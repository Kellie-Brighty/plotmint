import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../utils/AuthContext";
import { useWallet } from "../utils/useWallet";
import WriterAssets from "../components/WriterAssets";
import {
  subscribeToCreatorStories,
  subscribeToChapters,
  subscribeToCreatorAnalytics,
  addPlotTokensToChapter,
  createPlotOptionsFromChoices,
  type AnalyticsSummary,
  type ChapterData,
  updateChapter,
  updateChapterWithNFT,
  notifyFollowersOfNewChapter,
} from "../utils/storyService";
import type { StoryData } from "../utils/storyService";
import { serverTimestamp, type Timestamp } from "firebase/firestore";
import ChapterNFTCreator from "../components/ChapterNFTCreator";

// Keep mock analytics data for now

interface DraftChapter {
  id?: string;
  storyId: string;
  storyTitle: string;
  title: string;
  preview: string;
  status: "in-progress" | "outline" | "ready";
  wordCount: number;
  lastEdited: string;
  choices: { id: string; text: string; votes: number }[];
  order: number;
}

type Tab = "stories" | "analytics" | "chapters" | "assets";

const CreatorDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("stories");
  const [stories, setStories] = useState<StoryData[]>([]);
  const [drafts, setDrafts] = useState<DraftChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [_draftsLoading, setDraftsLoading] = useState(true);
  const { currentUser } = useAuth();
  const { getWalletClient, getPublicClient } = useWallet();
  const navigate = useNavigate();
  const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);

  const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(
    null
  );
  const [showNFTCreator, setShowNFTCreator] = useState(false);
  const [_isSaving, setIsSaving] = useState(false);
  const [_publishError, setPublishError] = useState<string | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Subscribe to real-time stories data
  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates for creator's stories
    const unsubscribe = subscribeToCreatorStories(
      currentUser.uid,
      (fetchedStories) => {
        setStories(fetchedStories);
        setLoading(false);
      },
      true // Include unpublished stories
    );

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [currentUser, navigate]);

  // Subscribe to real-time analytics data
  useEffect(() => {
    if (!currentUser) return;

    setAnalyticsLoading(true);

    // Subscribe to real-time analytics
    const unsubscribe = subscribeToCreatorAnalytics(
      currentUser.uid,
      (fetchedAnalytics) => {
        setAnalytics(fetchedAnalytics);
        setAnalyticsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Subscribe to draft chapters
  useEffect(() => {
    if (!currentUser) return;

    setDraftsLoading(true);

    // We need to get all stories first to match story titles with draft chapters
    const unsubscribeStories = subscribeToCreatorStories(
      currentUser.uid,
      (creatorStories) => {
        if (creatorStories.length === 0) {
          setDrafts([]);
          setDraftsLoading(false);
          return;
        }

        // Array to store all draft chapters from all stories
        let allDrafts: DraftChapter[] = [];
        let storySubscriptions: (() => void)[] = [];
        let loadedStoryCount = 0;

        // For each story, subscribe to its chapters
        creatorStories.forEach((story) => {
          if (!story.id) return;

          const unsubscribeChapters = subscribeToChapters(
            story.id,
            (chapters) => {
              // Filter for unpublished chapters only
              const storyDrafts = chapters
                .filter((chapter) => !chapter.published)
                .map((chapter) => ({
                  id: chapter.id,
                  storyId: story.id!,
                  storyTitle: story.title,
                  title: chapter.title,
                  preview: chapter.content.substring(0, 100),
                  status: "in-progress" as "in-progress" | "outline" | "ready", // Cast to union type
                  wordCount: chapter.content.split(/\s+/).length,
                  lastEdited: chapter.updatedAt
                    ? chapter.updatedAt.toDate().toISOString()
                    : new Date().toISOString(),
                  choices: chapter.choiceOptions
                    ? chapter.choiceOptions.map((option, index) => ({
                        id: `${chapter.id}-option-${index}`,
                        text: option,
                        votes: 0,
                      }))
                    : [],
                  order: chapter.order,
                }));

              // Remove any existing drafts for this story and add the new ones
              allDrafts = allDrafts.filter((d) => d.storyId !== story.id);
              allDrafts = [...allDrafts, ...storyDrafts];

              // Update the state with all drafts
              setDrafts(allDrafts);

              // Mark this story as loaded
              loadedStoryCount++;
              if (loadedStoryCount >= creatorStories.length) {
                setDraftsLoading(false);
              }
            },
            false // Include unpublished chapters
          );

          storySubscriptions.push(unsubscribeChapters);
        });

        // If no stories had subscriptions created, we're done
        if (storySubscriptions.length === 0) {
          setDraftsLoading(false);
        }
      },
      true // Include unpublished stories
    );

    // Cleanup function
    return () => {
      unsubscribeStories();
    };
  }, [currentUser]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format Firebase timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown date";

    // Handle both Firebase Timestamp objects and ISO strings
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status badge based on story status
  const getStatusBadge = (story: StoryData) => {
    if (!story.published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Draft
        </span>
      );
    } else if (story.chapterCount > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          In Progress
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Completed
        </span>
      );
    }
  };

  // Get draft status badge
  const getDraftStatusBadge = (status: string) => {
    switch (status) {
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            In Progress
          </span>
        );
      case "outline":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            Outline
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Ready to Publish
          </span>
        );
      default:
        return null;
    }
  };

  // Function to render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "stories":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-ink-900 dark:text-white">
                My Stories
              </h3>
              <Link to="/creator/new-story">
                <Button variant="primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Create New Story
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md">
                <p className="font-medium">Error loading stories</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : stories.length === 0 ? (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center">
                <h4 className="text-lg font-medium text-ink-900 dark:text-white mb-2">
                  You haven't created any stories yet
                </h4>
                <p className="text-ink-600 dark:text-ink-400 mb-6">
                  Create your first story and start your journey as a PlotMint
                  creator
                </p>
                <Link to="/creator/new-story">
                  <Button variant="primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create New Story
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="bg-white dark:bg-dark-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-parchment-200 dark:border-dark-700"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(story)}
                      </div>
                    </div>
                    <div className="p-5">
                      <h4 className="text-lg font-bold text-ink-900 dark:text-white mb-2 line-clamp-1">
                        {story.title}
                      </h4>
                      <div className="flex flex-col space-y-1 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-ink-600 dark:text-ink-400">
                            Chapters:
                          </span>
                          <span className="text-ink-900 dark:text-white font-medium">
                            {story.chapterCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-600 dark:text-ink-400">
                            Readers:
                          </span>
                          <span className="text-ink-900 dark:text-white font-medium">
                            {story.viewCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-600 dark:text-ink-400">
                            Collectors:
                          </span>
                          <span className="text-ink-900 dark:text-white font-medium">
                            {story.collectCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-600 dark:text-ink-400">
                            Last updated:
                          </span>
                          <span className="text-ink-900 dark:text-white font-medium">
                            {formatTimestamp(story.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/stories/${story.id}`}
                          className="flex-1 text-center py-2 px-3 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-md text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() =>
                            navigate("/creator/new-chapter", {
                              state: { storyData: story },
                            })
                          }
                          className="flex-1 py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Add Chapter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-8">
            {analyticsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <div className="bg-white dark:bg-dark-900 rounded-xl p-3 sm:p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4">
                        <h3 className="text-xs sm:text-sm font-medium text-ink-500 dark:text-ink-400">
                          Total Readers
                        </h3>
                        <div className="flex items-end">
                          <p className="text-lg sm:text-2xl font-bold text-ink-900 dark:text-white">
                            {analytics?.totalReaders || 0}
                          </p>
                          <span className="ml-1 sm:ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                            +{analytics?.readerGrowth || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-dark-900 rounded-xl p-3 sm:p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-6 sm:w-6 text-secondary-600 dark:text-secondary-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4">
                        <h3 className="text-xs sm:text-sm font-medium text-ink-500 dark:text-ink-400">
                          Collectors
                        </h3>
                        <div className="flex items-end">
                          <p className="text-lg sm:text-2xl font-bold text-ink-900 dark:text-white">
                            {analytics?.totalCollectors || 0}
                          </p>
                          <span className="ml-1 sm:ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                            +{analytics?.collectorGrowth || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-dark-900 rounded-xl p-3 sm:p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 11l7-7 7 7M5 19l7-7 7 7"
                          />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4">
                        <h3 className="text-xs sm:text-sm font-medium text-ink-500 dark:text-ink-400">
                          Total Votes
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-ink-900 dark:text-white">
                          {analytics?.totalVotes || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-dark-900 rounded-xl p-3 sm:p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                    <div className="flex items-center">
                      <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4">
                        <h3 className="text-xs sm:text-sm font-medium text-ink-500 dark:text-ink-400">
                          Revenue (ETH)
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold text-ink-900 dark:text-white">
                          {analytics?.totalRevenue.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-900 rounded-xl p-4 sm:p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                  <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-4">
                    Story Performance
                  </h3>

                  {/* Desktop Table View (hidden on mobile) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-parchment-200 dark:divide-dark-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                              Story
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                              Reads
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                              Collections
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                              Votes
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                              Revenue
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-parchment-200 dark:divide-dark-700">
                          {analytics?.storyPerformance?.length ? (
                            analytics.storyPerformance.map((story) => (
                              <tr key={story.id}>
                                <td className="px-4 py-3 text-sm font-medium text-ink-900 dark:text-white">
                                  {story.title}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-ink-700 dark:text-ink-200">
                                  {story.reads}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-ink-700 dark:text-ink-200">
                                  {story.collections}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-ink-700 dark:text-ink-200">
                                  {story.votes}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-ink-700 dark:text-ink-200">
                                  {story.revenue.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-8 text-center text-sm text-ink-500 dark:text-ink-400"
                              >
                                No story data available yet. Publish some
                                chapters to start seeing analytics.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View (shown only on mobile) */}
                  <div className="sm:hidden">
                    {analytics?.storyPerformance?.length ? (
                      <div className="space-y-4">
                        {analytics.storyPerformance.map((story) => (
                          <div
                            key={story.id}
                            className="border border-parchment-200 dark:border-dark-700 rounded-lg p-4"
                          >
                            <h4 className="font-medium text-ink-900 dark:text-white text-sm mb-3">
                              {story.title}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-parchment-50 dark:bg-dark-800 p-2 rounded">
                                <span className="block text-ink-500 dark:text-ink-400">
                                  Reads
                                </span>
                                <span className="font-medium text-ink-900 dark:text-white">
                                  {story.reads}
                                </span>
                              </div>
                              <div className="bg-parchment-50 dark:bg-dark-800 p-2 rounded">
                                <span className="block text-ink-500 dark:text-ink-400">
                                  Collections
                                </span>
                                <span className="font-medium text-ink-900 dark:text-white">
                                  {story.collections}
                                </span>
                              </div>
                              <div className="bg-parchment-50 dark:bg-dark-800 p-2 rounded">
                                <span className="block text-ink-500 dark:text-ink-400">
                                  Votes
                                </span>
                                <span className="font-medium text-ink-900 dark:text-white">
                                  {story.votes}
                                </span>
                              </div>
                              <div className="bg-parchment-50 dark:bg-dark-800 p-2 rounded">
                                <span className="block text-ink-500 dark:text-ink-400">
                                  Revenue
                                </span>
                                <span className="font-medium text-ink-900 dark:text-white">
                                  {story.revenue.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-ink-500 dark:text-ink-400">
                        No story data available yet. Publish some chapters to
                        start seeing analytics.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "chapters":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-ink-900 dark:text-white">
                Draft Chapters
              </h3>
            </div>

            {drafts.length === 0 ? (
              <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center">
                <h4 className="text-lg font-medium text-ink-900 dark:text-white mb-2">
                  No draft chapters
                </h4>
                <p className="text-ink-600 dark:text-ink-400 mb-6">
                  You don't have any chapter drafts in progress
                </p>
                <Link to="/creator/new-story">
                  <Button variant="primary">Create New Story</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View (hidden on mobile) */}
                <div className="hidden sm:block bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-parchment-200 dark:divide-dark-700">
                      <thead className="bg-parchment-50 dark:bg-dark-900">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                          >
                            Chapter
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                          >
                            Story
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                          >
                            Last Edited
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                          >
                            Words
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-dark-800 divide-y divide-parchment-200 dark:divide-dark-700">
                        {drafts.map((draft) => (
                          <tr key={draft.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-ink-900 dark:text-white">
                                {draft.title}
                              </div>
                              {draft.preview && (
                                <div className="text-xs text-ink-500 dark:text-ink-400 mt-1 line-clamp-1">
                                  {draft.preview.substring(0, 50)}...
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-ink-900 dark:text-white">
                                {draft.storyTitle}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getDraftStatusBadge(draft.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600 dark:text-ink-300">
                              {formatDate(draft.lastEdited)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600 dark:text-ink-300">
                              {draft.wordCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-3 justify-end">
                                <Link
                                  to={`/creator/edit-chapter/${draft.id}`}
                                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                                >
                                  Edit
                                </Link>
                                {draft.status === "ready" && (
                                  <button
                                    onClick={() =>
                                      handlePublishChapter(
                                        draft.storyId,
                                        draft.id!,
                                        draft.storyTitle,
                                        draft.title,
                                        draft.order
                                      )
                                    }
                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                                  >
                                    Publish
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View (shown only on mobile) */}
                <div className="sm:hidden">
                  <div className="space-y-4">
                    {drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-sm font-medium text-ink-900 dark:text-white">
                              {draft.title}
                            </h4>
                            <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                              {draft.storyTitle}
                            </p>
                          </div>
                          {getDraftStatusBadge(draft.status)}
                        </div>

                        {draft.preview && (
                          <p className="text-xs text-ink-500 dark:text-ink-400 mb-3 line-clamp-2">
                            {draft.preview.substring(0, 80)}...
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-parchment-50 dark:bg-dark-800 p-2 rounded">
                            <span className="block text-ink-500 dark:text-ink-400">
                              Last Edited
                            </span>
                            <span className="font-medium text-ink-900 dark:text-white">
                              {formatDate(draft.lastEdited)}
                            </span>
                          </div>
                          <div className="bg-parchment-50 dark:bg-dark-800 p-2 rounded">
                            <span className="block text-ink-500 dark:text-ink-400">
                              Word Count
                            </span>
                            <span className="font-medium text-ink-900 dark:text-white">
                              {draft.wordCount}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            to={`/creator/edit-chapter/${draft.id}`}
                            className="flex-1 text-center py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            Edit
                          </Link>
                          {draft.status === "ready" && (
                            <button
                              onClick={() =>
                                handlePublishChapter(
                                  draft.storyId,
                                  draft.id!,
                                  draft.storyTitle,
                                  draft.title,
                                  draft.order
                                )
                              }
                              className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "assets":
        return <WriterAssets userId={currentUser?.uid || ""} />;

      default:
        return null;
    }
  };

  const handlePublishChapter = async (
    storyId: string,
    chapterId: string,
    _storyTitle: string,
    chapterTitle: string,
    chapterOrder: number
  ) => {
    try {
      setIsSaving(true);
      setPublishError(null);

      // Find the story and chapter data
      const story = stories.find((s) => s.id === storyId);
      const chapterData = drafts.find((d) => d.id === chapterId);

      if (!story || !chapterData) {
        throw new Error("Story or chapter not found");
      }

      if (!chapterData.choices || chapterData.choices.length !== 2) {
        throw new Error(
          "Chapter must have exactly two plot options for publication"
        );
      }

      // Generate plot options with metadata
      const filledOptions = chapterData.choices
        .map((choice) => choice.text)
        .filter((option) => option.trim().length > 0);

      if (filledOptions.length !== 2) {
        throw new Error("Exactly two plot options are required");
      }

      const plotOptions = await createPlotOptionsFromChoices(
        filledOptions,
        story.title,
        chapterTitle
      );

      // Get wallet clients for token creation
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Please connect your wallet to create plot tokens");
      }

      console.log("🚀 Publishing chapter with plot tokens...");

      // Add plot tokens to the existing chapter
      await addPlotTokensToChapter(
        chapterId,
        plotOptions,
        walletClient,
        publicClient
      );

      // Now publish the chapter
      await updateChapter(chapterId, {
        published: true,
        updatedAt: serverTimestamp() as Timestamp,
      });

      // Notify followers
      await notifyFollowersOfNewChapter(storyId, chapterId);

      console.log("✅ Chapter published with plot tokens");

      // Now show NFT creation modal as optional next step
      const chapter: ChapterData = {
        id: chapterId,
        storyId,
        title: chapterTitle,
        order: chapterOrder,
        published: true,
        hasChoicePoint: true,
        content: "", // Will be loaded when needed
        creatorId: currentUser?.uid || "",
      };

      setSelectedStory(story);
      setSelectedChapter(chapter);
      setShowNFTCreator(true);
      setIsSaving(false);
    } catch (error) {
      console.error("Error publishing chapter:", error);
      setPublishError(
        `Failed to publish chapter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsSaving(false);
    }
  };

  const handleNFTCreated = async (nftContractAddress: string) => {
    if (!selectedChapter || !selectedStory) return;

    try {
      setIsSaving(true);
      setPublishError(null);

      console.log(
        "✅ NFT Collection created successfully:",
        nftContractAddress
      );

      // Update the already-published chapter with NFT contract address using the new utility function
      await updateChapterWithNFT(selectedChapter.id!, nftContractAddress);

      console.log("📝 Chapter updated with NFT contract address");
      setIsSaving(false);
    } catch (error) {
      console.error("Error updating chapter with NFT:", error);
      setPublishError(
        `Failed to update chapter with NFT: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsSaving(false);
    }
  };

  // const handleNextStep = (step: "tokens" | "publish" | "draft") => {
  //   // Chapter is already published with tokens, just navigate appropriately
  //   setShowNFTCreator(false);
  //   setSelectedChapter(null);
  //   setSelectedStory(null);

  //   switch (step) {
  //     case "tokens":
  //       // Navigate to token assets view
  //       setActiveTab("assets");
  //       break;
  //     case "publish":
  //     case "draft":
  //     default:
  //       // Stay on current tab (chapters)
  //       setActiveTab("chapters");
  //       break;
  //   }
  // };

  const handleSkipNFT = async () => {
    // Chapter is already published, just close the modal
    setShowNFTCreator(false);
    setSelectedChapter(null);
    setSelectedStory(null);
    console.log("NFT creation skipped - chapter already published");
  };

  // const handleRepairStoryData = async () => {
  //   if (!currentUser) return;

  //   setIsRepairing(true);
  //   setError(null);

  //   try {
  //     await fixStoryDataInconsistencies(currentUser.uid);
  //     console.log("✅ Story data repair completed successfully");
  //   } catch (error) {
  //     console.error("❌ Story data repair failed:", error);
  //     setError(
  //       `Failed to repair story data: ${
  //         error instanceof Error ? error.message : "Unknown error"
  //       }`
  //     );
  //   } finally {
  //     setIsRepairing(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 pt-24 pb-16">
      <div className="content-wrapper">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white mb-2">
                Creator Dashboard
              </h1>
              <p className="text-ink-600 dark:text-ink-300">
                Manage your stories, track performance, and create new content
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-parchment-200 dark:border-dark-700">
            <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("stories")}
                className={`py-3 sm:py-4 px-1 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === "stories"
                    ? "border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-medium"
                    : "border-b-2 border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300 dark:text-ink-400 dark:hover:text-ink-300 dark:hover:border-dark-500"
                }`}
              >
                Stories
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-3 sm:py-4 px-1 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === "analytics"
                    ? "border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-medium"
                    : "border-b-2 border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300 dark:text-ink-400 dark:hover:text-ink-300 dark:hover:border-dark-500"
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("chapters")}
                className={`py-3 sm:py-4 px-1 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === "chapters"
                    ? "border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-medium"
                    : "border-b-2 border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300 dark:text-ink-400 dark:hover:text-ink-300 dark:hover:border-dark-500"
                }`}
              >
                Draft Chapters
              </button>
              <button
                onClick={() => setActiveTab("assets")}
                className={`py-3 sm:py-4 px-1 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === "assets"
                    ? "border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-medium"
                    : "border-b-2 border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300 dark:text-ink-400 dark:hover:text-ink-300 dark:hover:border-dark-500"
                }`}
              >
                Token Assets
              </button>
            </nav>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>

        {/* NFT Creator Modal */}
        <AnimatePresence>
          {showNFTCreator && selectedChapter && selectedStory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-dark-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold text-ink-900 dark:text-white">
                      Create NFT Collection (Optional)
                    </h2>
                    <button
                      onClick={() => setShowNFTCreator(false)}
                      className="text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300"
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

                  <div className="mb-6 p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg">
                    <h3 className="font-semibold text-ink-900 dark:text-white mb-2">
                      {selectedStory.title} - {selectedChapter.title}
                    </h3>
                    <p className="text-ink-600 dark:text-ink-400 text-sm">
                      Your chapter is now published with plot tokens! Optionally
                      create a limited edition NFT collection to give your
                      readers exclusive collectibles.
                    </p>
                  </div>

                  <ChapterNFTCreator
                    chapterId={selectedChapter.id!}
                    storyTitle={selectedStory.title}
                    chapterTitle={selectedChapter.title}
                    chapterNumber={selectedChapter.order}
                    onNFTCreated={handleNFTCreated}
                    onFirstEditionMinted={() => {
                      // NFT creation flow completed
                      console.log("First edition minted successfully");
                    }}
                  />

                  <div className="mt-6 pt-6 border-t border-parchment-200 dark:border-dark-700">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleSkipNFT}
                        className="flex-1 py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                      >
                        Skip NFT & Publish Now
                      </button>
                      <button
                        onClick={() => setShowNFTCreator(false)}
                        className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-ink-700 dark:text-ink-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-2 text-center">
                      You can always create NFT collections for published
                      chapters later
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreatorDashboardPage;
