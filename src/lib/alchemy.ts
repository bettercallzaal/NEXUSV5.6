"use client";

import { Alchemy, Network } from "alchemy-sdk";

// Token addresses from environment variables
const ZAO_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ZAO_TOKEN_ADDRESS || "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957"; // ZAO on Optimism
const LOANZ_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LOANZ_TOKEN_ADDRESS || "0x03315307b202bf9c55ebebb8e9341d30411a0bc4"; // LOANZ on Base

// Extract API key from RPC URL
const extractApiKey = (rpcUrl: string) => {
  const parts = rpcUrl.split('/');
  return parts[parts.length - 1];
};

// Alchemy API key from RPC URL
const ALCHEMY_API_KEY_OPTIMISM = process.env.NEXT_PUBLIC_OPTIMISM_RPC ? 
  extractApiKey(process.env.NEXT_PUBLIC_OPTIMISM_RPC) : 
  "LkItjJ7_5DDMRV2-xZuYIEdqYxBuC-K-";

const ALCHEMY_API_KEY_BASE = process.env.NEXT_PUBLIC_BASE_RPC ? 
  extractApiKey(process.env.NEXT_PUBLIC_BASE_RPC) : 
  "LkItjJ7_5DDMRV2-xZuYIEdqYxBuC-K-";

// Initialize Alchemy SDK for Optimism
const optimismConfig = {
  apiKey: ALCHEMY_API_KEY_OPTIMISM,
  network: Network.OPT_MAINNET,
};

// Initialize Alchemy SDK for Base
const baseConfig = {
  apiKey: ALCHEMY_API_KEY_BASE,
  network: Network.BASE_MAINNET,
};

// Create Alchemy instances
export const alchemyOptimism = new Alchemy(optimismConfig);
export const alchemyBase = new Alchemy(baseConfig);

// Function to check ZAO balance on Optimism
export async function checkZaoBalance(address: string) {
  try {
    console.log("Checking ZAO balance with Alchemy SDK for:", address);
    const balance = await alchemyOptimism.core.getTokenBalances(address, [ZAO_TOKEN_ADDRESS]);
    
    if (balance.tokenBalances.length > 0) {
      const tokenBalance = balance.tokenBalances[0].tokenBalance;
      console.log("Raw ZAO balance from Alchemy:", tokenBalance);
      return tokenBalance || "0x0";
    }
    return "0x0";
  } catch (error) {
    console.error("Error checking ZAO balance with Alchemy:", error);
    return "0x0";
  }
}

// Function to check LOANZ balance on Base
export async function checkLoanzBalance(address: string) {
  try {
    console.log("Checking LOANZ balance with Alchemy SDK for:", address);
    const balance = await alchemyBase.core.getTokenBalances(address, [LOANZ_TOKEN_ADDRESS]);
    
    if (balance.tokenBalances.length > 0) {
      const tokenBalance = balance.tokenBalances[0].tokenBalance;
      console.log("Raw LOANZ balance from Alchemy:", tokenBalance);
      return tokenBalance || "0x0";
    }
    return "0x0";
  } catch (error) {
    console.error("Error checking LOANZ balance with Alchemy:", error);
    return "0x0";
  }
}

// Function to get token metadata
export async function getTokenMetadata(tokenAddress: string, network: 'optimism' | 'base') {
  try {
    const alchemy = network === 'optimism' ? alchemyOptimism : alchemyBase;
    const metadata = await alchemy.core.getTokenMetadata(tokenAddress);
    return metadata;
  } catch (error) {
    console.error(`Error getting token metadata for ${tokenAddress}:`, error);
    return null;
  }
}
