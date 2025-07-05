"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { checkZaoAndLoanzBalances, formatBalance, hasMinimumBalance } from "@/lib/token-balance-checker";

// Import ERC20 ABI for token interactions
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

// No longer need Alchemy SDK initialization as we're using the token-balance-checker

// Token addresses from environment variables
const ZAO_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ZAO_TOKEN_ADDRESS || "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957"; // ZAO on Optimism
const LOANZ_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LOANZ_TOKEN_ADDRESS || "0x03315307b202bf9c55ebebb8e9341d30411a0bc4"; // LOANZ on Base

// RPC URLs from environment variables
const OPTIMISM_RPC = process.env.NEXT_PUBLIC_OPTIMISM_RPC || "https://opt-mainnet.g.alchemy.com/v2/X254XnJZXB2fXUSNSUJRRO1YWQF-OnAd";
const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC || "https://base-mainnet.g.alchemy.com/v2/X254XnJZXB2fXUSNSUJRRO1YWQF-OnAd";

// Network configurations
const NETWORKS = {
  optimism: {
    name: 'Optimism',
    rpcUrl: OPTIMISM_RPC,
    tokenAddress: ZAO_TOKEN_ADDRESS,
    tokenSymbol: 'ZAO'
  },
  base: {
    name: 'Base',
    rpcUrl: BASE_RPC,
    tokenAddress: LOANZ_TOKEN_ADDRESS,
    tokenSymbol: 'LOANZ'
  }
};

// Cache providers to avoid creating new instances on every check
let providers = {
  optimism: undefined as ethers.providers.JsonRpcProvider | undefined,
  base: undefined as ethers.providers.JsonRpcProvider | undefined
};

// Cache contracts to avoid creating new instances on every check
let contracts = {
  zao: undefined as ethers.Contract | undefined,
  loanz: undefined as ethers.Contract | undefined
};

// Initialize providers and contracts
const initializeProviders = () => {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('Initializing providers with URLs:', NETWORKS.optimism.rpcUrl, NETWORKS.base.rpcUrl);
    
    // Always initialize fresh providers
    providers.optimism = new ethers.providers.JsonRpcProvider(NETWORKS.optimism.rpcUrl);
    console.log('Optimism provider initialized');
    
    providers.base = new ethers.providers.JsonRpcProvider(NETWORKS.base.rpcUrl);
    console.log('Base provider initialized');
    
    // Initialize contracts with providers
    contracts.zao = new ethers.Contract(NETWORKS.optimism.tokenAddress, ERC20_ABI, providers.optimism);
    console.log('ZAO contract initialized with address:', NETWORKS.optimism.tokenAddress);
    
    contracts.loanz = new ethers.Contract(NETWORKS.base.tokenAddress, ERC20_ABI, providers.base);
    console.log('LOANZ contract initialized with address:', NETWORKS.base.tokenAddress);
  } catch (error) {
    console.error('Error initializing providers:', error);
  }
};

// Interface for wallet state
interface WalletState {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  hasTokens: boolean;
  zaoBalance: string;
  loanzBalance: string;
  lastChecked: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  checkTokenBalance: () => Promise<void>;
  checkZao: () => Promise<void>;
  checkLoanz: () => Promise<void>;
  setBalances: (zaoBalance: string, loanzBalance: string, hasTokens: boolean) => void;
}

// Create wallet store with Zustand and persist middleware
export const useWalletStore = create(
  (persist as any)(
    (set: any, get: any) => ({
      address: null,
      isConnecting: false,
      isConnected: false,
      hasTokens: false,
      zaoBalance: '0',
      loanzBalance: '0',
      lastChecked: 0,
      
      connect: async () => {
        try {
          set({ isConnecting: true });
          
          // Check if MetaMask is installed
          if (typeof window !== 'undefined' && window.ethereum) {
            // Initialize providers and contracts
            initializeProviders();
            
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            
            set({ 
              address, 
              isConnected: true,
              isConnecting: false
            });
            
            // Check token balances after connecting
            await get().checkTokenBalance();
            
            // Set up event listeners for account and chain changes
            window.ethereum.on('accountsChanged', async (accounts: string[]) => {
              if (accounts.length === 0) {
                // User disconnected their wallet
                get().disconnect();
              } else {
                // User switched accounts
                set({ address: accounts[0] });
                await get().checkTokenBalance();
              }
            });
            
            window.ethereum.on('chainChanged', async () => {
              // Refresh token balances when chain changes
              await get().checkTokenBalance();
            });
          } else {
            console.error('MetaMask is not installed');
            set({ isConnecting: false });
          }
        } catch (error) {
          console.error('Error connecting wallet:', error);
          set({ isConnecting: false });
        }
      },
      
      disconnect: () => {
        set({ 
          address: null, 
          isConnected: false,
          hasTokens: false,
          zaoBalance: '0',
          loanzBalance: '0'
        });
      },
      
      checkTokenBalance: async () => {
        const { address, lastChecked } = get();
        console.log("[DEBUG] Checking token balances for address:", address);
        
        // Always use a valid wallet address - either the connected one or a test one for debugging
        const walletToCheck = address || "0x7234c36A71ec237c2Ae7698e8916e0735001E9Af";
        console.log("[DEBUG] Using wallet address for balance check:", walletToCheck);
        
        // Skip throttling for now to ensure balances are checked
        set({ lastChecked: Date.now() });
        
        try {
          console.log("[DEBUG] Calling checkZaoAndLoanzBalances with address:", walletToCheck);
          
          // Check both ZAO and LOANZ balances in one call
          const results = await checkZaoAndLoanzBalances(walletToCheck);
          
          console.log("[DEBUG] Balance check results:", JSON.stringify(results, null, 2));
          
          // Update state with formatted balances
          set({
            zaoBalance: results.zao.formattedBalance,
            loanzBalance: results.loanz.formattedBalance,
            hasTokens: results.zao.hasMinimum || results.loanz.hasMinimum
          });
          
          // Log results
          console.log("ZAO balance:", results.zao.formattedBalance, "Has ZAO:", results.zao.hasMinimum);
          console.log("LOANZ balance:", results.loanz.formattedBalance, "Has LOANZ:", results.loanz.hasMinimum);
          console.log("[DEBUG] State after update:", JSON.stringify({
            zaoBalance: get().zaoBalance,
            loanzBalance: get().loanzBalance,
            hasTokens: get().hasTokens
          }, null, 2));
          
        } catch (error) {
          console.error("[DEBUG] Error in checkTokenBalance:", error);
        }
      },
      
      // Check ZAO balance only using the improved token-balance-checker
      checkZao: async () => {
        const { address } = get();
        if (!address) return;
        set({ lastChecked: Date.now() });
        
        try {
          // Use token-balance-checker to check ZAO balance
          const results = await checkZaoAndLoanzBalances(address);
          
          // Update state with ZAO balance
          set({
            zaoBalance: results.zao.formattedBalance,
            hasTokens: results.zao.hasMinimum || parseFloat(get().loanzBalance) >= 0.1
          });
          
          console.log("ZAO balance:", results.zao.formattedBalance, "Has ZAO:", results.zao.hasMinimum);
        } catch (error) {
          console.error("Error checking ZAO balance:", error);
        }
      },
      
      // Check LOANZ balance only using the improved token-balance-checker
      checkLoanz: async () => {
        const { address } = get();
        if (!address) return;
        set({ lastChecked: Date.now() });
        
        try {
          // Use token-balance-checker to check LOANZ balance
          const results = await checkZaoAndLoanzBalances(address);
          
          // Update state with LOANZ balance
          set({
            loanzBalance: results.loanz.formattedBalance,
            hasTokens: results.loanz.hasMinimum || parseFloat(get().zaoBalance) >= 0.1
          });
          
          console.log("LOANZ balance:", results.loanz.formattedBalance, "Has LOANZ:", results.loanz.hasMinimum);
        } catch (error) {
          console.error("Error checking LOANZ balance:", error);
        }
      },
      
      // Directly set token balances (useful for testing or external updates)
      setBalances: (zaoBalance: string, loanzBalance: string, hasTokens: boolean) => {
        console.log("[DEBUG] Setting balances directly - ZAO:", zaoBalance, "LOANZ:", loanzBalance, "Has tokens:", hasTokens);
        set({
          zaoBalance,
          loanzBalance,
          hasTokens
        });
      },
    }),
    {
      // Selector for wallet state
      name: 'wallet-storage', // unique name for localStorage
      partialize: (state: any) => ({
        address: state.address,
        zaoBalance: state.zaoBalance,
        loanzBalance: state.loanzBalance,
        hasTokens: state.hasTokens,
        lastChecked: state.lastChecked
      })
    }
  )
);

// Custom hook to use wallet functionality
export function useWallet() {
  const state = useWalletStore((state: WalletState) => ({
    address: state.address,
    isConnected: !!state.address,
    zaoBalance: state.zaoBalance,
    loanzBalance: state.loanzBalance,
    hasTokens: state.hasTokens,
    isConnecting: state.isConnecting,
    lastChecked: state.lastChecked,
    connect: state.connect,
    disconnect: state.disconnect,
    checkTokenBalance: state.checkTokenBalance,
    checkZao: state.checkZao,
    checkLoanz: state.checkLoanz
  }));
  const { 
    address,
    isConnected,
    isConnecting,
    hasTokens,
    zaoBalance,
    loanzBalance,
    connect,
    disconnect,
    checkTokenBalance 
  } = useWalletStore();

  // Format address for display (0x1234...5678)
  const formatAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Check connection on initial load and set up event listeners
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    // Check if already connected
    const checkConnection = async () => {
      try {
        const ethereum = window.ethereum;
        if (!ethereum) return;
        
        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0 && !isConnected) {
          useWalletStore.setState({ 
            address: accounts[0],
            isConnected: true
          });
          checkTokenBalance();
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    checkConnection();

    // Clean up function not needed as event listeners are set up in the Zustand store
  }, [isConnected, checkTokenBalance]);

  // Function to manually check ZAO balance
  const checkZao = useCallback(() => {
    if (isConnected && address) {
      console.log("Manually checking ZAO balance...");
      checkTokenBalance();
    }
  }, [isConnected, address, checkTokenBalance]);

  // Function to manually check LOANZ balance
  const checkLoanz = useCallback(() => {
    if (isConnected && address) {
      console.log("Manually checking LOANZ balance...");
      checkTokenBalance();
    }
  }, [isConnected, address, checkTokenBalance]);

  return {
    address,
    formattedAddress: address ? formatAddress(address) : null,
    isConnected,
    isConnecting,
    hasTokens,
    zaoBalance,
    loanzBalance,
    connect,
    disconnect,
    checkTokenBalance,
    checkZao: useWalletStore.getState().checkZao,
    checkLoanz: useWalletStore.getState().checkLoanz,
    setBalances: useWalletStore.getState().setBalances
  };
}
