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
import type { VotePayload } from "../utils/zora";
// import { tradeCoin } from "@zoralabs/coins-sdk";
// import { parseEther } from "viem";
import type { Address } from "viem";
import { motion } from "framer-motion";

interface PlotOption {
  name: string;
  symbol: string;
  tokenAddress?: string;
  currentPrice?: number; // ETH per token
  totalVotes?: number;
  volumeETH?: number;
  isChecking?: boolean; // For tradeability check loading state
  isNotTradeable?: boolean; // Flag if token is not tradeable
  tradeabilityError?: string; // Error message if not tradeable
}

interface PlotVotingProps {
  storyId: string | undefined;
  chapterId: string | undefined;
  creatorId: string;
  plotOptions: PlotOption[];
  voteEndTime?: Date;
  currentVote?: number | null;
  onVote?: (choiceIndex: number, ethAmount: number) => void;
}

const PlotVoting: React.FC<PlotVotingProps> = ({
  storyId,
  chapterId,
  creatorId,
  plotOptions,
  voteEndTime,
  onVote,
}) => {
  const { currentUser } = useAuth();
  const { isConnected, address, getWalletClient, getPublicClient } =
    useWallet();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [ethAmount, setEthAmount] = useState<string>("0.01");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [voteResults, setVoteResults] = useState<{
    counts: number[];
    total: number;
    percentages: number[];
  }>({
    counts: [],
    total: 0,
    percentages: [],
  });
  const [plotOptionsWithStatus, setPlotOptionsWithStatus] =
    useState<PlotOption[]>(plotOptions);

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

  // Check tradeability when plot options change
  useEffect(() => {
    const checkTradeability = async () => {
      if (!plotOptions || plotOptions.length === 0) return;

      // Initialize with plot options
      const optionsWithStatus = [...plotOptions];
      setPlotOptionsWithStatus(optionsWithStatus);

      const publicClient = getPublicClient();
      if (!publicClient) return;

      const zoraService = new ZoraService();

      // Check each plot option's tradeability
      for (let i = 0; i < optionsWithStatus.length; i++) {
        const option = optionsWithStatus[i];

        if (!option.tokenAddress) {
          // Token not deployed yet
          optionsWithStatus[i] = {
            ...option,
            isNotTradeable: true,
            tradeabilityError: "Token not deployed yet",
          };
          continue;
        }

        try {
          // Set checking state
          optionsWithStatus[i] = { ...option, isChecking: true };
          setPlotOptionsWithStatus([...optionsWithStatus]);

          // Perform tradeability check
          const tradeabilityStatus = await zoraService.checkTokenTradeability(
            option.tokenAddress as Address,
            publicClient
          );

          console.log(
            `🔍 Tradeability check for ${option.symbol}:`,
            tradeabilityStatus
          );

          // Update option with results
          optionsWithStatus[i] = {
            ...option,
            isChecking: false,
            isNotTradeable: !(
              tradeabilityStatus.isInitialized &&
              tradeabilityStatus.hasHookBalance &&
              tradeabilityStatus.poolExists
            ),
            tradeabilityError:
              tradeabilityStatus.error ||
              (!tradeabilityStatus.isInitialized
                ? "Pool not initialized"
                : !tradeabilityStatus.hasHookBalance
                ? "No liquidity available"
                : !tradeabilityStatus.poolExists
                ? "Pool does not exist"
                : undefined),
          };
        } catch (error) {
          console.error(
            `❌ Error checking tradeability for ${option.symbol}:`,
            error
          );
          optionsWithStatus[i] = {
            ...option,
            isChecking: false,
            isNotTradeable: true,
            tradeabilityError: "Failed to check tradeability",
          };
        }
      }

      setPlotOptionsWithStatus([...optionsWithStatus]);
    };

    checkTradeability();
  }, [plotOptions, isConnected]);

  // Handle vote selection
  const handleVoteSelect = (optionIndex: number) => {
    if (!userCanVote || isSubmitting || !isVotingActive) return;

    const selectedOption = plotOptionsWithStatus[optionIndex];
    if (selectedOption?.isNotTradeable) {
      setError(
        `Cannot vote for ${selectedOption.symbol}: ${selectedOption.tradeabilityError}`
      );
      return;
    }

    setSelectedOption(optionIndex);
    setError(null); // Clear any previous errors
  };

  // Handle vote submission (token purchase)
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
      setError("Please enter a valid ETH amount");
      return;
    }

    const selectedPlotOption = plotOptionsWithStatus?.[selectedOption];
    if (!selectedPlotOption?.tokenAddress) {
      setError("Token address not found for selected plot option");
      return;
    }

    // Double-check tradeability before proceeding
    if (selectedPlotOption.isNotTradeable) {
      setError(
        `Cannot purchase tokens: ${selectedPlotOption.tradeabilityError}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Get wallet clients
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Wallet not properly connected");
      }

      // Create ZoraService instance
      const zoraService = new ZoraService();

      // Prepare vote payload for token purchase
      const votePayload: VotePayload = {
        chapterId,
        plotSymbol: selectedPlotOption.symbol,
        tokenAddress: selectedPlotOption.tokenAddress as Address,
        voter: address,
        amount: 1, // Vote count (always 1 per transaction)
        orderSize: ethAmount, // ETH amount as string
      };

      console.log("Purchasing tokens via ZoraService:", {
        plotOption: selectedPlotOption,
        ethAmount: ethValue,
        userAddress: address,
        votePayload,
      });

      // Execute token purchase via ZoraService
      await zoraService.voteWithETH(votePayload, walletClient, publicClient);

      // Also record the vote in the traditional voting system for compatibility
      await voteForPlotChoice({
        storyId,
        chapterId,
        choiceOptionIndex: selectedOption,
        userId: currentUser.uid,
      });

      // Mark as voted
      setHasVoted(true);

      // Call the callback if provided
      if (onVote) {
        onVote(selectedOption, ethValue);
      }

      console.log("✅ Token purchase completed successfully");
    } catch (error) {
      console.error("Error purchasing tokens:", error);
      setError(
        error instanceof Error
          ? `Failed to purchase tokens: ${error.message}`
          : "Failed to purchase tokens. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-6 mt-8"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-display font-bold text-ink-900 dark:text-white">
          Vote by Purchasing Plot Tokens
        </h3>
        {voteEndTime && (
          <div className="text-right">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md mb-4 border border-blue-200 dark:border-blue-900/30">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p>Connect your wallet to purchase plot tokens and vote.</p>
          </div>
        </div>
      )}

      {!userCanVote && isConnected && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md mb-4 border border-amber-200 dark:border-amber-900/30">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              As the creator of this story, you cannot purchase tokens or vote
              on plot directions.
            </p>
          </div>
        </div>
      )}

      {!isVotingActive && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md mb-4 border border-red-200 dark:border-red-900/30">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p>Voting has ended for this chapter. Tokens can now be sold.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md mb-4 border border-red-200 dark:border-red-900/30">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {plotOptionsWithStatus?.map((option, index) => (
          <div
            key={index}
            onClick={() =>
              !hasVoted && isVotingActive && handleVoteSelect(index)
            }
            className={`relative p-4 border rounded-lg transition-all ${
              selectedOption === index
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400"
                : "border-parchment-200 dark:border-dark-700 hover:bg-parchment-50 dark:hover:bg-dark-800"
            } ${
              !userCanVote || hasVoted || !isVotingActive
                ? "cursor-default"
                : "cursor-pointer"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1">
                <div
                  className={`w-5 h-5 rounded-full mr-3 mt-0.5 flex items-center justify-center border ${
                    selectedOption === index
                      ? "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400"
                      : "border-parchment-300 dark:border-dark-600"
                  }`}
                >
                  {selectedOption === index && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-ink-900 dark:text-white">
                      {option.name}
                    </h4>
                    <span className="px-2 py-1 text-xs font-mono bg-parchment-100 dark:bg-dark-800 text-ink-600 dark:text-ink-400 rounded">
                      ${option.symbol}
                    </span>

                    {/* Tradeability Status Indicators */}
                    {option.isChecking ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          Checking...
                        </span>
                      </div>
                    ) : option.isNotTradeable ? (
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs text-red-600 dark:text-red-400">
                          Not Tradeable
                        </span>
                      </div>
                    ) : option.tokenAddress ? (
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Ready to Trade
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Show tradeability error message */}
                  {option.isNotTradeable && option.tradeabilityError && (
                    <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs border border-red-200 dark:border-red-900/30">
                      <div className="flex items-start gap-1">
                        <svg
                          className="w-3 h-3 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{option.tradeabilityError}</span>
                      </div>
                    </div>
                  )}

                  {/* Only show stats after user has voted */}
                  {hasVoted && (
                    <div className="grid grid-cols-2 gap-4 text-sm text-ink-600 dark:text-ink-400">
                      <div>
                        <span className="font-medium">Current Price:</span>
                        <span className="ml-1">
                          {option.currentPrice
                            ? `${option.currentPrice.toFixed(6)} ETH`
                            : "TBD"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Total Votes:</span>
                        <span className="ml-1">{option.totalVotes || 0}</span>
                      </div>
                      {option.volumeETH && option.volumeETH > 0 && (
                        <div className="col-span-2">
                          <span className="font-medium">Volume:</span>
                          <span className="ml-1">
                            {option.volumeETH.toFixed(4)} ETH
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vote Percentages (shown after voting) */}
            {hasVoted && voteResults.total > 0 && (
              <div className="mt-3">
                <div className="relative w-full h-2 bg-parchment-200 dark:bg-dark-700 rounded-full overflow-hidden">
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
          <div className="mb-6 p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg border border-parchment-200 dark:border-dark-700">
            <h4 className="font-medium text-ink-900 dark:text-white mb-3">
              Purchase Amount
            </h4>

            {!plotOptionsWithStatus?.[selectedOption]?.tokenAddress ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md mb-3 border border-amber-200 dark:border-amber-900/30">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
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
                    Plot option tokens are being deployed. Please check back
                    shortly to purchase tokens and vote.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="ethAmount"
                    className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1"
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
                    className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-ink-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.01"
                  />
                </div>
                <div className="text-sm text-ink-600 dark:text-ink-400">
                  <div>
                    ≈{" "}
                    {plotOptionsWithStatus?.[selectedOption]?.currentPrice
                      ? Math.floor(
                          parseFloat(ethAmount) /
                            plotOptionsWithStatus[selectedOption]!.currentPrice!
                        )
                      : "TBD"}{" "}
                    tokens
                  </div>
                  <div className="text-xs">at current price</div>
                </div>
              </div>
            )}

            <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
              Minimum purchase: 0.001 ETH. Tokens cannot be sold until voting
              ends.
            </p>
          </div>
        )}

      <button
        onClick={handleSubmitVote}
        disabled={
          !userCanVote ||
          !isVotingActive ||
          selectedOption === null ||
          isSubmitting ||
          hasVoted ||
          !plotOptionsWithStatus?.[selectedOption || 0]?.tokenAddress ||
          plotOptionsWithStatus?.[selectedOption || 0]?.isNotTradeable
        }
        className={`w-full py-3 px-4 font-medium rounded-md transition-colors ${
          !userCanVote ||
          selectedOption === null ||
          isSubmitting ||
          hasVoted ||
          !plotOptionsWithStatus?.[selectedOption || 0]?.tokenAddress ||
          plotOptionsWithStatus?.[selectedOption || 0]?.isNotTradeable
            ? "bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
            : "bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400"
        }`}
      >
        {isSubmitting
          ? "Purchasing Tokens..."
          : hasVoted
          ? "Tokens Purchased"
          : selectedOption !== null &&
            !plotOptionsWithStatus?.[selectedOption]?.tokenAddress
          ? "Token not deployed yet"
          : selectedOption !== null &&
            plotOptionsWithStatus?.[selectedOption]?.isNotTradeable
          ? `Cannot Trade ${plotOptionsWithStatus?.[selectedOption]?.symbol} - ${plotOptionsWithStatus?.[selectedOption]?.tradeabilityError}`
          : selectedOption !== null
          ? `Purchase ${plotOptionsWithStatus?.[selectedOption]?.symbol} Tokens`
          : "Select Plot Option"}
      </button>

      <p className="text-sm text-ink-500 dark:text-ink-400 mt-3">
        Purchase tokens to vote on the story direction. The plot option with the
        most token purchases wins and becomes the next chapter.
      </p>
    </motion.div>
  );
};

export default PlotVoting;
