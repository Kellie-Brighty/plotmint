import React, { useState, useEffect } from "react";
import { useWallet } from "../utils/useWallet";

interface TokenHolding {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  plotSymbol: string;
  plotName: string;
  tokenAddress: string;
  tokenCount: number;
  purchasePrice: number; // ETH spent
  currentValue: number; // Current token value in ETH
  profitLoss: number; // Calculated profit/loss
  canSell: boolean; // Based on voting window status
  voteEndTime: Date;
  isWinningOption?: boolean;
}

interface TokenHoldingsProps {
  userId: string;
}

export const TokenHoldings: React.FC<TokenHoldingsProps> = ({ userId }) => {
  const {  isConnected } = useWallet();
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHolding, setSelectedHolding] = useState<TokenHolding | null>(
    null
  );

  useEffect(() => {
    if (userId && isConnected) {
      fetchTokenHoldings();
    }
  }, [userId, isConnected]);

  const fetchTokenHoldings = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual token holdings fetch
      // This will integrate with ZoraService to get user's token positions

      // Mock data for now
      const mockHoldings: TokenHolding[] = [
        {
          chapterId: "chapter1",
          storyTitle: "The Shadow Beyond",
          chapterTitle: "Chapter 3: The Choice",
          plotSymbol: "HEAL",
          plotName: "The Healer's Path",
          tokenAddress: "0x123...",
          tokenCount: 50,
          purchasePrice: 0.05,
          currentValue: 0.08,
          profitLoss: 0.03,
          canSell: false,
          voteEndTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
          isWinningOption: undefined,
        },
        {
          chapterId: "chapter2",
          storyTitle: "Digital Dreams",
          chapterTitle: "Chapter 2: The Algorithm",
          plotSymbol: "CODE",
          plotName: "Code the Future",
          tokenAddress: "0x456...",
          tokenCount: 25,
          purchasePrice: 0.03,
          currentValue: 0.02,
          profitLoss: -0.01,
          canSell: true,
          voteEndTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isWinningOption: true,
        },
      ];

      setHoldings(mockHoldings);
    } catch (error) {
      console.error("Error fetching token holdings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSellTokens = async (holding: TokenHolding) => {
    if (!holding.canSell) return;

    try {
      // TODO: Implement token selling via ZoraService
      console.log("Selling tokens for:", holding.plotSymbol);
      setSelectedHolding(null);
      // Refresh holdings after sale
      await fetchTokenHoldings();
    } catch (error) {
      console.error("Error selling tokens:", error);
    }
  };

  const formatTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return "Voting ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  const formatETH = (value: number) => {
    return `${value.toFixed(4)} ETH`;
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to view token holdings
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading token holdings...
        </p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          No token holdings found. Start voting on plot options to build your
          portfolio!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Token Holdings</h3>
        <button
          onClick={fetchTokenHoldings}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {holdings.map((holding, _index) => (
          <div
            key={`${holding.chapterId}-${holding.plotSymbol}`}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {holding.storyTitle}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {holding.chapterTitle}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    holding.canSell
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {holding.canSell
                    ? "Can Sell"
                    : formatTimeRemaining(holding.voteEndTime)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Plot Option
                </p>
                <p className="font-medium">{holding.plotName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {holding.plotSymbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tokens Owned
                </p>
                <p className="font-medium">{holding.tokenCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Purchase Price
                </p>
                <p className="font-medium">
                  {formatETH(holding.purchasePrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Current Value
                </p>
                <p className="font-medium">{formatETH(holding.currentValue)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  P&L:
                </span>
                <span
                  className={`font-medium ${
                    holding.profitLoss >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {holding.profitLoss >= 0 ? "+" : ""}
                  {formatETH(holding.profitLoss)}
                </span>
                {holding.isWinningOption === true && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Winner
                  </span>
                )}
              </div>

              {holding.canSell && (
                <button
                  onClick={() => setSelectedHolding(holding)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sell Tokens
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sell Confirmation Modal */}
      {selectedHolding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Sell Tokens</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to sell {selectedHolding.tokenCount}{" "}
              {selectedHolding.plotSymbol} tokens?
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span>Current Value:</span>
                <span>{formatETH(selectedHolding.currentValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated P&L:</span>
                <span
                  className={
                    selectedHolding.profitLoss >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {selectedHolding.profitLoss >= 0 ? "+" : ""}
                  {formatETH(selectedHolding.profitLoss)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedHolding(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSellTokens(selectedHolding)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sell Tokens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenHoldings;
