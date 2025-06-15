import React, { useState, useEffect } from "react";
import { useWallet } from "../utils/useWallet";

interface WriterAsset {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  plotOptions: {
    symbol: string;
    name: string;
    tokenAddress: string;
    allocatedTokens: number; // Tokens allocated to writer on creation
    currentValue: number; // Current value in ETH
    totalVotes: number;
    isWinning?: boolean;
  }[];
  voteEndTime: Date;
  canSell: boolean;
  createdAt: Date;
}

interface PurchasedToken {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  plotSymbol: string;
  plotName: string;
  tokenAddress: string;
  tokenCount: number;
  purchasePrice: number;
  currentValue: number;
  profitLoss: number;
  canSell: boolean;
  isWinningOption?: boolean;
}

interface WriterAssetsProps {
  userId: string;
}

export const WriterAssets: React.FC<WriterAssetsProps> = ({ userId }) => {
  const { isConnected } = useWallet();
  const [writerAssets, setWriterAssets] = useState<WriterAsset[]>([]);
  const [purchasedTokens, setPurchasedTokens] = useState<PurchasedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"created" | "purchased">(
    "created"
  );
  const [_selectedAsset, setSelectedAsset] = useState<WriterAsset | null>(null);

  useEffect(() => {
    if (userId && isConnected) {
      fetchWriterAssets();
      fetchPurchasedTokens();
    }
  }, [userId, isConnected]);

  const fetchWriterAssets = async () => {
    try {
      // TODO: Implement actual writer assets fetch
      // This will get all plot options created by the writer

      // Mock data for now
      const mockAssets: WriterAsset[] = [
        {
          chapterId: "chapter1",
          storyTitle: "The Shadow Beyond",
          chapterTitle: "Chapter 3: The Choice",
          plotOptions: [
            {
              symbol: "HEAL",
              name: "The Healer's Path",
              tokenAddress: "0x123...",
              allocatedTokens: 100, // Writer gets 100 tokens on creation
              currentValue: 0.15,
              totalVotes: 45,
              isWinning: true,
            },
            {
              symbol: "GUARD",
              name: "The Guardian's Mantle",
              tokenAddress: "0x456...",
              allocatedTokens: 100,
              currentValue: 0.08,
              totalVotes: 23,
              isWinning: false,
            },
          ],
          voteEndTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          canSell: false,
          createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
        },
        {
          chapterId: "chapter2",
          storyTitle: "The Shadow Beyond",
          chapterTitle: "Chapter 4: The Aftermath",
          plotOptions: [
            {
              symbol: "PEACE",
              name: "Path of Peace",
              tokenAddress: "0x789...",
              allocatedTokens: 100,
              currentValue: 0.12,
              totalVotes: 67,
              isWinning: true,
            },
            {
              symbol: "WAR",
              name: "Path of War",
              tokenAddress: "0xabc...",
              allocatedTokens: 100,
              currentValue: 0.05,
              totalVotes: 34,
              isWinning: false,
            },
          ],
          voteEndTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          canSell: true,
          createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
        },
      ];

      setWriterAssets(mockAssets);
    } catch (error) {
      console.error("Error fetching writer assets:", error);
    }
  };

  const fetchPurchasedTokens = async () => {
    try {
      // TODO: Implement actual purchased tokens fetch
      // This will get tokens the writer bought by voting on other stories

      // Mock data for now
      const mockPurchased: PurchasedToken[] = [
        {
          chapterId: "other-chapter1",
          storyTitle: "Digital Dreams",
          chapterTitle: "Chapter 2: The Algorithm",
          plotSymbol: "CODE",
          plotName: "Code the Future",
          tokenAddress: "0xdef...",
          tokenCount: 25,
          purchasePrice: 0.03,
          currentValue: 0.05,
          profitLoss: 0.02,
          canSell: true,
          isWinningOption: true,
        },
      ];

      setPurchasedTokens(mockPurchased);
    } catch (error) {
      console.error("Error fetching purchased tokens:", error);
    } finally {
      setLoading(false);
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

  const calculateTotalValue = (asset: WriterAsset) => {
    return asset.plotOptions.reduce(
      (total, option) =>
        total + (option.allocatedTokens * option.currentValue) / 100,
      0
    );
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to view your assets
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading your assets...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-parchment-100 dark:bg-dark-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("created")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "created"
              ? "bg-white dark:bg-dark-700 text-ink-900 dark:text-white shadow-sm"
              : "text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white"
          }`}
        >
          Created Assets ({writerAssets.length})
        </button>
        <button
          onClick={() => setActiveTab("purchased")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "purchased"
              ? "bg-white dark:bg-dark-700 text-ink-900 dark:text-white shadow-sm"
              : "text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white"
          }`}
        >
          Purchased Tokens ({purchasedTokens.length})
        </button>
      </div>

      {/* Created Assets Tab */}
      {activeTab === "created" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Created Plot Options</h3>
            <button
              onClick={fetchWriterAssets}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {writerAssets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No created assets found. Create a chapter with plot options to
                start earning!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {writerAssets.map((asset) => (
                <div
                  key={asset.chapterId}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                        {asset.storyTitle}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {asset.chapterTitle}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Created {asset.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          asset.canSell
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {asset.canSell
                          ? "Can Sell"
                          : formatTimeRemaining(asset.voteEndTime)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Total Value: {formatETH(calculateTotalValue(asset))}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {asset.plotOptions.map((option) => (
                      <div
                        key={option.symbol}
                        className={`border rounded-lg p-4 ${
                          option.isWinning
                            ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-medium">{option.name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {option.symbol}
                            </p>
                          </div>
                          {option.isWinning && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Leading
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Your Tokens:
                            </span>
                            <span className="font-medium">
                              {option.allocatedTokens}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Total Votes:
                            </span>
                            <span className="font-medium">
                              {option.totalVotes}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Token Value:
                            </span>
                            <span className="font-medium">
                              {formatETH(option.currentValue / 100)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Your Value:
                            </span>
                            <span className="font-medium">
                              {formatETH(
                                (option.allocatedTokens * option.currentValue) /
                                  100
                              )}
                            </span>
                          </div>
                        </div>

                        {asset.canSell && (
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Sell {option.symbol} Tokens
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Purchased Tokens Tab */}
      {activeTab === "purchased" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tokens You Purchased</h3>

          {purchasedTokens.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No purchased tokens found. Vote on other stories to build your
                portfolio!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {purchasedTokens.map((token, _index) => (
                <div
                  key={`${token.chapterId}-${token.plotSymbol}`}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {token.storyTitle}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {token.chapterTitle}
                      </p>
                    </div>
                    {token.isWinningOption && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Winner
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Plot Option
                      </p>
                      <p className="font-medium">{token.plotName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {token.plotSymbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tokens
                      </p>
                      <p className="font-medium">{token.tokenCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Purchase Price
                      </p>
                      <p className="font-medium">
                        {formatETH(token.purchasePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Current Value
                      </p>
                      <p className="font-medium">
                        {formatETH(token.currentValue)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        P&L:
                      </span>
                      <span
                        className={`font-medium ${
                          token.profitLoss >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {token.profitLoss >= 0 ? "+" : ""}
                        {formatETH(token.profitLoss)}
                      </span>
                    </div>

                    {token.canSell && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Sell Tokens
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WriterAssets;
