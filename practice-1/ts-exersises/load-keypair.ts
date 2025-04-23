import { Keypair } from "@solana/web3.js";
import "dotenv/config";

// import * as dotenv from "dotenv";
// dotenv.config();

const pk = process.env.PK;

if (!pk) {
    console.log("No private key provided");
    process.exit(1);
}

const asBytes = Uint8Array.from(JSON.parse(pk));
const keypair = Keypair.fromSecretKey(asBytes);

console.log(`The public key is: `, keypair.publicKey.toBase58());
