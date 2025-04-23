import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { Favorites } from "../target/types/favorites";
import { airdropIfRequired, getCustomErrorMessage } from "@solana-developers/helpers";
import { expect, describe, test, beforeEach } from '@jest/globals';
import { systemProgramErrors } from "./system-program-errors";

describe("favorites", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  let program: Program<Favorites>;
  let user: web3.Keypair;
  let favoritesPda: web3.PublicKey;

  beforeEach(async () => {
    user = web3.Keypair.generate();
    program = anchor.workspace.Favorites as Program<Favorites>;

    console.log(`User public key: ${user.publicKey}`);

    await airdropIfRequired(
      anchor.getProvider().connection,
      user.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );

    // PDA can be precomputed before each test
    [favoritesPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("favorites"), user.publicKey.toBuffer()],
      program.programId
    );
  });

  async function writeFavorites(number: number, color: string): Promise<string> {
    try {
      return await program.methods
        .setFavorites(new anchor.BN(number), color)
        .accounts({ user: user.publicKey })
        .signers([user])
        .rpc();
    } catch (err) {
      throw new Error(getCustomErrorMessage(systemProgramErrors, (err as Error).message));
    }
  }

  async function updateFavorites(number: number, color: string): Promise<string> {
    try {
      return await program.methods
        .updateFavorites(new anchor.BN(number), color)
        .accounts({ user: user.publicKey })
        .signers([user])
        .rpc();
    } catch (err) {
      throw new Error(getCustomErrorMessage(systemProgramErrors, (err as Error).message));
    }
  }

  async function expectFavoritesToMatch(color: string, number: number) {
    const data = await program.account.favorites.fetch(favoritesPda);
    expect(data.color).toEqual(color);
    expect(data.number.toNumber()).toEqual(number);
  }

  test("Writes our favorites to the blockchain", async () => {
    const tx = await writeFavorites(23, "red");
    console.log(`Tx signature: ${tx}`);
    await expectFavoritesToMatch("red", 23);
  });

  test("Updates our favorites on the blockchain", async () => {
    await writeFavorites(23, "red");
    await expectFavoritesToMatch("red", 23);
    await updateFavorites(40, "black");
    await expectFavoritesToMatch("black", 40);
  });
});
