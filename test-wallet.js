// Import ethers.js
const { ethers } = require('ethers');

console.log('Script started...');

// ERC20 ABI for token balance checking
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Token configurations
const NETWORKS = {
  optimism: {
    name: "Optimism",
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC || "https://mainnet.optimism.io",
    tokenAddress: process.env.NEXT_PUBLIC_ZAO_TOKEN_ADDRESS || "0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957",
    decimals: 18,
    symbol: "ZAO"
  },
  base: {
    name: "Base",
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org",
    tokenAddress: process.env.NEXT_PUBLIC_LOANZ_TOKEN_ADDRESS || "0x03315307b202bf9c55ebebb8e9341d30411a0bc4",
    decimals: 18,
    symbol: "LOANZ"
  }
};

// Format balance for display
function formatBalance(rawBalance, decimals = 18) {
  if (!rawBalance) return "0";
  return ethers.utils.formatUnits(rawBalance, decimals);
}

async function checkTokenBalance(walletAddress) {
  console.log(`Checking balances for wallet: ${walletAddress}`);
  
  try {
    // Check ZAO balance on Optimism
    const optimismProvider = new ethers.providers.JsonRpcProvider(NETWORKS.optimism.rpcUrl);
    const zaoContract = new ethers.Contract(NETWORKS.optimism.tokenAddress, ERC20_ABI, optimismProvider);
    const zaoBalance = await zaoContract.balanceOf(walletAddress);
    const formattedZaoBalance = formatBalance(zaoBalance);
    console.log(`ZAO Balance on Optimism: ${formattedZaoBalance}`);
    
    // Check LOANZ balance on Base
    const baseProvider = new ethers.providers.JsonRpcProvider(NETWORKS.base.rpcUrl);
    const loanzContract = new ethers.Contract(NETWORKS.base.tokenAddress, ERC20_ABI, baseProvider);
    const loanzBalance = await loanzContract.balanceOf(walletAddress);
    const formattedLoanzBalance = formatBalance(loanzBalance);
    console.log(`LOANZ Balance on Base: ${formattedLoanzBalance}`);
    
    // Check if wallet has minimum token balance (0.1 of either token)
    const hasZao = ethers.BigNumber.from(zaoBalance).gte(ethers.utils.parseEther("0.1"));
    const hasLoanz = ethers.BigNumber.from(loanzBalance).gte(ethers.utils.parseEther("0.1"));
    const hasTokens = hasZao || hasLoanz;
    
    console.log(`Has at least 0.1 ZAO: ${hasZao}`);
    console.log(`Has at least 0.1 LOANZ: ${hasLoanz}`);
    console.log(`Has required tokens for access: ${hasTokens}`);
    
  } catch (error) {
    console.error("Error checking token balances:", error);
  }
}

// Wallet address to check
const walletAddress = "0x7234c36A71ec237c2Ae7698e8916e0735001E9Af";

// Run the check
checkTokenBalance(walletAddress);
