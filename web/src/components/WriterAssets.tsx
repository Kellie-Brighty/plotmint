import React, { useState, useEffect } from "react";
import { useWallet } from "../utils/useWallet";
import { useCoinTrader } from "../utils/useCoinTrader";
import { useChapterNFT } from "../utils/useChapterNFT";
import { getUserStories, getUserChapters } from "../utils/storyService";
import { ZoraService } from "../utils/zoraService";
import type { ChapterData } from "../utils/storyService";
import type { Address } from "viem";

interface PlotOption {
  symbol: string;
  name: string;
  tokenAddress: Address;
  allocatedTokens: number; // Writer gets allocated tokens on creation
  currentValue: number; // Current token value in ETH
  totalVotes: number; // Total tokens purchased by readers
  isWinning: boolean;
}

interface WriterAsset {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  plotOptions: PlotOption[];
  voteEndTime: Date;
  canSell: boolean;
  createdAt: Date;
}

interface NFTCollection {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  contractAddress: Address;
  name: string;
  symbol: string;
  currentEdition: number;
  maxEditions: number;
  mintPrice: string; // ETH
  totalMinted: number;
  creatorMinted: boolean;
  royaltiesEarned: number; // ETH earned from secondary sales
}

interface PurchasedToken {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  plotSymbol: string;
  plotName: string;
  tokenAddress: Address;
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
  const { isConnected, address } = useWallet();
  const { getTokenPrice, getTokenSupply, getTokenBalance } = useCoinTrader();
  const { getChapterNFTData } = useChapterNFT();

  const [writerAssets, setWriterAssets] = useState<WriterAsset[]>([]);
  const [nftCollections, setNftCollections] = useState<NFTCollection[]>([]);
  const [purchasedTokens, setPurchasedTokens] = useState<PurchasedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"created" | "nfts" | "purchased">(
    "created"
  );
  const [_selectedAsset, setSelectedAsset] = useState<WriterAsset | null>(null);

  useEffect(() => {
    if (userId && isConnected) {
      fetchAllAssets();
    }
  }, [userId, isConnected]);

  const fetchAllAssets = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWriterAssets(),
        fetchNFTCollections(),
        fetchPurchasedTokens(),
      ]);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWriterAssets = async () => {
    try {
      console.log("🔍 Fetching writer assets for user:", userId);

      // Get user's stories and published chapters
      const stories = await getUserStories(userId);
      console.log("📚 Found stories:", stories.length);

      const publishedChapters: ChapterData[] = [];

      for (const story of stories) {
        const chapters = await getUserChapters(story.id!, userId);
        console.log(
          `📖 Story "${story.title}" has ${chapters.length} chapters`
        );

        // Filter for published chapters that have either plotTokens OR plotOptions
        const chaptersWithTokens = chapters.filter((ch) => {
          const hasTokens =
            ch.published &&
            ((ch.plotTokens && ch.plotTokens.length > 0) ||
              (ch.plotOptions && ch.plotOptions.length > 0));
          console.log(
            `Chapter "${ch.title}": published=${ch.published}, hasTokens=${hasTokens}`,
            {
              plotTokens: ch.plotTokens?.length || 0,
              plotOptions: ch.plotOptions?.length || 0,
            }
          );
          return hasTokens;
        });

        publishedChapters.push(...chaptersWithTokens);
      }

      console.log(
        "📊 Total chapters with plot tokens:",
        publishedChapters.length
      );

      const assets: WriterAsset[] = [];
      const zoraService = new ZoraService();

      for (const chapter of publishedChapters) {
        // Use plotTokens if available, otherwise fall back to plotOptions
        const tokens = chapter.plotTokens || chapter.plotOptions || [];

        if (tokens.length === 0) continue;

        const story = stories.find((s) => s.id === chapter.storyId);
        if (!story) continue;

        console.log(
          `🎯 Processing chapter "${chapter.title}" with ${tokens.length} tokens`
        );

        const plotOptions: PlotOption[] = [];

        // Try to get vote stats from ZoraService
        let voteStats = null;
        try {
          voteStats = await zoraService.getPlotVoteStats(chapter.id!);
          console.log("📊 Vote stats for chapter:", voteStats);
        } catch (error) {
          console.log("No vote stats found for chapter:", chapter.id);
        }

        for (const token of tokens) {
          try {
            // Get real token data from contract
            const tokenPrice = await getTokenPrice(
              token.tokenAddress as Address
            );
            const tokenSupply = await getTokenSupply(
              token.tokenAddress as Address
            );

            // Get the creator's actual token balance from the blockchain
            let creatorTokenBalance = 0;
            if (address) {
              try {
                creatorTokenBalance = await getTokenBalance(
                  token.tokenAddress as Address,
                  address
                );
                console.log(
                  `💰 Creator balance for ${token.symbol}: ${creatorTokenBalance}`
                );
              } catch (balanceError) {
                console.warn(
                  `Could not fetch balance for ${token.symbol}:`,
                  balanceError
                );
                creatorTokenBalance = 0;
              }
            }

            // Get vote count from ZoraService if available
            let totalVotes = Number(tokenSupply) - creatorTokenBalance; // Subtract creator's allocation
            let isWinning = false;

            if (voteStats && voteStats[token.symbol]) {
              totalVotes = voteStats[token.symbol].totalVotes;
              // Determine if this option is winning
              const allVoteCounts = Object.values(voteStats).map(
                (stat) => stat.totalVotes
              );
              const maxVotes = Math.max(...allVoteCounts);
              isWinning =
                voteStats[token.symbol].totalVotes === maxVotes && maxVotes > 0;
            }

            plotOptions.push({
              symbol: token.symbol,
              name: token.name,
              tokenAddress: token.tokenAddress as Address,
              allocatedTokens: creatorTokenBalance, // Use actual blockchain balance
              currentValue: tokenPrice,
              totalVotes,
              isWinning,
            });

            console.log(
              `✅ Token ${token.symbol}: price=${tokenPrice}, supply=${tokenSupply}, creatorBalance=${creatorTokenBalance}, votes=${totalVotes}, winning=${isWinning}`
            );
          } catch (error) {
            console.error(
              `❌ Error fetching data for token ${token.symbol}:`,
              error
            );
            // Fallback to stored data
            plotOptions.push({
              symbol: token.symbol,
              name: token.name,
              tokenAddress: token.tokenAddress as Address,
              allocatedTokens: 0, // Use 0 if we can't fetch balance
              currentValue: 0,
              totalVotes: 0,
              isWinning: false,
            });
          }
        }

        if (plotOptions.length > 0) {
          assets.push({
            chapterId: chapter.id!,
            storyTitle: story.title,
            chapterTitle: chapter.title,
            plotOptions,
            voteEndTime: chapter.voteEndTime
              ? chapter.voteEndTime.toDate()
              : new Date(Date.now() + 24 * 60 * 60 * 1000),
            canSell: chapter.voteEndTime
              ? new Date() > chapter.voteEndTime.toDate()
              : false,
            createdAt: chapter.createdAt
              ? chapter.createdAt.toDate()
              : new Date(),
          });

          console.log(
            `✅ Added asset for chapter "${chapter.title}" with ${plotOptions.length} plot options`
          );
        }
      }

      console.log("🎉 Final assets count:", assets.length);
      setWriterAssets(assets);
    } catch (error) {
      console.error("❌ Error fetching writer assets:", error);
    }
  };

  const fetchNFTCollections = async () => {
    try {
      console.log("🎨 Fetching NFT collections...");

      // Get user's stories and published chapters
      const stories = await getUserStories(userId);
      console.log(`📚 Found ${stories.length} stories for user`);

      const publishedChapters: ChapterData[] = [];

      for (const story of stories) {
        const chapters = await getUserChapters(story.id!, userId);
        console.log(
          `📖 Story "${story.title}" has ${chapters.length} chapters`
        );

        const chaptersWithNFT = chapters.filter((ch) => {
          const hasNFT = ch.published && ch.nftContractAddress;
          console.log(`Chapter "${ch.title}":`, {
            published: ch.published,
            nftContractAddress: ch.nftContractAddress,
            hasNFT: hasNFT ? "✅" : "❌",
          });
          return hasNFT;
        });

        console.log(
          `📊 Found ${chaptersWithNFT.length} chapters with NFT contracts`
        );
        publishedChapters.push(...chaptersWithNFT);
      }

      console.log(
        `🎯 Total chapters with NFT contracts: ${publishedChapters.length}`
      );

      const collections: NFTCollection[] = [];

      for (const chapter of publishedChapters) {
        if (!chapter.nftContractAddress) continue;

        const story = stories.find((s) => s.id === chapter.storyId);
        if (!story) continue;

        try {
          // Get real NFT data from contract
          const nftData = await getChapterNFTData(
            chapter.nftContractAddress as Address
          );

          if (nftData) {
            collections.push({
              chapterId: chapter.id!,
              storyTitle: story.title,
              chapterTitle: chapter.title,
              contractAddress: chapter.nftContractAddress as Address,
              name: `${story.title} - Chapter ${chapter.order}`,
              symbol: `${story.title.slice(0, 4).toUpperCase()}${
                chapter.order
              }`,
              currentEdition: nftData.currentEdition,
              maxEditions: nftData.maxEditions,
              mintPrice: nftData.mintPrice,
              totalMinted: nftData.currentEdition,
              creatorMinted: nftData.currentEdition > 0, // Creator mints first edition
              royaltiesEarned: 0, // TODO: Calculate from secondary sales
            });
          }
        } catch (error) {
          console.error(
            `Error fetching NFT data for chapter ${chapter.id}:`,
            error
          );
        }
      }

      setNftCollections(collections);
    } catch (error) {
      console.error("❌ Error fetching NFT collections:", error);
    }
  };

  const fetchPurchasedTokens = async () => {
    try {
      // TODO: Implement fetching tokens purchased by this user from other creators
      // This would involve querying the blockchain for token purchases made by the user's address

      // For now, using empty array - this would be populated with real data
      setPurchasedTokens([]);
    } catch (error) {
      console.error("Error fetching purchased tokens:", error);
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
          onClick={() => setActiveTab("nfts")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "nfts"
              ? "bg-white dark:bg-dark-700 text-ink-900 dark:text-white shadow-sm"
              : "text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white"
          }`}
        >
          NFT Collections ({nftCollections.length})
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

      {/* NFT Collections Tab */}
      {activeTab === "nfts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your NFT Collections</h3>
            <button
              onClick={fetchNFTCollections}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {nftCollections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No NFT collections found. Create NFT collections for your
                published chapters to give readers exclusive collectibles!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {nftCollections.map((collection) => (
                <div
                  key={collection.chapterId}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                        {collection.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {collection.storyTitle} - {collection.chapterTitle}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Symbol: {collection.symbol}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        NFT Collection
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Editions Minted
                      </p>
                      <p className="font-medium text-lg">
                        {collection.currentEdition} / {collection.maxEditions}
                      </p>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (collection.currentEdition /
                                collection.maxEditions) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Mint Price
                      </p>
                      <p className="font-medium text-lg">
                        {collection.mintPrice} ETH
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        (Creator: Free)
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Revenue Earned
                      </p>
                      <p className="font-medium text-lg">
                        {formatETH(
                          (collection.currentEdition - 1) *
                            parseFloat(collection.mintPrice)
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        From mints
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Royalties
                      </p>
                      <p className="font-medium text-lg">
                        {formatETH(collection.royaltiesEarned)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        10% on resales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          collection.creatorMinted
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {collection.creatorMinted
                          ? "Creator Edition Minted"
                          : "Not Minted"}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <a
                        href={`https://basescan.org/address/${collection.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        View Contract
                      </a>
                      <a
                        href={`https://opensea.io/assets/base/${collection.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View on OpenSea
                      </a>
                    </div>
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
