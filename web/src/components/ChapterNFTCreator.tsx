import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../utils/useWallet";
import { useChapterNFT } from "../utils/useChapterNFT";
import { NFT_CONFIG } from "../utils/chapterNFT";
import type { Address } from "viem";
import { tokenHoldingsService } from "../utils/tokenHoldingsService";

// Add voting restriction component for creators
const CreatorVotingRestriction: React.FC<{
  storyId: string;
  onRestrictionChange: (restricted: boolean) => void;
}> = ({ storyId, onRestrictionChange }) => {
  const [restriction, setRestriction] = useState<{
    canCreate: boolean;
    reason?: string;
    activeChapter?: {
      chapterId: string;
      timeRemaining: {
        hours: number;
        minutes: number;
        seconds: number;
      };
    };
  } | null>(null);

  const [currentTime, setCurrentTime] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const checkRestrictions = async () => {
    try {
      const result = await tokenHoldingsService.canCreatorCreateNewChapter(
        storyId
      );
      setRestriction(result);
      setCurrentTime(result.activeChapter?.timeRemaining || null);
      onRestrictionChange(!result.canCreate);
    } catch (error) {
      console.error("Error checking creator restrictions:", error);
      setRestriction({ canCreate: true });
      onRestrictionChange(false);
    }
  };

  useEffect(() => {
    if (storyId) {
      checkRestrictions();
    }
  }, [storyId]);

  useEffect(() => {
    if (!restriction?.canCreate && currentTime) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (!prev) return null;

          const totalSeconds =
            prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1;

          if (totalSeconds <= 0) {
            // Time's up, recheck restrictions
            checkRestrictions();
            return null;
          }

          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          return { hours, minutes, seconds };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [restriction?.canCreate, currentTime]);

  if (!restriction || restriction.canCreate) {
    return null;
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <svg
          className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-0.5"
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
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
            Chapter Creation Restricted
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
            {restriction.reason ||
              "Cannot create new chapters while voting is active for another chapter."}
          </p>
          {currentTime && (
            <div className="bg-orange-100 dark:bg-orange-800/40 rounded-lg p-3">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
                Voting Period Remaining:
              </p>
              <p className="text-2xl font-mono font-bold text-orange-900 dark:text-orange-100">
                {String(currentTime.hours).padStart(2, "0")}:
                {String(currentTime.minutes).padStart(2, "0")}:
                {String(currentTime.seconds).padStart(2, "0")}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                You can create a new chapter after this countdown ends.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChapterNFTCreatorProps {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  onNFTCreated?: (nftContractAddress: Address) => void;
  onFirstEditionMinted?: () => void;
  onNextStep?: (step: "tokens" | "publish" | "draft") => void;
}

const ChapterNFTCreator: React.FC<ChapterNFTCreatorProps> = ({
  chapterId,
  storyTitle,
  chapterTitle,
  chapterNumber,
  onNFTCreated,
  onFirstEditionMinted,
  onNextStep,
}) => {
  const { isConnected, connect } = useWallet();
  const {
    createChapterNFT,
    mintFirstEdition,
    getChapterNFTAddress,
    isCreating,
    isMinting,

    error,
    clearError,
  } = useChapterNFT();

  const [currentStep, setCurrentStep] = useState<
    "create" | "mint" | "complete" | "next-actions"
  >("create");
  const [nftContractAddress, setNftContractAddress] = useState<Address | null>(
    null
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);

  // Check if NFT collection already exists
  useEffect(() => {
    const checkExistingNFT = async () => {
      if (!chapterId) return;

      const existingAddress = await getChapterNFTAddress(chapterId);
      if (existingAddress) {
        setNftContractAddress(existingAddress);
        setCurrentStep("mint");
      }
    };

    checkExistingNFT();
  }, [chapterId, getChapterNFTAddress]);

  // Handle creating NFT collection
  const handleCreateNFT = async () => {
    if (isRestricted) {
      return; // Prevent creation during voting period
    }
    try {
      clearError();
      const result = await createChapterNFT({
        chapterId,
        storyTitle,
        chapterTitle,
        chapterNumber,
      });

      if (result.nftContractAddress) {
        setNftContractAddress(result.nftContractAddress);
        setCurrentStep("mint");
        onNFTCreated?.(result.nftContractAddress);
      }
    } catch (err) {
      console.error("Error creating NFT:", err);
    }
  };

  // Handle minting first edition
  const handleMintFirstEdition = async () => {
    if (!nftContractAddress) return;

    try {
      clearError();
      await mintFirstEdition(nftContractAddress);
      setCurrentStep("next-actions");
      setShowSuccess(true);
      onFirstEditionMinted?.();

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error("Error minting first edition:", err);
    }
  };

  // Generate collection preview data
  const collectionName = `${storyTitle} - Chapter ${chapterNumber}`;
  const collectionSymbol = `${storyTitle
    .slice(0, 4)
    .toUpperCase()}${chapterNumber}`;

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
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
          <h3 className="text-xl font-display font-bold text-ink-900 dark:text-white mb-2">
            Create Chapter NFT Collection
          </h3>
          <p className="text-ink-600 dark:text-ink-400 mb-4">
            Connect your wallet to create a limited edition NFT collection for
            this chapter
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Add the voting restriction notice */}
      <CreatorVotingRestriction
        storyId={chapterId}
        onRestrictionChange={setIsRestricted}
      />

      {/* Existing content wrapped with restriction overlay */}
      <div className={isRestricted ? "opacity-50 pointer-events-none" : ""}>
        {/* Success State */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
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
              </div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                NFT Collection Created Successfully!
              </h3>
              <p className="text-green-600 dark:text-green-400">
                Your chapter NFT collection is now live and ready for minting.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rest of existing component */}
        {!showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-2">
                Create Chapter NFT Collection
              </h2>
              <p className="text-ink-600 dark:text-ink-400">
                Deploy your chapter as an NFT collection that readers can mint
              </p>
              {isRestricted && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                  Chapter creation is temporarily restricted during the voting
                  period.
                </p>
              )}
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                {/* Step 1: Create Collection */}
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === "create"
                        ? "bg-primary-600 text-white"
                        : currentStep === "mint" || currentStep === "complete"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep === "mint" || currentStep === "complete"
                      ? "✓"
                      : "1"}
                  </div>
                  <span className="ml-2 text-sm font-medium text-ink-700 dark:text-ink-300">
                    Create Collection
                  </span>
                </div>

                <div className="w-12 h-px bg-gray-300 dark:bg-gray-600" />

                {/* Step 2: Mint First Edition */}
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === "mint"
                        ? "bg-primary-600 text-white"
                        : currentStep === "complete"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep === "complete" ? "✓" : "2"}
                  </div>
                  <span className="ml-2 text-sm font-medium text-ink-700 dark:text-ink-300">
                    Mint First Edition
                  </span>
                </div>
              </div>
            </div>

            {/* Collection Preview */}
            <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-ink-900 dark:text-white mb-3">
                Collection Preview
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink-600 dark:text-ink-400">Name:</span>
                  <p className="font-medium text-ink-900 dark:text-white">
                    {collectionName}
                  </p>
                </div>
                <div>
                  <span className="text-ink-600 dark:text-ink-400">
                    Symbol:
                  </span>
                  <p className="font-medium text-ink-900 dark:text-white">
                    {collectionSymbol}
                  </p>
                </div>
                <div>
                  <span className="text-ink-600 dark:text-ink-400">
                    Max Editions:
                  </span>
                  <p className="font-medium text-ink-900 dark:text-white">
                    {NFT_CONFIG.maxEditions}
                  </p>
                </div>
                <div>
                  <span className="text-ink-600 dark:text-ink-400">
                    Mint Price:
                  </span>
                  <p className="font-medium text-ink-900 dark:text-white">
                    {NFT_CONFIG.mintPrice} ETH
                  </p>
                </div>
              </div>

              {nftContractAddress && (
                <div className="mt-3 pt-3 border-t border-parchment-200 dark:border-dark-600">
                  <span className="text-ink-600 dark:text-ink-400 text-xs">
                    Contract Address:
                  </span>
                  <p className="font-mono text-xs text-ink-900 dark:text-white break-all">
                    {nftContractAddress}
                  </p>
                </div>
              )}
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900/30"
                >
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Display */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-900/30"
                >
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">Success!</p>
                      <p className="text-sm">
                        Your Chapter NFT collection has been created and first
                        edition minted!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="space-y-3">
              {currentStep === "create" && (
                <button
                  onClick={handleCreateNFT}
                  disabled={isRestricted || isCreating}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {isRestricted ? (
                    "Chapter Creation Restricted"
                  ) : isCreating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Collection...
                    </>
                  ) : (
                    "Create NFT Collection"
                  )}
                </button>
              )}

              {currentStep === "mint" && (
                <button
                  onClick={handleMintFirstEdition}
                  disabled={isMinting}
                  className="w-full py-3 px-4 bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {isMinting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Minting First Edition...
                    </>
                  ) : (
                    "Mint First Edition (Free)"
                  )}
                </button>
              )}

              {currentStep === "next-actions" && (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-green-600 dark:text-green-400"
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
                    </div>
                    <h4 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
                      NFT Collection Created!
                    </h4>
                    <p className="text-ink-600 dark:text-ink-400 mb-4">
                      Your chapter is now published with plot tokens AND an NFT
                      collection. What would you like to do next?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => onNextStep?.("publish")}
                      className="py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      View Creator Dashboard
                    </button>

                    <button
                      onClick={() => onNextStep?.("tokens")}
                      className="py-3 px-4 bg-secondary-600 hover:bg-secondary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
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
                      View Token Assets
                    </button>
                  </div>
                </div>
              )}

              {currentStep === "complete" && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-400"
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
                  </div>
                  <h4 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
                    Collection Created!
                  </h4>
                  <p className="text-ink-600 dark:text-ink-400">
                    Your readers can now mint limited edition NFTs of this
                    chapter
                  </p>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="mt-6 pt-6 border-t border-parchment-200 dark:border-dark-700">
              <h5 className="font-semibold text-ink-900 dark:text-white mb-3">
                How it works:
              </h5>
              <ul className="space-y-2 text-sm text-ink-600 dark:text-ink-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Each chapter gets its own NFT collection with 100 limited
                  editions
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  You mint the first edition for free as the creator
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Readers can mint editions 2-100 for {NFT_CONFIG.mintPrice} ETH
                  each
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  You earn 10% royalties on all secondary market sales
                </li>
              </ul>
            </div>

            {/* Introduction */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
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
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
                    Chapter Published Successfully!
                  </h3>
                  <p className="text-ink-600 dark:text-ink-400 text-sm">
                    Your chapter is now live with plot tokens. Create an NFT
                    collection as an optional bonus for your readers.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ChapterNFTCreator;
