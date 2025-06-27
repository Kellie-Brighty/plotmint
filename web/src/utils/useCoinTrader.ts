import { useState } from "react";
import { parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import type { Address } from "viem";
import { useWallet } from "./useWallet";
import {
  COIN_TRADER_ABI,
  COIN_TRADER_ADDRESS,
  PLATFORM_CONFIG,
  createPlotTokenPoolKey,
  getTradeDeadline,
  type PlotTokenPurchase,
  type PlotTokenSale,
} from "./coinTrader";

export function useCoinTrader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { getWalletClient, getPublicClient, address, isConnected } =
    useWallet();

  const purchasePlotTokens = async ({
    tokenAddress,
    ethAmount,
    recipient,
    minTokensOut = 0n,
    deadline,
  }: PlotTokenPurchase) => {
    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Wallet client not available");
      }

      setIsProcessing(true);
      setError(null);
      setIsConfirmed(false);
      setTxHash(null);

      const amountInWei = parseEther(ethAmount);

      // Calculate minimum tokens out with 0.5% slippage if not provided
      const calculatedMinOut = minTokensOut || (amountInWei * 995n) / 1000n;

      // Get deadline (default 20 minutes from now)
      const tradeDeadline = deadline || getTradeDeadline();

      // Create pool key for this token
      const poolKey = createPlotTokenPoolKey(tokenAddress);

      console.log("🚀 Purchasing plot tokens with Zora Coin Trader:", {
        tokenAddress,
        ethAmount,
        recipient,
        minTokensOut: calculatedMinOut.toString(),
        deadline: tradeDeadline.toString(),
        poolKey,
        coinTraderAddress: COIN_TRADER_ADDRESS,
        platformReferrer: PLATFORM_CONFIG.platformReferrer,
        amountInWei: amountInWei.toString(),
      });

      console.log("📋 buyCoin call parameters:", {
        address: COIN_TRADER_ADDRESS,
        functionName: "buyCoin",
        poolKey,
        recipient,
        minAmountOut: calculatedMinOut.toString(),
        deadline: tradeDeadline.toString(),
        tradeReferrer: PLATFORM_CONFIG.platformReferrer,
        value: amountInWei.toString(),
        chain: "baseSepolia",
        account: address,
      });

      // Call buyCoin function with ETH
      const hash = await walletClient.writeContract({
        address: COIN_TRADER_ADDRESS,
        abi: COIN_TRADER_ABI,
        functionName: "buyCoin",
        args: [
          poolKey, // PoolKey struct
          recipient, // recipient address
          calculatedMinOut, // minAmountOut (tokens)
          tradeDeadline, // deadline timestamp
          PLATFORM_CONFIG.platformReferrer, // tradeReferrer
        ],
        value: amountInWei, // ETH amount to spend
        chain: baseSepolia,
        account: address,
      });

      setTxHash(hash);
      console.log("📝 Transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log("✅ Transaction confirmed:", receipt);
      setIsConfirmed(true);
      setIsProcessing(false);

      return { hash, receipt };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to purchase tokens";
      console.error("❌ Error purchasing plot tokens:", err);
      setError(errorMessage);
      setIsProcessing(false);
      throw err;
    }
  };

  const sellPlotTokens = async ({
    tokenAddress,
    tokenAmount,
    recipient,
    minEthOut = 0n,
    deadline,
  }: PlotTokenSale) => {
    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Wallet client not available");
      }

      setIsProcessing(true);
      setError(null);
      setIsConfirmed(false);
      setTxHash(null);

      // Calculate minimum ETH out with 0.5% slippage if not provided
      const calculatedMinOut = minEthOut || (tokenAmount * 995n) / 1000n;

      // Get deadline (default 20 minutes from now)
      const tradeDeadline = deadline || getTradeDeadline();

      // Create pool key for this token
      const poolKey = createPlotTokenPoolKey(tokenAddress);

      console.log("🔄 Selling plot tokens with Zora Coin Trader:", {
        tokenAddress,
        tokenAmount: tokenAmount.toString(),
        recipient,
        minEthOut: calculatedMinOut.toString(),
        deadline: tradeDeadline.toString(),
        poolKey,
      });

      // Call sellCoin function
      const hash = await walletClient.writeContract({
        address: COIN_TRADER_ADDRESS,
        abi: COIN_TRADER_ABI,
        functionName: "sellCoin",
        args: [
          poolKey, // PoolKey struct
          tokenAmount, // amountIn (tokens to sell)
          recipient, // recipient address
          calculatedMinOut, // minAmountOut (ETH)
          tradeDeadline, // deadline timestamp
          PLATFORM_CONFIG.platformReferrer, // tradeReferrer
        ],
        chain: baseSepolia,
        account: address,
      });

      setTxHash(hash);
      console.log("📝 Transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log("✅ Transaction confirmed:", receipt);
      setIsConfirmed(true);
      setIsProcessing(false);

      return { hash, receipt };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sell tokens";
      console.error("❌ Error selling plot tokens:", err);
      setError(errorMessage);
      setIsProcessing(false);
      throw err;
    }
  };

  // Get token price (ETH per token)
  const getTokenPrice = async (_tokenAddress: Address): Promise<number> => {
    try {
      const publicClient = getPublicClient();
      if (!publicClient) throw new Error("Public client not available");

      // This would need to be implemented based on pool liquidity
      // For now, return a placeholder value
      // TODO: Implement actual price fetching from the pool
      return 0.001; // Placeholder: 0.001 ETH per token
    } catch (error) {
      console.error("Error getting token price:", error);
      return 0;
    }
  };

  // Get token supply
  const getTokenSupply = async (tokenAddress: Address): Promise<bigint> => {
    try {
      const publicClient = getPublicClient();
      if (!publicClient) throw new Error("Public client not available");

      // Read the total supply from the ERC20 token contract
      const totalSupply = await publicClient.readContract({
        address: tokenAddress,
        abi: [
          {
            name: "totalSupply",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        functionName: "totalSupply",
      });

      return totalSupply as bigint;
    } catch (error) {
      console.error("Error getting token supply:", error);
      return 0n;
    }
  };

  // Get token balance for a specific address
  const getTokenBalance = async (
    tokenAddress: Address,
    userAddress: Address
  ): Promise<number> => {
    try {
      const publicClient = getPublicClient();
      if (!publicClient) throw new Error("Public client not available");

      // Read the balance from the ERC20 token contract
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: [
          {
            name: "balanceOf",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        functionName: "balanceOf",
        args: [userAddress],
      });

      return Number(balance);
    } catch (error) {
      console.error("Error getting token balance:", error);
      return 0;
    }
  };

  return {
    // Purchase functions
    purchasePlotTokens,
    sellPlotTokens,

    // Query functions
    getTokenPrice,
    getTokenSupply,
    getTokenBalance,

    // Transaction state
    isProcessing,
    isConfirmed,
    txHash,
    error,

    // Helper methods
    clearError: () => setError(null),
    isLoading: isProcessing,
  };
}
