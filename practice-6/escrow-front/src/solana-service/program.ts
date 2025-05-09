import { AnchorProvider, Program, Wallet, web3, BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { randomBytes } from "crypto";
import escrowIdl from "./escrow.json";
import { Escrow } from "./idlType";
import { config } from "./config";

const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export class EscrowProgram {
  protected program: Program<Escrow>;
  protected connection: web3.Connection;
  protected wallet: NodeWallet;

  constructor(connection: web3.Connection, wallet: Wallet) {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    this.program = new Program<Escrow>(escrowIdl as Escrow, provider);
    this.wallet = wallet;
    this.connection = connection;
  }

  async getTokenProgram(mint: PublicKey): Promise<PublicKey> {
    const info = await this.connection.getParsedAccountInfo(mint);
    if (!info.value) {
      throw new Error("Unable to fetch token mint info");
    }

    const owner = new PublicKey(info.value.owner);
    if (
      !owner.equals(TOKEN_PROGRAM_ID) &&
      !owner.equals(TOKEN_2022_PROGRAM_ID)
    ) {
      throw new Error("Unsupported token program");
    }

    return owner;
  }

  createOfferId = (offerId: BN) => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("offer"),
        this.wallet.publicKey.toBuffer(),
        offerId.toArrayLike(Buffer, "le", 8),
      ],
      new PublicKey(config.contractAddress)
    )[0];
  };

  async makeOffer(
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,
    tokenAmountA: number,
    tokenAmountB: number
  ) {
     // Get token program for both mints
    const tokenProgramA = await this.getTokenProgram(tokenMintA);
    const tokenProgramB = await this.getTokenProgram(tokenMintB);
    if (!tokenProgramA.equals(tokenProgramB)) {
      throw new Error("Both tokens must use the same token program!");
    }

    const tokenProgram = tokenProgramA;

    try {
      const offerId = new BN(randomBytes(8));
      const offerAddress = this.createOfferId(offerId);

      const makerTokenAccountA = getAssociatedTokenAddressSync(tokenMintA, this.wallet.publicKey, true, tokenProgram);
      const makerTokenAccountB = getAssociatedTokenAddressSync(tokenMintB, this.wallet.publicKey, true, tokenProgram);

      const vault = getAssociatedTokenAddressSync(tokenMintA, offerAddress, true, tokenProgram);

      const accounts = {
        maker: this.wallet.publicKey,
        tokenMintA: tokenMintA,
        makerTokenAccountA,
        tokenMintB: tokenMintB,
        makerTokenAccountB,
        vault,
        offer: offerAddress,
        tokenProgram,
      };

      const txInstruction = await this.program.methods
        .makeOffer(offerId, new BN(tokenAmountA), new BN(tokenAmountB))
        .accounts(accounts)
        .instruction();

      const messageV0 = new web3.TransactionMessage({
        payerKey: this.wallet.publicKey,
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
        instructions: [txInstruction],
      }).compileToV0Message();

      const versionedTransaction = new web3.VersionedTransaction(messageV0);

      if (!this.program.provider.sendAndConfirm) return;

      const response = await this.program.provider.sendAndConfirm(versionedTransaction);

      if (!this.program.provider.publicKey) return;
      return response;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async takeOffer(
    maker: PublicKey,
    offer: PublicKey,
    tokenMintA: PublicKey,
    tokenMintB: PublicKey
  ) {
    const tokenProgramA = await this.getTokenProgram(tokenMintA);
    const tokenProgramB = await this.getTokenProgram(tokenMintB);
    if (!tokenProgramA.equals(tokenProgramB)) {
      throw new Error("Both tokens must use the same token program!");
    }

    const tokenProgram = tokenProgramA;
    try {
      const takerTokenAccountA = getAssociatedTokenAddressSync(tokenMintA, this.wallet.publicKey, true, tokenProgram);
      const takerTokenAccountB = getAssociatedTokenAddressSync(tokenMintB, this.wallet.publicKey, true, tokenProgram);

      const makerTokenAccountB = getAssociatedTokenAddressSync(tokenMintB, maker, true, tokenProgram);

      const vault = getAssociatedTokenAddressSync(tokenMintA, offer, true, tokenProgram);

      const accounts = {
        maker,
        offer,
        taker: this.wallet.publicKey,
        takerTokenAccountA,
        takerTokenAccountB,
        vault,
        tokenProgram,
        makerTokenAccountB,
      };

      const txInstruction = await this.program.methods
        .takeOffer()
        .accounts(accounts)
        .instruction();

      const messageV0 = new web3.TransactionMessage({
        payerKey: this.wallet.publicKey,
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
        instructions: [txInstruction],
      }).compileToV0Message();

      const versionedTransaction = new web3.VersionedTransaction(messageV0);

      if (!this.program.provider.sendAndConfirm) return;

      const response = await this.program.provider.sendAndConfirm(versionedTransaction);

      return response;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
