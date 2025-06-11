import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StoryCard from "../components/story/StoryCard";
import StoryFilter from "../components/story/StoryFilter";
import { Link } from "react-router-dom";
import { subscribeToStories } from "../utils/storyService";
import type { StoriesFilter, StoryData } from "../utils/storyService";

// Filter and sort options
const GENRE_FILTERS = [
  "All",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Cyberpunk",
  "Steampunk",
  "Mystery",
  "Romance",
  "Adventure",
  "Historical",
];

const SORT_OPTIONS = ["Trending", "Most Collected", "Newest", "Most Chapters"];

const StoriesPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Trending");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time stories data
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Convert the UI filter/sort to the service filter format
    const filter: StoriesFilter = {};

    // Apply genre filter if not "All"
    if (activeFilter !== "All") {
      filter.genre = activeFilter;
    }

    // Apply sort order
    switch (activeSort) {
      case "Trending":
        filter.sortBy = "viewCount";
        filter.sortDirection = "desc";
        break;
      case "Most Collected":
        filter.sortBy = "collectCount";
        filter.sortDirection = "desc";
        break;
      case "Newest":
        filter.sortBy = "createdAt";
        filter.sortDirection = "desc";
        break;
      case "Most Chapters":
        filter.sortBy = "chapterCount";
        filter.sortDirection = "desc";
        break;
    }

    // Subscribe to real-time updates
    const unsubscribe = subscribeToStories((stories) => {
      setStories(stories);
      setLoading(false);
    }, filter);

    // Cleanup function to unsubscribe when component unmounts
    // or when filter/sort changes
    return () => {
      unsubscribe();
    };
  }, [activeFilter, activeSort]);

  // Format story data for the StoryCard component
  const formatStoryForCard = (story: StoryData) => {
    return {
      id: story.id || "",
      title: story.title,
      coverImage: story.coverImage,
      author: story.creatorEmail?.split("@")[0] || "Anonymous",
      authorAvatar: `https://i.pravatar.cc/150?u=${story.creatorId}`,
      chapters: story.chapterCount,
      genre: story.genre,
      votes: 0, // We don't have this data yet
      collectors: story.collectCount,
      description: story.description,
      tags: story.tags,
    };
  };

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
          <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white mb-2">
            Explore Stories
          </h1>
          <p className="text-ink-600 dark:text-ink-300 flex items-center">
            Discover interactive stories where your choices shape the narrative.
            Collect chapters, vote on plot directions, and join a community of
            storytellers.
            <Link
              to="/discover"
              className="ml-2 text-primary-600 dark:text-primary-400 hover:underline"
            >
              Try advanced discovery
            </Link>
          </p>
        </motion.div>

        {/* Filters and Sorting */}
        <StoryFilter
          genres={GENRE_FILTERS}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          sortOptions={SORT_OPTIONS}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md my-6">
            <p className="font-medium">Error loading stories</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Stories Grid */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`grid ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                : "grid-cols-1 gap-4"
            } mt-8`}
          >
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={formatStoryForCard(story)}
                viewMode={viewMode}
              />
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && stories.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-display font-medium text-ink-700 dark:text-ink-300 mb-2">
              No stories found
            </h3>
            <p className="text-ink-600 dark:text-ink-400">
              Try adjusting your filters or check back later for new stories
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesPage;
