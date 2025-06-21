import { useState } from "react";
import { parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import type { Address } from "viem";
import { useWallet } from "./useWallet";
import {
  COIN_TRADER_ABI,
  COIN_TRADER_ADDRESS,
  PLATFORM_CONFIG,
  type PlotTokenPurchase,
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

      // Calculate minimum tokens out with 0.1% slippage if not provided
      const calculatedMinOut = minTokensOut || amountInWei / 1000n;

      console.log("🚀 Purchasing plot tokens:", {
        tokenAddress,
        ethAmount,
        recipient,
        minTokensOut: calculatedMinOut.toString(),
        coinTraderAddress: COIN_TRADER_ADDRESS,
        platformReferrer: PLATFORM_CONFIG.platformReferrer,
        amountInWei: amountInWei.toString(),
      });

      console.log("📋 Contract call parameters:", {
        address: COIN_TRADER_ADDRESS,
        functionName: "tradeCoin",
        args: [
          tokenAddress, // token address
          true, // isBuy = true
          recipient, // recipient
          amountInWei.toString(), // amountIn (ETH)
          calculatedMinOut.toString(), // minAmountOut (tokens)
          "0", // sqrtPriceLimitX96 (no price limit)
          PLATFORM_CONFIG.platformReferrer, // tradeReferrer
        ],
        value: amountInWei.toString(),
        chain: "baseSepolia",
        account: address,
      });

      // Write the contract transaction (let wallet handle gas estimation)
      const hash = await walletClient.writeContract({
        address: COIN_TRADER_ADDRESS,
        abi: COIN_TRADER_ABI,
        functionName: "tradeCoin",
        args: [
          tokenAddress, // token address
          true, // isBuy = true
          recipient, // recipient
          amountInWei, // amountIn (ETH)
          calculatedMinOut, // minAmountOut (tokens)
          0n, // sqrtPriceLimitX96 (no price limit)
          PLATFORM_CONFIG.platformReferrer, // tradeReferrer
        ],
        value: amountInWei,
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
  }: {
    tokenAddress: Address;
    tokenAmount: bigint;
    recipient: Address;
    minEthOut?: bigint;
  }) => {
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

      console.log("🔄 Selling plot tokens:", {
        tokenAddress,
        tokenAmount: tokenAmount.toString(),
        recipient,
        minEthOut: minEthOut.toString(),
      });

      // Write the contract transaction (let wallet handle gas estimation)
      const hash = await walletClient.writeContract({
        address: COIN_TRADER_ADDRESS,
        abi: COIN_TRADER_ABI,
        functionName: "tradeCoin",
        args: [
          tokenAddress, // token address
          false, // isBuy = false
          recipient, // recipient
          tokenAmount, // amountIn (tokens)
          minEthOut, // minAmountOut (ETH)
          0n, // sqrtPriceLimitX96 (no price limit)
          PLATFORM_CONFIG.platformReferrer, // tradeReferrer
        ],
        value: 0n, // No ETH sent for selling
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

      // This would need to be implemented based on the CoinTrader contract
      // For now, return a placeholder value
      // TODO: Implement actual price fetching from the contract
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
