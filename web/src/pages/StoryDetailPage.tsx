import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import {
  subscribeToStory,
  subscribeToChapters,
  recordStoryView,
  trackStoryReader,
  ensureStoryNumericFields,
} from "../utils/storyService";
import type { StoryData, ChapterData } from "../utils/storyService";
import { useAuth } from "../utils/AuthContext";

// Function to get placeholder image based on genre
const getPlaceholderImage = (genre: string) => {
  switch (genre.toLowerCase()) {
    case "sci-fi":
      return "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1200&h=600&q=80";
    case "fantasy":
      return "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=1200&h=600&q=80";
    case "horror":
      return "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&h=600&q=80";
    case "steampunk":
      return "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&h=600&q=80";
    case "cyberpunk":
      return "https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=1200&h=600&q=80";
    default:
      return "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=600&q=80";
  }
};

// Function to get avatar image
const getAvatarUrl = (authorName: string | null | undefined) => {
  if (!authorName) return `https://i.pravatar.cc/150?u=anonymous`;
  return `https://i.pravatar.cc/150?u=${authorName.replace(/\s+/g, "")}`;
};

const StoryDetailPage = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "chapters">(
    "overview"
  );
  const [story, setStory] = useState<StoryData | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewRecorded, setViewRecorded] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Subscribe to real-time story data
  useEffect(() => {
    if (!storyId) {
      setError("Story ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time story updates
    const unsubscribeStory = subscribeToStory(storyId, (fetchedStory) => {
      if (fetchedStory) {
        setStory(fetchedStory);

        // Fix any NaN values in the story
        ensureStoryNumericFields(storyId).catch((err) =>
          console.error("Error fixing numeric fields:", err)
        );

        // Record view and track reader only once per session and if not creator
        if (!viewRecorded && fetchedStory) {
          setViewRecorded(true);

          // Record the view
          recordStoryView(storyId, currentUser?.uid || null);

          // Track the reader if user is authenticated
          if (currentUser?.uid) {
            trackStoryReader(storyId, currentUser.uid);
          }
        }
      } else {
        setError("Story not found");
      }
      setLoading(false);
    });

    // Subscribe to real-time chapter updates
    const unsubscribeChapters = subscribeToChapters(
      storyId,
      (fetchedChapters) => {
        setChapters(fetchedChapters);
      }
    );

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      unsubscribeStory();
      unsubscribeChapters();
    };
  }, [storyId, currentUser, viewRecorded]);

  // Formatted dates for display
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

  // Get cover image URL
  const getCoverImageUrl = () => {
    if (!story) return getPlaceholderImage("default");

    if (story.coverImage && story.coverImage.startsWith("http")) {
      return story.coverImage;
    }
    return getPlaceholderImage(story.genre);
  };

  // Create a mock chapter structure from ChapterData for compatibility
  const formatChapterForDisplay = (chapter: ChapterData) => {
    return {
      id: chapter.id || "",
      title: chapter.title,
      content: chapter.content,
      published: chapter.published,
      publishedAt: chapter.createdAt,
      votes: 0, // We don't have this data yet
      collectors: 0, // We don't have this data yet
      preview: chapter.content.substring(0, 150) + "...",
      htmlPreview: `<div class="whitespace-pre-line break-anywhere">${
        chapter.content.substring(0, 150) + "..."
      }</div>`,
      estimatedReadingTime: Math.ceil(chapter.content.split(" ").length / 200), // Rough estimate
      choices:
        chapter.choiceOptions?.map((option, index) => ({
          id: `ch${chapter.id}-opt${index}`,
          text: option,
        })) || [],
    };
  };

  if (loading) {
    return (
      <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto bg-white dark:bg-dark-900 rounded-xl p-8 shadow-sm border border-parchment-200 dark:border-dark-700 text-center">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white mb-4">
              {error || "Story not found"}
            </h2>
            <p className="text-ink-600 dark:text-ink-300 mb-6">
              The story you're looking for might have been removed or doesn't
              exist.
            </p>
            <Link to="/stories">
              <Button variant="primary">Back to Stories</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format chapters for display
  const displayChapters = chapters.map(formatChapterForDisplay);

  return (
    <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Story Header */}
          <div className="relative">
            {/* Cover Image (Large Screens) */}
            <div className="hidden md:block h-96 w-full rounded-xl overflow-hidden mb-8 bg-parchment-200 dark:bg-dark-800">
              <img
                src={getCoverImageUrl()}
                alt={story.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getPlaceholderImage(story.genre);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent"></div>
            </div>

            <div className="md:absolute md:bottom-8 md:left-8 md:right-8 z-10">
              {/* Cover Image (Mobile) */}
              <div className="md:hidden h-64 w-full rounded-xl overflow-hidden mb-6 bg-parchment-200 dark:bg-dark-800 relative">
                <img
                  src={getCoverImageUrl()}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getPlaceholderImage(story.genre);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent"></div>

                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-500 text-white mb-2">
                    {story.genre}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1 break-anywhere">
                    {story.title}
                  </h1>
                </div>
              </div>

              {/* Desktop Title Section */}
              <div className="hidden md:block">
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-500 text-white mb-2">
                  {story.genre}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-2 break-anywhere">
                  {story.title}
                </h1>
                <div className="flex items-center text-white/90">
                  <img
                    src={
                      story.creatorId
                        ? `https://i.pravatar.cc/150?u=${story.creatorId}`
                        : getAvatarUrl("Anonymous")
                    }
                    alt={story.creatorEmail?.split("@")[0] || "Anonymous"}
                    className="w-8 h-8 rounded-full mr-2 object-cover"
                  />
                  <span className="font-medium">
                    {story.creatorEmail?.split("@")[0] || "Anonymous"}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{story.chapterCount} Chapters</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(story.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Author Info */}
          <div className="flex items-center md:hidden mb-6 text-ink-700 dark:text-ink-200">
            <img
              src={
                story.creatorId
                  ? `https://i.pravatar.cc/150?u=${story.creatorId}`
                  : getAvatarUrl("Anonymous")
              }
              alt={story.creatorEmail?.split("@")[0] || "Anonymous"}
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
            <span className="font-medium">
              {story.creatorEmail?.split("@")[0] || "Anonymous"}
            </span>
            <span className="mx-2">•</span>
            <span>{story.chapterCount} Chapters</span>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-parchment-200 dark:border-dark-700 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 font-medium text-sm sm:text-base transition-colors ${
                activeTab === "overview"
                  ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                  : "text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("chapters")}
              className={`px-4 py-3 font-medium text-sm sm:text-base transition-colors ${
                activeTab === "chapters"
                  ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                  : "text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white"
              }`}
            >
              Chapters
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === "overview" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="prose prose-brown dark:prose-invert max-w-none">
                    <h2 className="font-display text-2xl font-bold mb-4">
                      About this story
                    </h2>
                    <p className="text-ink-700 dark:text-ink-200 whitespace-pre-line">
                      {story.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-6">
                      {story.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-parchment-100 dark:bg-dark-800 text-ink-700 dark:text-ink-200 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-8 space-y-4">
                      <h2 className="font-display text-2xl font-bold">
                        Recent Chapters
                      </h2>
                      {displayChapters
                        .filter((chapter) => chapter.published)
                        .slice(0, 3)
                        .map((chapter) => (
                          <Link
                            key={chapter.id}
                            to={`/stories/${story.id}/chapters/${chapter.id}`}
                            className="block p-4 bg-white dark:bg-dark-900 rounded-lg border border-parchment-200 dark:border-dark-700 hover:shadow-md transition-shadow"
                          >
                            <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-2 break-anywhere">
                              {chapter.title}
                            </h3>
                            <div
                              className="text-ink-600 dark:text-ink-300 text-sm line-clamp-2 mb-3 whitespace-pre-line break-anywhere"
                              dangerouslySetInnerHTML={{
                                __html: chapter.htmlPreview,
                              }}
                            />
                            <div className="flex items-center justify-between text-sm text-ink-500 dark:text-ink-400">
                              <span>{formatDate(chapter.publishedAt)}</span>
                              <span>
                                {chapter.estimatedReadingTime} min read
                              </span>
                            </div>
                          </Link>
                        ))}

                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => setActiveTab("chapters")}
                        >
                          View All Chapters
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6">
                    <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white mb-4">
                      All Chapters
                    </h2>

                    {displayChapters.map((chapter, index) => (
                      <div
                        key={chapter.id}
                        className={`relative p-5 ${
                          chapter.published
                            ? "bg-white dark:bg-dark-900"
                            : "bg-parchment-100 dark:bg-dark-800"
                        } rounded-lg border ${
                          chapter.published
                            ? "border-parchment-200 dark:border-dark-700"
                            : "border-parchment-300 dark:border-dark-600 border-dashed"
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold text-sm mr-4">
                            {index + 1}
                          </div>

                          <div className="flex-grow">
                            <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-2 break-anywhere">
                              {chapter.title}
                            </h3>

                            <div
                              className="text-ink-600 dark:text-ink-300 text-sm line-clamp-2 mb-3 whitespace-pre-line break-anywhere"
                              dangerouslySetInnerHTML={{
                                __html: chapter.htmlPreview,
                              }}
                            />

                            {chapter.published ? (
                              <div className="flex flex-wrap items-center justify-between gap-y-4">
                                <div className="flex items-center text-sm text-ink-500 dark:text-ink-400 space-x-4">
                                  <span>{formatDate(chapter.publishedAt)}</span>
                                  {chapter.estimatedReadingTime && (
                                    <span>
                                      {chapter.estimatedReadingTime} min read
                                    </span>
                                  )}
                                  <div className="flex items-center">
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
                                        d="M5 15l7-7 7 7"
                                      />
                                    </svg>
                                    {chapter.votes}
                                  </div>
                                  <div className="flex items-center">
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
                                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                      />
                                    </svg>
                                    {chapter.collectors}
                                  </div>
                                </div>

                                <Link
                                  to={`/stories/${story.id}/chapters/${chapter.id}`}
                                  className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 transition-colors"
                                >
                                  Read Chapter
                                </Link>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-ink-500 dark:text-ink-400 italic">
                                  Coming soon
                                </span>

                                <button
                                  className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-ink-600 dark:text-ink-300 bg-parchment-200 dark:bg-dark-700 cursor-not-allowed opacity-70"
                                  disabled
                                >
                                  Not Released
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {chapter.published && chapter.choices.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-parchment-100 dark:border-dark-800">
                            <h4 className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-3">
                              Story Choices
                            </h4>
                            <div className="space-y-2">
                              {chapter.choices.map((choice) => (
                                <div
                                  key={choice.id}
                                  className="flex items-center p-3 bg-parchment-50 dark:bg-dark-800 rounded-md border border-parchment-200 dark:border-dark-700"
                                >
                                  <div className="w-5 h-5 rounded-full border-2 border-primary-500 mr-3"></div>
                                  <span className="text-sm text-ink-800 dark:text-ink-100">
                                    {choice.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-parchment-200 dark:border-dark-700 shadow-sm mb-6">
                  <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-4">
                    Start Reading
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-600 dark:text-ink-300">
                        Published
                      </span>
                      <span className="text-sm font-medium text-ink-900 dark:text-white">
                        {formatDate(story.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-600 dark:text-ink-300">
                        Chapters
                      </span>
                      <span className="text-sm font-medium text-ink-900 dark:text-white">
                        {displayChapters.filter((ch) => ch.published).length} of{" "}
                        {displayChapters.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-600 dark:text-ink-300">
                        Views
                      </span>
                      <span className="text-sm font-medium text-ink-900 dark:text-white">
                        {story.viewCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-600 dark:text-ink-300">
                        Readers
                      </span>
                      <span className="text-sm font-medium text-ink-900 dark:text-white">
                        {story.readerCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-600 dark:text-ink-300">
                        Last Updated
                      </span>
                      <span className="text-sm font-medium text-ink-900 dark:text-white">
                        {formatDate(story.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link
                      to={
                        displayChapters.length > 0
                          ? `/stories/${story.id}/chapters/${displayChapters[0].id}`
                          : `/stories/${story.id}`
                      }
                      className="block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400 rounded-md text-center font-medium transition-colors"
                    >
                      Start Reading
                    </Link>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-parchment-200 dark:border-dark-700 shadow-sm">
                  <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-4">
                    About the Author
                  </h3>

                  <div className="flex items-center mb-4">
                    <img
                      src={
                        story.creatorId
                          ? `https://i.pravatar.cc/150?u=${story.creatorId}`
                          : getAvatarUrl("Anonymous")
                      }
                      alt={story.creatorEmail?.split("@")[0] || "Anonymous"}
                      className="w-12 h-12 rounded-full mr-3 object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-ink-900 dark:text-white">
                        {story.creatorEmail?.split("@")[0] || "Anonymous"}
                      </h4>
                      <p className="text-sm text-ink-500 dark:text-ink-400">
                        Writer • {story.creatorId ? "1" : "0"} Stories
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
                    Science fiction author specializing in quantum mechanics and
                    multiverse theories. Former physicist with a passion for
                    making complex concepts accessible through storytelling.
                  </p>

                  <button className="block w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-primary-600 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-primary-400 rounded-md text-center font-medium border border-primary-600 dark:border-primary-500 transition-colors">
                    Follow Author
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;
