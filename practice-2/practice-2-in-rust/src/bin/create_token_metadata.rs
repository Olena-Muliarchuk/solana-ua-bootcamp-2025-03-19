use anyhow::{Context, Result};
use dotenvy::from_path;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    instruction::Instruction,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction,
    transaction::Transaction,
};
use spl_token_metadata_interface::{
    instruction::{initialize, update_field},
    state::Field,
};
use std::{env, str::FromStr};
use solana_sdk::pubkey;
use solana_client::rpc_config::RpcAccountInfoConfig;
use solana_sdk::commitment_config::CommitmentConfig;

const METADATA_PROGRAM_ID: Pubkey = pubkey!("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ACCOUNT_SIZE: usize = 1300;

#[tokio::main]
async fn main() -> Result<()> {
    from_path(".env").context("Failed to load .env file")?;

    let private_key_json = env::var("PK").context("No private key in environment")?;
    let private_key_bytes: Vec<u8> = serde_json::from_str(&private_key_json)?;
    let signer = Keypair::from_bytes(&private_key_bytes)?;
    let signer_pubkey = signer.pubkey();

    println!("🔑 Signer: {}", signer_pubkey);

    let rpc = RpcClient::new("https://api.devnet.solana.com");

    // Твій токен
    let mint_pubkey = Pubkey::from_str("3d5MK5qQsGQRkFqVmeJ1eaR2zbiH7BCh9C9TzDkj3Ztu")?;
    let metadata_account = Pubkey::find_program_address(
        &[
            b"metadata",
            &spl_token_2022::id().to_bytes(),
            &mint_pubkey.to_bytes(),
        ],
        &METADATA_PROGRAM_ID,
    ).0;

    // Перевірка: чи вже існує акаунт метаданих
    let maybe_metadata_account = rpc.get_account_with_commitment(
        &metadata_account,
        CommitmentConfig::confirmed(),
    )?.value;

    let mut instructions: Vec<Instruction> = vec![];

    if maybe_metadata_account.is_none() {
        println!("📦 Metadata account does not exist. Creating...");

        let rent_exempt_balance = rpc
            .get_minimum_balance_for_rent_exemption(ACCOUNT_SIZE)
            .context("Failed to get rent-exempt balance")?;

        let create_account_ix = system_instruction::create_account(
            &signer_pubkey,
            &metadata_account,
            rent_exempt_balance,
            ACCOUNT_SIZE as u64,
            &METADATA_PROGRAM_ID,
        );

        let init_ix = initialize(
            &spl_token_2022::id(),
            &mint_pubkey,
            &signer_pubkey,
            &metadata_account,
            &signer_pubkey,
            "My_T_R_Token".to_string(),
            "MyTRT".to_string(),
            "https://olena-muliarchuk.github.io/bootcamp-token-metadata/meta.json".to_string(),
        );

        instructions.push(create_account_ix);
        instructions.push(init_ix);
    } else {
        println!("✅ Metadata account already exists. Skipping creation.");
    }

    // Тепер оновлюємо метадані (незалежно від того, нові чи вже існуючі)
    let update_field_ix = update_field(
        &spl_token_2022::id(),
        &mint_pubkey,
        &signer_pubkey,
        Field::Key("level".to_string()),
        "2".to_string(),
    );

    instructions.push(update_field_ix);

    let blockhash = rpc.get_latest_blockhash().context("Failed to get blockhash")?;
    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&signer_pubkey),
        &[&signer],
        blockhash,
    );

    let sig = rpc.send_and_confirm_transaction(&tx).context("Transaction failed")?;

    println!(
        "✅ Metadata initialized or updated!\n🔗 https://explorer.solana.com/tx/{}?cluster=devnet",
        sig
    );

    Ok(())
}
