import { Connection, Keypair, clusterApiUrl, PublicKey, Transaction } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint
} from "@solana/spl-token";
import fs from "fs";
import "dotenv/config";

// === SETUP ===
const connection = new Connection(clusterApiUrl("devnet"));
const sender = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.REC_SECRET_KEY))); //SEND_SECRET_KEY
const receiver = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SEND_SECRET_KEY)));// REC_SECRET_KEY
const MINT = new PublicKey("24EaNimd1hvKzyQCYvRxHAbLg4rs9PnoWde7BSM5Z5r2");


// === FETCH ACCOUNTS ===
const token = await getMint(connection, MINT);
const senderTokenAccount = await getOrCreateAssociatedTokenAccount(connection, sender, MINT, sender.publicKey);
const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(connection, receiver, MINT, receiver.publicKey);

// === CREATE TX ===
const amount = BigInt(3 * 10 ** token.decimals);
const tx = new Transaction().add(
  createTransferInstruction(
    senderTokenAccount.address,
    receiverTokenAccount.address,
    sender.publicKey,
    amount
  )
);
tx.feePayer = receiver.publicKey;
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
tx.partialSign(sender);

// === SAVE TX ===
fs.writeFileSync("tx.bin", tx.serialize({ requireAllSignatures: false }));

// === RECEIVER SIGNS & SENDS ===
const loadedTx = Transaction.from(fs.readFileSync("tx.bin"));
loadedTx.partialSign(receiver);
const sig = await connection.sendRawTransaction(loadedTx.serialize());
console.log(`✅ Sent! https://explorer.solana.com/tx/${sig}?cluster=devnet`);

// https://explorer.solana.com/tx/4bUAC4zsLvDkHkDout98gdqYkoHSPckkPbYbCkCocqu9o9rXg2Ph5RHngvsNQvW1yqvMBTsCFJBAh7SxsVFxJmTQ?cluster=devnet