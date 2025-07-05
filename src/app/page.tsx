"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenChecker } from "@/components/token-checker";
import { WalletConnector } from "@/components/wallet-connector";
import { VirtualizedLinkList } from "@/components/links/virtualized-link-list";
import { LinksData } from "@/types/links";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasTokens, setHasTokens] = useState(false);
  const [zaoBalance, setZaoBalance] = useState("0");
  const [loanzBalance, setLoanzBalance] = useState("0");
  const [linksData, setLinksData] = useState<LinksData | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle wallet connection
  const handleWalletConnected = (address: string) => {
    console.log("[HOME] Wallet connected:", address);
    setWalletAddress(address);
  };

  // Handle wallet disconnection
  const handleWalletDisconnected = () => {
    console.log("[HOME] Wallet disconnected");
    setWalletAddress(null);
    setHasTokens(false);
    setZaoBalance("0");
    setLoanzBalance("0");
  };

  // Handle balance check results
  const handleBalancesChecked = (hasTokens: boolean, zaoBalance: string, loanzBalance: string) => {
    console.log("[HOME] Balances checked - Has tokens:", hasTokens);
    console.log("[HOME] ZAO Balance:", zaoBalance);
    console.log("[HOME] LOANZ Balance:", loanzBalance);
    setHasTokens(hasTokens);
    setZaoBalance(zaoBalance);
    setLoanzBalance(loanzBalance);
  };
  
  // Load links data
  useEffect(() => {
    async function loadLinks() {
      try {
        // Only load the default dataset
        const response = await fetch('/api/links');
        if (response.ok) {
          const data = await response.json();
          setLinksData(data);
        } else {
          throw new Error('Failed to load links');
        }
      } catch (error) {
        console.error("Error loading links:", error);
        // Load from static file as a fallback
        const data = await import('@/data/links.json');
        setLinksData(data);
      } finally {
        setLoading(false);
      }
    }

    loadLinks();
  }, []);
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">ZAO Nexus</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>ZAO Ecosystem Links</CardTitle>
          <CardDescription>
            Browse through our curated collection of resources and links
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading links...</span>
            </div>
          ) : linksData ? (
            <VirtualizedLinkList data={linksData} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to load links. Please try again later.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
