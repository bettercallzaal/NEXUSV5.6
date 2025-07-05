import { ethers } from "ethers";
import Web3 from "web3";

// Minimal ABI for ERC20 token balance checking
const ERC20_MINIMAL_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "decimals", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "symbol", type: "string" }],
    type: "function",
  },
];

// Token configuration
export const TOKENS = {
  zao: {
    network: "Optimism",
    chainId: 10,
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC || "https://opt-mainnet.g.alchemy.com/v2/LkItjJ7_5DDMRV2-xZuYIEdqYxBuC-K-",
    tokenAddress: process.env.NEXT_PUBLIC_ZAO_TOKEN_ADDRESS || "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957",
    tokenSymbol: "ZAO",
    decimals: 18,
  },
  loanz: {
    network: "Base",
    chainId: 8453,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC || "https://base-mainnet.g.alchemy.com/v2/LkItjJ7_5DDMRV2-xZuYIEdqYxBuC-K-",
    tokenAddress: process.env.NEXT_PUBLIC_LOANZ_TOKEN_ADDRESS || "0x03315307b202bf9c55ebebb8e9341d30411a0bc4",
    tokenSymbol: "LOANZ",
    decimals: 18,
  },
};

// Format balance with proper decimals
export function formatBalance(balance: ethers.BigNumber | string, decimals = 18): string {
  const balanceBN = typeof balance === "string" ? ethers.BigNumber.from(balance) : balance;
  const formatted = ethers.utils.formatUnits(balanceBN, decimals);
  const parsed = parseFloat(formatted);
  return parsed.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

// Check if user has minimum required token balance
export function hasMinimumBalance(balance: ethers.BigNumber | string, minAmount = "0.1", decimals = 18): boolean {
  const balanceBN = typeof balance === "string" ? ethers.BigNumber.from(balance) : balance;
  const minAmountBN = ethers.utils.parseUnits(minAmount, decimals);
  return balanceBN.gte(minAmountBN);
}

// Method 1: Using ethers.js (most reliable for direct contract calls)
export async function checkTokenBalanceEthers(
  walletAddress: string,
  tokenAddress: string,
  rpcUrl: string
): Promise<{ rawBalance: ethers.BigNumber; formattedBalance: string }> {
  try {
    console.log(`[DEBUG-ETHERS] Checking balance for wallet: ${walletAddress}`);
    console.log(`[DEBUG-ETHERS] Token address: ${tokenAddress}`);
    console.log(`[DEBUG-ETHERS] RPC URL: ${rpcUrl}`);
    
    // Validate inputs
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      console.error(`[DEBUG-ETHERS] Invalid wallet address: ${walletAddress}`);
      return { rawBalance: ethers.BigNumber.from(0), formattedBalance: "0" };
    }
    
    if (!tokenAddress || !ethers.utils.isAddress(tokenAddress)) {
      console.error(`[DEBUG-ETHERS] Invalid token address: ${tokenAddress}`);
      return { rawBalance: ethers.BigNumber.from(0), formattedBalance: "0" };
    }
    
    // Create provider with timeout
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_MINIMAL_ABI, provider);
    
    console.log(`[DEBUG-ETHERS] Calling balanceOf for ${walletAddress}`);
    const rawBalance = await tokenContract.balanceOf(walletAddress);
    console.log(`[DEBUG-ETHERS] Raw balance received: ${rawBalance.toString()}`);
    
    const formattedBalance = formatBalance(rawBalance);
    console.log(`[DEBUG-ETHERS] Formatted balance: ${formattedBalance}`);
    
    return { rawBalance, formattedBalance };
  } catch (error) {
    console.error("[DEBUG-ETHERS] Error checking token balance:", error);
    // Return zero instead of throwing to make the UI more resilient
    return { rawBalance: ethers.BigNumber.from(0), formattedBalance: "0" };
  }
}

// Method 2: Using Web3.js (alternative approach)
export async function checkTokenBalanceWeb3(
  walletAddress: string,
  tokenAddress: string,
  rpcUrl: string
): Promise<{ rawBalance: string; formattedBalance: string }> {
  try {
    console.log(`[DEBUG-WEB3] Checking balance for wallet: ${walletAddress}`);
    
    // Validate inputs
    if (!walletAddress) {
      console.error(`[DEBUG-WEB3] Invalid wallet address: ${walletAddress}`);
      return { rawBalance: "0", formattedBalance: "0" };
    }
    
    if (!tokenAddress) {
      console.error(`[DEBUG-WEB3] Invalid token address: ${tokenAddress}`);
      return { rawBalance: "0", formattedBalance: "0" };
    }
    
    const web3 = new Web3(rpcUrl);
    const tokenContract = new web3.eth.Contract(ERC20_MINIMAL_ABI as any, tokenAddress);
    
    // Explicitly cast the result to string to fix TypeScript errors
    const balanceResult = await tokenContract.methods.balanceOf(walletAddress).call();
    const rawBalance: string = balanceResult ? balanceResult.toString() : "0";
    
    const formattedBalance = formatBalance(rawBalance);
    
    return { rawBalance, formattedBalance };
  } catch (error) {
    console.error("[DEBUG-WEB3] Error checking token balance:", error);
    // Return zero instead of throwing
    return { rawBalance: "0", formattedBalance: "0" };
  }
}

// Check multiple token balances in parallel (most efficient)
export async function checkMultipleTokenBalances(
  walletAddress: string,
  tokens: Array<{ tokenAddress: string; rpcUrl: string; symbol: string; decimals: number }>
): Promise<Array<{ symbol: string; rawBalance: string; formattedBalance: string; hasMinimum: boolean }>> {
  try {
    // Create array of balance check promises
    const balancePromises = tokens.map(token => {
      const provider = new ethers.providers.JsonRpcProvider(token.rpcUrl);
      const tokenContract = new ethers.Contract(token.tokenAddress, ERC20_MINIMAL_ABI, provider);
      return tokenContract.balanceOf(walletAddress);
    });
    
    // Execute all balance checks in parallel
    const results = await Promise.allSettled(balancePromises);
    
    // Process results
    return results.map((result, index) => {
      const token = tokens[index];
      
      if (result.status === "fulfilled") {
        const rawBalance = result.value;
        const formattedBalance = formatBalance(rawBalance, token.decimals);
        const hasMinimum = hasMinimumBalance(rawBalance, "0.1", token.decimals);
        
        return {
          symbol: token.symbol,
          rawBalance: rawBalance.toString(),
          formattedBalance,
          hasMinimum,
        };
      } else {
        console.error(`Error checking balance for ${token.symbol}:`, result.reason);
        return {
          symbol: token.symbol,
          rawBalance: "0",
          formattedBalance: "Error",
          hasMinimum: false,
        };
      }
    });
  } catch (error) {
    console.error("Error checking multiple token balances:", error);
    throw error;
  }
}

// Check both ZAO and LOANZ balances in one call
export async function checkZaoAndLoanzBalances(walletAddress: string) {
  console.log("[DEBUG-CHECKER] Starting checkZaoAndLoanzBalances for wallet:", walletAddress);
  
  // Validate wallet address
  if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
    console.error(`[DEBUG-CHECKER] Invalid wallet address: ${walletAddress}`);
    // Return zero balances but don't throw
    return {
      zao: { rawBalance: "0", formattedBalance: "0", hasMinimum: false },
      loanz: { rawBalance: "0", formattedBalance: "0", hasMinimum: false }
    };
  }
  
  console.log("[DEBUG-CHECKER] Using token addresses - ZAO:", TOKENS.zao.tokenAddress, "LOANZ:", TOKENS.loanz.tokenAddress);
  console.log("[DEBUG-CHECKER] Using RPC URLs - Optimism:", TOKENS.zao.rpcUrl, "Base:", TOKENS.loanz.rpcUrl);
  
  try {
    // Check both tokens in parallel
    console.log("[DEBUG-CHECKER] Checking balances in parallel...");
    
    // Use sequential calls if Promise.allSettled fails
    let zaoResult;
    let loanzResult;
    
    try {
      [zaoResult, loanzResult] = await Promise.allSettled([
        checkTokenBalanceEthers(walletAddress, TOKENS.zao.tokenAddress, TOKENS.zao.rpcUrl),
        checkTokenBalanceEthers(walletAddress, TOKENS.loanz.tokenAddress, TOKENS.loanz.rpcUrl)
      ]);
    } catch (parallelError) {
      console.error("[DEBUG-CHECKER] Error in parallel balance check, trying sequential:", parallelError);
      
      // Try sequential calls as fallback
      try {
        zaoResult = { status: "fulfilled", value: await checkTokenBalanceEthers(walletAddress, TOKENS.zao.tokenAddress, TOKENS.zao.rpcUrl) };
      } catch (zaoError) {
        console.error("[DEBUG-CHECKER] Error checking ZAO balance:", zaoError);
        zaoResult = { status: "rejected", reason: zaoError };
      }
      
      try {
        loanzResult = { status: "fulfilled", value: await checkTokenBalanceEthers(walletAddress, TOKENS.loanz.tokenAddress, TOKENS.loanz.rpcUrl) };
      } catch (loanzError) {
        console.error("[DEBUG-CHECKER] Error checking LOANZ balance:", loanzError);
        loanzResult = { status: "rejected", reason: loanzError };
      }
    }
    
    console.log("[DEBUG-CHECKER] ZAO result status:", zaoResult?.status);
    console.log("[DEBUG-CHECKER] LOANZ result status:", loanzResult?.status);
    
    // Process ZAO result
    const zao = {
      rawBalance: (zaoResult?.status === "fulfilled" && zaoResult.value) ? zaoResult.value.rawBalance.toString() : "0",
      formattedBalance: (zaoResult?.status === "fulfilled" && zaoResult.value) ? zaoResult.value.formattedBalance : "0",
      hasMinimum: (zaoResult?.status === "fulfilled" && zaoResult.value) ? hasMinimumBalance(zaoResult.value.rawBalance) : false
    };
    
    // Process LOANZ result
    const loanz = {
      rawBalance: (loanzResult?.status === "fulfilled" && loanzResult.value) ? loanzResult.value.rawBalance.toString() : "0",
      formattedBalance: (loanzResult?.status === "fulfilled" && loanzResult.value) ? loanzResult.value.formattedBalance : "0",
      hasMinimum: (loanzResult?.status === "fulfilled" && loanzResult.value) ? hasMinimumBalance(loanzResult.value.rawBalance) : false
    };
    
    console.log("[DEBUG-CHECKER] Final results - ZAO:", zao, "LOANZ:", loanz);
    return { zao, loanz };
  } catch (error) {
    console.error("[DEBUG-CHECKER] Error checking token balances:", error);
    // Return zero balances but don't throw
    return {
      zao: { rawBalance: "0", formattedBalance: "0", hasMinimum: false },
      loanz: { rawBalance: "0", formattedBalance: "0", hasMinimum: false }
    };
  }
}
