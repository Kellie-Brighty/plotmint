import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  QueryConstraint,
  limit as limitQuery,
  limit,
} from "firebase/firestore";
import { ZoraService } from "./zoraService";
import type { PlotOption } from "./zora";
import type { WalletClient, PublicClient, Address } from "viem";

// Types for our story and chapter data
export interface StoryData {
  id?: string;
  title: string;
  genre: string;
  tags: string[];
  description: string;
  coverImage: string;
  creatorId: string;
  creatorEmail?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  published: boolean;
  chapterCount: number;
  viewCount: number;
  collectCount: number;
  readerCount: number;
}

export interface ChapterData {
  id?: string;
  storyId: string;
  title: string;
  content: string;
  creatorId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  published: boolean;
  hasChoicePoint: boolean;
  choiceOptions?: string[];
  plotTokens?: Array<{
    name: string;
    symbol: string;
    tokenAddress: Address;
    metadataURI: string;
  }>;
  plotOptions?: Array<{
    name: string;
    symbol: string;
    tokenAddress: Address;
    metadataURI: string;
    isWinning?: boolean;
  }>;
  voteEndTime?: Timestamp;
  order: number;
  nftContractAddress?: string;
}

export interface PlotVote {
  id?: string;
  storyId: string;
  chapterId: string;
  choiceOptionIndex: number;
  userId: string;
  createdAt?: Timestamp;
}

/**
 * Interface for chapter collection data
 */
export interface ChapterCollection {
  id?: string;
  storyId: string;
  chapterId: string;
  userId: string;
  createdAt?: Timestamp;
}

// New interfaces for callbacks and filters
export interface StoriesFilter {
  genre?: string;
  tags?: string[];
  published?: boolean;
  creatorId?: string;
  limit?: number;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "collectCount"
    | "viewCount"
    | "chapterCount";
  sortDirection?: "asc" | "desc";
}

export type StoriesCallback = (stories: StoryData[]) => void;
export type StoryCallback = (story: StoryData | null) => void;
export type ChaptersCallback = (chapters: ChapterData[]) => void;

/**
 * Interface for analytics data
 */
export interface StoryAnalytics {
  id: string;
  title: string;
  reads: number;
  collections: number;
  votes: number;
  revenue: number;
}

export interface AnalyticsSummary {
  totalReaders: number;
  totalCollectors: number;
  totalVotes: number;
  totalRevenue: number;
  readerGrowth: number;
  collectorGrowth: number;
  storyPerformance: StoryAnalytics[];
}

/**
 * Interface for reader's collection data
 */
export interface ReaderCollection {
  id?: string;
  storyId: string;
  storyTitle: string;
  coverImage: string;
  totalChapters: number;
  collectedChapters: number;
  author: string;
  chapterIds: string[];
}

/**
 * Interface for reader's reading history
 */
export interface ReadingHistory {
  id?: string;
  storyId: string;
  storyTitle: string;
  chapterId: string;
  chapterTitle: string;
  coverImage: string;
  readAt: string;
  progress: number;
}

/**
 * Interface for reader's voting history
 */
export interface VotingHistory {
  id?: string;
  storyId: string;
  storyTitle: string;
  chapterId: string;
  chapterTitle: string;
  coverImage: string;
  choice: string;
  votedAt: string;
  totalVotes: number;
  choiceVotes: number;
}

/**
 * Interface for reader notifications
 */
export interface ReaderNotification {
  id?: string;
  type:
    | "chapter_published"
    | "vote_results"
    | "collect_success"
    | "author_update";
  storyId: string;
  storyTitle: string;
  chapterId?: string;
  chapterTitle?: string;
  result?: string;
  authorName?: string;
  message?: string;
  timestamp: string;
  read: boolean;
}

/**
 * Create a new story
 * @param storyData - Story data without id, createdAt, updatedAt
 * @param userId - ID of the user creating the story
 * @param userEmail - Email of the user creating the story
 * @returns Promise with the new story ID
 */
export const createStory = async (
  storyData: Omit<
    StoryData,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "creatorId"
    | "creatorEmail"
    | "published"
    | "chapterCount"
    | "viewCount"
    | "collectCount"
  >,
  userId: string,
  userEmail: string
): Promise<string> => {
  try {
    const storiesRef = collection(db, "stories");

    const newStory: Omit<StoryData, "id"> = {
      ...storyData,
      creatorId: userId,
      creatorEmail: userEmail,
      published: false,
      chapterCount: 0,
      viewCount: 0,
      collectCount: 0,
      readerCount: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(storiesRef, newStory);
    return docRef.id;
  } catch (error) {
    console.error("Error creating story:", error);
    throw error;
  }
};

/**
 * Create a new chapter for a story
 * @param chapterData - Chapter data without id, createdAt, updatedAt
 * @param userId - ID of the user creating the chapter
 * @returns Promise with the new chapter ID
 */
export const createChapter = async (
  chapterData: Omit<
    ChapterData,
    "id" | "createdAt" | "updatedAt" | "creatorId" | "order"
  > & { published?: boolean },
  userId: string
): Promise<string> => {
  try {
    const chaptersRef = collection(db, "chapters");

    // Get current chapter count for this story
    const storyRef = doc(db, "stories", chapterData.storyId);
    const storyDoc = await getDoc(storyRef);

    if (!storyDoc.exists()) {
      throw new Error("Story not found");
    }

    const storyData = storyDoc.data() as StoryData;
    const chapterOrder = storyData.chapterCount;

    // Determine if this is the first published chapter
    // const isFirstChapter = chapterOrder === 0;

    const newChapter: Omit<ChapterData, "id"> = {
      ...chapterData,
      creatorId: userId,
      published:
        chapterData.published !== undefined ? chapterData.published : true, // Allow explicitly setting published status
      order: chapterOrder,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(chaptersRef, newChapter);

    // Update the story with new chapter count and published status
    // If this chapter is published, ensure the story is also marked as published
    const updateData: any = {
      chapterCount: chapterOrder + 1,
      updatedAt: serverTimestamp(),
    };

    // If this chapter is published, mark the story as published too
    if (newChapter.published) {
      updateData.published = true;
      console.log(
        `📖 Marking story "${storyData.title}" as published due to chapter creation`
      );
    }

    await updateDoc(storyRef, updateData);

    return docRef.id;
  } catch (error) {
    console.error("Error creating chapter:", error);
    throw error;
  }
};

/**
 * Generate metadata URI for a plot option token
 * @param plotName - Name of the plot option
 * @param plotSymbol - Symbol for the token
 * @param storyTitle - Title of the story
 * @param chapterTitle - Title of the chapter
 * @returns JSON metadata object that can be uploaded to IPFS
 */
export const generatePlotTokenMetadata = (
  plotName: string,
  plotSymbol: string,
  storyTitle: string,
  chapterTitle: string
) => {
  return {
    name: `${storyTitle} - ${plotName}`,
    description: `Vote token for plot option "${plotName}" in chapter "${chapterTitle}" of "${storyTitle}". This token represents your vote for this story direction.`,
    image: `https://via.placeholder.com/400x400/1f2937/ffffff?text=${encodeURIComponent(
      plotSymbol
    )}`,
    external_url: window.location.origin,
    attributes: [
      {
        trait_type: "Story",
        value: storyTitle,
      },
      {
        trait_type: "Chapter",
        value: chapterTitle,
      },
      {
        trait_type: "Plot Option",
        value: plotName,
      },
      {
        trait_type: "Token Symbol",
        value: plotSymbol,
      },
      {
        trait_type: "Type",
        value: "Plot Vote Token",
      },
    ],
  };
};

/**
 * Create plot options from choice options with auto-generated symbols and metadata
 * @param choiceOptions - Array of choice option strings
 * @param storyTitle - Title of the story
 * @param chapterTitle - Title of the chapter
 * @returns Array of PlotOption objects ready for token creation
 */
export const createPlotOptionsFromChoices = async (
  choiceOptions: string[],
  storyTitle: string,
  chapterTitle: string
): Promise<PlotOption[]> => {
  if (choiceOptions.length !== 2) {
    throw new Error("Exactly two choice options are required");
  }

  const plotOptions: PlotOption[] = [];

  for (let i = 0; i < choiceOptions.length; i++) {
    const choiceText = choiceOptions[i];
    const shortName =
      choiceText.substring(0, 30) + (choiceText.length > 30 ? "..." : "");
    const symbol = `PLOT${i + 1}${Date.now().toString().slice(-4)}`; // e.g., PLOT11234

    // Generate metadata
    const metadata = generatePlotTokenMetadata(
      shortName,
      symbol,
      storyTitle,
      chapterTitle
    );

    // For now, we'll use a data URI for metadata
    // In production, you'd want to upload to IPFS
    const metadataURI = `data:application/json;base64,${btoa(
      JSON.stringify(metadata)
    )}`;

    plotOptions.push({
      name: shortName,
      symbol,
      metadataURI,
    });
  }

  return plotOptions;
};

/**
 * Create a new chapter with Zora token integration for plot options
 * @param chapterData - Chapter data without id, createdAt, updatedAt, creatorId, order
 * @param userId - ID of the user creating the chapter
 * @param plotOptions - Plot options for token creation (optional)
 * @param walletClient - Wallet client for Zora transactions (required if plotOptions provided)
 * @param publicClient - Public client for Zora transactions (required if plotOptions provided)
 * @param nftContractAddress - NFT contract address for token creation (optional)
 * @returns Promise with the new chapter ID
 */
export const createChapterWithTokens = async (
  chapterData: Omit<
    ChapterData,
    "id" | "createdAt" | "updatedAt" | "creatorId" | "order" | "plotTokens"
  > & { published?: boolean },
  userId: string,
  plotOptions?: PlotOption[],
  walletClient?: WalletClient,
  publicClient?: PublicClient,
  nftContractAddress?: string
): Promise<string> => {
  const chaptersRef = collection(db, "chapters");

  try {
    // Get the next order number for this story
    const existingChaptersQuery = query(
      chaptersRef,
      where("storyId", "==", chapterData.storyId),
      orderBy("order", "desc"),
      limit(1)
    );

    const existingChaptersSnapshot = await getDocs(existingChaptersQuery);
    const nextOrder = existingChaptersSnapshot.empty
      ? 1
      : (existingChaptersSnapshot.docs[0].data().order || 0) + 1;

    let plotTokens: Array<{
      name: string;
      symbol: string;
      tokenAddress: Address;
      metadataURI: string;
    }> = [];

    // Handle plot token creation if plot options are provided
    if (plotOptions && plotOptions.length > 0) {
      if (!walletClient || !publicClient) {
        throw new Error(
          "Wallet and public clients are required for token creation"
        );
      }

      if (plotOptions.length !== 2) {
        throw new Error(
          "Exactly two plot options are required for token creation"
        );
      }

      // Initialize Zora service
      const zoraService = new ZoraService();

      // Create a temporary chapter ID for token creation
      const tempChapterRef = doc(chaptersRef);
      const tempChapterId = tempChapterRef.id;

      try {
        // Register plot options as tokens
        await zoraService.registerPlotOptions(
          tempChapterId,
          plotOptions,
          walletClient,
          publicClient
        );

        // Get the created tokens information
        const voteStats = await zoraService.getPlotVoteStats(tempChapterId);

        // Convert to plotTokens format
        plotTokens = plotOptions.map((option) => {
          const tokenInfo = voteStats[option.symbol];
          return {
            name: option.name,
            symbol: option.symbol,
            tokenAddress: tokenInfo.tokenAddress,
            metadataURI: option.metadataURI,
          };
        });

        console.log(`✅ Created ${plotTokens.length} plot tokens for chapter`);
      } catch (tokenError) {
        console.error("Error creating plot tokens:", tokenError);
        throw new Error(
          `Failed to create plot tokens: ${
            tokenError instanceof Error ? tokenError.message : "Unknown error"
          }`
        );
      }
    }

    // Create the chapter document with all data
    const newChapter: Omit<ChapterData, "id"> = {
      ...chapterData,
      creatorId: userId,
      order: nextOrder,
      plotTokens,
      ...(nftContractAddress && { nftContractAddress }), // Only include if defined
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Add the chapter to Firestore
    const docRef = await addDoc(chaptersRef, newChapter);

    console.log(`✅ Chapter created with ID: ${docRef.id}`);

    // Update the story's chapter count and last updated time
    const storyRef = doc(db, "stories", chapterData.storyId);
    const storySnap = await getDoc(storyRef);

    if (storySnap.exists()) {
      const storyData = storySnap.data() as StoryData;

      // Prepare update data
      const updateData: any = {
        chapterCount: (storyData.chapterCount || 0) + 1,
        updatedAt: serverTimestamp(),
      };

      // If this chapter is published, mark the story as published too
      if (newChapter.published) {
        updateData.published = true;
        console.log(
          `📖 Marking story "${storyData.title}" as published due to chapter with tokens creation`
        );
      }

      await updateDoc(storyRef, updateData);
    }

    return docRef.id;
  } catch (error) {
    console.error("Error creating chapter:", error);
    throw error;
  }
};

/**
 * Get a story by ID
 * @param storyId - ID of the story to retrieve
 * @returns Promise with the story data
 */
export const getStoryById = async (
  storyId: string
): Promise<StoryData | null> => {
  try {
    const storyRef = doc(db, "stories", storyId);
    const storyDoc = await getDoc(storyRef);

    if (!storyDoc.exists()) {
      return null;
    }

    return { id: storyDoc.id, ...storyDoc.data() } as StoryData;
  } catch (error) {
    console.error("Error getting story:", error);
    throw error;
  }
};

/**
 * Get chapters for a story
 * @param storyId - ID of the story to get chapters for
 * @returns Promise with an array of chapter data
 */
export const getChaptersByStoryId = async (
  storyId: string
): Promise<ChapterData[]> => {
  try {
    const chaptersRef = collection(db, "chapters");
    const chaptersQuery = query(
      chaptersRef,
      where("storyId", "==", storyId),
      where("published", "==", true),
      orderBy("order", "asc")
    );

    const querySnapshot = await getDocs(chaptersQuery);
    const chapters: ChapterData[] = [];

    querySnapshot.forEach((doc) => {
      chapters.push({ id: doc.id, ...doc.data() } as ChapterData);
    });

    return chapters;
  } catch (error) {
    console.error("Error getting chapters:", error);
    throw error;
  }
};

/**
 * Get a specific chapter by ID
 * @param chapterId - ID of the chapter to retrieve
 * @returns Promise with the chapter data
 */
export const getChapterById = async (
  chapterId: string
): Promise<ChapterData | null> => {
  try {
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterDoc = await getDoc(chapterRef);

    if (!chapterDoc.exists()) {
      return null;
    }

    return { id: chapterDoc.id, ...chapterDoc.data() } as ChapterData;
  } catch (error) {
    console.error("Error getting chapter:", error);
    throw error;
  }
};

/**
 * Record a vote for a plot choice
 * @param vote - Vote data without id, createdAt
 * @returns Promise with the vote ID
 */
export const voteForPlotChoice = async (
  vote: Omit<PlotVote, "id" | "createdAt">
): Promise<string> => {
  try {
    // Check if user already voted for this chapter
    const votesRef = collection(db, "plotVotes");
    const votesQuery = query(
      votesRef,
      where("chapterId", "==", vote.chapterId),
      where("userId", "==", vote.userId)
    );

    const querySnapshot = await getDocs(votesQuery);

    if (!querySnapshot.empty) {
      // User already voted, update their vote
      const existingVoteDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "plotVotes", existingVoteDoc.id), {
        choiceOptionIndex: vote.choiceOptionIndex,
        updatedAt: serverTimestamp(),
      });

      return existingVoteDoc.id;
    }

    // New vote
    const newVote: Omit<PlotVote, "id"> = {
      ...vote,
      createdAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(votesRef, newVote);
    return docRef.id;
  } catch (error) {
    console.error("Error voting for plot choice:", error);
    throw error;
  }
};

/**
 * Get all stories that have at least one chapter
 * @param limit - Optional limit on number of stories to return
 * @returns Promise with an array of story data
 */
export const getAllStories = async (limit?: number): Promise<StoryData[]> => {
  try {
    const storiesRef = collection(db, "stories");

    // First, let's get all published stories and log them
    console.log("🔍 Fetching all published stories for discovery...");

    // Simplified query - remove compound orderBy that might be causing issues
    let storiesQuery = query(
      storiesRef,
      where("published", "==", true), // Only get published stories
      where("chapterCount", ">", 0), // Only get stories with at least one chapter
      orderBy("chapterCount", "desc") // Order by chapter count only
    );

    if (limit) {
      storiesQuery = query(storiesQuery, limitQuery(limit));
    }

    console.log(
      "🔧 Executing query with filters: published=true, chapterCount>0"
    );

    const querySnapshot = await getDocs(storiesQuery);
    const stories: StoryData[] = [];

    console.log(`📊 Query returned ${querySnapshot.docs.length} documents`);

    querySnapshot.forEach((doc) => {
      const storyData = { id: doc.id, ...doc.data() } as StoryData;
      console.log("📖 Found published story:", {
        id: storyData.id,
        title: storyData.title,
        published: storyData.published,
        chapterCount: storyData.chapterCount,
        createdAt: storyData.createdAt,
      });
      stories.push(storyData);
    });

    console.log(`✅ Total stories found for discovery: ${stories.length}`);

    // If no stories found, let's debug what's in the database
    if (stories.length === 0) {
      console.log(
        "⚠️ No stories found! Let's check what's actually in the database..."
      );

      // Check all stories regardless of filters
      const debugQuery = query(storiesRef, orderBy("createdAt", "desc"));
      const debugSnapshot = await getDocs(debugQuery);

      console.log(
        `🔍 DEBUG: Total stories in database: ${debugSnapshot.docs.length}`
      );

      debugSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log("📋 Story in DB:", {
          id: doc.id,
          title: data.title,
          published: data.published,
          publishedType: typeof data.published,
          chapterCount: data.chapterCount,
          chapterCountType: typeof data.chapterCount,
          meetsRequirements:
            data.published === true && data.chapterCount > 0 ? "✅" : "❌",
          issues: [
            data.published !== true ? "Not published" : null,
            !(data.chapterCount > 0)
              ? `Chapter count issue: ${data.chapterCount}`
              : null,
          ].filter(Boolean),
        });
      });
    }

    return stories;
  } catch (error) {
    console.error("❌ Error getting stories:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // If the compound query fails, try a simpler approach
    console.log("🔄 Trying fallback query...");
    try {
      const storiesRef = collection(db, "stories");
      const fallbackQuery = query(
        storiesRef,
        where("published", "==", true),
        orderBy("createdAt", "desc")
      );

      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackStories: StoryData[] = [];

      fallbackSnapshot.forEach((doc) => {
        const storyData = { id: doc.id, ...doc.data() } as StoryData;
        // Filter client-side for chapterCount > 0
        if (storyData.chapterCount > 0) {
          fallbackStories.push(storyData);
        }
      });

      console.log(`✅ Fallback query found ${fallbackStories.length} stories`);
      return fallbackStories;
    } catch (fallbackError) {
      console.error("❌ Fallback query also failed:", fallbackError);
      throw error;
    }
  }
};

/**
 * Get stories created by a specific user
 * @param userId - ID of the user to get stories for
 * @returns Promise with an array of story data
 */
export const getStoriesByCreator = async (
  userId: string
): Promise<StoryData[]> => {
  try {
    const storiesRef = collection(db, "stories");
    const storiesQuery = query(
      storiesRef,
      where("creatorId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(storiesQuery);
    const stories: StoryData[] = [];

    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() } as StoryData);
    });

    return stories;
  } catch (error) {
    console.error("Error getting creator stories:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for all stories
 * @param callback - Function to call when stories change
 * @param filter - Optional filter criteria
 * @returns Unsubscribe function
 */
export const subscribeToStories = (
  callback: StoriesCallback,
  filter?: StoriesFilter
): (() => void) => {
  const storiesRef = collection(db, "stories");

  // Build query constraints based on filter
  const constraints: QueryConstraint[] = [];

  // Always include published=true by default unless explicitly specified
  if (filter?.published !== undefined) {
    constraints.push(where("published", "==", filter.published));
    console.log("🔍 subscribeToStories: published filter =", filter.published);
  } else {
    constraints.push(where("published", "==", true));
    console.log("🔍 subscribeToStories: default published filter = true");
  }

  // Add all other filters
  if (filter?.genre) {
    constraints.push(where("genre", "==", filter.genre));
    console.log("🔍 subscribeToStories: genre filter =", filter.genre);
  }

  if (filter?.creatorId) {
    constraints.push(where("creatorId", "==", filter.creatorId));
    console.log("🔍 subscribeToStories: creatorId filter =", filter.creatorId);
  }

  // Handle sorting
  const sortField = filter?.sortBy || "createdAt";
  const sortDir = filter?.sortDirection || "desc";
  constraints.push(orderBy(sortField, sortDir));
  console.log("🔍 subscribeToStories: sorting by", sortField, sortDir);

  // If tags are specified, we'll need to filter them after getting results
  // as Firestore doesn't support direct array contains any with other queries

  // Add limit if specified
  if (filter?.limit) {
    constraints.push(limitQuery(filter.limit));
    console.log("🔍 subscribeToStories: limit =", filter.limit);
  }

  console.log(
    "🔍 subscribeToStories: Final query constraints:",
    constraints.length
  );

  // Create and execute query
  const q = query(storiesRef, ...constraints);

  // Subscribe to real-time updates
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log(
        `📊 subscribeToStories: Query returned ${snapshot.docs.length} documents`
      );

      const stories: StoryData[] = [];

      snapshot.forEach((doc) => {
        const storyData = { id: doc.id, ...doc.data() } as StoryData;

        console.log("📖 subscribeToStories: Found story:", {
          id: storyData.id,
          title: storyData.title,
          published: storyData.published,
          chapterCount: storyData.chapterCount,
          genre: storyData.genre,
          creatorId: storyData.creatorId,
        });

        // Filter by tags if specified
        if (filter?.tags && filter.tags.length > 0) {
          const hasMatchingTag = storyData.tags.some((tag) =>
            filter.tags?.includes(tag)
          );
          if (hasMatchingTag) {
            console.log("✅ Story matches tag filter");
            stories.push(storyData);
          } else {
            console.log("❌ Story doesn't match tag filter");
          }
        } else {
          console.log("✅ No tag filter, including story");
          stories.push(storyData);
        }
      });

      console.log(
        `🎯 subscribeToStories: Final filtered stories count: ${stories.length}`
      );
      callback(stories);
    },
    (error) => {
      console.error("❌ Error subscribing to stories:", error);
      console.error("❌ Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      callback([]);
    }
  );

  return unsubscribe;
};

/**
 * Subscribe to real-time updates for a specific story
 * @param storyId - ID of the story to listen to
 * @param callback - Function to call when the story changes
 * @returns Unsubscribe function
 */
export const subscribeToStory = (
  storyId: string,
  callback: StoryCallback
): (() => void) => {
  const storyRef = doc(db, "stories", storyId);

  const unsubscribe = onSnapshot(
    storyRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Ensure readerCount has a default value if missing
        if (typeof data.readerCount !== "number" || isNaN(data.readerCount)) {
          data.readerCount = 0;
          // Fix the NaN value in the database
          updateDoc(storyRef, { readerCount: 0 }).catch((err) =>
            console.error("Error fixing readerCount:", err)
          );
        }
        const storyData = { id: doc.id, ...data } as StoryData;
        callback(storyData);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error subscribing to story:", error);
      callback(null);
    }
  );

  return unsubscribe;
};

/**
 * Subscribe to real-time updates for stories by a specific creator
 * @param creatorId - ID of the creator
 * @param callback - Function to call when stories change
 * @param includeUnpublished - Whether to include unpublished stories
 * @returns Unsubscribe function
 */
export const subscribeToCreatorStories = (
  creatorId: string,
  callback: StoriesCallback,
  includeUnpublished: boolean = true
): (() => void) => {
  return subscribeToStories(callback, {
    creatorId,
    published: includeUnpublished ? undefined : true,
    sortBy: "updatedAt",
    sortDirection: "desc",
  });
};

/**
 * Subscribe to real-time updates for a story's chapters
 * @param storyId - ID of the story to get chapters for
 * @param callback - Function to call when chapters change
 * @param publishedOnly - Whether to include only published chapters
 * @returns Unsubscribe function
 */
export const subscribeToChapters = (
  storyId: string,
  callback: ChaptersCallback,
  publishedOnly: boolean = true
): (() => void) => {
  const chaptersRef = collection(db, "chapters");

  const constraints: QueryConstraint[] = [
    where("storyId", "==", storyId),
    orderBy("order", "asc"),
  ];

  if (publishedOnly) {
    constraints.push(where("published", "==", true));
  }

  const q = query(chaptersRef, ...constraints);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const chapters: ChapterData[] = [];

      snapshot.forEach((doc) => {
        chapters.push({ id: doc.id, ...doc.data() } as ChapterData);
      });

      callback(chapters);
    },
    (error) => {
      console.error("Error subscribing to chapters:", error);
      callback([]);
    }
  );

  return unsubscribe;
};

/**
 * Record a view for a story
 * @param storyId - ID of the story being viewed
 * @param userId - ID of the current user
 * @returns Promise that resolves when the view is recorded
 */
export const recordStoryView = async (
  storyId: string,
  userId: string | null
): Promise<void> => {
  try {
    // Get the story to check creator
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      console.error("Story not found");
      return;
    }

    const storyData = storySnap.data() as StoryData;

    // Don't count views from the creator
    if (userId && userId === storyData.creatorId) {
      return;
    }

    // Create a view record in the storyViews collection
    // const viewsRef = collection(db, "storyViews");
    const viewId = `${storyId}_${userId || "anonymous"}_${Date.now()}`;

    await setDoc(doc(db, "storyViews", viewId), {
      storyId,
      userId: userId || "anonymous",
      timestamp: serverTimestamp(),
    });

    // Increment the view count on the story document
    await updateDoc(storyRef, {
      viewCount: storyData.viewCount + 1,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error recording story view:", error);
  }
};

/**
 * Track a reader for a story (unique readers)
 * @param storyId - ID of the story being read
 * @param userId - ID of the current user
 * @returns Promise that resolves when the reader is tracked
 */
export const trackStoryReader = async (
  storyId: string,
  userId: string | null
): Promise<void> => {
  // Don't track anonymous users as readers
  if (!userId) return;

  try {
    // Get the story to check creator
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      console.error("Story not found");
      return;
    }

    const storyData = storySnap.data() as StoryData;

    // Don't count the creator as a reader
    if (userId === storyData.creatorId) {
      return;
    }

    // Check if this user has already been recorded as a reader
    const readersRef = collection(db, "storyReaders");
    const readerQuery = query(
      readersRef,
      where("storyId", "==", storyId),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(readerQuery);

    // If the user hasn't been recorded as a reader yet, add them
    if (querySnapshot.empty) {
      const readerId = `${storyId}_${userId}`;

      await setDoc(doc(db, "storyReaders", readerId), {
        storyId,
        userId,
        firstReadAt: serverTimestamp(),
        lastReadAt: serverTimestamp(),
      });

      // Ensure readerCount exists and is a number
      const readerCount =
        typeof storyData.readerCount === "number" &&
        !isNaN(storyData.readerCount)
          ? storyData.readerCount
          : 0;

      // Increment the reader count on the story document
      await updateDoc(storyRef, {
        readerCount: readerCount + 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Update the lastReadAt timestamp for existing readers
      const readerDoc = querySnapshot.docs[0];
      await updateDoc(readerDoc.ref, {
        lastReadAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error tracking story reader:", error);
  }
};

/**
 * Get the count of unique readers for a story
 * @param storyId - ID of the story
 * @returns Promise with the reader count
 */
export const getStoryReaderCount = async (storyId: string): Promise<number> => {
  try {
    const readersRef = collection(db, "storyReaders");
    const readerQuery = query(readersRef, where("storyId", "==", storyId));

    const querySnapshot = await getDocs(readerQuery);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting story reader count:", error);
    return 0;
  }
};

/**
 * Subscribe to real-time reader count for a story
 * @param storyId - ID of the story
 * @param callback - Function to call when reader count changes
 * @returns Unsubscribe function
 */
export const subscribeToStoryReaderCount = (
  storyId: string,
  callback: (count: number) => void
): (() => void) => {
  try {
    const readersRef = collection(db, "storyReaders");
    const readerQuery = query(readersRef, where("storyId", "==", storyId));

    const unsubscribe = onSnapshot(readerQuery, (querySnapshot) => {
      callback(querySnapshot.size);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to story reader count:", error);
    return () => {};
  }
};

/**
 * Ensure the story has proper numeric fields (fix for NaN issues)
 * @param storyId - ID of the story to fix
 */
export const ensureStoryNumericFields = async (
  storyId: string
): Promise<void> => {
  try {
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      return;
    }

    const data = storySnap.data();
    const updates: { [key: string]: any } = {};

    // Check all numeric fields and ensure they're numbers
    if (typeof data.viewCount !== "number" || isNaN(data.viewCount)) {
      updates.viewCount = 0;
    }

    if (typeof data.readerCount !== "number" || isNaN(data.readerCount)) {
      updates.readerCount = 0;
    }

    if (typeof data.collectCount !== "number" || isNaN(data.collectCount)) {
      updates.collectCount = 0;
    }

    if (typeof data.chapterCount !== "number" || isNaN(data.chapterCount)) {
      // Count chapters to get the real value
      const chaptersRef = collection(db, "chapters");
      const chaptersQuery = query(chaptersRef, where("storyId", "==", storyId));
      const chaptersSnap = await getDocs(chaptersQuery);
      updates.chapterCount = chaptersSnap.size;
    }

    // Only update if there are fields to fix
    if (Object.keys(updates).length > 0) {
      await updateDoc(storyRef, updates);
    }
  } catch (error) {
    console.error("Error ensuring story numeric fields:", error);
  }
};

/**
 * Fix all stories in the database that have NaN values in numeric fields
 * This is a one-time fix that can be run manually from the console
 * @returns Promise that resolves when all stories are fixed
 */
export const fixAllStoriesNumericFields = async (): Promise<void> => {
  try {
    const storiesRef = collection(db, "stories");
    const storiesSnapshot = await getDocs(storiesRef);

    const fixPromises = storiesSnapshot.docs.map((doc) => {
      const storyId = doc.id;
      return ensureStoryNumericFields(storyId);
    });

    await Promise.all(fixPromises);
    console.log(`Fixed ${fixPromises.length} stories`);
  } catch (error) {
    console.error("Error fixing all stories:", error);
  }
};

/**
 * Collect a chapter for a user
 * @param storyId - ID of the story
 * @param chapterId - ID of the chapter to collect
 * @param userId - ID of the user collecting the chapter
 * @returns Promise with the collection ID
 */
export const collectChapter = async (
  storyId: string,
  chapterId: string,
  userId: string
): Promise<string> => {
  try {
    // First check if user is the creator of the story
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      throw new Error("Story not found");
    }

    const storyData = storySnap.data() as StoryData;

    // Don't allow creators to collect their own chapters
    if (userId === storyData.creatorId) {
      throw new Error("You cannot collect chapters from your own story");
    }

    // Check if the user has already collected this chapter
    const collectionsRef = collection(db, "chapterCollections");
    const collectionsQuery = query(
      collectionsRef,
      where("storyId", "==", storyId),
      where("chapterId", "==", chapterId),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(collectionsQuery);

    // If already collected, return the existing collection ID
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }

    // Create a new collection record
    const newCollection: Omit<ChapterCollection, "id"> = {
      storyId,
      chapterId,
      userId,
      createdAt: serverTimestamp() as Timestamp,
    };

    // Add the collection to Firestore
    const docRef = await addDoc(collectionsRef, newCollection);

    // Increment the collectCount on the story document
    await updateDoc(storyRef, {
      collectCount: storyData.collectCount + 1,
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error collecting chapter:", error);
    throw error;
  }
};

/**
 * Check if a user has collected a specific chapter
 * @param storyId - ID of the story
 * @param chapterId - ID of the chapter
 * @param userId - ID of the user
 * @returns Promise with boolean indicating if collected
 */
export const hasUserCollectedChapter = async (
  storyId: string,
  chapterId: string,
  userId: string
): Promise<boolean> => {
  try {
    // If no user ID, they definitely haven't collected it
    if (!userId) return false;

    const collectionsRef = collection(db, "chapterCollections");
    const collectionsQuery = query(
      collectionsRef,
      where("storyId", "==", storyId),
      where("chapterId", "==", chapterId),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(collectionsQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking if chapter is collected:", error);
    return false;
  }
};

/**
 * Check if a user has already voted on a chapter
 * @param chapterId - ID of the chapter
 * @param userId - ID of the user
 * @returns Promise with the selected option index if voted, null otherwise
 */
export const hasUserVotedOnChapter = async (
  chapterId: string,
  userId: string
): Promise<number | null> => {
  try {
    // If no user ID, they definitely haven't voted
    if (!userId) return null;

    const votesRef = collection(db, "plotVotes");
    const votesQuery = query(
      votesRef,
      where("chapterId", "==", chapterId),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(votesQuery);

    if (querySnapshot.empty) {
      return null;
    }

    const voteData = querySnapshot.docs[0].data();
    return voteData.choiceOptionIndex;
  } catch (error) {
    console.error("Error checking if user voted:", error);
    return null;
  }
};

/**
 * Get vote counts for each option in a chapter
 * @param chapterId - ID of the chapter
 * @returns Promise with an array of vote counts for each option
 */
export const getChapterVoteCounts = async (
  chapterId: string
): Promise<{
  counts: number[];
  total: number;
  percentages: number[];
}> => {
  try {
    const votesRef = collection(db, "plotVotes");
    const votesQuery = query(votesRef, where("chapterId", "==", chapterId));

    const querySnapshot = await getDocs(votesQuery);

    // Initialize results object
    const result = {
      counts: [] as number[],
      total: querySnapshot.size,
      percentages: [] as number[],
    };

    // Count votes for each option
    const voteCounts: Record<number, number> = {};

    querySnapshot.forEach((doc) => {
      const vote = doc.data();
      const optionIndex = vote.choiceOptionIndex;

      if (voteCounts[optionIndex] === undefined) {
        voteCounts[optionIndex] = 1;
      } else {
        voteCounts[optionIndex]++;
      }
    });

    // If no votes yet, return empty arrays
    if (result.total === 0) {
      return result;
    }

    // Find the highest option index to determine array size
    const maxOptionIndex = Math.max(...Object.keys(voteCounts).map(Number));

    // Create arrays with the right size filled with zeros
    result.counts = Array(maxOptionIndex + 1).fill(0);
    result.percentages = Array(maxOptionIndex + 1).fill(0);

    // Fill in the vote counts and calculate percentages
    Object.entries(voteCounts).forEach(([optionIndex, count]) => {
      const index = Number(optionIndex);
      result.counts[index] = count;
      result.percentages[index] = Math.round((count / result.total) * 100);
    });

    return result;
  } catch (error) {
    console.error("Error getting vote counts:", error);
    return {
      counts: [],
      total: 0,
      percentages: [],
    };
  }
};

/**
 * Subscribe to real-time vote counts for a chapter
 * @param chapterId - ID of the chapter
 * @param callback - Function to call when vote counts change
 * @returns Unsubscribe function
 */
export const subscribeToVoteCounts = (
  chapterId: string,
  callback: (data: {
    counts: number[];
    total: number;
    percentages: number[];
  }) => void
): (() => void) => {
  try {
    const votesRef = collection(db, "plotVotes");
    const votesQuery = query(votesRef, where("chapterId", "==", chapterId));

    const unsubscribe = onSnapshot(
      votesQuery,
      (snapshot) => {
        // Count votes for each option
        const voteCounts: Record<number, number> = {};
        const total = snapshot.size;

        snapshot.forEach((doc) => {
          const vote = doc.data();
          const optionIndex = vote.choiceOptionIndex;

          if (voteCounts[optionIndex] === undefined) {
            voteCounts[optionIndex] = 1;
          } else {
            voteCounts[optionIndex]++;
          }
        });

        // Initialize results
        const result = {
          counts: [] as number[],
          total,
          percentages: [] as number[],
        };

        // If no votes yet, return empty arrays
        if (total === 0) {
          callback(result);
          return;
        }

        // Find the highest option index to determine array size
        const maxOptionIndex = Math.max(...Object.keys(voteCounts).map(Number));

        // Create arrays with the right size filled with zeros
        result.counts = Array(maxOptionIndex + 1).fill(0);
        result.percentages = Array(maxOptionIndex + 1).fill(0);

        // Fill in the vote counts and calculate percentages
        Object.entries(voteCounts).forEach(([optionIndex, count]) => {
          const index = Number(optionIndex);
          result.counts[index] = count;
          result.percentages[index] = Math.round((count / total) * 100);
        });

        callback(result);
      },
      (error) => {
        console.error("Error subscribing to vote counts:", error);
        callback({
          counts: [],
          total: 0,
          percentages: [],
        });
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to vote counts:", error);
    return () => {};
  }
};

/**
 * Get analytics data for a creator's stories
 * @param creatorId - ID of the creator
 * @returns Promise with analytics data
 */
export const getCreatorAnalytics = async (
  creatorId: string
): Promise<AnalyticsSummary> => {
  try {
    // Get all stories by this creator
    const storiesRef = collection(db, "stories");
    const storiesQuery = query(storiesRef, where("creatorId", "==", creatorId));
    const storiesSnapshot = await getDocs(storiesQuery);

    // Initialize analytics summary
    const summary: AnalyticsSummary = {
      totalReaders: 0,
      totalCollectors: 0,
      totalVotes: 0,
      totalRevenue: 0,
      readerGrowth: 0, // We'll calculate this later
      collectorGrowth: 0, // We'll calculate this later
      storyPerformance: [],
    };

    // Process each story
    const storyAnalyticsPromises = storiesSnapshot.docs.map(
      async (storyDoc) => {
        const storyData = storyDoc.data() as StoryData;
        const storyId = storyDoc.id;

        // Get vote counts for this story (sum of all chapter votes)
        const chaptersRef = collection(db, "chapters");
        const chaptersQuery = query(
          chaptersRef,
          where("storyId", "==", storyId)
        );
        const chaptersSnapshot = await getDocs(chaptersQuery);

        let storyVotes = 0;

        // For each chapter, count votes
        for (const chapterDoc of chaptersSnapshot.docs) {
          const chapterId = chapterDoc.id;
          const votesRef = collection(db, "plotVotes");
          const votesQuery = query(
            votesRef,
            where("chapterId", "==", chapterId)
          );
          const votesSnapshot = await getDocs(votesQuery);
          storyVotes += votesSnapshot.size;
        }

        // Get collections for this story
        const collectionsRef = collection(db, "chapterCollections");
        const collectionsQuery = query(
          collectionsRef,
          where("storyId", "==", storyId)
        );
        const collectionsSnapshot = await getDocs(collectionsQuery);

        // For simplicity, we're using a placeholder for revenue calculation
        // In a real NFT app, this would come from blockchain transactions
        const collectionCount = collectionsSnapshot.size;
        const revenueEstimate = collectionCount * 0.01; // Simple estimate: 0.01 ETH per collection

        // Create story analytics
        const storyAnalytics: StoryAnalytics = {
          id: storyId,
          title: storyData.title,
          reads: storyData.viewCount || 0,
          collections: collectionCount,
          votes: storyVotes,
          revenue: revenueEstimate,
        };

        // Add to summary totals
        summary.totalReaders += storyData.readerCount || 0;
        summary.totalCollectors += collectionCount;
        summary.totalVotes += storyVotes;
        summary.totalRevenue += revenueEstimate;

        return storyAnalytics;
      }
    );

    // Wait for all story analytics to be processed
    summary.storyPerformance = await Promise.all(storyAnalyticsPromises);

    // Calculate growth percentages (simple placeholder for now)
    // In a real app, you would compare to previous period data
    summary.readerGrowth = Math.round(Math.random() * 15);
    summary.collectorGrowth = Math.round(Math.random() * 10);

    return summary;
  } catch (error) {
    console.error("Error getting creator analytics:", error);
    return {
      totalReaders: 0,
      totalCollectors: 0,
      totalVotes: 0,
      totalRevenue: 0,
      readerGrowth: 0,
      collectorGrowth: 0,
      storyPerformance: [],
    };
  }
};

/**
 * Subscribe to real-time analytics for a creator
 * @param creatorId - ID of the creator
 * @param callback - Function to call with updated analytics
 * @returns Unsubscribe function
 */
export const subscribeToCreatorAnalytics = (
  creatorId: string,
  callback: (analytics: AnalyticsSummary) => void
): (() => void) => {
  // Get initial analytics
  getCreatorAnalytics(creatorId).then(callback);

  // We need to subscribe to multiple collections to track changes
  const unsubscribes: (() => void)[] = [];

  // Subscribe to stories collection to detect changes in reader counts
  const storiesRef = collection(db, "stories");
  const storiesQuery = query(storiesRef, where("creatorId", "==", creatorId));

  const unsubStories = onSnapshot(storiesQuery, () => {
    // When any story changes, refresh the entire analytics
    getCreatorAnalytics(creatorId).then(callback);
  });
  unsubscribes.push(unsubStories);

  // Subscribe to chapter collections to detect new collections
  const collectionsRef = collection(db, "chapterCollections");
  const unsubCollections = onSnapshot(collectionsRef, () => {
    // When collections change, refresh analytics
    getCreatorAnalytics(creatorId).then(callback);
  });
  unsubscribes.push(unsubCollections);

  // Subscribe to plot votes to detect new votes
  const votesRef = collection(db, "plotVotes");
  const unsubVotes = onSnapshot(votesRef, () => {
    // When votes change, refresh analytics
    getCreatorAnalytics(creatorId).then(callback);
  });
  unsubscribes.push(unsubVotes);

  // Return a function that unsubscribes from all
  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
};

/**
 * Get collections for a reader
 * @param userId - ID of the reader
 * @param callback - Function to call with collections data
 * @returns Unsubscribe function
 */
export const subscribeToReaderCollections = (
  userId: string,
  callback: (collections: ReaderCollection[]) => void
): (() => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Query all collections for this user
  const collectionsRef = collection(db, "chapterCollections");
  const collectionsQuery = query(collectionsRef, where("userId", "==", userId));

  const unsubscribe = onSnapshot(collectionsQuery, async (snapshot) => {
    // Group collections by story
    const collectionsByStory: Record<string, string[]> = {};

    snapshot.forEach((doc) => {
      const collection = doc.data() as ChapterCollection;
      if (!collectionsByStory[collection.storyId]) {
        collectionsByStory[collection.storyId] = [];
      }
      collectionsByStory[collection.storyId].push(collection.chapterId);
    });

    // Fetch story details for each collection
    const readerCollections: ReaderCollection[] = [];

    for (const [storyId, chapterIds] of Object.entries(collectionsByStory)) {
      try {
        // Get story data
        const storyRef = doc(db, "stories", storyId);
        const storySnap = await getDoc(storyRef);

        if (storySnap.exists()) {
          const storyData = storySnap.data() as StoryData;

          // Get creator name
          let authorName = "Anonymous";
          if (storyData.creatorEmail) {
            authorName = storyData.creatorEmail.split("@")[0];
          }

          readerCollections.push({
            id: `collection-${storyId}`,
            storyId,
            storyTitle: storyData.title,
            coverImage: storyData.coverImage,
            totalChapters: storyData.chapterCount,
            collectedChapters: chapterIds.length,
            author: authorName,
            chapterIds,
          });
        }
      } catch (error) {
        console.error("Error fetching story details for collection:", error);
      }
    }

    callback(readerCollections);
  });

  return unsubscribe;
};

/**
 * Get reading history for a reader
 * @param userId - ID of the reader
 * @param callback - Function to call with reading history data
 * @param limit - Optional limit on number of items to return
 * @returns Unsubscribe function
 */
export const subscribeToReadingHistory = (
  userId: string,
  callback: (history: ReadingHistory[]) => void,
  limit: number = 10
): (() => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Get reading history from the readingHistory collection
  const readingHistoryRef = collection(db, "readingHistory");
  const historyQuery = query(
    readingHistoryRef,
    where("userId", "==", userId),
    orderBy("readAt", "desc"),
    limitQuery(limit)
  );

  // Use onSnapshot for real-time updates
  const unsubscribe = onSnapshot(
    historyQuery,
    async (snapshot) => {
      const historyItems: ReadingHistory[] = [];

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();

        try {
          // Get story and chapter details
          const storyRef = doc(db, "stories", data.storyId);
          const chapterRef = doc(db, "chapters", data.chapterId);

          const [storySnap, chapterSnap] = await Promise.all([
            getDoc(storyRef),
            getDoc(chapterRef),
          ]);

          if (storySnap.exists() && chapterSnap.exists()) {
            const storyData = storySnap.data() as StoryData;
            const chapterData = chapterSnap.data() as ChapterData;

            historyItems.push({
              id: docSnapshot.id,
              storyId: data.storyId,
              storyTitle: storyData.title,
              chapterId: data.chapterId,
              chapterTitle: chapterData.title,
              coverImage: storyData.coverImage,
              readAt: data.readAt.toDate().toISOString(),
              progress: data.progress,
            });
          }
        } catch (error) {
          console.error("Error fetching details for reading history:", error);
        }
      }

      callback(historyItems);
    },
    (error) => {
      console.error("Error subscribing to reading history:", error);
      callback([]);
    }
  );

  return unsubscribe;
};

/**
 * Get voting history for a reader
 * @param userId - ID of the reader
 * @param callback - Function to call with voting history data
 * @param limit - Optional limit on number of items to return
 * @returns Unsubscribe function
 */
export const subscribeToVotingHistory = (
  userId: string,
  callback: (history: VotingHistory[]) => void,
  limit: number = 10
): (() => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Query plot votes for this user
  const votesRef = collection(db, "plotVotes");
  const votesQuery = query(
    votesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limitQuery(limit)
  );

  const unsubscribe = onSnapshot(votesQuery, async (snapshot) => {
    const votingHistory: VotingHistory[] = [];

    for (const voteDoc of snapshot.docs) {
      const voteData = voteDoc.data() as PlotVote;

      try {
        // Get story and chapter details
        const storyRef = doc(db, "stories", voteData.storyId);
        const chapterRef = doc(db, "chapters", voteData.chapterId);

        const [storySnap, chapterSnap] = await Promise.all([
          getDoc(storyRef),
          getDoc(chapterRef),
        ]);

        if (storySnap.exists() && chapterSnap.exists()) {
          const storyData = storySnap.data() as StoryData;
          const chapterData = chapterSnap.data() as ChapterData;

          // Get vote counts
          const voteResults = await getChapterVoteCounts(voteData.chapterId);

          votingHistory.push({
            id: voteDoc.id,
            storyId: voteData.storyId,
            storyTitle: storyData.title,
            chapterId: voteData.chapterId,
            chapterTitle: chapterData.title,
            coverImage: storyData.coverImage,
            choice:
              chapterData.choiceOptions?.[voteData.choiceOptionIndex] ||
              "Unknown option",
            votedAt:
              voteData.createdAt?.toDate().toISOString() ||
              new Date().toISOString(),
            totalVotes: voteResults.total,
            choiceVotes: voteResults.counts[voteData.choiceOptionIndex] || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching details for voting history:", error);
      }
    }

    callback(votingHistory);
  });

  return unsubscribe;
};

/**
 * Get notifications for a reader
 * @param userId - ID of the reader
 * @param callback - Function to call with notifications data
 * @param limit - Optional limit on number of items to return
 * @returns Unsubscribe function
 */
export const subscribeToReaderNotifications = (
  userId: string,
  callback: (notifications: ReaderNotification[]) => void,
  limit: number = 20
): (() => void) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Get notifications from the userNotifications collection
  const notificationsRef = collection(db, "userNotifications");
  const notificationsQuery = query(
    notificationsRef,
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limitQuery(limit)
  );

  // Use onSnapshot for real-time updates
  const unsubscribe = onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications: ReaderNotification[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        notifications.push({
          id: docSnapshot.id,
          type: data.type as
            | "chapter_published"
            | "vote_results"
            | "collect_success"
            | "author_update",
          storyId: data.storyId,
          storyTitle: data.storyTitle,
          chapterId: data.chapterId,
          chapterTitle: data.chapterTitle,
          result: data.result,
          authorName: data.authorName,
          message: data.message,
          timestamp: data.timestamp.toDate().toISOString(),
          read: data.read,
        });
      });

      callback(notifications);
    },
    (error) => {
      console.error("Error subscribing to notifications:", error);
      callback([]);
    }
  );

  return unsubscribe;
};

/**
 * Record reading progress for a chapter
 * @param userId - ID of the user reading the chapter
 * @param storyId - ID of the story being read
 * @param chapterId - ID of the chapter being read
 * @param progress - Reading progress percentage (0-100)
 * @returns Promise that resolves when the reading progress is recorded
 */
export const recordReadingProgress = async (
  userId: string,
  storyId: string,
  chapterId: string,
  progress: number
): Promise<void> => {
  if (!userId) return;

  try {
    // Get story and chapter details
    const storyRef = doc(db, "stories", storyId);
    const chapterRef = doc(db, "chapters", chapterId);

    const [storySnap, chapterSnap] = await Promise.all([
      getDoc(storyRef),
      getDoc(chapterRef),
    ]);

    if (!storySnap.exists() || !chapterSnap.exists()) {
      console.error("Story or chapter not found");
      return;
    }

    const storyData = storySnap.data() as StoryData;
    const chapterData = chapterSnap.data() as ChapterData;

    // Create a unique ID for this reading record
    const readingId = `${userId}_${storyId}_${chapterId}`;

    // Create or update the reading history record
    const readingHistoryRef = doc(db, "readingHistory", readingId);

    // Set the reading history data
    await setDoc(
      readingHistoryRef,
      {
        userId,
        storyId,
        storyTitle: storyData.title,
        chapterId,
        chapterTitle: chapterData.title,
        readAt: serverTimestamp(),
        progress: Math.min(Math.max(0, progress), 100), // Ensure progress is between 0-100
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ); // Use merge to update existing records

    console.log(
      `Reading progress recorded: ${progress}% for chapter ${chapterId}`
    );

    // If this is a completed read (progress = 100%), also track the reader
    if (progress >= 100) {
      trackStoryReader(storyId, userId);
    }
  } catch (error) {
    console.error("Error recording reading progress:", error);
  }
};

/**
 * Create a notification for a user
 * @param userId - ID of the user to notify
 * @param type - Type of notification
 * @param data - Notification data
 * @returns Promise that resolves when the notification is created
 */
export const createNotification = async (
  userId: string,
  type:
    | "chapter_published"
    | "vote_results"
    | "collect_success"
    | "author_update",
  data: {
    storyId: string;
    storyTitle: string;
    chapterId?: string;
    chapterTitle?: string;
    result?: string;
    authorName?: string;
    message?: string;
  }
): Promise<string> => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // Create a notification in the userNotifications collection
    const notificationsRef = collection(db, "userNotifications");

    const notification = {
      userId,
      type,
      storyId: data.storyId,
      storyTitle: data.storyTitle,
      chapterId: data.chapterId || null,
      chapterTitle: data.chapterTitle || null,
      result: data.result || null,
      authorName: data.authorName || null,
      message: data.message || null,
      timestamp: serverTimestamp(),
      read: false,
    };

    const docRef = await addDoc(notificationsRef, notification);
    console.log(`Notification created: ${type} for user ${userId}`);

    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param notificationId - ID of the notification to mark as read
 * @returns Promise that resolves when the notification is marked as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, "userNotifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

/**
 * Notify followers when a new chapter is published
 * @param storyId - ID of the story with the new chapter
 * @param chapterId - ID of the newly published chapter
 * @returns Promise that resolves when all notifications are created
 */
export const notifyFollowersOfNewChapter = async (
  storyId: string,
  chapterId: string
): Promise<void> => {
  try {
    // Get story details
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      console.error("Story not found");
      return;
    }

    const storyData = storySnap.data() as StoryData;

    // Get chapter details
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterSnap = await getDoc(chapterRef);

    if (!chapterSnap.exists()) {
      console.error("Chapter not found");
      return;
    }

    const chapterData = chapterSnap.data() as ChapterData;

    // Get all readers for this story
    const readersRef = collection(db, "storyReaders");
    const readersQuery = query(readersRef, where("storyId", "==", storyId));
    const readersSnap = await getDocs(readersQuery);

    // Create a notification for each reader
    const notificationPromises = readersSnap.docs.map((readerDoc) => {
      const readerData = readerDoc.data();

      // Don't notify the creator
      if (readerData.userId === storyData.creatorId) {
        return Promise.resolve();
      }

      return createNotification(readerData.userId, "chapter_published", {
        storyId,
        storyTitle: storyData.title,
        chapterId,
        chapterTitle: chapterData.title,
      });
    });

    await Promise.all(notificationPromises);
    console.log(
      `Notified ${notificationPromises.length} readers of new chapter`
    );
  } catch (error) {
    console.error("Error notifying followers of new chapter:", error);
  }
};

/**
 * Update an existing chapter
 * @param chapterId - ID of the chapter to update
 * @param chapterData - Partial chapter data to update
 * @returns Promise that resolves when the update is complete
 */
export const updateChapter = async (
  chapterId: string,
  chapterData: Partial<
    Omit<ChapterData, "id" | "createdAt" | "creatorId" | "storyId" | "order">
  >
): Promise<void> => {
  try {
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterSnap = await getDoc(chapterRef);

    if (!chapterSnap.exists()) {
      throw new Error("Chapter not found");
    }

    // Update the chapter with new data
    await updateDoc(chapterRef, {
      ...chapterData,
      updatedAt: serverTimestamp(),
    });

    // If this chapter is being published, ensure the story is also marked as published
    if (chapterData.published === true) {
      const storyId = chapterSnap.data().storyId;
      const storyRef = doc(db, "stories", storyId);
      const storySnap = await getDoc(storyRef);

      if (storySnap.exists()) {
        const storyData = storySnap.data() as StoryData;

        // If the story isn't published yet, mark it as published
        if (!storyData.published) {
          console.log(
            `📖 Marking story "${storyData.title}" as published due to chapter publication`
          );
          await updateDoc(storyRef, {
            published: true,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Just update the timestamp
          await updateDoc(storyRef, {
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    console.log("Chapter updated successfully:", chapterId);
  } catch (error) {
    console.error("Error updating chapter:", error);
    throw error;
  }
};

/**
 * Add plot tokens to an existing chapter
 * @param chapterId - ID of the chapter to add tokens to
 * @param plotOptions - Plot options for token creation
 * @param walletClient - Wallet client for Zora transactions
 * @param publicClient - Public client for Zora transactions
 * @returns Promise that resolves when tokens are added
 */
export const addPlotTokensToChapter = async (
  chapterId: string,
  plotOptions: PlotOption[],
  walletClient: WalletClient,
  publicClient: PublicClient
): Promise<void> => {
  try {
    if (plotOptions.length !== 2) {
      throw new Error(
        "Exactly two plot options are required for token creation"
      );
    }

    // Get the chapter to make sure it exists
    const chapterData = await getChapterById(chapterId);
    if (!chapterData) {
      throw new Error("Chapter not found");
    }

    // Check if chapter already has plot tokens
    if (chapterData.plotTokens && chapterData.plotTokens.length > 0) {
      throw new Error("Chapter already has plot tokens");
    }

    // Initialize Zora service
    const zoraService = new ZoraService();

    // Register plot options as tokens
    await zoraService.registerPlotOptions(
      chapterId,
      plotOptions,
      walletClient,
      publicClient
    );

    // Get the created tokens information
    const voteStats = await zoraService.getPlotVoteStats(chapterId);

    // Convert to plotTokens format
    const plotTokens = plotOptions.map((option) => {
      const tokenInfo = voteStats[option.symbol];
      return {
        name: option.name,
        symbol: option.symbol,
        tokenAddress: tokenInfo.tokenAddress,
        metadataURI: option.metadataURI,
      };
    });

    // Update the chapter with plot tokens
    await updateChapter(chapterId, {
      plotTokens,
    });

    console.log(
      `✅ Added ${plotTokens.length} plot tokens to chapter ${chapterId}`
    );
  } catch (error) {
    console.error("Error adding plot tokens to chapter:", error);
    throw error;
  }
};

/**
 * Get all stories created by a specific user
 * @param userId - The user ID
 * @returns Promise with array of stories
 */
export const getUserStories = async (userId: string): Promise<StoryData[]> => {
  try {
    console.log(`🔍 Fetching stories for user: ${userId}`);

    const storiesRef = collection(db, "stories");
    const q = query(
      storiesRef,
      where("creatorId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const stories = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as StoryData)
    );

    console.log(`📚 Found ${stories.length} stories for user ${userId}:`);
    stories.forEach((story) => {
      console.log("📖 User story:", {
        id: story.id,
        title: story.title,
        published: story.published,
        publishedType: typeof story.published,
        chapterCount: story.chapterCount,
        chapterCountType: typeof story.chapterCount,
        createdAt: story.createdAt,
      });
    });

    return stories;
  } catch (error) {
    console.error("❌ Error getting user stories:", error);
    return [];
  }
};

/**
 * Get all chapters created by a specific user for a specific story
 * @param storyId - The story ID
 * @param userId - The user ID
 * @returns Promise with array of chapters
 */
export const getUserChapters = async (
  storyId: string,
  userId: string
): Promise<ChapterData[]> => {
  try {
    const chaptersRef = collection(db, "chapters");
    const q = query(
      chaptersRef,
      where("storyId", "==", storyId),
      where("creatorId", "==", userId),
      orderBy("order", "asc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as ChapterData)
    );
  } catch (error) {
    console.error("Error getting user chapters:", error);
    return [];
  }
};

/**
 * Get all tokens purchased by a specific user
 * @param userId - The user ID
 * @returns Promise with array of purchased tokens
 */
export const getUserPurchasedTokens = async (
  _userId: string
): Promise<any[]> => {
  try {
    // TODO: Implement fetching tokens purchased by user from other creators
    // This would involve querying blockchain for user's token balances
    // across all plot tokens in all stories
    return [];
  } catch (error) {
    console.error("Error getting user purchased tokens:", error);
    return [];
  }
};

/**
 * Utility function to fix story data inconsistencies
 * This can be called to repair stories that might have incorrect chapterCount
 * or other data integrity issues
 */
export const fixStoryDataInconsistencies = async (
  userId?: string
): Promise<void> => {
  try {
    console.log("🔧 Starting story data repair process...");

    const storiesRef = collection(db, "stories");
    let storiesQuery;

    if (userId) {
      // Fix stories for a specific user
      storiesQuery = query(storiesRef, where("creatorId", "==", userId));
      console.log(`🔧 Fixing stories for user: ${userId}`);
    } else {
      // Fix all stories
      storiesQuery = query(storiesRef, orderBy("createdAt", "desc"));
      console.log("🔧 Fixing all stories");
    }

    const storiesSnapshot = await getDocs(storiesQuery);
    let fixedCount = 0;

    for (const storyDoc of storiesSnapshot.docs) {
      const storyData = storyDoc.data() as StoryData;
      const storyId = storyDoc.id;

      // Get actual chapter count for this story
      const chaptersRef = collection(db, "chapters");
      const publishedChaptersQuery = query(
        chaptersRef,
        where("storyId", "==", storyId),
        where("published", "==", true)
      );

      const chaptersSnapshot = await getDocs(publishedChaptersQuery);
      const actualChapterCount = chaptersSnapshot.docs.length;
      const hasPublishedChapters = actualChapterCount > 0;

      // Check if story data needs updating
      const needsUpdate =
        storyData.chapterCount !== actualChapterCount ||
        storyData.published !== hasPublishedChapters;

      if (needsUpdate) {
        console.log(`🔧 Fixing story "${storyData.title}":`, {
          oldChapterCount: storyData.chapterCount,
          newChapterCount: actualChapterCount,
          oldPublished: storyData.published,
          newPublished: hasPublishedChapters,
        });

        await updateDoc(doc(db, "stories", storyId), {
          chapterCount: actualChapterCount,
          published: hasPublishedChapters,
          updatedAt: serverTimestamp(),
        });

        fixedCount++;
      }
    }

    console.log(`✅ Fixed ${fixedCount} stories`);
  } catch (error) {
    console.error("❌ Error fixing story data:", error);
    throw error;
  }
};

/**
 * Update a chapter with NFT contract address
 * This ensures the NFT contract address is properly saved to the database
 */
export const updateChapterWithNFT = async (
  chapterId: string,
  nftContractAddress: string
): Promise<void> => {
  try {
    console.log(
      `🎨 Saving NFT contract address for chapter ${chapterId}:`,
      nftContractAddress
    );

    const chapterRef = doc(db, "chapters", chapterId);

    // First verify the chapter exists
    const chapterSnap = await getDoc(chapterRef);
    if (!chapterSnap.exists()) {
      throw new Error(`Chapter ${chapterId} not found`);
    }

    // Update with NFT contract address
    await updateDoc(chapterRef, {
      nftContractAddress,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ NFT contract address saved for chapter ${chapterId}`);

    // Verify the update worked
    const updatedChapterSnap = await getDoc(chapterRef);
    const updatedData = updatedChapterSnap.data();

    if (updatedData?.nftContractAddress === nftContractAddress) {
      console.log("✅ NFT contract address verification successful");
    } else {
      console.error("❌ NFT contract address verification failed:", {
        expected: nftContractAddress,
        actual: updatedData?.nftContractAddress,
      });
    }
  } catch (error) {
    console.error("❌ Error updating chapter with NFT:", error);
    throw error;
  }
};

/**
 * Debug function to check story data and understand discovery issues
 * Call this from browser console: window.debugStoryDiscovery()
 */
export const debugStoryDiscovery = async (): Promise<void> => {
  try {
    console.log("🔍 === STORY DISCOVERY DEBUG ===");

    // Get ALL stories (including unpublished)
    const storiesRef = collection(db, "stories");
    const allStoriesQuery = query(storiesRef, orderBy("createdAt", "desc"));
    const allStoriesSnapshot = await getDocs(allStoriesQuery);

    console.log(
      `📚 Total stories in database: ${allStoriesSnapshot.docs.length}`
    );

    allStoriesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`📖 Story "${data.title}":`, {
        id: doc.id,
        published: data.published,
        chapterCount: data.chapterCount,
        createdAt: data.createdAt,
        meetsDiscoveryRequirements:
          data.published && data.chapterCount > 0 ? "✅" : "❌",
      });
    });

    // Now test the actual getAllStories function
    console.log("\n🔍 Testing getAllStories() function:");
    const discoveryStories = await getAllStories();
    console.log(
      `📋 Stories returned by getAllStories(): ${discoveryStories.length}`
    );

    discoveryStories.forEach((story) => {
      console.log(
        `✅ Discovery story: "${story.title}" (chapters: ${story.chapterCount})`
      );
    });

    // Check published stories specifically
    const publishedQuery = query(
      storiesRef,
      where("published", "==", true),
      orderBy("createdAt", "desc")
    );
    const publishedSnapshot = await getDocs(publishedQuery);
    console.log(`\n📊 Published stories: ${publishedSnapshot.docs.length}`);

    publishedSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(
        `📋 Published: "${data.title}" (chapters: ${data.chapterCount})`
      );
    });

    console.log("🔍 === END DEBUG ===");
  } catch (error) {
    console.error("❌ Debug function error:", error);
  }
};

/**
 * Simple utility to manually mark stories as published if they have published chapters
 * Call this from browser console: window.markStoriesAsPublished()
 */
export const markStoriesAsPublished = async (): Promise<void> => {
  try {
    console.log("🔧 Manually marking stories as published...");

    const storiesRef = collection(db, "stories");
    const allStoriesQuery = query(storiesRef, orderBy("createdAt", "desc"));
    const storiesSnapshot = await getDocs(allStoriesQuery);

    let fixedCount = 0;

    for (const storyDoc of storiesSnapshot.docs) {
      const storyData = storyDoc.data() as StoryData;
      const storyId = storyDoc.id;

      console.log(`🔍 Checking story "${storyData.title}":`, {
        published: storyData.published,
        chapterCount: storyData.chapterCount,
      });

      // If story is not published, check if it has published chapters
      if (!storyData.published) {
        const chaptersRef = collection(db, "chapters");
        const publishedChaptersQuery = query(
          chaptersRef,
          where("storyId", "==", storyId),
          where("published", "==", true)
        );

        const chaptersSnapshot = await getDocs(publishedChaptersQuery);
        const publishedChapterCount = chaptersSnapshot.docs.length;

        console.log(`📊 Story has ${publishedChapterCount} published chapters`);

        if (publishedChapterCount > 0) {
          console.log(`✅ Marking story "${storyData.title}" as published`);

          await updateDoc(doc(db, "stories", storyId), {
            published: true,
            chapterCount: publishedChapterCount,
            updatedAt: serverTimestamp(),
          });

          fixedCount++;
        }
      }
    }

    console.log(`🎉 Fixed ${fixedCount} stories`);
  } catch (error) {
    console.error("❌ Error marking stories as published:", error);
    throw error;
  }
};

// Make function available globally for browser console
if (typeof window !== "undefined") {
  (window as any).debugStoryDiscovery = debugStoryDiscovery;
  (window as any).getAllStories = getAllStories;
  (window as any).fixStoryDataInconsistencies = fixStoryDataInconsistencies;
  (window as any).markStoriesAsPublished = markStoriesAsPublished;
}
