import React, { useState } from "react";
import { useWallet } from "../utils/useWallet";
import { useCoinTrader } from "../utils/useCoinTrader";
import type { Address } from "viem";

const PlotTokenDemo: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [ethAmount, setEthAmount] = useState("0.01");
  const [tokenAddress, setTokenAddress] = useState("");
  
  const {
    purchasePlotTokens,
    isLoading: isPurchasing,
    isConfirmed,
    txHash,
    error,
    clearError,
  } = useCoinTrader();

  const handlePurchase = async () => {
    if (!isConnected || !address || !tokenAddress) return;

    try {
      await purchasePlotTokens({
        tokenAddress: tokenAddress as Address,
        ethAmount,
        recipient: address,
      });
    } catch (err) {
      console.error("Purchase failed:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-dark-900 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 p-6">
      <h2 className="text-xl font-display font-bold text-ink-900 dark:text-white mb-4">
        Ì∫Ä PLOT Token Purchase Demo
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
            Token Address
          </label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 text-sm border border-parchment-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-ink-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
            ETH Amount
          </label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            disabled={isPurchasing}
            className="w-full px-3 py-2 text-sm border border-parchment-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-ink-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md border border-red-200 dark:border-red-900/30">
            <p className="text-sm">‚ùå {error}</p>
            <button
              onClick={clearError}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Clear
            </button>
          </div>
        )}

        {txHash && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-900/30">
            <p className="text-sm font-medium">
              {isPurchasing ? "Ì¥Ñ Processing..." : "‚úÖ Transaction Complete"}
            </p>
            <p className="text-xs mt-1">
              Tx: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
            </p>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={!isConnected || !tokenAddress || isPurchasing || parseFloat(ethAmount) <= 0}
          className={`w-full py-2.5 px-3 text-sm font-medium rounded-md transition-colors ${
            !isConnected || !tokenAddress || isPurchasing || parseFloat(ethAmount) <= 0
              ? "bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400"
          }`}
        >
          {isPurchasing
            ? "Ì¥Ñ Purchasing..."
            : !isConnected
            ? "Connect Wallet"
            : !tokenAddress
            ? "Enter Token Address"
            : "Ì∫Ä Buy PLOT Tokens"}
        </button>

        <div className="text-xs text-ink-500 dark:text-ink-400 space-y-1">
          <p>Ì≤° This demo uses the Zora Coin Trader at: <code className="text-xs">0x17CdB2a31E55669f3eb4185CBc702ad052A12A27</code></p>
          <p>Ì¥ó Transactions are processed on Base Sepolia testnet</p>
          <p>‚ö° Powered by Zora's advanced DEX infrastructure</p>
        </div>
      </div>
    </div>
  );
};

export default PlotTokenDemo;
