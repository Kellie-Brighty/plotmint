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
import type { Address } from "viem";
import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";
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
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [selectionTimestamp, setSelectionTimestamp] = useState<number | null>(
    null
  );
  const [isVerifyingPurchase, setIsVerifyingPurchase] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [purchaseVerified, setPurchaseVerified] = useState(false);
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

  // Create public client for blockchain queries
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // ERC-20 ABI for Transfer events
  const erc20Abi = parseAbi([
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function balanceOf(address owner) view returns (uint256)",
  ]);

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

  const handleVoteSelect = (optionIndex: number) => {
    if (!userCanVote || !isVotingActive || hasVoted) return;
    setSelectedOption(optionIndex);

    // Record selection timestamp for temporal verification
    setSelectionTimestamp(Date.now());
    setPurchaseVerified(false);
    setVerificationError(null);

    console.log("📋 Plot option selected at:", new Date().toISOString());
  };

  // Verify that user purchased tokens after selecting plot option
  const verifyRecentPurchase = async () => {
    if (!address || !selectionTimestamp || selectedOption === null) {
      setVerificationError("Missing required information for verification");
      return false;
    }

    const selectedPlotOption = plotOptions[selectedOption];
    if (!selectedPlotOption?.tokenAddress) {
      setVerificationError("Token address not available");
      return false;
    }

    try {
      setIsVerifyingPurchase(true);
      setVerificationError(null);

      console.log("🔍 Verifying recent token purchase:", {
        userAddress: address,
        tokenAddress: selectedPlotOption.tokenAddress,
        selectionTime: new Date(selectionTimestamp).toISOString(),
      });

      // Get recent Transfer events to user's address
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - BigInt(1000); // Look back ~1000 blocks (approx 30 min on Base)

      const logs = await publicClient.getLogs({
        address: selectedPlotOption.tokenAddress as Address,
        event: erc20Abi.find(
          (item) => item.type === "event" && item.name === "Transfer"
        )!,
        args: {
          to: address,
        },
        fromBlock,
        toBlock: currentBlock,
      });

      console.log(`📝 Found ${logs.length} Transfer events to user address`);

      // Check if any transfers happened after selection timestamp
      for (const log of logs) {
        const block = await publicClient.getBlock({
          blockNumber: log.blockNumber,
        });
        const transferTime = Number(block.timestamp) * 1000; // Convert to milliseconds

        console.log(
          "⏰ Transfer at:",
          new Date(transferTime).toISOString(),
          "vs Selection at:",
          new Date(selectionTimestamp).toISOString()
        );

        if (transferTime > selectionTimestamp) {
          console.log("✅ Found recent token purchase after selection!");
          setPurchaseVerified(true);
          return true;
        }
      }

      setVerificationError(
        "No token purchases found after plot selection. Please buy tokens on Zora first."
      );
      return false;
    } catch (error) {
      console.error("❌ Error verifying token purchase:", error);
      setVerificationError(
        "Failed to verify token purchase. Please try again."
      );
      return false;
    } finally {
      setIsVerifyingPurchase(false);
    }
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

  const handleBuyOnZora = () => {
    if (
      selectedOption === null ||
      !plotOptions?.[selectedOption]?.tokenAddress
    ) {
      return;
    }

    const selectedPlotOption = plotOptions[selectedOption];
    const zoraUrl = `https://testnet.zora.co/coin/bsep:${selectedPlotOption.tokenAddress}`;

    console.log("🔗 Redirecting to Zora for token purchase:", {
      plotOption: selectedPlotOption,
      zoraUrl,
    });

    // Open Zora in a new tab
    window.open(zoraUrl, "_blank", "noopener,noreferrer");
  };

  const handleMarkAsVoted = async () => {
    if (!currentUser || !storyId || !chapterId || selectedOption === null) {
      return;
    }

    // First verify that user purchased tokens after selecting the plot option
    const isVerified = await verifyRecentPurchase();
    if (!isVerified) {
      return; // Verification failed, error message already set
    }

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
        "0" // No ETH amount since buying happens on Zora
      );

      // Mark as voted
      setHasVoted(true);

      // Call the callback if provided
      if (onVote) {
        onVote(selectedOption, 0); // No ETH amount since buying happens on Zora
      }

      console.log("✅ Plot vote recorded successfully");
    } catch (error) {
      console.error("❌ Error recording plot vote:", error);
      setVerificationError("Failed to record vote. Please try again.");
    }
  };

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

      {/* Verification Error Display */}
      {verificationError && (
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
            <p className="text-sm">❌ {verificationError}</p>
          </div>
        </div>
      )}

      {/* Purchase Verification Success */}
      {purchaseVerified && selectedOption !== null && (
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
              ✅ Token purchase verified! You bought $
              {plotOptions[selectedOption].symbol} after selecting this option.
            </p>
          </div>
        </div>
      )}

      {/* Verification in Progress */}
      {isVerifyingPurchase && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md mb-3 border border-blue-200 dark:border-blue-900/30">
          <div className="flex items-start">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2 mt-0.5 flex-shrink-0"></div>
            <p className="text-sm">
              🔍 Verifying your token purchase on the blockchain...
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

      {/* Token Purchase Info */}
      {userCanVote &&
        isVotingActive &&
        selectedOption !== null &&
        !hasVoted && (
          <div className="mb-4 p-3 bg-parchment-50 dark:bg-dark-800 rounded-lg border border-parchment-200 dark:border-dark-700">
            <h4 className="font-medium text-sm text-ink-900 dark:text-white mb-2">
              🛒 Buy Plot Tokens
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
                <div className="text-xs text-ink-600 dark:text-ink-400">
                  💡 Click below to buy{" "}
                  <strong>${plotOptions[selectedOption].symbol}</strong> tokens
                  on Zora's platform
                </div>
                <div className="text-xs text-ink-500 dark:text-ink-500">
                  🔗 Secure trading powered by Zora's advanced DEX
                </div>
              </div>
            )}

            <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
              📈 Buy any amount • PLOT tokens represent your vote weight
            </p>
          </div>
        )}

      {/* Action Buttons */}
      {hasVoted ? (
        <button
          disabled
          className="w-full py-2.5 px-3 text-sm font-medium rounded-md bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
        >
          ✅ Vote Recorded
        </button>
      ) : selectedOption !== null &&
        plotOptions?.[selectedOption]?.tokenAddress ? (
        <div className="space-y-2">
          <button
            onClick={handleBuyOnZora}
            disabled={!userCanVote || !isVotingActive}
            className={`w-full py-2.5 px-3 text-sm font-medium rounded-md transition-colors ${
              !userCanVote || !isVotingActive
                ? "bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400"
            }`}
          >
            🔗 Buy ${plotOptions[selectedOption].symbol} on Zora
          </button>
          <button
            onClick={handleMarkAsVoted}
            disabled={!userCanVote || !isVotingActive}
            className={`w-full py-2 px-3 text-xs font-medium rounded-md transition-colors ${
              !userCanVote || !isVotingActive
                ? "bg-parchment-100 text-ink-400 dark:bg-dark-800 dark:text-ink-500 cursor-not-allowed"
                : "bg-secondary-100 hover:bg-secondary-200 text-secondary-700 dark:bg-secondary-900/30 dark:hover:bg-secondary-900/50 dark:text-secondary-300"
            }`}
          >
            📝 I bought tokens - record my vote
          </button>
        </div>
      ) : selectedOption !== null &&
        !plotOptions?.[selectedOption]?.tokenAddress ? (
        <button
          disabled
          className="w-full py-2.5 px-3 text-sm font-medium rounded-md bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
        >
          ⏳ Token Deploying...
        </button>
      ) : (
        <button
          disabled
          className="w-full py-2.5 px-3 text-sm font-medium rounded-md bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
        >
          📋 Select Plot Option
        </button>
      )}

      <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
        🗳️ Buy PLOT tokens on Zora to vote on story direction • The plot option
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
