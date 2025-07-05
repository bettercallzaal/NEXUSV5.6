"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenChecker } from "@/components/token-checker";
import { WalletConnector } from "@/components/wallet-connector";
import { checkZaoAndLoanzBalances } from "@/lib/token-balance-checker";
import { Loader2 } from "lucide-react";

export default function TokenCheckerPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasTokens, setHasTokens] = useState(false);
  const [zaoBalance, setZaoBalance] = useState("0");
  const [loanzBalance, setLoanzBalance] = useState("0");
  const [testWalletResult, setTestWalletResult] = useState<{
    zao: { formattedBalance: string; hasMinimum: boolean };
    loanz: { formattedBalance: string; hasMinimum: boolean };
  } | null>(null);
  const [isTestingWallet, setIsTestingWallet] = useState(false);

  // Handle wallet connection
  const handleWalletConnected = (address: string) => {
    console.log("[TOKEN-PAGE] Wallet connected:", address);
    setWalletAddress(address);
  };

  // Handle wallet disconnection
  const handleWalletDisconnected = () => {
    console.log("[TOKEN-PAGE] Wallet disconnected");
    setWalletAddress(null);
    setHasTokens(false);
    setZaoBalance("0");
    setLoanzBalance("0");
  };

  // Handle balance check results
  const handleBalancesChecked = (hasTokens: boolean, zaoBalance: string, loanzBalance: string) => {
    console.log("[TOKEN-PAGE] Balances checked - Has tokens:", hasTokens);
    console.log("[TOKEN-PAGE] ZAO Balance:", zaoBalance);
    console.log("[TOKEN-PAGE] LOANZ Balance:", loanzBalance);
    setHasTokens(hasTokens);
    setZaoBalance(zaoBalance);
    setLoanzBalance(loanzBalance);
  };

  // Test specific wallet address
  const testSpecificWallet = async () => {
    const testWalletAddress = "0x7234c36A71ec237c2Ae7698e8916e0735001E9Af";
    setIsTestingWallet(true);
    
    try {
      console.log("[TOKEN-PAGE] Testing specific wallet:", testWalletAddress);
      const results = await checkZaoAndLoanzBalances(testWalletAddress);
      setTestWalletResult(results);
      console.log("[TOKEN-PAGE] Test wallet results:", results);
    } catch (error) {
      console.error("[TOKEN-PAGE] Error testing wallet:", error);
    } finally {
      setIsTestingWallet(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Token Balance Checker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>Connect your wallet to check token balances</CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnector 
              onWalletConnected={handleWalletConnected}
              onWalletDisconnected={handleWalletDisconnected}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Token Balances</CardTitle>
            <CardDescription>
              {walletAddress ? "Your current token balances" : "Connect wallet to view balances"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TokenChecker 
              walletAddress={walletAddress}
              onBalancesChecked={handleBalancesChecked}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="w-full">
              <p className="text-sm font-medium mb-2">Access Status:</p>
              <div className={`p-3 rounded-md ${hasTokens ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"}`}>
                {hasTokens 
                  ? "✅ You have sufficient tokens for access" 
                  : "⚠️ Insufficient token balance for access"}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Specific Wallet</CardTitle>
            <CardDescription>Test the balance checker with a known wallet address</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-sm">Test wallet: <code>0x7234c36A71ec237c2Ae7698e8916e0735001E9Af</code></p>
              
              <Button 
                onClick={testSpecificWallet} 
                disabled={isTestingWallet}
                className="w-full md:w-auto"
              >
                {isTestingWallet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : "Test Specific Wallet"}
              </Button>
              
              {testWalletResult && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Test Results:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">$ZAO:</p>
                      <p>Balance: {testWalletResult.zao.formattedBalance}</p>
                      <p>Has Minimum: {testWalletResult.zao.hasMinimum ? "✅ Yes" : "❌ No"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">$LOANZ:</p>
                      <p>Balance: {testWalletResult.loanz.formattedBalance}</p>
                      <p>Has Minimum: {testWalletResult.loanz.hasMinimum ? "✅ Yes" : "❌ No"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
