import { useState, useEffect } from "react";
import { useAuth } from "../utils/AuthContext";
import { useWallet } from "../utils/useWallet";
import { canVoteOnPlot } from "../utils/storyUtils";
import {
  voteForPlotChoice,
  hasUserVotedOnChapter,
  subscribeToVoteCounts,
} from "../utils/storyService";
import { ZoraService } from "../utils/zoraService";
import { useCoinTrader } from "../utils/useCoinTrader";
import type { Address } from "viem";
import { motion } from "framer-motion";

interface PlotOption {
  name: string;
  symbol: string;
  tokenAddress?: string;
  currentPrice?: number; // ETH per token
  totalVotes?: number;
  volumeETH?: number;
  preview?: string; // Preview snippet for this plot option
}

interface PlotVotingProps {
  storyId: string | undefined;
  chapterId: string | undefined;
  creatorId: string;
  plotOptions: PlotOption[];
  plotOptionPreviews?: string[]; // Preview snippets for each option
  voteEndTime?: Date;
  currentVote?: number | null;
  onVote?: (choiceIndex: number, ethAmount: number) => void;
}

const PlotVoting: React.FC<PlotVotingProps> = ({
  storyId,
  chapterId,
  creatorId,
  plotOptions,
  plotOptionPreviews,
  voteEndTime,
  onVote,
}) => {
  const { currentUser } = useAuth();
  const { isConnected, address } = useWallet();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [ethAmount, setEthAmount] = useState<string>("0.01");
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    optionIndex: number | null;
    optionName: string;
    preview: string;
  }>({
    isOpen: false,
    optionIndex: null,
    optionName: "",
    preview: "",
  });
  const [voteResults, setVoteResults] = useState<{
    counts: number[];
    total: number;
    percentages: number[];
  }>({
    counts: [],
    total: 0,
    percentages: [],
  });

  // Use the new CoinTrader hook
  const {
    purchasePlotTokens,
    isLoading: isPurchasing,
    isConfirmed,
    txHash,
    error: purchaseError,
    clearError,
  } = useCoinTrader();

  // Check if the current user can vote
  const userCanVote = canVoteOnPlot(creatorId, currentUser?.uid) && isConnected;

  // Check if voting is still active
  const isVotingActive = voteEndTime ? new Date() < voteEndTime : true;

  // Check if user has already voted
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!currentUser?.uid || !chapterId) return;

      try {
        const existingVote = await hasUserVotedOnChapter(
          chapterId,
          currentUser.uid
        );

        if (existingVote !== null) {
          setSelectedOption(existingVote);
          setHasVoted(true);
        }
      } catch (error) {
        console.error("Error checking vote status:", error);
      }
    };

    checkVoteStatus();
  }, [chapterId, currentUser]);

  // Subscribe to vote counts
  useEffect(() => {
    if (!chapterId) return;

    const unsubscribe = subscribeToVoteCounts(chapterId, (results) => {
      setVoteResults(results);
    });

    return () => unsubscribe();
  }, [chapterId]);

  // Update time remaining
  useEffect(() => {
    if (!voteEndTime) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = voteEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Voting ended");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [voteEndTime]);

  // Handle successful purchase
  useEffect(() => {
    if (isConfirmed && selectedOption !== null && !hasVoted) {
      handlePurchaseSuccess();
    }
  }, [isConfirmed, selectedOption, hasVoted]);

  const handleVoteSelect = (optionIndex: number) => {
    if (!userCanVote || !isVotingActive || hasVoted) return;
    setSelectedOption(optionIndex);
    clearError();
  };

  const handleShowPreview = (optionIndex: number) => {
    const option = plotOptions[optionIndex];
    const preview = plotOptionPreviews?.[optionIndex] || option.preview || "";

    if (preview.trim()) {
      setPreviewModal({
        isOpen: true,
        optionIndex,
        optionName: option.name,
        preview,
      });
    }
  };

  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      optionIndex: null,
      optionName: "",
      preview: "",
    });
  };

  const handleSubmitVote = async () => {
    if (
      !userCanVote ||
      !isVotingActive ||
      selectedOption === null ||
      !currentUser ||
      !storyId ||
      !chapterId ||
      !address
    ) {
      return;
    }

    const ethValue = parseFloat(ethAmount);
    if (ethValue <= 0) {
      return;
    }

    const selectedPlotOption = plotOptions?.[selectedOption];
    if (!selectedPlotOption?.tokenAddress) {
      return;
    }

    console.log("🚀 Purchasing plot tokens with Zora Coin Trader:", {
      plotOption: selectedPlotOption,
      ethAmount: ethValue,
      userAddress: address,
      tokenAddress: selectedPlotOption.tokenAddress,
    });

    try {
      // Purchase tokens using CoinTrader contract with Zora integration
      await purchasePlotTokens({
        tokenAddress: selectedPlotOption.tokenAddress as Address,
        ethAmount,
        recipient: address,
      });

      console.log("✅ Plot token purchase transaction submitted successfully");
    } catch (error) {
      console.error("❌ Error submitting plot token purchase:", error);
    }
  };

  const handlePurchaseSuccess = async () => {
    if (!currentUser || !storyId || !chapterId || selectedOption === null)
      return;

    try {
      const selectedPlotOption = plotOptions[selectedOption];

      // Record vote in traditional voting system for compatibility
      await voteForPlotChoice({
        storyId,
        chapterId,
        choiceOptionIndex: selectedOption,
        userId: currentUser.uid,
      });

      // Record vote in ZoraService for plot tracking
      const zoraService = new ZoraService();
      await zoraService.recordPlotVote(
        chapterId,
        selectedPlotOption.symbol,
        address as Address,
        ethAmount
      );

      // Mark as voted
      setHasVoted(true);

      // Call the callback if provided
      if (onVote) {
        onVote(selectedOption, parseFloat(ethAmount));
      }

      console.log("✅ Plot vote recorded successfully");
    } catch (error) {
      console.error("❌ Error recording plot vote:", error);
    }
  };

  const displayError = purchaseError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-dark-900 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 p-4"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-display font-bold text-ink-900 dark:text-white">
          🗳️ Vote on Plot Direction
        </h3>
        {voteEndTime && (
          <div className="text-right">
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isVotingActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {timeRemaining}
            </div>
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md mb-3 border border-blue-200 dark:border-blue-900/30">
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
              🔗 Connect your wallet to purchase PLOT tokens and vote on story
              directions.
            </p>
          </div>
        </div>
      )}

      {!userCanVote && isConnected && (
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
              ✍️ As the story creator, you cannot purchase tokens or vote on
              plot directions.
            </p>
          </div>
        </div>
      )}

      {!isVotingActive && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md mb-3 border border-red-200 dark:border-red-900/30">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm">
              ⏰ Voting has ended for this chapter. PLOT tokens can now be
              traded on secondary markets.
            </p>
          </div>
        </div>
      )}

      {displayError && (
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
            <p className="text-sm">❌ {displayError}</p>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {isPurchasing && txHash && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md mb-3 border border-blue-200 dark:border-blue-900/30">
          <div className="flex items-start">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2 mt-0.5 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-medium">
                🔄 Processing your PLOT token purchase...
              </p>
              <p className="text-xs mt-1">
                Transaction:{" "}
                <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded text-xs">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </code>
              </p>
              <p className="text-xs mt-1">
                ⏳ Please wait for blockchain confirmation
              </p>
            </div>
          </div>
        </div>
      )}

      {isConfirmed && !hasVoted && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md mb-3 border border-green-200 dark:border-green-900/30">
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
              ✅ PLOT tokens purchased successfully! Recording your vote...
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {plotOptions?.map((option, index) => (
          <div
            key={index}
            onClick={() =>
              !hasVoted && isVotingActive && handleVoteSelect(index)
            }
            className={`relative p-3 border rounded-lg transition-all ${
              selectedOption === index
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400"
                : "border-parchment-200 dark:border-dark-700 hover:bg-parchment-50 dark:hover:bg-dark-800"
            } ${
              !userCanVote || hasVoted || !isVotingActive
                ? "cursor-default"
                : "cursor-pointer"
            }`}
          >
            <div className="flex items-start">
              <div
                className={`w-4 h-4 rounded-full mr-2 mt-0.5 flex items-center justify-center border ${
                  selectedOption === index
                    ? "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400"
                    : "border-parchment-300 dark:border-dark-600"
                }`}
              >
                {selectedOption === index && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-ink-900 dark:text-white truncate">
                    {option.name}
                  </h4>
                  <span className="px-1.5 py-0.5 text-xs font-mono bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded flex-shrink-0">
                    ${option.symbol}
                  </span>

                  {/* Token Address Badge */}
                  {option.tokenAddress && (
                    <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded flex-shrink-0">
                      🟢 Ready
                    </span>
                  )}

                  {/* Preview button */}
                  {(plotOptionPreviews?.[index] || option.preview) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowPreview(index);
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Preview
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Vote Percentages (shown after voting) */}
            {hasVoted && voteResults.total > 0 && (
              <div className="mt-2 ml-6">
                <div className="relative w-full h-1.5 bg-parchment-200 dark:bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${voteResults.percentages[index] || 0}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`absolute top-0 left-0 h-full ${
                      selectedOption === index
                        ? "bg-primary-500 dark:bg-primary-400"
                        : "bg-parchment-400 dark:bg-dark-500"
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center mt-1 text-xs text-ink-600 dark:text-ink-400">
                  <span>
                    {voteResults.counts[index] || 0} vote
                    {(voteResults.counts[index] || 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="font-medium">
                    {voteResults.percentages[index] || 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ETH Amount Input */}
      {userCanVote &&
        isVotingActive &&
        selectedOption !== null &&
        !hasVoted && (
          <div className="mb-4 p-3 bg-parchment-50 dark:bg-dark-800 rounded-lg border border-parchment-200 dark:border-dark-700">
            <h4 className="font-medium text-sm text-ink-900 dark:text-white mb-2">
              💰 Purchase Amount
            </h4>

            {!plotOptions?.[selectedOption]?.tokenAddress ? (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md mb-2 border border-amber-200 dark:border-amber-900/30">
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
                  <p className="text-xs">
                    🚀 PLOT option tokens are being deployed. Check back
                    shortly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="ethAmount"
                    className="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-1"
                  >
                    ETH Amount
                  </label>
                  <input
                    id="ethAmount"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    disabled={isPurchasing}
                    className="w-full px-2 py-1.5 text-sm border border-parchment-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-ink-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                    placeholder="0.01"
                  />
                </div>
                <div className="text-xs text-ink-600 dark:text-ink-400">
                  💡 Your purchase will be routed through Zora's advanced DEX
                </div>
              </div>
            )}

            <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
              📈 Min: 0.001 ETH • PLOT tokens can be traded after voting ends
            </p>
          </div>
        )}

      <button
        onClick={handleSubmitVote}
        disabled={
          !userCanVote ||
          !isVotingActive ||
          selectedOption === null ||
          isPurchasing ||
          hasVoted ||
          !plotOptions?.[selectedOption || 0]?.tokenAddress ||
          parseFloat(ethAmount) <= 0
        }
        className={`w-full py-2.5 px-3 text-sm font-medium rounded-md transition-colors ${
          !userCanVote ||
          selectedOption === null ||
          isPurchasing ||
          hasVoted ||
          !plotOptions?.[selectedOption || 0]?.tokenAddress ||
          parseFloat(ethAmount) <= 0
            ? "bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
            : "bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400"
        }`}
      >
        {isPurchasing
          ? "🔄 Purchasing PLOT Tokens..."
          : hasVoted
          ? "✅ PLOT Tokens Purchased"
          : selectedOption !== null &&
            !plotOptions?.[selectedOption]?.tokenAddress
          ? "⏳ Token Deploying..."
          : selectedOption !== null
          ? `🚀 Purchase ${plotOptions?.[selectedOption]?.symbol} Tokens`
          : "📋 Select Plot Option"}
      </button>

      <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
        🗳️ Purchase PLOT tokens to vote on story direction • The plot option
        with most token purchases wins • Powered by Zora
      </p>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
                  📖 Plot Preview
                </h3>
                <button
                  onClick={handleClosePreview}
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

              <div className="mb-4">
                <h4 className="font-medium text-ink-900 dark:text-white mb-2">
                  {previewModal.optionName}
                </h4>
                <div className="p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg border border-parchment-200 dark:border-dark-700">
                  <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
                    {previewModal.preview}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClosePreview}
                  className="px-4 py-2 text-sm font-medium text-ink-700 dark:text-ink-300 bg-parchment-100 dark:bg-dark-700 hover:bg-parchment-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
                >
                  Close
                </button>
                {!hasVoted && isVotingActive && userCanVote && (
                  <button
                    onClick={() => {
                      if (previewModal.optionIndex !== null) {
                        handleVoteSelect(previewModal.optionIndex);
                        handleClosePreview();
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                  >
                    🗳️ Vote for This Option
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PlotVoting;
