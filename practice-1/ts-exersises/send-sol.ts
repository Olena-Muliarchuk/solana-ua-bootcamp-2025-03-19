import "dotenv/config";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  Connection,
  sendAndConfirmTransaction,
  TransactionInstruction
} from "@solana/web3.js";

import "dotenv/config";

const pk = process.env.PK;

if (!pk) {
  console.log("No private key provided");
  process.exit(1);
}

const asBytes = Uint8Array.from(JSON.parse(pk));
const keypair = Keypair.fromSecretKey(asBytes); // sender
const connection = new Connection(clusterApiUrl("devnet"));

console.log(`🔑 Our public key is: ${keypair.publicKey.toBase58()}`);

const recipient = new PublicKey("omQENDN5wkeHyww65JfukFjQQoAs2BWGrQjRdTo9WBo");
console.log(`💸 Attempting to send 0.01 SOL to ${recipient.toBase58()}...`);


// Get this address from https://spl.solana.com/memo
const memoProgram = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const memoText = "Hello from Solana. Test transaction";

const tx = new Transaction();

const sendSolIx = SystemProgram.transfer({
  fromPubkey: keypair.publicKey,
  toPubkey: recipient,
  lamports: 5_000_000
});

// const addMemoInstruction = SystemProgram.transfer({
//     fromPubkey: keypair.publicKey,
//     toPubkey: memoProgram,
//     lamports: 5_000_000
// });

const addMemoInstruction = new TransactionInstruction({
  keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
  data: Buffer.from(memoText, "utf-8"),
  programId: memoProgram,
});



console.log(`📝 memo is: ${memoText}`);

tx.add(sendSolIx);
tx.add(addMemoInstruction);

const signed_tx = await connection.sendTransaction(tx, [keypair]);

console.log("Signature", signed_tx);
// const signed_tx = await sendAndConfirmRawTransaction(connection, tx, [keypair]);
