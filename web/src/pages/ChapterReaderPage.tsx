import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import {
  subscribeToStory,
  getChapterById,
  subscribeToChapters,
  recordReadingProgress,
} from "../utils/storyService";
import { trackReadingTime, getRequiredReadTime } from "../utils/rewardService";
import type { StoryData, ChapterData } from "../utils/storyService";
import ChapterActions from "../components/ChapterActions";
import { useAuth } from "../utils/AuthContext";

const ChapterReaderPage = () => {
  const { storyId, chapterId } = useParams<{
    storyId: string;
    chapterId: string;
  }>();
  const { currentUser } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  // State for real data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<StoryData | null>(null);
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterData[]>([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [readTime, setReadTime] = useState(0); // Track reading time in seconds
  const [requiredReadTime, setRequiredReadTime] = useState(0); // Required reading time
  const [readTimeReached, setReadTimeReached] = useState(false); // Flag for when time is reached
  const [showProgressWidget, setShowProgressWidget] = useState(false); // Control visibility of progress widget

  // Fetch required read time when chapter loads
  useEffect(() => {
    if (!chapterId) return;

    const fetchRequiredTime = async () => {
      try {
        const time = await getRequiredReadTime(chapterId);
        setRequiredReadTime(time);
      } catch (error) {
        console.error("Error fetching required read time:", error);
      }
    };

    fetchRequiredTime();
  }, [chapterId]);

  // Track scroll position to calculate reading progress
  useEffect(() => {
    if (!contentRef.current || !chapter) return;

    const calculateReadingProgress = () => {
      const element = contentRef.current;
      if (!element) return;

      const totalHeight = element.scrollHeight - element.clientHeight;
      const scrollPosition = element.scrollTop;

      // Calculate progress as a percentage
      let progress = 0;
      if (totalHeight > 0) {
        progress = Math.min(
          Math.round((scrollPosition / totalHeight) * 100),
          100
        );
      }

      setReadingProgress(progress);

      // Show progress widget after user has scrolled a bit
      if (scrollPosition > 100 && !showProgressWidget) {
        setShowProgressWidget(true);
      } else if (scrollPosition <= 100 && showProgressWidget) {
        setShowProgressWidget(false);
      }
    };

    // Add scroll event listener
    const contentElement = contentRef.current;
    contentElement.addEventListener("scroll", calculateReadingProgress);

    // Initialize progress
    calculateReadingProgress();

    // Cleanup
    return () => {
      contentElement.removeEventListener("scroll", calculateReadingProgress);
    };
  }, [chapter, contentRef, showProgressWidget]);

  // Record reading progress when component unmounts or when progress changes significantly
  useEffect(() => {
    if (!currentUser || !storyId || !chapterId || !chapter) return;

    const recordProgress = () => {
      if (readingProgress > 0 && currentUser?.uid) {
        recordReadingProgress(
          currentUser.uid,
          storyId,
          chapterId,
          readingProgress
        );
      }
    };

    // Record progress when component unmounts
    return () => {
      recordProgress();
    };
  }, [currentUser, storyId, chapterId, chapter, readingProgress]);

  // Also record progress periodically while reading
  useEffect(() => {
    if (!currentUser || !storyId || !chapterId || !chapter) return;

    // Record progress every 30 seconds
    const interval = setInterval(() => {
      if (readingProgress > 0 && currentUser?.uid) {
        recordReadingProgress(
          currentUser.uid,
          storyId,
          chapterId,
          readingProgress
        );
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentUser, storyId, chapterId, chapter, readingProgress]);

  // Check if read time requirement is met
  useEffect(() => {
    setReadTimeReached(readTime >= requiredReadTime);
  }, [readTime, requiredReadTime]);

  // Track reading time
  useEffect(() => {
    if (!currentUser || !storyId || !chapterId || !chapter || !requiredReadTime)
      return;

    // Track time using setInterval
    let accumulatedTime = 0;
    let isPaused = false;

    // Use Page Visibility API to detect if user switches tabs
    const handleVisibilityChange = () => {
      isPaused = document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Update reading time every second
    const timeInterval = setInterval(() => {
      // Only increment time if not paused and not already reached required time
      if (!isPaused && accumulatedTime < requiredReadTime) {
        accumulatedTime += 1;
        setReadTime(accumulatedTime);

        // Record reading time to Firestore every 5 seconds
        if (accumulatedTime % 5 === 0 && currentUser?.uid) {
          trackReadingTime(
            currentUser.uid,
            storyId,
            chapterId,
            accumulatedTime
          );
        }

        // If we just reached the required time, do a final update
        if (accumulatedTime >= requiredReadTime) {
          trackReadingTime(
            currentUser.uid,
            storyId,
            chapterId,
            requiredReadTime
          );
        }
      }
    }, 1000);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(timeInterval);

      // Final recording of reading time
      if (currentUser?.uid && accumulatedTime > 0) {
        trackReadingTime(
          currentUser.uid,
          storyId,
          chapterId,
          Math.min(accumulatedTime, requiredReadTime)
        );
      }
    };
  }, [currentUser, storyId, chapterId, chapter, requiredReadTime]);

  // Scroll to top when component mounts or chapter changes
  useEffect(() => {
    // Scroll window to top
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

    // Also scroll the content container to top if it exists
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [chapterId]); // Dependency on chapterId ensures scroll happens when chapter changes

  // Fetch real data
  useEffect(() => {
    if (!storyId || !chapterId) {
      setError("Missing story or chapter ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to story updates
    const unsubscribeStory = subscribeToStory(storyId, (fetchedStory) => {
      if (fetchedStory) {
        setStory(fetchedStory);
      } else {
        setError("Story not found");
      }
    });

    // Subscribe to all chapters for navigation
    const unsubscribeChapters = subscribeToChapters(
      storyId,
      (fetchedChapters) => {
        setAllChapters(fetchedChapters);
      }
    );

    // Get the specific chapter
    const fetchChapter = async () => {
      try {
        const fetchedChapter = await getChapterById(chapterId);
        if (fetchedChapter) {
          console.log("🔍 ChapterReaderPage - Fetched chapter data:", {
            chapterId: fetchedChapter.id,
            chapterKeys: Object.keys(fetchedChapter),
            hasPlotTokens: !!fetchedChapter.plotTokens,
            plotTokens: fetchedChapter.plotTokens,
            hasPlotOptions: !!fetchedChapter.plotOptions,
            plotOptions: fetchedChapter.plotOptions,
            fullChapter: fetchedChapter,
          });
          setChapter(fetchedChapter);
        } else {
          setError("Chapter not found");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chapter:", err);
        setError("Failed to load chapter");
        setLoading(false);
      }
    };

    fetchChapter();

    return () => {
      unsubscribeStory();
      unsubscribeChapters();
    };
  }, [storyId, chapterId]);

  // Helper functions for navigation
  const getPreviousChapterId = () => {
    if (!chapter || !allChapters.length) return null;
    const currentIndex = allChapters.findIndex((ch) => ch.id === chapter.id);
    if (currentIndex <= 0) return null;
    return allChapters[currentIndex - 1].id;
  };

  const getNextChapterId = () => {
    if (!chapter || !allChapters.length) return null;
    const currentIndex = allChapters.findIndex((ch) => ch.id === chapter.id);
    if (currentIndex === -1 || currentIndex >= allChapters.length - 1)
      return null;
    return allChapters[currentIndex + 1].id;
  };

  // Format the timestamp for real data
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

  // Format read time display
  const formatReadTime = (seconds: number): string => {
    if (seconds < 1) {
      const milliseconds = Math.round(seconds * 1000);
      return `${milliseconds} milliseconds`;
    } else if (seconds < 60) {
      return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
    } else {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} ${minutes === 1 ? "min" : "mins"}`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !story || !chapter) {
    return (
      <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto bg-white dark:bg-dark-900 rounded-xl p-8 shadow-sm border border-parchment-200 dark:border-dark-700 text-center">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white mb-4">
              {error || "Chapter not found"}
            </h2>
            <p className="text-ink-600 dark:text-ink-300 mb-6">
              The chapter you're looking for might have been removed or doesn't
              exist.
            </p>
            <Link to={storyId ? `/stories/${storyId}` : "/stories"}>
              <Button variant="primary">Back to Story</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get navigation chapter IDs
  const previousChapterId = getPreviousChapterId();
  const nextChapterId = getNextChapterId();

  // Rest of the component
  return (
    <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
      {/* Chapter Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-dark-900 border-b border-parchment-200 dark:border-dark-700 shadow-sm py-2">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to={`/stories/${storyId}`}
                className="inline-flex items-center text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="font-medium text-sm hidden sm:inline">
                  Back to Story
                </span>
              </Link>

              <div className="hidden sm:block mx-4 h-5 w-px bg-parchment-300 dark:bg-dark-600"></div>

              <div className="hidden sm:block text-sm">
                <span className="text-ink-500 dark:text-ink-400">
                  {story.title}
                </span>
                <span className="mx-2 text-ink-400 dark:text-ink-500">•</span>
                <span className="text-ink-700 dark:text-ink-200">
                  {chapter.title}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {previousChapterId && (
                <Link
                  to={`/stories/${storyId}/chapters/${previousChapterId}`}
                  className="p-1.5 sm:p-2 rounded-md text-ink-600 dark:text-ink-300 hover:bg-parchment-100 dark:hover:bg-dark-800"
                  title="Previous Chapter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Link>
              )}

              {nextChapterId && (
                <Link
                  to={`/stories/${storyId}/chapters/${nextChapterId}`}
                  className="p-1.5 sm:p-2 rounded-md text-ink-600 dark:text-ink-300 hover:bg-parchment-100 dark:hover:bg-dark-800"
                  title="Next Chapter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Reading Progress Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: showProgressWidget ? 1 : 0,
          y: showProgressWidget ? 0 : 20,
        }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 right-6 z-30 bg-white dark:bg-dark-800 shadow-lg rounded-lg border border-parchment-200 dark:border-dark-600 overflow-hidden"
      >
        <div className="p-3 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-ink-800 dark:text-white">
              Reading Progress
            </div>
            {readTimeReached && (
              <span className="text-green-600 dark:text-green-400 text-xs font-medium flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Complete!
              </span>
            )}
          </div>

          {/* Read Time Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-ink-600 dark:text-ink-300 mb-1">
              <span>Read Time: {formatReadTime(readTime)}</span>
              <span>Required: {formatReadTime(requiredReadTime)}</span>
            </div>
            <div className="w-full bg-parchment-200 dark:bg-dark-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  readTimeReached
                    ? "bg-green-500 dark:bg-green-600"
                    : "bg-primary-600 dark:bg-primary-500"
                }`}
                style={{
                  width: `${Math.min(
                    (readTime / requiredReadTime) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Reading Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-ink-600 dark:text-ink-300 mb-1">
              <span>Page Progress</span>
              <span>{readingProgress}%</span>
            </div>
            <div className="w-full bg-parchment-200 dark:bg-dark-700 rounded-full h-2">
              <div
                className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                style={{ width: `${readingProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 mt-8">
        {/* Mobile Layout (unchanged) - Stack content vertically */}
        <div className="lg:hidden">
          <div className="max-w-3xl mx-auto">
            {/* Chapter Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-ink-900 dark:text-white mb-4 chapter-title">
                {chapter.title}
              </h1>
              <div className="flex items-center text-sm text-ink-600 dark:text-ink-300">
                <span>{formatDate(chapter.createdAt)}</span>
                <span className="mx-2">•</span>
                <span>
                  {requiredReadTime > 0
                    ? formatReadTime(requiredReadTime)
                    : Math.ceil(chapter.content.split(" ").length / 200) +
                      " min"}{" "}
                  read
                </span>
                {readTimeReached && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Read Complete
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Chapter Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-16 max-h-[70vh] overflow-y-auto border border-parchment-200 dark:border-dark-700 rounded-lg p-6 bg-white dark:bg-dark-900 shadow-sm"
              ref={contentRef}
            >
              <div
                className="prose prose-lg prose-brown dark:prose-invert max-w-none whitespace-pre-line break-anywhere"
                dangerouslySetInnerHTML={{ __html: chapter.content }}
              />
            </motion.div>

            {/* Chapter Navigation */}
            <div className="border-t border-parchment-200 dark:border-dark-700 pt-8 mb-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Navigation */}
                <div className="flex items-center space-x-4">
                  {previousChapterId && (
                    <Link
                      to={`/stories/${storyId}/chapters/${previousChapterId}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-parchment-100 dark:bg-dark-800 text-ink-800 dark:text-ink-200 rounded-md text-sm font-medium hover:bg-parchment-200 dark:hover:bg-dark-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Previous Chapter
                    </Link>
                  )}

                  {nextChapterId && (
                    <Link
                      to={`/stories/${storyId}/chapters/${nextChapterId}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Next Chapter
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Choice Points or Chapter Actions */}
            <ChapterActions
              storyId={storyId}
              chapterId={chapterId}
              creatorId={story.creatorId}
              choiceOptions={chapter.choiceOptions}
              hasChoicePoint={chapter.hasChoicePoint}
              readTime={readTime}
              requiredReadTime={requiredReadTime}
              chapter={chapter}
              storyTitle={story.title}
              chapterTitle={chapter.title}
            />

            {/* Back to Story Link */}
            <div className="text-center">
              <Link
                to={`/stories/${storyId}`}
                className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to {story.title}
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Two column layout with sidebar */}
        <div className="hidden lg:flex lg:gap-8 max-w-7xl mx-auto">
          {/* Main Content Area - Left Side */}
          <div className="flex-1 max-w-4xl">
            {/* Chapter Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-ink-900 dark:text-white mb-4 chapter-title">
                {chapter.title}
              </h1>
              <div className="flex items-center text-sm text-ink-600 dark:text-ink-300">
                <span>{formatDate(chapter.createdAt)}</span>
                <span className="mx-2">•</span>
                <span>
                  {requiredReadTime > 0
                    ? formatReadTime(requiredReadTime)
                    : Math.ceil(chapter.content.split(" ").length / 200) +
                      " min"}{" "}
                  read
                </span>
                {readTimeReached && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Read Complete
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Chapter Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 max-h-[calc(100vh-200px)] overflow-y-auto border border-parchment-200 dark:border-dark-700 rounded-lg p-8 bg-white dark:bg-dark-900 shadow-sm"
              ref={contentRef}
            >
              <div
                className="prose prose-lg prose-brown dark:prose-invert max-w-none whitespace-pre-line break-anywhere"
                dangerouslySetInnerHTML={{ __html: chapter.content }}
              />
            </motion.div>

            {/* Chapter Navigation */}
            <div className="border-t border-parchment-200 dark:border-dark-700 pt-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {previousChapterId && (
                    <Link
                      to={`/stories/${storyId}/chapters/${previousChapterId}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-parchment-100 dark:bg-dark-800 text-ink-800 dark:text-ink-200 rounded-md text-sm font-medium hover:bg-parchment-200 dark:hover:bg-dark-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Previous Chapter
                    </Link>
                  )}

                  {nextChapterId && (
                    <Link
                      to={`/stories/${storyId}/chapters/${nextChapterId}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Next Chapter
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  )}
                </div>

                {/* Back to Story Link */}
                <Link
                  to={`/stories/${storyId}`}
                  className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to {story.title}
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-24">
              {/* Chapter Actions Sidebar */}
              <ChapterActions
                storyId={storyId}
                chapterId={chapterId}
                creatorId={story.creatorId}
                choiceOptions={chapter.choiceOptions}
                hasChoicePoint={chapter.hasChoicePoint}
                readTime={readTime}
                requiredReadTime={requiredReadTime}
                chapter={chapter}
                storyTitle={story.title}
                chapterTitle={chapter.title}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterReaderPage;
