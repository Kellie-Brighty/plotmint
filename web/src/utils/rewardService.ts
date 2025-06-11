import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Interface for read-to-earn claims
export interface ReadRewardClaim {
  userId: string;
  storyId: string;
  chapterId: string;
  readTime: number; // Time spent reading in seconds
  claimed: boolean;
  claimedAt?: any; // Timestamp
  rewardAmount: number;
  signature?: string;
  expiryTimestamp?: number;
}

/**
 * Check if a user has already claimed a reward for a chapter
 * @param userId - ID of the user
 * @param chapterId - ID of the chapter
 * @returns Promise that resolves to a boolean indicating if the reward has been claimed
 */
export const hasUserClaimedReward = async (
  userId: string,
  chapterId: string
): Promise<boolean> => {
  if (!userId || !chapterId) return false;

  try {
    // Create a unique ID for this claim
    const claimId = `${userId}_${chapterId}`;
    const claimRef = doc(db, "readRewardClaims", claimId);
    const claimDoc = await getDoc(claimRef);

    return claimDoc.exists() && claimDoc.data()?.claimed === true;
  } catch (error) {
    console.error("Error checking reward claim status:", error);
    return false;
  }
};

/**
 * Track reading time for a chapter
 * @param userId - ID of the user
 * @param storyId - ID of the story
 * @param chapterId - ID of the chapter
 * @param readTime - Time spent reading in seconds
 * @returns Promise that resolves when the reading time is recorded
 */
export const trackReadingTime = async (
  userId: string,
  storyId: string,
  chapterId: string,
  readTime: number
): Promise<void> => {
  if (!userId || !storyId || !chapterId) return;

  try {
    // Check if user is the creator of the story
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);

    if (storySnap.exists() && storySnap.data().creatorId === userId) {
      // Creator can't earn rewards for their own story
      return;
    }
  } catch (error) {
    console.error("Error checking creator status:", error);
  }

  try {
    // Create a unique ID for this reading session
    const readingId = `${userId}_${chapterId}`;
    const readingRef = doc(db, "readRewardClaims", readingId);

    // Check if there's an existing record
    const docSnap = await getDoc(readingRef);

    if (docSnap.exists()) {
      // If already claimed, don't update
      if (docSnap.data()?.claimed) return;

      // Otherwise update the read time if current is greater
      const existingReadTime = docSnap.data()?.readTime || 0;
      if (readTime <= existingReadTime) return;
    }

    // Calculate reward amount - for simulation purposes
    // In a real implementation, this would be based on chapter length or other factors
    const rewardAmount = 5; // Default 5 PLOT tokens

    await setDoc(
      readingRef,
      {
        userId,
        storyId,
        chapterId,
        readTime,
        rewardAmount,
        claimed: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error tracking reading time:", error);
  }
};

/**
 * Simulate claiming a reward for a chapter - this would normally interact with the backend
 * @param userId - ID of the user
 * @param storyId - ID of the story
 * @param chapterId - ID of the chapter
 * @returns Promise that resolves to the signature, reward amount, and expiry timestamp
 */
export const claimReadReward = async (
  userId: string,
  storyId: string,
  chapterId: string
): Promise<{
  success: boolean;
  signature?: string;
  rewardAmount?: number;
  expiryTimestamp?: number;
  error?: string;
}> => {
  if (!userId || !storyId || !chapterId) {
    return { success: false, error: "Missing required parameters" };
  }

  try {
    // Check if user is the creator of the story
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);

    if (storySnap.exists() && storySnap.data().creatorId === userId) {
      // Creator can't earn rewards for their own story
      return {
        success: false,
        error: "Creators cannot earn rewards for their own stories",
      };
    }
  } catch (error) {
    console.error("Error checking creator status:", error);
  }

  try {
    // Create a unique ID for this claim
    const claimId = `${userId}_${chapterId}`;
    const claimRef = doc(db, "readRewardClaims", claimId);

    // Check if the claim exists and if the user has read enough
    const claimDoc = await getDoc(claimRef);

    if (!claimDoc.exists()) {
      return { success: false, error: "No reading record found" };
    }

    const claimData = claimDoc.data() as ReadRewardClaim;

    // Check if already claimed
    if (claimData.claimed) {
      return { success: false, error: "Reward already claimed" };
    }

    // Get the required read time for this chapter
    const requiredReadTime = await getRequiredReadTime(chapterId);

    if (claimData.readTime < requiredReadTime) {
      return {
        success: false,
        error: `You need to read for at least ${Math.round(
          requiredReadTime / 60
        )} minutes to claim a reward`,
      };
    }

    // For simulation, generate a dummy signature and expiry
    // In a real implementation, this would come from the backend
    const signature = `0x${Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("")}`;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Update the claim as claimed
    await setDoc(
      claimRef,
      {
        claimed: true,
        claimedAt: serverTimestamp(),
        signature,
        expiryTimestamp,
      },
      { merge: true }
    );

    return {
      success: true,
      signature,
      rewardAmount: claimData.rewardAmount,
      expiryTimestamp,
    };
  } catch (error) {
    console.error("Error claiming reward:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to claim reward",
    };
  }
};

/**
 * Calculate the required read time based on chapter content
 * @param content - Chapter content text
 * @returns Required read time in seconds
 */
export const calculateReadTime = (content: string): number => {
  if (!content) return 0;

  // Count words
  const wordCount = content
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Average reading speed: 200 words per minute
  const readingTimeMinutes = wordCount / 200;

  // Convert to seconds and add a 15% buffer to account for comprehension
  const readingTimeSeconds = Math.ceil(readingTimeMinutes * 60 * 1.15);

  // Ensure minimum read time is at least 10 seconds (for very short chapters)
  return Math.max(readingTimeSeconds, 10);
};

/**
 * Calculate content complexity factor based on average sentence length
 * Returns a multiplier between 1.0 and 1.5
 * @param content - Chapter content text
 * @returns Complexity factor
 */
export const calculateComplexityFactor = (content: string): number => {
  if (!content) return 1.0;

  // Split content into sentences
  const sentences = content
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0);

  if (sentences.length === 0) return 1.0;

  // Calculate average words per sentence
  const totalWords = sentences.reduce((sum, sentence) => {
    return sum + sentence.split(/\s+/).filter((word) => word.length > 0).length;
  }, 0);

  const avgWordsPerSentence = totalWords / sentences.length;

  // Apply complexity factor:
  // - Less than 10 words per sentence: 1.0 (easy)
  // - 10-15 words per sentence: 1.1-1.2 (moderate)
  // - 15-20 words per sentence: 1.2-1.3 (moderate-hard)
  // - 20+ words per sentence: 1.3-1.5 (difficult)

  if (avgWordsPerSentence < 10) {
    return 1.0;
  } else if (avgWordsPerSentence < 15) {
    return 1.1 + (avgWordsPerSentence - 10) * 0.02;
  } else if (avgWordsPerSentence < 20) {
    return 1.2 + (avgWordsPerSentence - 15) * 0.02;
  } else {
    return Math.min(1.3 + (avgWordsPerSentence - 20) * 0.01, 1.5);
  }
};

/**
 * Get the required read time for a chapter
 * @param chapterId - ID of the chapter
 * @returns Promise that resolves to the required read time in seconds
 */
export const getRequiredReadTime = async (
  chapterId: string
): Promise<number> => {
  if (!chapterId) return 0;

  try {
    // Get the chapter content
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterDoc = await getDoc(chapterRef);

    if (!chapterDoc.exists()) {
      console.error("Chapter not found");
      return 10; // Default fallback
    }

    const chapterData = chapterDoc.data();
    const content = chapterData.content || "";

    // Calculate base reading time
    const baseReadTime = calculateReadTime(content);

    // Apply complexity factor
    const complexityFactor = calculateComplexityFactor(content);

    // Calculate final read time
    const finalReadTime = Math.ceil(baseReadTime * complexityFactor);

    console.log(
      `Chapter ${chapterId} read time: ${finalReadTime} seconds (${Math.round(
        finalReadTime / 60
      )} minutes)`
    );

    return finalReadTime;
  } catch (error) {
    console.error("Error getting required read time:", error);
    return 10; // Default fallback
  }
};

/**
 * Get user's total PLOT token balance
 * @param userId - ID of the user
 * @returns Promise that resolves to the user's token balance
 */
export const getUserTokenBalance = async (userId: string): Promise<number> => {
  if (!userId) return 0;

  try {
    // In a real implementation, this would query the blockchain or a backend service
    // For simulation, we'll calculate based on claimed rewards
    const claimsRef = collection(db, "readRewardClaims");
    const userClaimsQuery = query(
      claimsRef,
      where("userId", "==", userId),
      where("claimed", "==", true)
    );

    const querySnapshot = await getDocs(userClaimsQuery);

    let totalBalance = 0;
    querySnapshot.forEach((doc) => {
      totalBalance += doc.data().rewardAmount || 0;
    });

    return totalBalance;
  } catch (error) {
    console.error("Error getting user token balance:", error);
    return 0;
  }
};
