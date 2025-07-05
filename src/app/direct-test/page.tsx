"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { checkZaoAndLoanzBalances, TOKENS } from "@/lib/token-balance-checker";

export default function DirectTestPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [zaoBalance, setZaoBalance] = useState<string | null>(null);
  const [loanzBalance, setLoanzBalance] = useState<string | null>(null);
  const [hasZao, setHasZao] = useState(false);
  const [hasLoanz, setHasLoanz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hardcoded wallet address for testing
  const walletAddress = "0x7234c36A71ec237c2Ae7698e8916e0735001E9Af";

  // Check balances when component mounts
  useEffect(() => {
    checkBalances();
  }, []);

  // Check token balances
  async function checkBalances() {
    setIsChecking(true);
    setError(null);
    
    try {
      console.log("Checking balances for:", walletAddress);
      const results = await checkZaoAndLoanzBalances(walletAddress);
      
      console.log("ZAO result:", results.zao);
      console.log("LOANZ result:", results.loanz);
      
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Direct Token Balance Test</h1>
      
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Testing Specific Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Wallet: <span className="font-mono">{walletAddress}</span>
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="grid gap-3 mb-6">
          {/* ZAO Balance */}
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div>
              <div className="font-medium">${TOKENS.zao.tokenSymbol}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{TOKENS.zao.network}</div>
            </div>
            
            <div className="text-right">
              <div className="font-mono">
                {isChecking ? "Loading..." : zaoBalance || "0"}
              </div>
              {hasZao && <div className="text-xs text-green-600 dark:text-green-400">✓ Minimum balance met</div>}
            </div>
          </div>
          
          {/* LOANZ Balance */}
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div>
              <div className="font-medium">${TOKENS.loanz.tokenSymbol}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{TOKENS.loanz.network}</div>
            </div>
            
            <div className="text-right">
              <div className="font-mono">
                {isChecking ? "Loading..." : loanzBalance || "0"}
              </div>
              {hasLoanz && <div className="text-xs text-green-600 dark:text-green-400">✓ Minimum balance met</div>}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={checkBalances} 
            disabled={isChecking}
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
    </div>
  );
}
