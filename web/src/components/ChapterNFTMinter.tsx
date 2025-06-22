import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../utils/useWallet";
import { useChapterNFT } from "../utils/useChapterNFT";
import type { Address } from "viem";

interface ChapterNFTMinterProps {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  nftContractAddress?: Address;
  onMintSuccess?: (tokenId: number, editionNumber: number) => void;
}

export const ChapterNFTMinter: React.FC<ChapterNFTMinterProps> = ({
  chapterId,
  storyTitle,
  chapterTitle,
  nftContractAddress,
  onMintSuccess,
}) => {
  const { isConnected, address } = useWallet();
  const {
    getChapterNFTAddress,
    getChapterNFTData,
    mintEdition,
    isLoading: isMinting,
    error: mintError,
    isConfirmed,
    clearError,
  } = useChapterNFT();

  const [collectionExists, setCollectionExists] = useState(false);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contractAddress, setContractAddress] = useState<Address | null>(
    nftContractAddress || null
  );

  // Check if NFT collection exists for this chapter
  useEffect(() => {
    const checkNFTCollection = async () => {
      setLoading(true);
      try {
        // First check if we have a contract address passed as prop
        let nftAddress = contractAddress;

        // If not, try to get it from the factory
        if (!nftAddress) {
          nftAddress = await getChapterNFTAddress(chapterId);
          setContractAddress(nftAddress);
        }

        if (nftAddress) {
          setCollectionExists(true);

          // Get collection data
          const data = await getChapterNFTData(nftAddress);
          if (data) {
            setCollectionData({
              ...data,
              chapterId,
              name: `${storyTitle} - ${chapterTitle}`,
            });
          }
        } else {
          setCollectionExists(false);
          setCollectionData(null);
        }
      } catch (error) {
        console.error("Error checking NFT collection:", error);
        setCollectionExists(false);
        setCollectionData(null);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      checkNFTCollection();
    }
  }, [chapterId, nftContractAddress]);

  // Handle successful mint
  useEffect(() => {
    if (isConfirmed && collectionData && onMintSuccess) {
      // Calculate the new edition number (current + 1 since we just minted)
      const newEditionNumber = collectionData.currentEdition + 1;
      onMintSuccess(newEditionNumber, newEditionNumber);

      // Refresh collection data to show updated edition count
      if (contractAddress) {
        getChapterNFTData(contractAddress).then((data) => {
          if (data) {
            setCollectionData({
              ...data,
              chapterId,
              name: `${storyTitle} - ${chapterTitle}`,
            });
          }
        });
      }
    }
  }, [isConfirmed]);

  const handleMint = async () => {
    if (!contractAddress || !isConnected || !address) return;

    clearError();

    try {
      // For readers, we use the public mint function
      console.log("🎨 Minting NFT edition for reader...");
      await mintEdition(contractAddress);
    } catch (error) {
      console.error("Error minting NFT:", error);
    }
  };

  // Don't show anything if loading or no collection exists
  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-900 rounded-lg p-4 border border-parchment-200 dark:border-dark-700">
        <div className="animate-pulse">
          <div className="h-4 bg-parchment-200 dark:bg-dark-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-parchment-200 dark:bg-dark-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!collectionExists || !collectionData) {
    return null; // Don't show anything if no NFT collection exists
  }

  // Check if all editions are minted
  const allEditionsMinted =
    collectionData.currentEdition >= collectionData.maxEditions;

  // Check if first edition hasn't been minted yet (creator hasn't minted)
  const firstEditionNotMinted = collectionData.currentEdition === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-dark-900 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mr-2">
              <svg
                className="w-4 h-4 text-purple-600 dark:text-purple-400"
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
              <h3 className="text-base font-semibold text-ink-900 dark:text-white">
                Collect Chapter NFT
              </h3>
              <p className="text-xs text-ink-600 dark:text-ink-400">
                Limited edition collectible
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-ink-900 dark:text-white">
              {collectionData.mintPrice} ETH
            </div>
            <div className="text-xs text-ink-600 dark:text-ink-400">
              #{collectionData.currentEdition + 1}/{collectionData.maxEditions}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-ink-600 dark:text-ink-400 mb-1">
            <span>Editions Minted</span>
            <span>
              {collectionData.currentEdition} / {collectionData.maxEditions}
            </span>
          </div>
          <div className="w-full bg-parchment-200 dark:bg-dark-700 rounded-full h-1.5">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (collectionData.currentEdition / collectionData.maxEditions) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {firstEditionNotMinted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
            >
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                The creator hasn't minted the first edition yet. Public minting
                will be available once the creator mints their edition.
              </p>
            </motion.div>
          )}

          {allEditionsMinted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
            >
              <p className="text-xs text-red-800 dark:text-red-200">
                All editions have been minted! This collection is now sold out.
              </p>
            </motion.div>
          )}

          {mintError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
            >
              <p className="text-xs text-red-800 dark:text-red-200">
                {mintError}
              </p>
            </motion.div>
          )}

          {isConfirmed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-xs text-green-800 dark:text-green-200">
                  NFT successfully minted! Check your collection to see your new
                  edition.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={
            !isConnected ||
            isMinting ||
            allEditionsMinted ||
            firstEditionNotMinted ||
            isConfirmed
          }
          className={`w-full py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            !isConnected
              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : isMinting
              ? "bg-purple-400 dark:bg-purple-600 text-white cursor-not-allowed"
              : allEditionsMinted || firstEditionNotMinted || isConfirmed
              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white shadow-sm hover:shadow-md"
          }`}
        >
          {!isConnected ? (
            "Connect Wallet to Mint"
          ) : isMinting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Minting...
            </span>
          ) : isConfirmed ? (
            "Successfully Minted!"
          ) : allEditionsMinted ? (
            "Sold Out"
          ) : firstEditionNotMinted ? (
            "Waiting for Creator"
          ) : (
            `Mint Edition #${collectionData.currentEdition + 1}`
          )}
        </button>

        {!isConnected && (
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-2 text-center">
            Connect your wallet to mint this chapter as an NFT collectible
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ChapterNFTMinter;
