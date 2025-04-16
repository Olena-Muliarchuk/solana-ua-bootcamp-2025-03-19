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
    extension::{ExtensionType, metadata_pointer},
    instruction::initialize_mint,
    state::Mint,
};

fn main() -> anyhow::Result<()> {
    from_path(".env").expect("Failed to load .env file"); 

    let private_key_json = env::var("PK").expect("No private key provided in environment");
    let pk_as_bytes: Vec<u8> = serde_json::from_str(&private_key_json).expect("Invalid private key format");
    let sender_keypair = Keypair::from_bytes(&pk_as_bytes).expect("Failed to create keypair");

    println!("🔑 Sender public key: {}", sender_keypair.pubkey());

    let connection = RpcClient::new("https://api.devnet.solana.com");
    let latest_blockhash = connection.get_latest_blockhash()?;

    //  Розрахунок розміру акаунта Mint з розширенням MetadataPointer
    let extensions = &[ExtensionType::MetadataPointer];
    let mint_space = ExtensionType::try_calculate_account_len::<Mint>(extensions)?;
    let mint_rent = connection.get_minimum_balance_for_rent_exemption(mint_space)?;

    let decimals = 2;
    let mint_account = Keypair::new();

    let create_mint_account_ix = system_instruction::create_account(
        &sender_keypair.pubkey(),
        &mint_account.pubkey(),
        mint_rent,
        mint_space as u64,
        &token_2022_program_id(),
    );

    let mut tx1 = Transaction::new_with_payer(
        &[create_mint_account_ix],
        Some(&sender_keypair.pubkey()),
    );
    tx1.sign(&[&sender_keypair, &mint_account], latest_blockhash);
    connection.send_and_confirm_transaction(&tx1)?;
    println!(" Mint account created: {}", mint_account.pubkey());

    let metadata_ix = metadata_pointer::instruction::initialize(
        &token_2022_program_id(),
        &mint_account.pubkey(),
        Some(sender_keypair.pubkey()),
        Some(mint_account.pubkey()),
    )?;

    let mut tx2 = Transaction::new_with_payer(
        &[metadata_ix],
        Some(&sender_keypair.pubkey()),
    );
    tx2.sign(&[&sender_keypair], latest_blockhash);
    connection.send_and_confirm_transaction(&tx2)?;
    println!("MetadataPointer initialized");
    let mint_ix = initialize_mint(
        &token_2022_program_id(),
        &mint_account.pubkey(),
        &sender_keypair.pubkey(),
        None,
        decimals,
    )?;

    let mut tx3 = Transaction::new_with_payer(
        &[mint_ix],
        Some(&sender_keypair.pubkey()),
    );
    tx3.sign(&[&sender_keypair], latest_blockhash);
    let sig = connection.send_and_confirm_transaction(&tx3)?;
    println!("Mint initialized with decimals=2");
    println!(" Final Transaction Signature: {}", sig);

    Ok(())
}
