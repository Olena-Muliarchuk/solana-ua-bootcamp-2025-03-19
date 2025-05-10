import "dotenv/config";
import {
    Keypair,
    Connection,
    clusterApiUrl,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import {
    createMint,
    createMultisig,
    getOrCreateAssociatedTokenAccount,
    createMintToInstruction
} from "@solana/spl-token";
import { getExplorerLink } from "@solana-developers/helpers";

// === Setup ===
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.REC_SECRET_KEY)));
const signer1 = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SEND1_SECRET_KEY)));
const signer2 = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SEND2_SECRET_KEY)));

console.log("Signer1:", signer1.publicKey.toBase58());
console.log("Signer2:", signer2.publicKey.toBase58());

// === 1. Create 2-of-2 multisig account ===
const multisigAddress = await createMultisig(
    connection,
    payer,
    [signer1.publicKey, signer2.publicKey],
    2
);
console.log(`Multisig created: ${getExplorerLink("address", multisigAddress.toBase58(), "devnet")}`);

// === 2. Create token mint with multisig as mint authority ===
const mint = await createMint(
    connection,
    payer,
    multisigAddress, // Mint authority
    null, // No freeze authority
    2     // Decimals
);
console.log(`Token mint created: ${getExplorerLink("address", mint.toBase58(), "devnet")}`);

// === 3. Create associated token account for recipient ===
const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    signer1.publicKey
);
console.log(`Recipient token account: ${getExplorerLink("address", recipientTokenAccount.address.toBase58(), "devnet")}`);

// === 4. Mint tokens using multisig ===
const amount = 10 * 10 ** 2; // 10 tokens with 2 decimals

console.log(`Minting ${amount / 10 ** 2} tokens to recipient...`);

// Створення інструкції mintTo з мультисигом
const mintIx = createMintToInstruction(
    mint,
    recipientTokenAccount.address,
    multisigAddress, // mintAuthority
    amount,
    [signer1.publicKey, signer2.publicKey]
);


const tx = new Transaction().add(mintIx);
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
tx.feePayer = payer.publicKey;
tx.sign(signer1, signer2, payer);

const sig = await sendAndConfirmTransaction(connection, tx, [signer1, signer2, payer]);
console.log(`✅ Tokens minted! TX: ${getExplorerLink("tx", sig, "devnet")}`);

//  Tokens minted! TX: https://explorer.solana.com/tx/5UapV3SEXj1V7rUTwDmAHcvBGetAV6Z9cpxpZVuhyZxdkaPdJowgLSktVGWN7HasvgacKWnoym37ZBtryArmU64?cluster=devnet
