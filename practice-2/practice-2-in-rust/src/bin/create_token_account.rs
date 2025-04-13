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
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};
use spl_token_2022::{
    id as token_2022_program_id,
    instruction::{initialize_mint},
    state::Mint,
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

    let connection = RpcClient::new("https://api.devnet.solana.com");

    let latest_blockhash = connection.get_latest_blockhash()?;

    // Мінт токена (Перевірка)
    let token_mint_pubkey = Pubkey::from_str("9VXSQygGgFfTgB3rqN1gHUMoCeGpwUgYyJtFsaAK9zMS")
        .context("Failed to parse mint address")?;
    let owner = Pubkey::from_str("9vhAWnsNdrQyvQYiqVAPnzi1F1QzU6BzkhWcrimJCUzp")?;

    let associated_token = get_associated_token_address_with_program_id(
        &owner, 
        &token_mint_pubkey
        &token_2022_program_id()
    );
    println!("Associated Token Address: {}", associated_token);

    let create_ata_ix = create_associated_token_account(
        &sender_keypair.pubkey(),
        &owner,
        &token_mint_pubkey,
        &token_2022_program_id(),
    );

    let mut ata_transaction = Transaction::new_signed_with_payer(
        &[create_ata_ix],
        Some(&sender_keypair.pubkey()),
        &[&sender_keypair],
        latest_blockhash,
    );

    let transaction_signature =  connection.send_and_confirm_transaction(&ata_transaction)?;
    println!(" Associated Token Account created successfully.");
    println!("Transaction Signature: {}", transaction_signature);
    println!("Token Account: {}", associated_token);
    println!(
        "Explorer Link: https://explorer.solana.com/address/{}?cluster=devnet",
        associated_token
    );

    Ok(())
}