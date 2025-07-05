"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checkZaoAndLoanzBalances } from "@/lib/token-balance-checker";
import { Loader2 } from "lucide-react";

export default function SimpleTestPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    zao: { formattedBalance: string; hasMinimum: boolean };
    loanz: { formattedBalance: string; hasMinimum: boolean };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Test wallet address
  const testWalletAddress = "0x7234c36A71ec237c2Ae7698e8916e0735001E9Af";

  // Check token balances
  async function checkBalances() {
    setIsChecking(true);
    setError(null);
    
    try {
      console.log("[SIMPLE-TEST] Checking balances for:", testWalletAddress);
      const results = await checkZaoAndLoanzBalances(testWalletAddress);
      
      console.log("[SIMPLE-TEST] Results:", results);
      setResult(results);
    } catch (err) {
      console.error("[SIMPLE-TEST] Error checking balances:", err);
      setError("Failed to check token balances. See console for details.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Simple Token Balance Test</h1>
      
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Testing Specific Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Wallet: <span className="font-mono">{testWalletAddress}</span>
          </p>
        </div>
        
        <div className="mb-6">
          <Button 
            onClick={checkBalances} 
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Balances...
              </>
            ) : "Check Token Balances"}
          </Button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}
        
        {result && (
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-4 text-center">Token Balances</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r pr-4">
                <p className="font-medium">$ZAO (Optimism)</p>
                <p className="mt-2">Balance: <span className="font-mono">{result.zao.formattedBalance}</span></p>
                <p className="mt-1">
                  Status: {result.zao.hasMinimum ? (
                    <span className="text-green-600 dark:text-green-400">✓ Sufficient</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">✗ Insufficient</span>
                  )}
                </p>
              </div>
              
              <div className="pl-4">
                <p className="font-medium">$LOANZ (Base)</p>
                <p className="mt-2">Balance: <span className="font-mono">{result.loanz.formattedBalance}</span></p>
                <p className="mt-1">
                  Status: {result.loanz.hasMinimum ? (
                    <span className="text-green-600 dark:text-green-400">✓ Sufficient</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">✗ Insufficient</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-center">
                Access: {(result.zao.hasMinimum || result.loanz.hasMinimum) ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">✓ Granted</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-medium">✗ Denied</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
