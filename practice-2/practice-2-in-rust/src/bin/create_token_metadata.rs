use anyhow::{Context, Result};
use mpl_token_metadata::{
    instructions::CreateMetadataAccountV3Builder,
    types::DataV2,
    ID as TOKEN_METADATA_PROGRAM_ID,
};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    instruction::Instruction,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use std::{env, str::FromStr};
use dotenvy::from_path;

// ToDo: need update
#[tokio::main]
async fn main() -> Result<()> {
   
    from_path(".env").context("Failed to load .env file")?;
    let private_key_json = env::var("PK").context("No private key in environment")?;
    let private_key_bytes: Vec<u8> = serde_json::from_str(&private_key_json)?;
    let sender_keypair = Keypair::from_bytes(&private_key_bytes)?;

    println!("🔑 Sender public key: {}", sender_keypair.pubkey());


    let connection = RpcClient::new("https://api.devnet.solana.com");

    let token_mint_account = Pubkey::from_str("9VXSQygGgFfTgB3rqN1gHUMoCeGpwUgYyJtFsaAK9zMS")?;
    let metadata_seeds = &[
        b"metadata",
        TOKEN_METADATA_PROGRAM_ID.as_ref(),
        token_mint_account.as_ref(),
    ];
    let (metadata_pda, _bump) =
        Pubkey::find_program_address(metadata_seeds, &TOKEN_METADATA_PROGRAM_ID);

    println!("📜 Metadata PDA: {}", metadata_pda);

    let metadata_data = DataV2 {
        name: "My_T_R_Token".to_string(),
        symbol: "MyTRT".to_string(),
        uri: "https://olena-muliarchuk.github.io/bootcamp-token-metadata/meta.json".to_string(),
        seller_fee_basis_points: 500,
        creators: None,
        collection: None,
        uses: None,
    };

    let create_metadata_instruction: Instruction = CreateMetadataAccountV3Builder::new()
        .metadata(metadata_pda)
        .mint(token_mint_account)
        .mint_authority(sender_keypair.pubkey())
        .payer(sender_keypair.pubkey())
        .update_authority(sender_keypair.pubkey(), true)
        .data(metadata_data)
        .is_mutable(true)
        .instruction();

    let mut transaction = Transaction::new_with_payer(
        &[create_metadata_instruction], 
        Some(&sender_keypair.pubkey()), 
    );

  
    let latest_blockhash = connection.get_latest_blockhash()?;
    transaction.sign(&[&sender_keypair], latest_blockhash);


    let signature = connection.send_and_confirm_transaction(&transaction)?;
    println!("✅ Metadata account created successfully!");
    println!(
        "Transaction Signature: https://explorer.solana.com/tx/{}?cluster=devnet",
        signature
    );

    Ok(())
}