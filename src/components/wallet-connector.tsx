"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

interface WalletConnectorProps {
  onWalletConnected: (address: string) => void;
  onWalletDisconnected: () => void;
}

export function WalletConnector({ onWalletConnected, onWalletDisconnected }: WalletConnectorProps) {
  const { login, logout, authenticated, ready, user } = usePrivy();
  
  // Get the wallet address if available
  const walletAddress = user?.wallet?.address;
  
  // Check connection status and notify parent components
  useEffect(() => {
    if (ready) {
      if (authenticated && walletAddress) {
        onWalletConnected(walletAddress);
      } else if (!authenticated) {
        onWalletDisconnected();
      }
    }
  }, [authenticated, ready, walletAddress, onWalletConnected, onWalletDisconnected]);

  return (
    <div className="flex flex-col items-center gap-4">
      {authenticated && walletAddress ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm">
            Connected: <span className="font-mono">{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
          </p>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={logout}
          >
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <Button
          onClick={login}
          disabled={!ready}
          className="flex items-center gap-2"
        >
          {!ready ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Connect Wallet"
          )}
        </Button>
      )}
    </div>
  );
}
