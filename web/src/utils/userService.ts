import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit as limitQuery,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import type { User } from "./firebase";

// Types for user profile data
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  joined: Timestamp | string;
  isCreator: boolean;
  coverImage?: string;
}

export interface UserStory {
  id: string;
  title: string;
  coverImage: string;
  chaptersCount: number;
  collectorsCount: number;
  lastUpdated: Timestamp | string;
}

export interface UserCollection {
  id: string;
  storyId: string;
  storyTitle: string;
  chapterTitle: string;
  coverImage: string;
  collectedAt: Timestamp | string;
}

export interface UserActivity {
  id: string;
  type: "publish" | "collect" | "vote";
  storyId: string;
  storyTitle: string;
  chapterId?: string;
  chapterTitle: string;
  optionChosen?: string;
  timestamp: Timestamp | string;
}

/**
 * Create or update a user profile in Firestore
 * @param user - Firebase User object
 * @param profileData - Additional profile data
 * @returns Promise that resolves when profile is updated
 */
export const updateUserProfile = async (
  user: User,
  profileData: Partial<Omit<UserProfile, "id">>
): Promise<void> => {
  try {
    const userRef = doc(db, "userProfiles", user.uid);

    // Get existing data if any
    const userSnap = await getDoc(userRef);

    const defaultUsername = user.email?.split("@")[0] || "user";

    // Merge existing data with new data
    const userData = {
      id: user.uid,
      username: defaultUsername,
      displayName: user.displayName || defaultUsername,
      avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
      bio: "",
      joined: userSnap.exists() ? userSnap.data().joined : serverTimestamp(),
      isCreator: false,
      ...(userSnap.exists() ? userSnap.data() : {}),
      ...profileData,
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Subscribe to a user profile for real-time updates
 * @param userId - ID of the user to fetch
 * @param callback - Function to call with profile data
 * @returns Unsubscribe function
 */
export const subscribeToUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
): (() => void) => {
  try {
    const userRef = doc(db, "userProfiles", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data() as UserProfile;
          callback({ ...userData, id: doc.id });
        } else {
          // If no profile exists, try to create one from auth data
          // or return null if that's not possible
          callback(null);
        }
      },
      (error) => {
        console.error("Error subscribing to user profile:", error);
        callback(null);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up user profile subscription:", error);
    callback(null);
    return () => {};
  }
};

/**
 * Subscribe to a user's stories for real-time updates
 * @param userId - ID of the user
 * @param callback - Function to call with stories data
 * @param limit - Optional limit on number of stories to return
 * @returns Unsubscribe function
 */
export const subscribeToUserStories = (
  userId: string,
  callback: (stories: UserStory[]) => void,
  limit: number = 10
): (() => void) => {
  try {
    const storiesRef = collection(db, "stories");
    const storiesQuery = query(
      storiesRef,
      where("creatorId", "==", userId),
      orderBy("updatedAt", "desc"),
      limitQuery(limit)
    );

    const unsubscribe = onSnapshot(
      storiesQuery,
      (snapshot) => {
        const stories: UserStory[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          stories.push({
            id: doc.id,
            title: data.title,
            coverImage: data.coverImage,
            chaptersCount: data.chapterCount || 0,
            collectorsCount: data.collectCount || 0,
            lastUpdated: data.updatedAt,
          });
        });

        callback(stories);
      },
      (error) => {
        console.error("Error subscribing to user stories:", error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up user stories subscription:", error);
    callback([]);
    return () => {};
  }
};

/**
 * Subscribe to a user's collection for real-time updates
 * @param userId - ID of the user
 * @param callback - Function to call with collection data
 * @param limit - Optional limit on number of items to return
 * @returns Unsubscribe function
 */
export const subscribeToUserCollection = (
  userId: string,
  callback: (collection: UserCollection[]) => void,
  limit: number = 10
): (() => void) => {
  try {
    const collectionsRef = collection(db, "chapterCollections");
    const collectionsQuery = query(
      collectionsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limitQuery(limit)
    );

    const unsubscribe = onSnapshot(
      collectionsQuery,
      async (snapshot) => {
        const collections: UserCollection[] = [];

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();

          try {
            // Get story details
            const storyRef = doc(db, "stories", data.storyId);
            const chapterRef = doc(db, "chapters", data.chapterId);

            const [storySnap, chapterSnap] = await Promise.all([
              getDoc(storyRef),
              getDoc(chapterRef),
            ]);

            if (storySnap.exists() && chapterSnap.exists()) {
              const storyData = storySnap.data() as {
                title: string;
                coverImage: string;
              };
              const chapterData = chapterSnap.data() as { title: string };

              collections.push({
                id: docSnapshot.id,
                storyId: data.storyId,
                storyTitle: storyData.title,
                chapterTitle: chapterData.title,
                coverImage: storyData.coverImage,
                collectedAt: data.createdAt,
              });
            }
          } catch (error) {
            console.error("Error fetching collection details:", error);
          }
        }

        callback(collections);
      },
      (error) => {
        console.error("Error subscribing to user collection:", error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up user collection subscription:", error);
    callback([]);
    return () => {};
  }
};

/**
 * Subscribe to a user's activity for real-time updates
 * @param userId - ID of the user
 * @param callback - Function to call with activity data
 * @param limit - Optional limit on number of items to return
 * @returns Unsubscribe function
 */
export const subscribeToUserActivity = (
  userId: string,
  callback: (activity: UserActivity[]) => void,
  limit: number = 20
): (() => void) => {
  try {
    // Initialize array to store all activity
    const allActivity: UserActivity[] = [];

    // Track when all subscriptions have returned data
    let subscriptionsActive = 0;
    let subscriptionsResponded = 0;

    // Function to check if all subscriptions have responded
    const checkAllResponded = () => {
      subscriptionsResponded++;
      if (subscriptionsResponded === subscriptionsActive) {
        sortAndReturnActivity();
      }
    };

    // Function to sort and return activity
    const sortAndReturnActivity = () => {
      // Sort by timestamp descending
      allActivity.sort((a, b) => {
        const dateA =
          a.timestamp instanceof Timestamp
            ? a.timestamp.toMillis()
            : new Date(a.timestamp).getTime();
        const dateB =
          b.timestamp instanceof Timestamp
            ? b.timestamp.toMillis()
            : new Date(b.timestamp).getTime();
        return dateB - dateA;
      });

      // Limit results
      callback(allActivity.slice(0, limit));
    };

    // Subscribe to story publishes
    subscriptionsActive++;
    const storiesRef = collection(db, "stories");
    const storiesQuery = query(
      storiesRef,
      where("creatorId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    const storyUnsubscribe = onSnapshot(
      storiesQuery,
      async (snapshot) => {
        for (const docSnapshot of snapshot.docs) {
          const storyData = docSnapshot.data() as { title: string };

          // Fetch chapters for this story
          const chaptersRef = collection(db, "chapters");
          const chaptersQuery = query(
            chaptersRef,
            where("storyId", "==", docSnapshot.id),
            orderBy("createdAt", "desc")
          );

          const chaptersSnap = await getDocs(chaptersQuery);

          chaptersSnap.forEach((chapterDoc) => {
            const chapterData = chapterDoc.data();
            allActivity.push({
              id: `publish_${chapterDoc.id}`,
              type: "publish",
              storyId: docSnapshot.id,
              storyTitle: storyData.title,
              chapterId: chapterDoc.id,
              chapterTitle: chapterData.title,
              timestamp: chapterData.createdAt,
            });
          });
        }

        checkAllResponded();
      },
      (error) => {
        console.error("Error subscribing to stories:", error);
        checkAllResponded();
      }
    );

    // Subscribe to chapter collections
    subscriptionsActive++;
    const collectionsRef = collection(db, "chapterCollections");
    const collectionsQuery = query(
      collectionsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const collectionsUnsubscribe = onSnapshot(
      collectionsQuery,
      async (snapshot) => {
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
              const storyData = storySnap.data() as {
                title: string;
                coverImage: string;
              };
              const chapterData = chapterSnap.data() as { title: string };

              allActivity.push({
                id: docSnapshot.id,
                type: "collect",
                storyId: data.storyId,
                storyTitle: storyData.title,
                chapterId: data.chapterId,
                chapterTitle: chapterData.title,
                timestamp: data.createdAt,
              });
            }
          } catch (error) {
            console.error("Error fetching collection details:", error);
          }
        }

        checkAllResponded();
      },
      (error) => {
        console.error("Error subscribing to collections:", error);
        checkAllResponded();
      }
    );

    // Subscribe to votes
    subscriptionsActive++;
    const votesRef = collection(db, "votes");
    const votesQuery = query(
      votesRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const votesUnsubscribe = onSnapshot(
      votesQuery,
      async (snapshot) => {
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
              const storyData = storySnap.data() as {
                title: string;
                coverImage: string;
              };
              const chapterData = chapterSnap.data() as { title: string };

              allActivity.push({
                id: docSnapshot.id,
                type: "vote",
                storyId: data.storyId,
                storyTitle: storyData.title,
                chapterId: data.chapterId,
                chapterTitle: chapterData.title,
                optionChosen: data.optionText,
                timestamp: data.createdAt,
              });
            }
          } catch (error) {
            console.error("Error fetching vote details:", error);
          }
        }

        checkAllResponded();
      },
      (error) => {
        console.error("Error subscribing to votes:", error);
        checkAllResponded();
      }
    );

    // Return combined unsubscribe function
    return () => {
      storyUnsubscribe();
      collectionsUnsubscribe();
      votesUnsubscribe();
    };
  } catch (error) {
    console.error("Error setting up activity subscriptions:", error);
    callback([]);
    return () => {};
  }
};
