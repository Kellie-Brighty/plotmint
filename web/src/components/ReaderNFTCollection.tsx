import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "../utils/useWallet";
import { useChapterNFT } from "../utils/useChapterNFT";
import NFTTransferModal from "./NFTTransferModal";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import type { ChapterData, StoryData } from "../utils/storyService";
import type { Address } from "viem";

interface NFTCollectionItem {
  chapterId: string;
  storyId: string;
  storyTitle: string;
  chapterTitle: string;
  contractAddress: Address;
  tokenId?: number;
  editionNumber?: number;
  mintPrice: string;
  mintDate?: Date;
  transactionHash?: string;
}

interface ReaderNFTCollectionProps {
  userId: string;
}

export const ReaderNFTCollection: React.FC<ReaderNFTCollectionProps> = ({
  userId,
}) => {
  const { isConnected, address } = useWallet();
  const { getChapterNFTData, getUserOwnedTokenIds } = useChapterNFT();

  const [nftCollection, setNftCollection] = useState<NFTCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    nft: NFTCollectionItem | null;
  }>({ isOpen: false, nft: null });

  useEffect(() => {
    if (userId && isConnected) {
      fetchUserNFTCollection();
    }
  }, [userId, isConnected]);

  const fetchUserNFTCollection = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!address) {
        setNftCollection([]);
        return;
      }

      const nftItems: NFTCollectionItem[] = [];

      // Strategy 1: Check NFTs from reading history
      const readingHistoryRef = collection(db, "readingHistory");
      const historyQuery = query(
        readingHistoryRef,
        where("userId", "==", userId)
      );

      const historySnapshot = await getDocs(historyQuery);
      const uniqueChapters = new Set<string>();

      // Collect unique chapter IDs from reading history
      historySnapshot.forEach((doc) => {
        const data = doc.data();
        uniqueChapters.add(data.chapterId);
      });

      // Strategy 2: Also check from collections (chapters user has collected)
      const collectionsRef = collection(db, "chapterCollections");
      const collectionsQuery = query(
        collectionsRef,
        where("userId", "==", userId)
      );

      const collectionsSnapshot = await getDocs(collectionsQuery);

      // Add chapters from collections
      collectionsSnapshot.forEach((doc) => {
        const data = doc.data();
        uniqueChapters.add(data.chapterId);
      });

      // Strategy 3: Fallback - Check NFT mint notifications for chapters where user minted NFTs
      const notificationsRef = collection(db, "userNotifications");
      const nftNotificationsQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        where("type", "==", "nft_mint_success")
      );

      const nftNotificationsSnapshot = await getDocs(nftNotificationsQuery);

      // Add chapters from NFT mint notifications
      nftNotificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.chapterId) {
          uniqueChapters.add(data.chapterId);
        }
      });

      // Strategy 4: Direct approach - If we have NFT notifications but no chapters found,
      // try to fetch NFTs directly from the notifications without relying on reading history
      if (uniqueChapters.size === 0 && nftNotificationsSnapshot.size > 0) {
        // Process each NFT notification directly
        for (const notificationDoc of nftNotificationsSnapshot.docs) {
          const notificationData = notificationDoc.data();
          const chapterId = notificationData.chapterId;

          if (!chapterId) continue;

          try {
            // Get chapter data directly
            const chapterRef = doc(db, "chapters", chapterId);
            const chapterSnap = await getDoc(chapterRef);

            if (!chapterSnap.exists()) {
              continue;
            }

            const chapterData = chapterSnap.data() as ChapterData;

            // Check if chapter has NFT contract
            if (!chapterData.nftContractAddress) {
              continue;
            }

            // Check if user owns any NFTs from this contract
            const ownedTokenIds = await getUserOwnedTokenIds(
              chapterData.nftContractAddress as Address,
              address
            );

            if (ownedTokenIds.length === 0) {
              continue;
            }

            // Get story data for this chapter
            const storyRef = doc(db, "stories", chapterData.storyId);
            const storySnap = await getDoc(storyRef);

            if (!storySnap.exists()) {
              continue;
            }

            const storyData = storySnap.data() as StoryData;

            // Get NFT collection data
            const nftData = await getChapterNFTData(
              chapterData.nftContractAddress as Address
            );

            if (!nftData) {
              continue;
            }

            // Create NFT items for each owned token
            for (const tokenId of ownedTokenIds) {
              nftItems.push({
                chapterId: chapterData.id!,
                storyId: storyData.id!,
                storyTitle: storyData.title,
                chapterTitle: chapterData.title,
                contractAddress: chapterData.nftContractAddress as Address,
                tokenId: tokenId,
                editionNumber: tokenId, // Token ID is the edition number
                mintPrice: nftData.mintPrice,
              });
            }
          } catch (error) {
            console.error(
              `Error in direct processing of chapter ${chapterId}:`,
              error
            );
          }
        }
      }

      // Strategy 5: Check for NFTs in each chapter (original approach)
      for (const chapterId of uniqueChapters) {
        try {
          // Get chapter data to find NFT contract address
          const chapterRef = doc(db, "chapters", chapterId);
          const chapterSnap = await getDoc(chapterRef);

          if (!chapterSnap.exists()) {
            continue;
          }

          const chapterData = chapterSnap.data() as ChapterData;

          // Check if chapter has NFT contract
          if (!chapterData.nftContractAddress) {
            continue;
          }

          // Check if user owns any NFTs from this contract
          const ownedTokenIds = await getUserOwnedTokenIds(
            chapterData.nftContractAddress as Address,
            address
          );

          if (ownedTokenIds.length === 0) {
            continue;
          }

          // Get story data for this chapter
          const storyRef = doc(db, "stories", chapterData.storyId);
          const storySnap = await getDoc(storyRef);

          if (!storySnap.exists()) {
            continue;
          }

          const storyData = storySnap.data() as StoryData;

          // Get NFT collection data
          const nftData = await getChapterNFTData(
            chapterData.nftContractAddress as Address
          );

          if (!nftData) {
            continue;
          }

          // Create NFT items for each owned token
          for (const tokenId of ownedTokenIds) {
            nftItems.push({
              chapterId: chapterData.id!,
              storyId: storyData.id!,
              storyTitle: storyData.title,
              chapterTitle: chapterData.title,
              contractAddress: chapterData.nftContractAddress as Address,
              tokenId: tokenId,
              editionNumber: tokenId, // Token ID is the edition number
              mintPrice: nftData.mintPrice,
            });
          }
        } catch (chapterError) {
          console.error(`Error processing chapter ${chapterId}:`, chapterError);
        }
      }

      setNftCollection(nftItems);
    } catch (error) {
      console.error("Error fetching user NFT collection:", error);
      setError("Failed to load NFT collection");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Unknown date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-ink-600 dark:text-ink-400">
          Connect your wallet to view your NFT collection
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-ink-600 dark:text-ink-400">
          Loading your NFT collection...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
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
        <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
          Error Loading Collection
        </h3>
        <p className="text-ink-600 dark:text-ink-400 mb-4">{error}</p>
        <button
          onClick={fetchUserNFTCollection}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (nftCollection.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
          No NFTs Yet
        </h3>
        <p className="text-ink-600 dark:text-ink-400 mb-6">
          You haven't minted any chapter NFTs yet. Start reading stories and
          collect your favorite chapters as NFTs!
        </p>

        <button
          onClick={() => (window.location.href = "/stories")}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Browse Stories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
            Your NFT Collection
          </h3>
          <p className="text-sm text-ink-600 dark:text-ink-400">
            {nftCollection.length} chapter NFT
            {nftCollection.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <button
          onClick={fetchUserNFTCollection}
          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nftCollection.map((nft, index) => (
          <motion.div
            key={`${nft.storyId}-${nft.chapterId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-dark-900 rounded-lg border border-parchment-200 dark:border-dark-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* NFT Header */}
            <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Chapter NFT</div>
                    {nft.editionNumber && (
                      <div className="text-xs opacity-90">
                        Edition #{nft.editionNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{nft.mintPrice} ETH</div>
                  <div className="text-xs opacity-90">Mint Price</div>
                </div>
              </div>
            </div>

            {/* NFT Content */}
            <div className="p-4">
              <h4 className="font-semibold text-ink-900 dark:text-white mb-1 line-clamp-2">
                {nft.storyTitle}
              </h4>
              <p className="text-sm text-ink-600 dark:text-ink-400 mb-3 line-clamp-1">
                {nft.chapterTitle}
              </p>

              {nft.mintDate && (
                <div className="text-xs text-ink-500 dark:text-ink-400 mb-3">
                  Minted {formatDate(nft.mintDate)}
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <a
                  href={`/stories/${nft.storyId}/chapters/${nft.chapterId}`}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors"
                >
                  Read Chapter →
                </a>
                <a
                  href={`https://sepolia.basescan.org/address/${nft.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 text-sm transition-colors"
                >
                  View Contract ↗
                </a>
              </div>

              {/* Transfer Button */}
              <button
                onClick={() => setTransferModal({ isOpen: true, nft })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-ink-700 dark:text-ink-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Transfer NFT
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Collection Summary */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-100">
              Collection Summary
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {nftCollection.length} unique chapter NFTs from{" "}
              {new Set(nftCollection.map((nft) => nft.storyId)).size} stories
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {nftCollection
                .reduce((total, nft) => total + parseFloat(nft.mintPrice), 0)
                .toFixed(4)}{" "}
              ETH
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              Total Mint Value
            </div>
          </div>
        </div>
      </div>

      {/* NFT Transfer Modal */}
      {transferModal.nft && (
        <NFTTransferModal
          isOpen={transferModal.isOpen}
          onClose={() => setTransferModal({ isOpen: false, nft: null })}
          nft={{
            contractAddress: transferModal.nft.contractAddress,
            tokenId: transferModal.nft.tokenId || 1,
            storyTitle: transferModal.nft.storyTitle,
            chapterTitle: transferModal.nft.chapterTitle,
            editionNumber: transferModal.nft.editionNumber || 1,
          }}
          onTransferSuccess={() => {
            // Refresh the collection after successful transfer
            fetchUserNFTCollection();
            setTransferModal({ isOpen: false, nft: null });
          }}
        />
      )}
    </div>
  );
};

export default ReaderNFTCollection;
