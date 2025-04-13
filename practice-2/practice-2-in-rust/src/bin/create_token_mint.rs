use dotenvy::from_path;
use std::env;
use serde_json;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    signer::Signer,
    signature::Keypair,
    transaction::Transaction,
    system_instruction,
};

use spl_token_2022::{
    id as token_2022_program_id,
    instruction::initialize_mint,
    state::Mint,
};
use solana_program::program_pack::Pack;

fn main() -> anyhow::Result<()> {
    from_path(".env").expect("Failed to load .env file"); 

    let private_key_json = env::var("PK").expect("No private key provided in environment");
    let pk_as_bytes: Vec<u8> = serde_json::from_str(&private_key_json).expect("Invalid private key format");
    let sender_keypair = Keypair::from_bytes(&pk_as_bytes).expect("Failed to create keypair");

    println!("🔑 Sender public key: {}", sender_keypair.pubkey());

    let connection = RpcClient::new("https://api.devnet.solana.com");
    let latest_blockhash = connection.get_latest_blockhash()?;

    // Create token
    let decimals = 2;
    let mint_account = Keypair::new();
    let mint_space =  <Mint as Pack>::LEN;
    let mint_rent = connection.get_minimum_balance_for_rent_exemption(mint_space)?;

    let create_mint_account_ix = system_instruction::create_account(
        &sender_keypair.pubkey(),
        &mint_account.pubkey(),
        mint_rent,
        mint_space as u64,
        &token_2022_program_id(),
    );

    let create_token_mint_ix = initialize_mint(
        &token_2022_program_id(),
        &mint_account.pubkey(),
        &sender_keypair.pubkey(),
        None,
        decimals,
    )?;

    let mut transaction = Transaction::new_with_payer(
        &[create_mint_account_ix, create_token_mint_ix],
        Some(&sender_keypair.pubkey()),
    );

    transaction.sign(&[&sender_keypair, &mint_account], latest_blockhash);

    let signature = connection.send_and_confirm_transaction(&transaction)?;

    println!(" Token Mint created successfully! Mint address: {}", mint_account.pubkey());
    println!("Transaction signature: {}", signature);

    Ok(())
}
