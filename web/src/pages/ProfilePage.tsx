import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { useAuth } from "../utils/AuthContext";
import {
  subscribeToUserProfile,
  subscribeToUserStories,
  subscribeToUserCollection,
  subscribeToUserActivity,
  updateUserProfile,
  type UserProfile,
  type UserStory,
  type UserCollection,
  type UserActivity,
} from "../utils/userService";
import { EmptyStateCard } from "../components/ui/EmptyStateCard";

// Fallback user data (when no profile exists)
const createFallbackProfile = (
  userId: string,
  username?: string
): UserProfile => ({
  id: userId,
  username: username || "user",
  displayName: username || "Anonymous User",
  avatar: `https://i.pravatar.cc/150?u=${userId}`,
  bio: "",
  joined: new Date().toISOString(),
  isCreator: false,
});

type TabType = "collection" | "stories" | "activity";

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("collection");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [userCollection, setUserCollection] = useState<UserCollection[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to user profile data
  useEffect(() => {
    if (!userId) {
      setError("User ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Check if this is the current user's profile
    const isCurrentUserProfile = currentUser && currentUser.uid === userId;

    // Subscribe to real-time profile updates
    const unsubscribe = subscribeToUserProfile(userId, async (profile) => {
      if (profile) {
        setUserProfile(profile);
      } else {
        // If no profile exists and this is the current user, create one
        if (isCurrentUserProfile && currentUser) {
          try {
            // Create profile using the auth data
            const defaultUsername = currentUser.email?.split("@")[0] || "user";
            const profileData = {
              displayName: currentUser.displayName || defaultUsername,
              username: defaultUsername,
              avatar:
                currentUser.photoURL ||
                `https://i.pravatar.cc/150?u=${currentUser.uid}`,
              bio: "",
              isCreator: false,
            };

            await updateUserProfile(currentUser, profileData);
            // Profile will be updated via the subscription
          } catch (err) {
            console.error("Error creating user profile:", err);
            // Fall back to default profile if creation fails
            const username = userId.includes("@")
              ? userId.split("@")[0]
              : undefined;
            setUserProfile(createFallbackProfile(userId, username));
          }
        } else {
          // If it's not the current user or profile creation failed, use fallback
          const username = userId.includes("@")
            ? userId.split("@")[0]
            : undefined;
          setUserProfile(createFallbackProfile(userId, username));
        }
      }
      setLoading(false);
    });

    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [userId, currentUser]);

  // Update page title when profile data is available
  useEffect(() => {
    if (userProfile) {
      document.title = `${userProfile.displayName} | PlotMint`;
    }
  }, [userProfile]);

  // Subscribe to stories data if user is a creator
  useEffect(() => {
    if (!userId || !userProfile) return;

    if (userProfile.isCreator) {
      const unsubscribe = subscribeToUserStories(userId, (stories) => {
        setUserStories(stories);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [userId, userProfile]);

  // Subscribe to collection data
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserCollection(userId, (collection) => {
      setUserCollection(collection);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Subscribe to activity data
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserActivity(userId, (activity) => {
      setUserActivity(activity);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Format date for display
  const formatDate = (dateString: any) => {
    if (!dateString) return "Unknown date";

    // Handle Firebase Timestamp objects
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get relative time string
  const getRelativeTimeString = (dateString: any) => {
    if (!dateString) return "recently";

    // Handle Firebase Timestamp objects
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  };

  // Force update profile with current user information
  const handleForceUpdateProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const defaultUsername = currentUser.email?.split("@")[0] || "user";
      await updateUserProfile(currentUser, {
        displayName: currentUser.displayName || defaultUsername,
        username: defaultUsername,
        avatar:
          currentUser.photoURL ||
          `https://i.pravatar.cc/150?u=${currentUser.uid}`,
        bio: "",
        isCreator: false,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setLoading(false);
    }
  };

  // Render activity icon based on type
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "publish":
        return (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "collect":
        return (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </div>
        );
      case "vote":
        return (
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 pt-24 pb-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 pt-24 pb-16">
        <div className="content-wrapper">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-ink-900 dark:text-white mb-4">
              User Not Found
            </h1>
            <p className="text-ink-600 dark:text-ink-300 mb-6">
              The user profile you're looking for doesn't exist or has been
              removed.
            </p>
            <Link to="/">
              <Button variant="primary" size="md">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 pt-24 pb-16">
      <div className="content-wrapper">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden mb-8"
        >
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-primary-500 to-secondary-500 relative">
            {/* Avatar */}
            <div className="absolute -bottom-16 left-6 sm:left-8">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-dark-900 overflow-hidden shadow-md">
                <img
                  src={userProfile.avatar}
                  alt={userProfile.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://i.pravatar.cc/150?u=${userId}`;
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-20 px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white mb-1">
                  {userProfile.displayName}
                </h1>
                <p className="text-ink-500 dark:text-ink-400 mb-2">
                  @{userProfile.username}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-ink-600 dark:text-ink-300">
                    Joined {formatDate(userProfile.joined)}
                  </span>
                </div>
              </div>

              {currentUser && currentUser.uid === userId && (
                <div className="mt-4 sm:mt-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleForceUpdateProfile}
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              )}
            </div>

            {userProfile.bio && (
              <p className="text-ink-700 dark:text-ink-200 mb-6 max-w-3xl">
                {userProfile.bio}
              </p>
            )}

            {/* Tabs */}
            <div className="border-b border-parchment-200 dark:border-dark-700">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setActiveTab("collection")}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    activeTab === "collection"
                      ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
                  }`}
                >
                  Collection
                </button>
                {userProfile.isCreator && (
                  <button
                    onClick={() => setActiveTab("stories")}
                    className={`py-4 text-sm font-medium border-b-2 ${
                      activeTab === "stories"
                        ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
                    }`}
                  >
                    Stories
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    activeTab === "activity"
                      ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
                  }`}
                >
                  Activity
                </button>
              </nav>
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {/* Collection Tab */}
          {activeTab === "collection" &&
            (userCollection.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCollection.map((item) => (
                  <Link
                    key={item.id}
                    to={`/stories/${item.storyId}/chapters/${item.id}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden transition-transform duration-200 group-hover:scale-[1.02] group-hover:shadow-md">
                      <div className="h-48 bg-parchment-100 dark:bg-dark-700 relative">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.storyTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-400 dark:text-ink-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <div className="text-white">
                            <div className="font-medium truncate">
                              {item.storyTitle}
                            </div>
                            <div className="text-sm opacity-90 truncate">
                              {item.chapterTitle}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-ink-500 dark:text-ink-400">
                          Collected {getRelativeTimeString(item.collectedAt)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyStateCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                }
                title="No Collections Yet"
                description="Start exploring stories and collect chapters to see them here."
                actionLabel="Explore Stories"
                actionLink="/stories"
              />
            ))}

          {/* Stories Tab */}
          {activeTab === "stories" &&
            (userStories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userStories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/stories/${story.id}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden transition-transform duration-200 group-hover:scale-[1.02] group-hover:shadow-md">
                      <div className="h-48 bg-parchment-100 dark:bg-dark-700 relative">
                        {story.coverImage ? (
                          <img
                            src={story.coverImage}
                            alt={story.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-400 dark:text-ink-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <div className="text-white">
                            <div className="font-medium truncate">
                              {story.title}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center text-xs text-ink-500 dark:text-ink-400">
                          <div>
                            {story.chaptersCount}{" "}
                            {story.chaptersCount === 1 ? "Chapter" : "Chapters"}
                          </div>
                          <div>
                            Updated {getRelativeTimeString(story.lastUpdated)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyStateCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                }
                title="No Stories Yet"
                description="Create your first story to begin your creator journey."
                actionLabel="Create Story"
                actionLink="/creator/new-story"
              />
            ))}

          {/* Activity Tab */}
          {activeTab === "activity" &&
            (userActivity.length > 0 ? (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden">
                <ul className="divide-y divide-parchment-200 dark:divide-dark-700">
                  {userActivity.map((activity) => (
                    <li key={activity.id} className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {renderActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900 dark:text-white">
                            {activity.type === "publish" && "Published chapter"}
                            {activity.type === "collect" && "Collected chapter"}
                            {activity.type === "vote" && "Voted on chapter"}
                          </p>
                          <div className="mt-1">
                            <Link
                              to={`/stories/${activity.storyId}`}
                              className="text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              {activity.storyTitle}
                            </Link>
                            <span className="mx-1 text-ink-400">•</span>
                            <Link
                              to={`/stories/${activity.storyId}/chapters/${activity.chapterId}`}
                              className="text-ink-700 dark:text-ink-300 hover:underline"
                            >
                              {activity.chapterTitle}
                            </Link>
                          </div>
                          {activity.type === "vote" &&
                            activity.optionChosen && (
                              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                                Voted for: "{activity.optionChosen}"
                              </p>
                            )}
                          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                            {getRelativeTimeString(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyStateCard
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                title="No Activity Yet"
                description="Your reading and writing activity will appear here."
                actionLabel="Explore Stories"
                actionLink="/stories"
              />
            ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
