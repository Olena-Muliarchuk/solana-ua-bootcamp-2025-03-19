import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicKey, AccountInfo, ParsedAccountData } from '@solana/web3.js';
import { Metaplex, Nft, Sft } from '@metaplex-foundation/js';

interface WalletTokensTabProps {
    isWalletConnected: boolean;
}

interface WalletToken {
    mint: string;
    amount: string;
    decimals: number;
    programId: string;
    accountAddress: string;
    name?: string;
    symbol?: string;
}

const parseWalletTokens = (accounts: { pubkey: PublicKey; account: AccountInfo<ParsedAccountData>; programId: PublicKey }[]): WalletToken[] => {
    return accounts
        .map(({ pubkey, account, programId }) => {
            const info = account.data.parsed?.info;
            if (!info || info.tokenAmount.uiAmount === 0) return null;

            return {
                mint: info.mint,
                amount: info.tokenAmount.uiAmountString,
                decimals: info.tokenAmount.decimals,
                programId: programId.equals(TOKEN_PROGRAM_ID) ? 'Token Program' : 'Token-2022 Program',
                accountAddress: pubkey.toBase58(),
            };
        })
        .filter((token): token is WalletToken => token !== null);
};

const TokenCard: React.FC<{ token: WalletToken }> = ({ token }) => (
    <li className="border p-3 rounded-md">
        <p><strong>Token Mint:</strong> {token.mint}</p>
        <p><strong>Account Address:</strong> {token.accountAddress}</p>
        <p><strong>Name:</strong> {token.name ?? 'N/A'}</p>
        <p><strong>Symbol:</strong> {token.symbol ?? 'N/A'}</p>
        <p><strong>Balance:</strong> {token.amount}</p>
        <p><strong>Standard:</strong> {token.programId}</p>
    </li>
);

export const CustomWalletTokensTab: React.FC<WalletTokensTabProps> = ({ isWalletConnected }) => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [tokens, setTokens] = useState<WalletToken[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const metaplex = useMemo(() => {
        if (!connection) return null;
        try {
            return Metaplex.make(connection);
        } catch (e) {
            console.error("Failed to initialize Metaplex:", e);
            return null;
        }
    }, [connection]);

    const fetchTokens = useCallback(async () => {
        if (!wallet || !connection) return;

        setLoading(true);
        setError(null);
        setTokens([]);

        try {
            const [standardTokens, token2022Tokens] = await Promise.all([
                connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID }),
                connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_2022_PROGRAM_ID }),
            ]);

            const allAccounts = [
                ...standardTokens.value.map(acc => ({ ...acc, programId: TOKEN_PROGRAM_ID })),
                ...token2022Tokens.value.map(acc => ({ ...acc, programId: TOKEN_2022_PROGRAM_ID })),
            ];

            const parsedTokens = parseWalletTokens(allAccounts);
            if (!parsedTokens.length) {
                setTokens([]);
                return;
            }

            if (metaplex) {
                const uniqueMints = [...new Set(parsedTokens.map(t => t.mint))].map(mint => new PublicKey(mint));
                const metadataList = await Promise.all(uniqueMints.map(mint =>
                    metaplex.nfts().findByMint({ mintAddress: mint, loadJsonMetadata: false }).catch(() => null)
                ));

                const metadataMap = new Map<string, Nft | Sft | null>();
                uniqueMints.forEach((mint, idx) => {
                    metadataMap.set(mint.toBase58(), metadataList[idx]);
                });

                const enrichedTokens = parsedTokens.map(token => {
                    const meta = metadataMap.get(token.mint);
                    return {
                        ...token,
                        name: meta?.name || 'Unknown Token',
                        symbol: meta?.symbol || 'Unknown Symbol',
                    };
                });

                setTokens(enrichedTokens);
            } else {
                setTokens(parsedTokens);
            }
        } catch (e) {
            console.error("Error fetching tokens:", e);
            setError("Failed to load tokens. Try again later.");
        } finally {
            setLoading(false);
        }
    }, [wallet, connection, metaplex]);

    useEffect(() => {
        if (isWalletConnected) {
            fetchTokens();
        } else {
            setTokens([]);
            setLoading(false);
            setError(null);
        }
    }, [isWalletConnected, fetchTokens]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Wallet Tokens</CardTitle>
            </CardHeader>
            <CardContent>
                {!isWalletConnected ? (
                    <p>Please connect your wallet to view tokens.</p>
                ) : loading ? (
                    <p>Loading tokens...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : tokens.length ? (
                    <ul className="space-y-3">{tokens.map(token => <TokenCard key={token.accountAddress} token={token} />)}</ul>
                ) : (
                    <p>No tokens found.</p>
                )}
            </CardContent>
        </Card>
    );
};
