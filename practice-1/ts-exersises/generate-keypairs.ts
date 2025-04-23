import { Keypair } from "@solana/web3.js";

// const keypair = Keypair.generate();
// // console.log(' Generated keypair!', keypair); // не читабельний формат, так ключі не передаємо

// console.log("Public key", keypair.publicKey.toBase58()); // це в блокчейні буде ідентифікувати ваш акаунт; на це можуть бути перечислені ламперти 10 в 9 степені частина солани
// console.log("Public key", keypair.secretKey); // підписання всіх транзакцій

// // спробувати згенерувати ключі які будуть починатись на першу літеру імені, або містити наприлкад слово буткемп і засікти час (можна поставити функцію)

// Варто добавляти паралелізацію, занадто довго 10 год
function generateKeypairWithPrefix(prefix: string) {
    let keypair: Keypair;
    let attempts = 0;
    const startTime = Date.now();

    do {
        keypair = Keypair.generate();
        attempts++;

        // if (attempts % 10000 === 0) {
        //     console.log(`Attempts: ${attempts}`);
        //     console.log("-- ", keypair.publicKey.toBase58());
        // }
    } while (!keypair.publicKey.toBase58().startsWith(prefix));

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    console.log("Generated keypair after", attempts, "attempts", "prefix:", prefix);
    console.log("Public key:", keypair.publicKey.toBase58());
    console.log("Secret key:", keypair.secretKey);
    console.log("Time taken (ms):", timeTaken);
}

generateKeypairWithPrefix("o");
