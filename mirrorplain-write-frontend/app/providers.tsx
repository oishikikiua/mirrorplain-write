"use client";

import type { ReactNode } from "react";
import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <MetaMaskProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
      {children}
    </MetaMaskProvider>
  );
}

