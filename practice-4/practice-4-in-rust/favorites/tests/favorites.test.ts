import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { Favorites } from "../target/types/favorites";
import { airdropIfRequired } from "@solana-developers/helpers";
import { expect, describe, test } from "@jest/globals";

describe("favorites", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Favorites as Program<Favorites>;

  const FAVORITES_SEED = "favorites";

  const getPda = (owner: web3.PublicKey): [web3.PublicKey, number] =>
    web3.PublicKey.findProgramAddressSync(
      [Buffer.from(FAVORITES_SEED), owner.toBuffer()],
      program.programId
    );

  test("Creates a new favorites account with optional authority", async () => {
    const user = web3.Keypair.generate();
    await airdropIfRequired(
      anchor.getProvider().connection,
      user.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );

    const tx = await program.methods
      .setFavorites(new anchor.BN(42), "purple", null)
      .accounts({
        user: user.publicKey,
        owner: user.publicKey,
      })
      .signers([user])
      .rpc();

    console.log("Set favorites tx:", tx);

    const [pda] = getPda(user.publicKey);
    const acc = await program.account.favorites.fetch(pda);
    expect(acc.number.toNumber()).toBe(42);
    expect(acc.color).toBe("purple");
    expect(acc.authority).toBeNull();
  });

  test("Sets a delegate and allows update by delegate", async () => {
    const owner = web3.Keypair.generate();
    const delegate = web3.Keypair.generate();

    await airdropIfRequired(
      anchor.getProvider().connection,
      owner.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );
    await airdropIfRequired(
      anchor.getProvider().connection,
      delegate.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );

    await program.methods
      .setFavorites(new anchor.BN(1), "white", delegate.publicKey)
      .accounts({
        user: owner.publicKey,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const [pda] = getPda(owner.publicKey);

    await program.methods
      .setAuthority(delegate.publicKey)
      .accounts({
        user: owner.publicKey,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    const accWithDelegate = await program.account.favorites.fetch(pda);
    expect(accWithDelegate.authority?.toBase58()).toBe(
      delegate.publicKey.toBase58()
    );

    await program.methods
      .updateFavorites(new anchor.BN(999), "silver")
      .accounts({
        user: delegate.publicKey,
        owner: owner.publicKey,
      })
      .signers([delegate])
      .rpc();

    const updated = await program.account.favorites.fetch(pda);
    expect(updated.number.toNumber()).toBe(999);
    expect(updated.color).toBe("silver");
  });

  test("Legacy account doesn't support authority and cannot be updated by delegate", async () => {
    const owner = web3.Keypair.generate();
    const delegate = web3.Keypair.generate();

    await airdropIfRequired(
      anchor.getProvider().connection,
      owner.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );
    await airdropIfRequired(
      anchor.getProvider().connection,
      delegate.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );

    await program.methods
      .setFavoritesLegacy(new anchor.BN(123), "black")
      .accounts({ user: owner.publicKey })
      .signers([owner])
      .rpc();

    const [pda] = getPda(owner.publicKey);
    const acc = await program.account.favorites.fetch(pda);
    expect(acc.authority).toBeNull();

    try {
      await program.methods
        .updateFavorites(new anchor.BN(321), "red")
        .accounts({
          user: delegate.publicKey,
          owner: owner.publicKey,
        })
        .signers([delegate])
        .rpc();
      throw new Error("Expected failure");
    } catch (err: any) {
      expect(err.message).toMatch(/You are not authorized/);
    }
  });
});
