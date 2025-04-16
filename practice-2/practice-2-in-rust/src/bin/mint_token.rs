use std::env;
use anyhow::{Context, Result};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction::create_account,
    transaction::Transaction,
};
use spl_token_2022::{
    id as token_2022_program_id,
    instruction::{initialize_mint, mint_to},
    state::Mint,
};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use std::str::FromStr;
use dotenvy::from_path;
use solana_program::program_pack::Pack;


#[tokio::main]
async fn main() -> Result<()> {
    from_path(".env").expect("Failed to load .env file");

    // Завантаження приватного ключа з .env
    let private_key_json = env::var("PK").context("No private key in environment")?;
    let private_key_bytes: Vec<u8> = serde_json::from_str(&private_key_json)?;
    let sender_keypair = Keypair::from_bytes(&private_key_bytes)?;

    println!("🔑 Sender public key: {}", sender_keypair.pubkey());

    // RPC-клієнт
    let connection = RpcClient::new("https://api.devnet.solana.com");

    // Отримання останнього blockhash
    let latest_blockhash = connection.get_latest_blockhash()?;
    // Мінт токена
    let token_mint_pubkey = Pubkey::from_str("3d5MK5qQsGQRkFqVmeJ1eaR2zbiH7BCh9C9TzDkj3Ztu")
        .context("Failed to parse mint address")?;
    let mint_account_pubkey =
        Pubkey::from_str("G9HfVHM1sDw6Y3F9VwB3MqpS44JGfFkdeL73SSgCv1mU")
            .context("Failed to parse account address")?; 

    // Перевірка мінт акаунта
    match connection.get_account(&token_mint_pubkey) {
        Ok(mint_account) => {
            println!("✅ Mint account found.");
            if mint_account.owner != token_2022_program_id() {
                println!("❌ Mint is not owned by Token 2022 Program.");
                return Ok(());
            }
            if mint_account.data.len() != Mint::LEN {
                println!("❌ Mint account data is invalid. Reinitializing...");
            } else {
                println!("✅ Mint account is valid.");
            }
        }
        Err(_) => {
            println!("❌ Mint account not found. Creating a new one...");

            let mint_rent = connection.get_minimum_balance_for_rent_exemption(<Mint as Pack>::LEN)?;
            let create_mint_ix = create_account(
                &sender_keypair.pubkey(),
                &token_mint_pubkey,
                mint_rent,
                <Mint as Pack>::LEN as u64,
                &token_2022_program_id(),
            );

            let initialize_mint_ix = initialize_mint(
                &token_2022_program_id(),
                &token_mint_pubkey,
                &sender_keypair.pubkey(),
                None,
                2, // Decimals
            )?;

            let transaction = Transaction::new_signed_with_payer(
                &[create_mint_ix, initialize_mint_ix],
                Some(&sender_keypair.pubkey()),
                &[&sender_keypair],
                latest_blockhash,
            );

            connection.send_and_confirm_transaction(&transaction)?;
            println!("✅ Mint account created successfully.");
        }
    }

    let amount = 300;
    let mint_to_instruction = mint_to(
        &token_2022_program_id(),
        &token_mint_pubkey,
        &mint_account_pubkey,
        &sender_keypair.pubkey(),
        &[],
        amount,
    )?;

    let  transaction = Transaction::new_signed_with_payer(
        &[mint_to_instruction],
        Some(&sender_keypair.pubkey()),
        &[&sender_keypair],
        latest_blockhash,
    );

    let signature = connection.send_and_confirm_transaction(&transaction)?;

    println!("✅ Success. {} tokens minted.", amount);
    println!(
        "Mint Transaction: https://explorer.solana.com/tx/{}?cluster=devnet\n",
        signature
    );

    Ok(())
}