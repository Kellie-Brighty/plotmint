/**
 * Utility functions for story-related operations
 */

/**
 * Checks if the current user is the creator of the story
 * @param storyCreatorId - The ID of the story creator
 * @param currentUserId - The ID of the current user
 * @returns boolean - True if the current user is the creator, false otherwise
 */
export const isStoryCreator = (
  storyCreatorId: string | undefined,
  currentUserId: string | undefined
): boolean => {
  if (!storyCreatorId || !currentUserId) return false;
  return storyCreatorId === currentUserId;
};

/**
 * Checks if the user can vote on a plot
 * @param storyCreatorId - The ID of the story creator
 * @param currentUserId - The ID of the current user
 * @returns boolean - True if the user can vote, false otherwise
 */
export const canVoteOnPlot = (
  storyCreatorId: string | undefined,
  currentUserId: string | undefined
): boolean => {
  // User must be logged in to vote
  if (!currentUserId) return false;

  // Creator cannot vote on their own story
  return !isStoryCreator(storyCreatorId, currentUserId);
};

/**
 * Checks if the user can collect a story
 * @param storyCreatorId - The ID of the story creator
 * @param currentUserId - The ID of the current user
 * @returns boolean - True if the user can collect, false otherwise
 */
export const canCollectStory = (
  storyCreatorId: string | undefined,
  currentUserId: string | undefined
): boolean => {
  // User must be logged in to collect
  if (!currentUserId) return false;

  // Creator cannot collect their own story
  return !isStoryCreator(storyCreatorId, currentUserId);
};
