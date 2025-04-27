import { PropsWithChildren } from "react";

import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const WalletProvider = ({ children }: PropsWithChildren) => {
  return (
    <WalletModalProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WalletModalProvider>
  );
};
