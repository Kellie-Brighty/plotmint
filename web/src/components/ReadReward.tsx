import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../utils/AuthContext";
import { hasUserClaimedReward, claimReadReward } from "../utils/rewardService";
import { Button } from "./ui/Button";

interface ReadRewardProps {
  storyId: string | undefined;
  chapterId: string | undefined;
  creatorId: string;
  readTime: number; // in seconds
  requiredReadTime: number; // in seconds
}

const ReadReward: React.FC<ReadRewardProps> = ({
  storyId,
  chapterId,
  creatorId,
  readTime,
  requiredReadTime,
}) => {
  const { currentUser } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [readTimeReached, setReadTimeReached] = useState(false);

  // Check if current user is the creator
  const isCreator = currentUser?.uid === creatorId;

  // Check if user has already claimed
  useEffect(() => {
    const checkClaimStatus = async () => {
      if (!currentUser?.uid || !chapterId) {
        setClaimed(false);
        return;
      }

      try {
        const hasClaimed = await hasUserClaimedReward(
          currentUser.uid,
          chapterId
        );
        setClaimed(hasClaimed);
      } catch (error) {
        console.error("Error checking claim status:", error);
      }
    };

    checkClaimStatus();
  }, [currentUser, chapterId]);

  // Check if read time requirement is met
  useEffect(() => {
    setReadTimeReached(readTime >= requiredReadTime);
  }, [readTime, requiredReadTime]);

  // Handle claiming reward
  const handleClaimReward = async () => {
    if (!currentUser?.uid || !storyId || !chapterId) return;
    if (!readTimeReached) return;

    try {
      setIsClaiming(true);
      setClaimError(null);

      // Call claim function
      const result = await claimReadReward(currentUser.uid, storyId, chapterId);

      if (result.success) {
        setClaimed(true);

        // Show success message briefly
        setClaimSuccess(true);
        setTimeout(() => {
          setClaimSuccess(false);
        }, 3000);
      } else {
        setClaimError(result.error || "Failed to claim reward");
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      setClaimError(
        error instanceof Error ? error.message : "Failed to claim reward"
      );
    } finally {
      setIsClaiming(false);
    }
  };

  // Format time display (mm:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // If required time not set yet or user is creator, don't render
  if (requiredReadTime === 0 || isCreator) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-dark-900 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden"
    >
      <div className="p-4">
        <h3 className="text-lg font-display font-bold text-ink-900 dark:text-white mb-3 flex items-center">
          <span>Earn PLOT Tokens</span>
          <svg
            className="ml-2 h-4 w-4 text-amber-500"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
          </svg>
        </h3>

        {claimError && (
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
              <p className="text-sm">{claimError}</p>
            </div>
          </div>
        )}

        {claimSuccess && (
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
              <p className="text-sm">You successfully claimed 5 PLOT tokens!</p>
            </div>
          </motion.div>
        )}

        <p className="text-sm text-ink-600 dark:text-ink-400 mb-3">
          {readTimeReached
            ? "You've completed the required reading time! Claim your PLOT tokens as a reward."
            : "Continue reading to earn PLOT tokens as a reward."}
        </p>

        <div className="mb-3 bg-parchment-100 dark:bg-dark-800 rounded-md p-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-ink-700 dark:text-ink-300">
              Read Time Progress:
            </span>
            <span className="font-medium text-ink-900 dark:text-ink-100">
              {formatTime(Math.min(readTime, requiredReadTime))} /{" "}
              {formatTime(requiredReadTime)}
              {readTimeReached && (
                <span className="ml-1 text-green-600 dark:text-green-400">
                  ✓
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-parchment-200 dark:bg-dark-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                readTimeReached ? "bg-green-500" : "bg-primary-500"
              }`}
              style={{
                width: `${Math.min((readTime / requiredReadTime) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        <Button
          variant={readTimeReached ? "primary" : "secondary"}
          onClick={handleClaimReward}
          disabled={!readTimeReached || isClaiming || claimed}
          size="sm"
          className="w-full"
        >
          {isClaiming ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          ) : claimed ? (
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-4 w-4"
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
              Reward Claimed
            </span>
          ) : !readTimeReached ? (
            "Keep Reading to Earn Reward"
          ) : (
            "Claim 5 PLOT Tokens"
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ReadReward;
