import { Keypair } from "@solana/web3.js";

/**
 * Generates a keypair with a public key that starts with the specified prefix.
 *
 * @param {string} prefix - The prefix that the public key should start with.
 * @returns {void} - The function does not return a value but outputs information to the console.
 */
function generateKeypairWithPrefix(prefix: string) {
    let keypair: Keypair;
    let attempts = 0;
    const startTime = Date.now();
    console.log("Time start (ms):", startTime);
    do {
        keypair = Keypair.generate();
        attempts++;
    } while (!keypair.publicKey.toBase58().startsWith(prefix));

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    console.log("Generated keypair after", attempts, "attempts", "prefix:", prefix);
    console.log("Public key:", keypair.publicKey.toBase58());
    console.log("Secret key:", keypair.secretKey);
    console.log("Time taken (ms):", timeTaken);
}

generateKeypairWithPrefix("anza");
