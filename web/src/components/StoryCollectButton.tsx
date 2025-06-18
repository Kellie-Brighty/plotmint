import { useState } from "react";
import { useAuth } from "../utils/AuthContext";
import { canCollectStory } from "../utils/storyUtils";

interface StoryCollectButtonProps {
  storyId: string;
  creatorId: string;
  isCollected?: boolean;
  onCollect?: (collected: boolean) => void;
}

const StoryCollectButton: React.FC<StoryCollectButtonProps> = ({
  creatorId,
  isCollected = false,
  onCollect,
}) => {
  const { currentUser } = useAuth();
  const [collected, setCollected] = useState(isCollected);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if the current user can collect
  const userCanCollect = canCollectStory(creatorId, currentUser?.uid);

  // Handle collect/uncollect
  const handleToggleCollect = async () => {
    if (!userCanCollect || isSubmitting || !currentUser) {
      return;
    }

    try {
      setIsSubmitting(true);

      // For now, just toggle locally since we disabled wallet functionality
      // In a real app with web3, this would interact with a smart contract
      const newCollectedState = !collected;
      setCollected(newCollectedState);

      // Call the callback if provided
      if (onCollect) {
        onCollect(newCollectedState);
      }
    } catch (error) {
      console.error("Error toggling collection:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-parchment-100 dark:bg-dark-800 text-ink-500 dark:text-ink-400 font-medium rounded-md cursor-not-allowed"
      >
        Sign in to Collect
      </button>
    );
  }

  if (!userCanCollect) {
    return (
      <div className="flex items-center">
        <button
          disabled
          className="px-4 py-2 bg-parchment-100 dark:bg-dark-800 text-ink-500 dark:text-ink-400 font-medium rounded-md cursor-not-allowed"
        >
          Cannot Collect Own Story
        </button>
        <span className="ml-2 text-xs text-ink-500 dark:text-ink-400">
          Creators cannot collect their own stories
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggleCollect}
      disabled={isSubmitting}
      className={`px-4 py-2 font-medium rounded-md ${
        collected
          ? "bg-secondary-600 hover:bg-secondary-700 text-white"
          : "bg-parchment-100 dark:bg-dark-800 hover:bg-parchment-200 dark:hover:bg-dark-700 text-ink-800 dark:text-ink-200"
      }`}
    >
      {isSubmitting
        ? "Processing..."
        : collected
        ? "Collected"
        : "Collect Story"}
    </button>
  );
};

export default StoryCollectButton;
