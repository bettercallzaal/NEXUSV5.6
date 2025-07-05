"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { checkZaoAndLoanzBalances } from "@/lib/token-balance-checker";

interface TokenCheckerProps {
  walletAddress: string | null;
  onBalancesChecked?: (hasTokens: boolean, zaoBalance: string, loanzBalance: string) => void;
}

export function TokenChecker({ walletAddress, onBalancesChecked }: TokenCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [zaoBalance, setZaoBalance] = useState<string>("0");
  const [loanzBalance, setLoanzBalance] = useState<string>("0");
  const [hasZao, setHasZao] = useState(false);
  const [hasLoanz, setHasLoanz] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check balances when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      checkBalances();
    }
  }, [walletAddress]);

  // Check token balances
  async function checkBalances() {
    if (!walletAddress) {
      console.log("[TOKEN-CHECKER] No wallet address provided");
      return;
    }

    setIsChecking(true);
    setError(null);
    
    try {
      console.log("[TOKEN-CHECKER] Checking balances for:", walletAddress);
      const results = await checkZaoAndLoanzBalances(walletAddress);
      
      console.log("[TOKEN-CHECKER] ZAO result:", results.zao);
      console.log("[TOKEN-CHECKER] LOANZ result:", results.loanz);
      
      // Update ZAO balance
      setZaoBalance(results.zao.formattedBalance);
      setHasZao(results.zao.hasMinimum);
      
      // Update LOANZ balance
      setLoanzBalance(results.loanz.formattedBalance);
      setHasLoanz(results.loanz.hasMinimum);

      // Notify parent component if callback provided
      if (onBalancesChecked) {
        const hasTokens = results.zao.hasMinimum || results.loanz.hasMinimum;
        onBalancesChecked(hasTokens, results.zao.formattedBalance, results.loanz.formattedBalance);
      }
    } catch (error) {
      console.error("[TOKEN-CHECKER] Error checking balances:", error);
      setError("Failed to check token balances. Please try again.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="text-center mb-2">
        <h3 className="font-medium">Token Balances</h3>
        {walletAddress ? (
          <p className="text-sm text-muted-foreground">
            Wallet: <span className="font-mono">{`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No wallet connected</p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">$ZAO Balance:</span>
          <span className={hasZao ? "text-green-600 dark:text-green-400 font-medium" : ""}>
            {zaoBalance}
            {hasZao && "✓"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">$LOANZ Balance:</span>
          <span className={hasLoanz ? "text-green-600 dark:text-green-400 font-medium" : ""}>
            {loanzBalance}
            {hasLoanz && "✓"}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={checkBalances}
          disabled={isChecking || !walletAddress}
          className="flex items-center gap-2"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh Balances
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
