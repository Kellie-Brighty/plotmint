import { useState, useEffect } from "react";
import { useAuth } from "../utils/AuthContext";
import { canCollectStory } from "../utils/storyUtils";
import {
  collectChapter,
  hasUserCollectedChapter,
  createNotification,
} from "../utils/storyService";
// import { ZoraService } from "../utils/zoraService";
// import type { PlotVoteStats } from "../utils/zora";
import PlotVoting from "./PlotVoting";
import ReadReward from "./ReadReward";
import ChapterNFTMinter from "./ChapterNFTMinter";
import { motion } from "framer-motion";
import type { Address } from "viem";

interface ChapterActionsProps {
  storyId: string | undefined;
  chapterId: string | undefined;
  creatorId: string;
  choiceOptions?: string[];
  hasChoicePoint: boolean;
  readTime?: number;
  requiredReadTime?: number;
  chapter?: any; // Add chapter data to access plotTokens
  storyTitle?: string;
  chapterTitle?: string;
}

const ChapterActions: React.FC<ChapterActionsProps> = ({
  storyId,
  chapterId,
  creatorId,
  choiceOptions = [],
  hasChoicePoint,
  readTime = 0,
  requiredReadTime = 0,
  chapter,
  storyTitle = "",
  chapterTitle = "",
}) => {
  const { currentUser } = useAuth();
  const [isCollecting, setIsCollecting] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [collectSuccess, setCollectSuccess] = useState(false);
  const [plotOptions, setPlotOptions] = useState<any[]>([]);
  const [voteStatus, setVoteStatus] = useState<{
    selectedOption: number | null;
    hasVoted: boolean;
  }>({
    selectedOption: null,
    hasVoted: false,
  });

  // Check if user can collect
  const userCanCollect = canCollectStory(creatorId, currentUser?.uid);

  // Use chapter's plotTokens data
  useEffect(() => {
    if (!hasChoicePoint || choiceOptions.length === 0) {
      setPlotOptions([]);
      return;
    }

    // Check if chapter has plotTokens (tokens already deployed)
    if (chapter?.plotTokens && chapter.plotTokens.length > 0) {
      // Use the plotTokens from the chapter
      const formattedOptions = chapter.plotTokens.map(
        (token: any, index: number) => ({
          name: choiceOptions[index] || token.name, // Use choice text as name
          symbol: token.symbol,
          tokenAddress: token.tokenAddress,
          currentPrice: 0.001, // Mock price for now
          totalVotes: 0, // Will be updated from vote subscription
          volumeETH: 0,
          preview: chapter?.plotOptionPreviews?.[index] || "", // Add preview text
        })
      );

      console.log("Using plotTokens from chapter:", formattedOptions);
      setPlotOptions(formattedOptions);
    } else {
      // No tokens deployed yet, show choice options without token addresses
      console.log("No plotTokens found, showing choice options without tokens");
      const emptyOptions = choiceOptions.map((choiceText, index) => ({
        name: choiceText,
        symbol: `PLOT${index + 1}`,
        tokenAddress: undefined,
        currentPrice: 0.001,
        totalVotes: 0,
        volumeETH: 0,
        preview: chapter?.plotOptionPreviews?.[index] || "", // Add preview text
      }));

      setPlotOptions(emptyOptions);
    }
  }, [hasChoicePoint, choiceOptions, chapter?.plotTokens]);

  // Check if the user has already collected this chapter
  useEffect(() => {
    const checkCollectionStatus = async () => {
      if (!currentUser?.uid || !storyId || !chapterId) {
        setIsCollected(false);
        return;
      }

      try {
        const hasCollected = await hasUserCollectedChapter(
          storyId,
          chapterId,
          currentUser.uid
        );
        setIsCollected(hasCollected);
      } catch (error) {
        console.error("Error checking collection status:", error);
      }
    };

    checkCollectionStatus();
  }, [storyId, chapterId, currentUser]);

  // Handle collecting the chapter
  const handleCollect = async () => {
    if (!userCanCollect || !currentUser?.uid || !storyId || !chapterId) {
      return;
    }

    try {
      setIsCollecting(true);
      setCollectError(null);

      // Collect the chapter
      await collectChapter(storyId, chapterId, currentUser.uid);
      setIsCollected(true);

      // Get story and chapter titles for the notification
      const storyTitle =
        document.querySelector("h1")?.textContent || "Unknown Story";
      const chapterTitle =
        document.querySelector(".chapter-title")?.textContent ||
        "Unknown Chapter";

      // Create a notification for the collection
      await createNotification(currentUser.uid, "collect_success", {
        storyId,
        storyTitle,
        chapterId,
        chapterTitle,
      });

      // Show success message briefly
      setCollectSuccess(true);
      setTimeout(() => {
        setCollectSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error collecting chapter:", error);
      setCollectError(
        error instanceof Error ? error.message : "Failed to collect chapter"
      );
    } finally {
      setIsCollecting(false);
    }
  };

  // Handle vote callback from PlotVoting
  const handleVote = async (choiceIndex: number) => {
    if (!currentUser?.uid || !storyId || !chapterId) return;

    // Update local state
    setVoteStatus({
      selectedOption: choiceIndex,
      hasVoted: true,
    });

    try {
      // Get story and chapter titles for the notification
      const storyTitle =
        document.querySelector("h1")?.textContent || "Unknown Story";
      const chapterTitle =
        document.querySelector(".chapter-title")?.textContent ||
        "Unknown Chapter";
      const choiceText = choiceOptions[choiceIndex] || "Unknown option";

      // Create a notification for the vote
      await createNotification(currentUser.uid, "vote_results", {
        storyId,
        storyTitle,
        chapterId,
        chapterTitle,
        result: choiceText,
      });

      // Note: Plot options will be updated automatically via the PlotVoting component's vote subscription
    } catch (error) {
      console.error("Error creating vote notification:", error);
    }
  };

  // Handle NFT mint success
  const handleNFTMintSuccess = async (
    _tokenId: number,
    editionNumber: number
  ) => {
    if (!currentUser?.uid || !storyId || !chapterId) return;

    try {
      // Create a notification for the NFT mint
      await createNotification(currentUser.uid, "nft_mint_success", {
        storyId,
        storyTitle,
        chapterId,
        chapterTitle,
        editionNumber: editionNumber,
      });

      console.log(
        `✅ NFT mint notification created for edition #${editionNumber}`
      );
    } catch (error) {
      console.error("Error creating NFT mint notification:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* NFT Minting Section - First */}
      {chapterId && storyTitle && chapterTitle && (
        <ChapterNFTMinter
          chapterId={chapterId}
          storyTitle={storyTitle}
          chapterTitle={chapterTitle}
          nftContractAddress={chapter?.nftContractAddress as Address}
          onMintSuccess={handleNFTMintSuccess}
        />
      )}

      {/* Plot Voting Section - Second */}
      {hasChoicePoint && choiceOptions.length > 0 && (
        <PlotVoting
          storyId={storyId}
          chapterId={chapterId}
          creatorId={creatorId}
          plotOptions={plotOptions}
          plotOptionPreviews={chapter?.plotOptionPreviews}
          currentVote={voteStatus.selectedOption}
          onVote={handleVote}
        />
      )}

      {/* Chapter Collection Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-dark-900 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden"
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-3">
            Add to Collection
          </h3>

          {!userCanCollect && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md mb-3 border border-amber-200 dark:border-amber-900/30">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm">
                  As the creator, you cannot collect your own chapters.
                </p>
              </div>
            </div>
          )}

          {collectError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md mb-3 border border-red-200 dark:border-red-900/30">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm">{collectError}</p>
              </div>
            </div>
          )}

          {collectSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 rounded-md mb-3 border border-green-200 dark:border-green-900/30"
            >
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm">
                  Chapter successfully added to your collection!
                </p>
              </div>
            </motion.div>
          )}

          <p className="text-sm text-ink-600 dark:text-ink-400 mb-3">
            Collecting chapters helps you track stories and supports creators.
          </p>

          <button
            onClick={handleCollect}
            disabled={!userCanCollect || isCollecting || isCollected}
            className={`w-full py-2.5 px-3 text-sm font-medium rounded-md transition-colors ${
              !userCanCollect || isCollecting || isCollected
                ? "bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400"
            }`}
          >
            {isCollecting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
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
                Processing...
              </span>
            ) : isCollected ? (
              <span className="flex items-center justify-center">
                <svg
                  className="mr-2 h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Added to Collection
              </span>
            ) : (
              "Add to My Collection"
            )}
          </button>
        </div>
      </motion.div>

      {/* Read Reward Section */}
      <ReadReward
        storyId={storyId}
        chapterId={chapterId}
        creatorId={creatorId}
        readTime={readTime}
        requiredReadTime={requiredReadTime}
      />
    </div>
  );
};

export default ChapterActions;
