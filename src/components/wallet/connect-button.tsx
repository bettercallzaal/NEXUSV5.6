"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";

export function WalletConnectButton() {
  const { login, logout, authenticated, user } = usePrivy();
  
  if (!authenticated) {
    return (
      <Button 
        onClick={login} 
        variant="outline" 
        size="sm"
      >
        Connect Wallet
      </Button>
    );
  }
  
  return (
    <Button 
      onClick={logout} 
      variant="outline" 
      size="sm"
    >
      {user?.wallet?.address?.substring(0, 6)}...{user?.wallet?.address?.substring(user?.wallet?.address?.length - 4) || "Disconnect"}
    </Button>
  );
}
