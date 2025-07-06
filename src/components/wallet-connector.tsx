"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

interface WalletConnectorProps {
  onWalletConnected: (address: string) => void;
  onWalletDisconnected: () => void;
  compact?: boolean;
}

export function WalletConnector({ onWalletConnected, onWalletDisconnected, compact = false }: WalletConnectorProps) {
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
    <div className={compact ? "flex items-center" : "flex flex-col items-center gap-4"}>
      {authenticated && walletAddress ? (
        compact ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="text-xs h-8 px-2"
          >
            Disconnect
          </Button>
        ) : (
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
        )
      ) : (
        <Button
          onClick={login}
          disabled={!ready}
          className={`flex items-center gap-1 ${compact ? "text-xs h-8 px-2" : "gap-2"}`}
          variant={compact ? "outline" : "default"}
          size={compact ? "sm" : "default"}
        >
          {!ready ? (
            <>
              <Loader2 className={compact ? "h-3 w-3 animate-spin" : "h-4 w-4 animate-spin"} />
              {compact ? "Loading" : "Loading..."}
            </>
          ) : (
            compact ? "Connect" : "Connect Wallet"
          )}
        </Button>
      )}
    </div>
  );
}
