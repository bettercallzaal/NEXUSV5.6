"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { checkZaoAndLoanzBalances, TOKENS } from "@/lib/token-balance-checker";

interface TokenBalanceDisplayProps {
  walletAddress: string | null;
}

export function TokenBalanceDisplay({ walletAddress }: TokenBalanceDisplayProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(0);
  const [zaoBalance, setZaoBalance] = useState<string | null>(null);
  const [loanzBalance, setLoanzBalance] = useState<string | null>(null);
  const [hasZao, setHasZao] = useState(false);
  const [hasLoanz, setHasLoanz] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check balances when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      checkBalances();
    } else {
      // Reset balances when wallet disconnects
      setZaoBalance(null);
      setLoanzBalance(null);
      setHasZao(false);
      setHasLoanz(false);
    }
  }, [walletAddress]);

  // Check token balances with throttling
  async function checkBalances() {
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }

    // Throttle checks to avoid excessive RPC calls
    const now = Date.now();
    if (now - lastChecked < 10000 && !isChecking) {
      setError("Please wait a moment before checking again");
      return;
    }

    setIsChecking(true);
    setError(null);
    setLastChecked(now);

    try {
      const results = await checkZaoAndLoanzBalances(walletAddress);
      
      // Update ZAO balance
      setZaoBalance(results.zao.formattedBalance);
      setHasZao(results.zao.hasMinimum);
      
      // Update LOANZ balance
      setLoanzBalance(results.loanz.formattedBalance);
      setHasLoanz(results.loanz.hasMinimum);
    } catch (error) {
      console.error("Error checking balances:", error);
      setError("Failed to check token balances. Please try again.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Token Balances</h3>
      
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="grid gap-3">
        {/* ZAO Balance */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
          <div>
            <div className="font-medium">${TOKENS.zao.tokenSymbol}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{TOKENS.zao.network}</div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-mono">{zaoBalance || "0"}</div>
              {hasZao && <div className="text-xs text-green-600 dark:text-green-400">✓ Minimum balance met</div>}
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={checkBalances} 
              disabled={isChecking}
              className="h-8 w-8"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* LOANZ Balance */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
          <div>
            <div className="font-medium">${TOKENS.loanz.tokenSymbol}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{TOKENS.loanz.network}</div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-mono">{loanzBalance || "0"}</div>
              {hasLoanz && <div className="text-xs text-green-600 dark:text-green-400">✓ Minimum balance met</div>}
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={checkBalances} 
              disabled={isChecking}
              className="h-8 w-8"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkBalances} 
          disabled={isChecking || !walletAddress}
          className="text-sm"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-3 w-3" />
              Refresh All Balances
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
