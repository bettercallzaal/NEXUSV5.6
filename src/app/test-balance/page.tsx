"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TokenBalanceDisplay } from "@/components/token-balance-display";

export default function TestBalancePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format address for display (0x1234...5678)
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Connect wallet function
  async function connectWallet() {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } else {
        setError("No Ethereum wallet found. Please install MetaMask.");
      }
    } catch (error) {
      console.error("User denied account access:", error);
      setError("Connection denied by user.");
    } finally {
      setIsConnecting(false);
    }
  }

  // Check if wallet is already connected
  useEffect(() => {
    async function checkConnection() {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
    
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletAddress(null);
        } else {
          setWalletAddress(accounts[0]);
        }
      });
    }
    
    return () => {
      // Clean up event listener
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Token Balance Checker Test</h1>
      
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Test ZAO & LOANZ Balance Checker</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Connect your wallet to test the new balance checker
          </p>
        </div>
        
        <div className="mb-6">
          <div className="text-center mb-4">
            {walletAddress ? (
              <div className="py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                Connected: <span className="font-mono">{formatAddress(walletAddress)}</span>
              </div>
            ) : (
              <div className="py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                Not connected
              </div>
            )}
          </div>
          
          <Button 
            onClick={connectWallet} 
            disabled={isConnecting || !!walletAddress}
            className="w-full mb-4"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : walletAddress ? (
              "Wallet Connected"
            ) : (
              "Connect Wallet"
            )}
          </Button>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
        
        {walletAddress && (
          <TokenBalanceDisplay walletAddress={walletAddress} />
        )}
      </div>
    </div>
  );
}
