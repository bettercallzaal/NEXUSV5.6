"use client";

import { ReactNode } from "react";
import { Web3Provider } from "@/providers/web3-provider";
import { AuthProvider } from "@/contexts/auth-context";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Web3Provider>
  );
}
