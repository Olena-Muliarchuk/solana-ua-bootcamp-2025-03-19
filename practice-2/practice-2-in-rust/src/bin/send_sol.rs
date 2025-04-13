use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    signer::Signer,
    signature::Keypair,
    transaction::Transaction,
    system_instruction,
    pubkey::Pubkey,
};
use std::env;
use std::str::FromStr;
use dotenvy::from_path;
use serde_json;
use spl_memo::build_memo;

fn main() -> anyhow::Result<()> {
    from_path(".env").expect("Failed to load .env file"); 

    let payer_key_json = env::var("PK").expect("No private key provided in environment");
    let pk_as_bytes: Vec<u8> = serde_json::from_str(&payer_key_json).expect("Invalid private key format");
    let sender_keypair = Keypair::from_bytes(&pk_as_bytes).expect("Failed to create keypair");

    println!("🔑 Sender public key: {}", sender_keypair.pubkey());

    let connection = RpcClient::new("https://api.devnet.solana.com");

    // let sender_balance = connection.get_balance(&sender_keypair.pubkey())?;
    // println!("💰 Sender balance: {} lamports", sender_balance);

    let recipient = Pubkey::from_str("omQENDN5wkeHyww65JfukFjQQoAs2BWGrQjRdTo9WBo")?;
    println!("💸 Sending 0.01 SOL to {}", recipient);

    let amount = 5_000_000; 

    let transfer_instruction = system_instruction::transfer(&sender_keypair.pubkey(), &recipient, amount);

    let memo_text =String::from( "Hi! I'm testing it)");
    let memo_instruction = build_memo(memo_text.as_bytes(), &[&sender_keypair.pubkey()]);

    let mut transaction = Transaction::new_with_payer(
        &[transfer_instruction, memo_instruction],
        Some(&sender_keypair.pubkey()),
    );

    let blockhash = connection.get_latest_blockhash()?;
    transaction.sign(&[&sender_keypair], blockhash);

    let signature = connection.send_and_confirm_transaction(&transaction)?;

    println!("Transaction confirmed, signature: {}", signature);

    Ok(())
}