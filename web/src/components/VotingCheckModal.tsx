import React, { useState, useEffect } from "react";
import { ZoraService } from "../utils/zoraService";
import { getUserChapters } from "../utils/storyService";
import type { ChapterData } from "../utils/storyService";
import type { PlotWinner } from "../utils/zora";

interface VotingCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  storyId: string;
  storyTitle: string;
  creatorId: string;
}

interface VotingStatus {
  hasActiveVoting: boolean;
  activeChapter?: ChapterData;
  timeRemaining?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  previousResults?: Array<{
    chapterId: string;
    chapterTitle: string;
    winner: PlotWinner;
    plotOptions: Array<{
      symbol: string;
      name: string;
      votes: number;
      isWinner: boolean;
    }>;
  }>;
}

export const VotingCheckModal: React.FC<VotingCheckModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  storyId,
  storyTitle,
  creatorId,
}) => {
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeRemaining, setRealTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const zoraService = new ZoraService();

  useEffect(() => {
    if (isOpen) {
      checkVotingStatus();
    }
  }, [isOpen, storyId]);

  // Real-time countdown update
  useEffect(() => {
    if (votingStatus?.hasActiveVoting && votingStatus.timeRemaining) {
      setRealTimeRemaining(votingStatus.timeRemaining);

      const interval = setInterval(() => {
        setRealTimeRemaining((prev) => {
          if (!prev) return null;

          const totalSeconds =
            prev.hours * 3600 + prev.minutes * 60 + prev.seconds;
          if (totalSeconds <= 1) {
            // Voting period ended, refresh status
            checkVotingStatus();
            return null;
          }

          const newTotalSeconds = totalSeconds - 1;
          return {
            hours: Math.floor(newTotalSeconds / 3600),
            minutes: Math.floor((newTotalSeconds % 3600) / 60),
            seconds: newTotalSeconds % 60,
          };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [votingStatus]);

  const checkVotingStatus = async () => {
    try {
      setLoading(true);

      // Get all published chapters for this story
      const chapters = await getUserChapters(storyId, creatorId);
      const publishedChapters = chapters.filter(
        (ch) =>
          ch.published &&
          ((ch.plotTokens && ch.plotTokens.length > 0) ||
            (ch.plotOptions && ch.plotOptions.length > 0))
      );

      if (publishedChapters.length === 0) {
        setVotingStatus({ hasActiveVoting: false });
        setLoading(false);
        return;
      }

      // Check each chapter for active voting
      let hasActiveVoting = false;
      let activeChapter: ChapterData | undefined;
      let timeRemaining:
        | { hours: number; minutes: number; seconds: number }
        | undefined;
      const previousResults: VotingStatus["previousResults"] = [];

      for (const chapter of publishedChapters) {
        const tokens = chapter.plotTokens || chapter.plotOptions || [];
        if (tokens.length === 0) continue;

        // Check voting period
        const createdAt = chapter.createdAt?.toDate() || new Date();
        const votingEndTime = new Date(
          createdAt.getTime() + 24 * 60 * 60 * 1000
        );
        const now = new Date();
        const isVotingActive = now < votingEndTime;

        if (isVotingActive) {
          hasActiveVoting = true;
          activeChapter = chapter;
          const timeRemainingMs = votingEndTime.getTime() - now.getTime();
          const hours = Math.floor(timeRemainingMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((timeRemainingMs % (1000 * 60)) / 1000);
          timeRemaining = { hours, minutes, seconds };
          break; // Only need to find one active voting
        } else {
          // Check for previous voting results
          try {
            const voteStats = await zoraService.getPlotVoteStats(chapter.id!);

            // Get detailed coin info for each option
            const plotOptions = [];
            for (const [symbol, stats] of Object.entries(voteStats)) {
              try {
                const coinInfo = await zoraService.getCoinInfo(
                  stats.tokenAddress
                );

                // Get the actual plot option name from chapter data
                const plotOptionName =
                  tokens.find((t) => t.symbol === symbol)?.name || symbol;

                plotOptions.push({
                  symbol,
                  name: plotOptionName, // Use actual plot option name
                  votes: coinInfo.uniqueHolders || 0,
                  isWinner: false, // Will be determined below
                });
              } catch (error) {
                console.warn(`Could not get coin info for ${symbol}:`, error);

                // Get the actual plot option name from chapter data
                const plotOptionName =
                  tokens.find((t) => t.symbol === symbol)?.name || symbol;

                plotOptions.push({
                  symbol,
                  name: plotOptionName,
                  votes: stats.totalVotes || 0,
                  isWinner: false,
                });
              }
            }

            // Determine winner
            const maxVotes = Math.max(...plotOptions.map((opt) => opt.votes));
            plotOptions.forEach((opt) => {
              if (opt.votes === maxVotes && maxVotes > 0) {
                opt.isWinner = true;
              }
            });

            const winner = plotOptions.find((opt) => opt.isWinner);
            if (winner) {
              previousResults.push({
                chapterId: chapter.id!,
                chapterTitle: chapter.title,
                winner: {
                  symbol: winner.symbol,
                  tokenAddress: tokens.find((t) => t.symbol === winner.symbol)
                    ?.tokenAddress as any,
                  totalVotes: winner.votes,
                  volumeETH: "0",
                },
                plotOptions,
              });
            }
          } catch (error) {
            console.warn(
              `No voting stats found for chapter ${chapter.id}`,
              error
            );
          }
        }
      }

      setVotingStatus({
        hasActiveVoting,
        activeChapter,
        timeRemaining,
        previousResults: previousResults.slice(-3), // Show last 3 results
      });
    } catch (error) {
      console.error("Error checking voting status:", error);
      setVotingStatus({ hasActiveVoting: false });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Chapter
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Checking voting status...
              </p>
            </div>
          ) : votingStatus?.hasActiveVoting ? (
            // Active voting restriction
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                      Chapter Creation Restricted
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      You cannot create a new chapter while voting is active on
                      a previous chapter.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Active Voting Chapter: "{votingStatus.activeChapter?.title}"
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Readers are currently voting on the plot direction. Wait for
                    the voting period to end before creating your next chapter.
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time Remaining:
                    </span>
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                      <span className="text-sm font-mono text-yellow-800 dark:text-yellow-200">
                        {realTimeRemaining
                          ? `${realTimeRemaining.hours
                              .toString()
                              .padStart(2, "0")}:${realTimeRemaining.minutes
                              .toString()
                              .padStart(2, "0")}:${realTimeRemaining.seconds
                              .toString()
                              .padStart(2, "0")}`
                          : "00:00:00"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⏰ <strong>24-Hour Voting Period:</strong> Each chapter has a
                  24-hour voting period where readers can purchase plot tokens
                  to influence the story direction. Once voting ends, you'll be
                  able to create the next chapter based on the winning plot
                  option.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // No active voting - show previous results and allow creation
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
                      Ready to Create New Chapter
                    </h3>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      No active voting periods. You can create a new chapter for
                      "{storyTitle}".
                    </p>
                  </div>
                </div>
              </div>

              {votingStatus?.previousResults &&
                votingStatus.previousResults.length > 0 && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      📊 Previous Voting Results
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Here are the recent voting outcomes to guide your story
                      direction:
                    </p>

                    <div className="space-y-4">
                      {votingStatus.previousResults.map((result, index) => (
                        <div
                          key={result.chapterId}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {result.chapterTitle}
                            </h5>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Chapter{" "}
                              {votingStatus.previousResults!.length - index}{" "}
                              voting ago
                            </span>
                          </div>

                          <div className="space-y-2">
                            {result.plotOptions.map((option) => (
                              <div
                                key={option.symbol}
                                className={`flex items-center justify-between p-3 rounded ${
                                  option.isWinner
                                    ? "bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
                                    : "bg-gray-50 dark:bg-gray-800"
                                }`}
                              >
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                                    {option.name}
                                    {option.isWinner && (
                                      <span className="ml-2 text-green-600 dark:text-green-400">
                                        🏆 Winner
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {option.symbol}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {option.votes} votes
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      💡 Story Continuity Tip
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Consider incorporating the winning plot choices into your
                      next chapter to maintain story continuity and reader
                      engagement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onProceed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Chapter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
