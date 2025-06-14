import { useState, useEffect } from "react";
import { useAuth } from "../utils/AuthContext";
import { canVoteOnPlot } from "../utils/storyUtils";
import {
  voteForPlotChoice,
  hasUserVotedOnChapter,
  subscribeToVoteCounts,
} from "../utils/storyService";
import { motion } from "framer-motion";

interface PlotVotingProps {
  storyId: string | undefined;
  chapterId: string | undefined;
  creatorId: string;
  choiceOptions: string[];
  currentVote?: number | null;
  onVote?: (choiceIndex: number) => void;
}

const PlotVoting: React.FC<PlotVotingProps> = ({
  storyId,
  chapterId,
  creatorId,
  choiceOptions,
  onVote,
}) => {
  const { currentUser } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteResults, setVoteResults] = useState<{
    counts: number[];
    total: number;
    percentages: number[];
  }>({
    counts: [],
    total: 0,
    percentages: [],
  });

  // Check if the current user can vote
  const userCanVote = canVoteOnPlot(creatorId, currentUser?.uid);

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

  // Handle vote selection
  const handleVoteSelect = (optionIndex: number) => {
    if (!userCanVote || isSubmitting) return;
    setSelectedOption(optionIndex);
  };

  // Handle vote submission
  const handleSubmitVote = async () => {
    if (
      !userCanVote ||
      selectedOption === null ||
      !currentUser ||
      !storyId ||
      !chapterId
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

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
        onVote(selectedOption);
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
      setError("Failed to submit your vote. Please try again.");
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
      <h3 className="text-xl font-display font-bold text-ink-900 dark:text-white mb-4">
        Help Choose the Next Plot Direction
      </h3>

      {!userCanVote && (
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
              As the creator of this story, you cannot vote on plot directions.
            </p>
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

      <div className="space-y-3 mb-4">
        {choiceOptions.map((option, index) => (
          <div
            key={index}
            onClick={() => !hasVoted && handleVoteSelect(index)}
            className={`relative p-4 border rounded-lg transition-all ${
              selectedOption === index
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400"
                : "border-parchment-200 dark:border-dark-700 hover:bg-parchment-50 dark:hover:bg-dark-800"
            } ${
              !userCanVote || hasVoted ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center border ${
                  selectedOption === index
                    ? "border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400"
                    : "border-parchment-300 dark:border-dark-600"
                }`}
              >
                {selectedOption === index && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-ink-800 dark:text-ink-200 break-anywhere font-medium">
                {option}
              </span>
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

      <button
        onClick={handleSubmitVote}
        disabled={
          !userCanVote || selectedOption === null || isSubmitting || hasVoted
        }
        className={`w-full py-3 px-4 font-medium rounded-md transition-colors ${
          !userCanVote || selectedOption === null || isSubmitting || hasVoted
            ? "bg-parchment-200 text-ink-500 dark:bg-dark-700 dark:text-ink-400 cursor-not-allowed"
            : "bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400"
        }`}
      >
        {isSubmitting
          ? "Submitting..."
          : hasVoted
          ? "Vote Submitted"
          : "Cast Your Vote"}
      </button>

      <p className="text-sm text-ink-500 dark:text-ink-400 mt-3">
        Your vote helps shape how this story evolves. The option with the most
        votes will become the next chapter.
      </p>
    </motion.div>
  );
};

export default PlotVoting;
