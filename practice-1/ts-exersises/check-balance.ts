import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from "@solana/web3.js";
import "dotenv/config";
import { airdropIfRequired } from "@solana-developers/helpers";

// import * as dotenv from "dotenv";
// dotenv.config();

let pubk = process.env.PubK;
let defaultPubKey = "9vhAWnsNdrQyvQYiqVAPnzi1F1QzU6BzkhWcrimJCUzp";

if (!pubk) {
    console.log("No public key provided from .env. Default public key is used");
    pubk = defaultPubKey;
}
const connection = new Connection(clusterApiUrl("devnet"));
const pubKey = new PublicKey(pubk);

// First
const airdrop1 = await airdropIfRequired(connection, pubKey,
    1 * LAMPORTS_PER_SOL,
    0.5 * LAMPORTS_PER_SOL);

console.log("Airdrop 1 ", airdrop1);

// second
await connection.requestAirdrop(pubKey, 1 * LAMPORTS_PER_SOL);


const balanseInSol = await connection.getBalance(pubKey) / LAMPORTS_PER_SOL;

console.log("Balance in SOL", balanseInSol);