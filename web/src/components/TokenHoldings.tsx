import React, { useState, useEffect } from "react";
import { useWallet } from "../utils/useWallet";
import { tokenHoldingsService } from "../utils/tokenHoldingsService";
import { ZoraService } from "../utils/zoraService";
import type { UserTokenPortfolio, UserTokenHolding } from "../utils/zora";
import type { Address } from "viem";

// Add countdown timer component
const VotingCountdown: React.FC<{
  timeRemaining:
    | {
        hours: number;
        minutes: number;
        seconds: number;
        totalSeconds: number;
        isActive: boolean;
      }
    | undefined;
  className?: string;
}> = ({ timeRemaining, className = "" }) => {
  const [currentTime, setCurrentTime] = useState(timeRemaining);

  useEffect(() => {
    if (!timeRemaining?.isActive) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (!prev || prev.totalSeconds <= 0) return prev;

        const newTotalSeconds = prev.totalSeconds - 1;
        const hours = Math.floor(newTotalSeconds / 3600);
        const minutes = Math.floor((newTotalSeconds % 3600) / 60);
        const seconds = newTotalSeconds % 60;

        return {
          hours,
          minutes,
          seconds,
          totalSeconds: newTotalSeconds,
          isActive: newTotalSeconds > 0,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining?.isActive]);

  if (!currentTime?.isActive) {
    return (
      <span className={`text-green-600 dark:text-green-400 ${className}`}>
        ✅ Voting ended - Trading available
      </span>
    );
  }

  return (
    <span
      className={`text-orange-600 dark:text-orange-400 font-mono ${className}`}
    >
      ⏰ {String(currentTime.hours).padStart(2, "0")}:
      {String(currentTime.minutes).padStart(2, "0")}:
      {String(currentTime.seconds).padStart(2, "0")} remaining
    </span>
  );
};

// Add voting restriction notice component
const VotingRestrictionNotice: React.FC<{
  canSell: boolean | undefined;
  timeRemaining:
    | {
        hours: number;
        minutes: number;
        seconds: number;
        totalSeconds: number;
        isActive: boolean;
      }
    | undefined;
}> = ({ canSell, timeRemaining }) => {
  if (canSell) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-2">
        <svg
          className="w-5 h-5 text-orange-600 dark:text-orange-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Trading Restricted During Voting Period
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            You can sell your tokens after the 24-hour voting period ends.
          </p>
          <VotingCountdown timeRemaining={timeRemaining} className="text-xs" />
        </div>
      </div>
    </div>
  );
};

interface TokenHoldingsProps {
  userId: string;
}

interface SellModalProps {
  holding: UserTokenHolding;
  isOpen: boolean;
  onClose: () => void;
  onSellComplete: () => void;
}

const SellModal: React.FC<SellModalProps> = ({
  holding,
  isOpen,
  onClose,
  onSellComplete,
}) => {
  const { getWalletClient, getPublicClient, address } = useWallet();
  const [sellAmount, setSellAmount] = useState("");
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zoraService = new ZoraService();

  const maxTokens = parseInt(holding.balance);

  const handleSell = async () => {
    if (!address || !sellAmount) return;

    const tokensToSell = parseInt(sellAmount);
    if (tokensToSell <= 0 || tokensToSell > maxTokens) {
      setError("Invalid sell amount");
      return;
    }

    setSelling(true);
    setError(null);

    try {
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Wallet not connected properly");
      }

      // Convert tokens to wei (assuming 1 token = 1e18 wei)
      const tokenAmountWei =
        BigInt(tokensToSell) * BigInt("1000000000000000000");

      // Create sell trade parameters
      const sellParams = zoraService.createSellTradeParams(
        holding.tokenAddress as Address,
        tokenAmountWei,
        address,
        0.05 // 5% slippage
      );

      console.log(`🔄 Selling ${tokensToSell} ${holding.symbol} tokens...`);

      // Execute the sell trade
      const receipt = await zoraService.tradeCoin(
        sellParams,
        walletClient,
        { address } as any,
        publicClient
      );

      console.log("✅ Sell transaction successful:", receipt.transactionHash);

      // Close modal and refresh portfolio
      onClose();
      onSellComplete();
    } catch (error) {
      console.error("❌ Sell transaction failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to sell tokens"
      );
    } finally {
      setSelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
            Sell {holding.symbol}
          </h3>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-parchment-50 dark:bg-dark-800 rounded-lg">
          <div className="text-sm text-ink-600 dark:text-ink-400 mb-1">
            Token Details
          </div>
          <div className="font-medium text-ink-900 dark:text-white">
            {holding.name}
          </div>
          <div className="text-sm text-ink-600 dark:text-ink-400">
            Story: {holding.storyTitle} - {holding.chapterTitle}
          </div>
          <div className="text-sm text-ink-600 dark:text-ink-400">
            Your Balance: {holding.balance} tokens
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
            Amount to Sell
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={maxTokens}
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={() => setSellAmount(maxTokens.toString())}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Max
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={selling}
            className="flex-1 px-4 py-2 border border-parchment-300 dark:border-dark-600 text-ink-700 dark:text-ink-300 font-medium rounded-lg hover:bg-parchment-50 dark:hover:bg-dark-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSell}
            disabled={
              selling ||
              !sellAmount ||
              parseInt(sellAmount) <= 0 ||
              parseInt(sellAmount) > maxTokens
            }
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {selling ? "Selling..." : "Sell Tokens"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TokenHoldings: React.FC<TokenHoldingsProps> = ({}) => {
  const { address, isConnected } = useWallet();
  const [portfolio, setPortfolio] = useState<UserTokenPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] =
    useState<UserTokenHolding | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchTokenPortfolio();
    } else {
      setPortfolio(null);
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchTokenPortfolio = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Fetching token portfolio for address:", address);
      console.log("🔍 Address details:", {
        address: address,
        addressType: typeof address,
        addressLength: address.length,
        addressLowercase: address.toLowerCase(),
        addressUppercase: address.toUpperCase(),
      });
      
      const userPortfolio = await tokenHoldingsService.getUserTokenPortfolio(
        address
      );
      setPortfolio(userPortfolio);
      console.log("✅ Portfolio loaded:", userPortfolio);
    } catch (error) {
      console.error("❌ Error fetching token portfolio:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load token portfolio"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!address) return;

    setRefreshing(true);
    try {
      const userPortfolio = await tokenHoldingsService.getUserTokenPortfolio(
        address
      );
      setPortfolio(userPortfolio);
    } catch (error) {
      console.error("❌ Error refreshing portfolio:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSellClick = (holding: UserTokenHolding) => {
    setSelectedHolding(holding);
    setSellModalOpen(true);
  };

  const handleSellComplete = () => {
    // Refresh portfolio after successful sell
    handleRefresh();
  };

  const formatETH = (ethString: string) => {
    const value = parseFloat(ethString);
    if (value === 0) return "0 ETH";
    if (value < 0.0001) return "< 0.0001 ETH";
    return `${value.toFixed(4)} ETH`;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage > 0) return "text-green-600 dark:text-green-400";
    if (percentage < 0) return "text-red-600 dark:text-red-400";
    return "text-ink-600 dark:text-ink-400";
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-primary-600 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-ink-900 dark:text-white mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-ink-600 dark:text-ink-400">
          Connect your wallet to view your plot token holdings and portfolio
          performance.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-ink-600 dark:text-ink-400">
          Loading your token portfolio...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-ink-900 dark:text-white mb-2">
          Error Loading Portfolio
        </h3>
        <p className="text-ink-600 dark:text-ink-400 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {refreshing ? "Retrying..." : "Try Again"}
        </button>
      </div>
    );
  }

  if (!portfolio || portfolio.holdings.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-primary-600 dark:text-primary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-ink-900 dark:text-white mb-2">
          No Token Holdings Found
        </h3>
        <p className="text-ink-600 dark:text-ink-400">
          Start voting on plot options to build your portfolio! Each vote
          purchases tokens that represent your choice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
            Portfolio Overview
          </h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 text-sm bg-parchment-100 dark:bg-dark-800 border border-parchment-200 dark:border-dark-700 text-ink-700 dark:text-ink-300 rounded-lg hover:bg-parchment-200 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg">
            <p className="text-sm text-ink-600 dark:text-ink-400 mb-1">
              Total Value
            </p>
            <p className="text-xl font-bold text-ink-900 dark:text-white">
              ${parseFloat(portfolio.totalValue).toLocaleString()}
            </p>
          </div>

          <div className="text-center p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg">
            <p className="text-sm text-ink-600 dark:text-ink-400 mb-1">
              Total Invested
            </p>
            <p className="text-xl font-bold text-ink-900 dark:text-white">
              ${parseFloat(portfolio.totalInvested).toLocaleString()}
            </p>
          </div>

          <div className="text-center p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg">
            <p className="text-sm text-ink-600 dark:text-ink-400 mb-1">
              Profit/Loss
            </p>
            <p
              className={`text-xl font-bold ${getPercentageColor(
                portfolio.totalProfitLossPercentage
              )}`}
            >
              ${parseFloat(portfolio.totalProfitLoss).toLocaleString()}
            </p>
          </div>

          <div className="text-center p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg">
            <p className="text-sm text-ink-600 dark:text-ink-400 mb-1">
              Total Holdings
            </p>
            <p className="text-xl font-bold text-ink-900 dark:text-white">
              {portfolio.holdings.length}
            </p>
          </div>
        </div>

        {portfolio.totalProfitLossPercentage !== 0 && (
          <div className="mt-4 text-center">
            <span
              className={`text-sm font-medium ${getPercentageColor(
                portfolio.totalProfitLossPercentage
              )}`}
            >
              {formatPercentage(portfolio.totalProfitLossPercentage)} overall
              return
            </span>
          </div>
        )}
      </div>

      {/* Token Holdings List */}
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden">
        <div className="p-6 border-b border-parchment-200 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
            Your Token Holdings
          </h3>
          <p className="text-sm text-ink-600 dark:text-ink-400 mt-1">
            Tokens acquired through plot voting
          </p>
        </div>

        <div className="divide-y divide-parchment-200 dark:divide-dark-700">
          {portfolio.holdings.map(
            (holding: UserTokenHolding, index: number) => (
              <div
                key={`${holding.chapterId}-${holding.symbol}-${index}`}
                className="p-6"
              >
                <div className="space-y-4">
                  {/* Token Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {holding.creatorProfile?.avatar?.previewImage?.small && (
                        <img
                          src={holding.creatorProfile.avatar.previewImage.small}
                          alt={holding.creatorProfile.handle || "Creator"}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-ink-900 dark:text-white">
                          {holding.name}
                        </h4>
                          <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-medium rounded">
                            {holding.symbol}
                          </span>
                        </div>
                        <p className="text-sm text-ink-600 dark:text-ink-400">
                          {holding.storyTitle} - {holding.chapterTitle}
                        </p>
                        {holding.creatorProfile?.handle && (
                          <p className="text-xs text-ink-500 dark:text-ink-500">
                            Created by @{holding.creatorProfile.handle}
                          </p>
                        )}
                        {/* Voting countdown display */}
                        {holding.votingTimeRemaining && (
                          <div className="mt-1">
                            <VotingCountdown
                              timeRemaining={holding.votingTimeRemaining}
                              className="text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSellClick(holding)}
                      disabled={!holding.canSell}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors text-sm ${
                        holding.canSell
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        !holding.canSell
                          ? "Cannot sell during voting period"
                          : "Sell tokens"
                      }
                    >
                      {holding.canSell ? "Sell Tokens" : "Sell Restricted"}
                    </button>
                  </div>

                  {/* Voting Restriction Notice */}
                  <VotingRestrictionNotice
                    canSell={holding.canSell}
                    timeRemaining={holding.votingTimeRemaining}
                  />

                  {/* Market Data Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Your Balance */}
                    <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-3">
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-1">
                        Your Balance
                      </p>
                      <p className="text-lg font-semibold text-ink-900 dark:text-white">
                        {holding.balance}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-ink-400">
                        tokens
                      </p>
                    </div>

                    {/* Current Price */}
                    <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-3">
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-1">
                        Current Price
                      </p>
                      <p className="text-lg font-semibold text-ink-900 dark:text-white">
                        {holding.currentPrice
                          ? parseFloat(holding.currentPrice).toFixed(8)
                          : "0.00000000"}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-ink-400">
                        ETH per token
                      </p>
                    </div>

                    {/* Market Cap */}
                    <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-3">
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-1">
                        Market Cap
                      </p>
                      <p className="text-lg font-semibold text-ink-900 dark:text-white">
                        $
                        {holding.marketCap
                          ? parseFloat(holding.marketCap).toLocaleString()
                          : "0"}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-ink-400">
                        USD
                      </p>
                    </div>

                    {/* Unique Holders */}
                    <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-3">
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-1">
                        Unique Holders
                      </p>
                      <p className="text-lg font-semibold text-ink-900 dark:text-white">
                        {holding.uniqueHolders || 0}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-ink-400">
                        wallets
                      </p>
                    </div>

                    {/* Total Volume */}
                    <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-3">
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-1">
                        Total Volume
                      </p>
                      <p className="text-lg font-semibold text-ink-900 dark:text-white">
                        $
                        {holding.totalVolume
                          ? parseFloat(holding.totalVolume).toLocaleString()
                          : "0"}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-ink-400">
                        USD
                      </p>
                  </div>

                    {/* Your Investment */}
                    <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-3">
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-1">
                        Your Investment
                      </p>
                      <p className="text-lg font-semibold text-ink-900 dark:text-white">
                        {formatETH(holding.purchasePrice)}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-ink-400">
                        ETH invested
                      </p>
                    </div>

                    {/* Current Value */}
                    <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-3">
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-1">
                        Current Value
                      </p>
                      <p className="text-lg font-semibold text-ink-900 dark:text-white">
                        {formatETH(holding.currentValue)}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-ink-400">
                        ETH value
                      </p>
                    </div>

                    {/* Profit/Loss */}
                    <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-3">
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-1">
                        Profit/Loss
                      </p>
                        <p
                        className={`text-lg font-semibold ${getPercentageColor(
                            holding.profitLossPercentage
                          )}`}
                        >
                          {formatETH(holding.profitLoss)}
                        </p>
                        <p
                        className={`text-xs ${getPercentageColor(
                            holding.profitLossPercentage
                          )}`}
                        >
                          {formatPercentage(holding.profitLossPercentage)}
                        </p>
                      </div>
                    </div>

                  {/* Additional Volume Info */}
                  {holding.volume24h && parseFloat(holding.volume24h) > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        24h Volume
                      </p>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        ${parseFloat(holding.volume24h).toLocaleString()} USD
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Sell Modal */}
      {selectedHolding && (
        <SellModal
          holding={selectedHolding}
          isOpen={sellModalOpen}
          onClose={() => {
            setSellModalOpen(false);
            setSelectedHolding(null);
          }}
          onSellComplete={handleSellComplete}
        />
      )}

      {/* Last Updated */}
      <div className="text-center text-xs text-ink-500 dark:text-ink-400">
        Last updated: {new Date(portfolio.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default TokenHoldings;
