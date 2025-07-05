"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

// Use environment variable for Privy App ID
// Fallback to a placeholder for development only
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clujj4zs900tml70fslec0g39";

// Log a warning if the app ID is not set
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
  console.warn("Privy App ID is not set. Please set NEXT_PUBLIC_PRIVY_APP_ID in your environment variables.");
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#6366f1", // Indigo color to match the theme
          logo: "https://zao.org/logo.png", // Replace with your actual logo URL
        },
        loginMethods: ["wallet", "email", "google", "twitter"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets"
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
