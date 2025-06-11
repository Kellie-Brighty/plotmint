import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { subscribeToStories } from "../utils/storyService";
import type { StoryData } from "../utils/storyService";
import type { StoriesFilter } from "../utils/storyService";

// Mock data for categories
const CATEGORIES = [
  { id: "fantasy", name: "Fantasy", count: 126 },
  { id: "sci-fi", name: "Sci-Fi", count: 98 },
  { id: "mystery", name: "Mystery", count: 76 },
  { id: "romance", name: "Romance", count: 64 },
  { id: "horror", name: "Horror", count: 42 },
  { id: "adventure", name: "Adventure", count: 53 },
  { id: "historical", name: "Historical", count: 38 },
  { id: "crime", name: "Crime", count: 31 },
];


// Mock data for popular tags
const POPULAR_TAGS = [
  { id: "adventure", name: "Adventure", count: 238 },
  { id: "sci-fi", name: "Sci-Fi", count: 215 },
  { id: "fantasy", name: "Fantasy", count: 197 },
  { id: "mystery", name: "Mystery", count: 183 },
  { id: "romance", name: "Romance", count: 164 },
  { id: "dystopian", name: "Dystopian", count: 142 },
  { id: "thriller", name: "Thriller", count: 136 },
  { id: "horror", name: "Horror", count: 118 },
  { id: "historical", name: "Historical", count: 104 },
  { id: "cyberpunk", name: "Cyberpunk", count: 87 },
  { id: "magic", name: "Magic", count: 83 },
  { id: "time-travel", name: "Time Travel", count: 75 },
  { id: "supernatural", name: "Supernatural", count: 68 },
  { id: "drama", name: "Drama", count: 62 },
  { id: "space", name: "Space", count: 57 },
];

type FilterType = "trending" | "recent" | "popular" | "recommended";

interface StoryCardData {
  id?: string;
  title: string;
  author: string;
  authorId: string;
  coverImage: string;
  tags: string[];
  collectCount: number;
  readCount: number;
  publishedAt: any;
  summary: string;
}

const DiscoveryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("trending");
  const [stories, setStories] = useState<StoryCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Convert UI filters to service filter format
    const filter: StoriesFilter = {
      published: true,
    };

    // Set sort order based on activeFilter
    switch (activeFilter) {
      case "trending":
        filter.sortBy = "viewCount";
        filter.sortDirection = "desc";
        break;
      case "recent":
        filter.sortBy = "createdAt";
        filter.sortDirection = "desc";
        break;
      case "popular":
        filter.sortBy = "collectCount";
        filter.sortDirection = "desc";
        break;
      case "recommended":
        // For now, just use the same as trending
        filter.sortBy = "viewCount";
        filter.sortDirection = "desc";
        break;
    }

    // Add category filter if any selected
    if (selectedCategories.length === 1) {
      // We can only filter by one genre in Firebase query
      filter.genre = selectedCategories[0];
    }

    // Add tags to filter
    if (selectedTags.length > 0) {
      filter.tags = selectedTags;
    }

    // Subscribe to real-time updates
    const unsubscribe = subscribeToStories((fetchedStories: StoryData[]) => {
      // Filter stories by search query if provided
      let filteredStories = fetchedStories;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        filteredStories = filteredStories.filter(
          (story: StoryData) =>
            story.title.toLowerCase().includes(query) ||
            (story.description &&
              story.description.toLowerCase().includes(query)) ||
            (story.genre && story.genre.toLowerCase().includes(query)) ||
            story.tags.some((tag: string) => tag.toLowerCase().includes(query))
        );
      }

      // Map to UI format
      const mappedStories = filteredStories.map(storyToCardFormat);
      setStories(mappedStories);
      setLoading(false);
    }, filter);

    // Clean up subscription on unmount or filter change
    return () => unsubscribe();
  }, [activeFilter, selectedCategories, selectedTags, searchQuery]);

  // Map Firebase story data to UI format
  const storyToCardFormat = (story: StoryData): StoryCardData => {
    return {
      id: story.id,
      title: story.title,
      author: story.creatorEmail?.split("@")[0] || "Anonymous",
      authorId: story.creatorId,
      coverImage: story.coverImage,
      tags: story.tags,
      collectCount: story.collectCount,
      readCount: story.viewCount,
      publishedAt: story.createdAt,
      summary: story.description,
    };
  };

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

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(
        selectedCategories.filter((id) => id !== categoryId)
      );
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
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
            Discover Stories
          </h1>
          <p className="text-ink-600 dark:text-ink-300">
            Find your next favorite story with our advanced discovery features.
          </p>
        </motion.div>

        {/* Search and Filters Section */}
        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-5 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stories, authors, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-parchment-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="absolute left-3 top-3.5 text-ink-400 dark:text-ink-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3.5 text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-ink-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveFilter("trending")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === "trending"
                  ? "bg-primary-600 text-white dark:bg-primary-500"
                  : "bg-parchment-100 text-ink-700 dark:bg-dark-800 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => setActiveFilter("recent")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === "recent"
                  ? "bg-primary-600 text-white dark:bg-primary-500"
                  : "bg-parchment-100 text-ink-700 dark:bg-dark-800 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setActiveFilter("popular")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === "popular"
                  ? "bg-primary-600 text-white dark:bg-primary-500"
                  : "bg-parchment-100 text-ink-700 dark:bg-dark-800 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
              }`}
            >
              Most Read
            </button>
            <button
              onClick={() => setActiveFilter("recommended")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === "recommended"
                  ? "bg-primary-600 text-white dark:bg-primary-500"
                  : "bg-parchment-100 text-ink-700 dark:bg-dark-800 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
              }`}
            >
              Recommended
            </button>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-ink-900 dark:text-white mb-3">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center ${
                    selectedCategories.includes(category.id)
                      ? "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-300 dark:border-primary-700"
                      : "bg-parchment-100 text-ink-700 dark:bg-dark-800 dark:text-ink-300 border border-parchment-200 dark:border-dark-700 hover:bg-parchment-200 dark:hover:bg-dark-700"
                  }`}
                >
                  {category.name}
                  <span className="ml-1.5 text-xs text-ink-500 dark:text-ink-400">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div>
            <h3 className="text-sm font-medium text-ink-900 dark:text-white mb-3">
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.slice(0, 12).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs ${
                    selectedTags.includes(tag.id)
                      ? "bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300 border border-secondary-300 dark:border-secondary-700"
                      : "bg-parchment-50 text-ink-600 dark:bg-dark-800 dark:text-ink-300 border border-parchment-200 dark:border-dark-700 hover:bg-parchment-100 dark:hover:bg-dark-700"
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md mb-6">
            <p className="font-medium">Error loading stories</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                {stories.length} {stories.length === 1 ? "Story" : "Stories"}{" "}
                Found
              </h2>
              {(selectedCategories.length > 0 ||
                selectedTags.length > 0 ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedTags([]);
                    setSearchQuery("");
                  }}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                >
                  Clear Filters
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>

            {stories.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-ink-300 dark:text-ink-600 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-ink-900 dark:text-white mb-2">
                  No stories found
                </h3>
                <p className="text-ink-600 dark:text-ink-400 max-w-md mx-auto">
                  Try adjusting your search or filter criteria to find what
                  you're looking for.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-sm border border-parchment-200 dark:border-dark-700 flex flex-col h-full hover:shadow-md transition-shadow"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-2 flex flex-wrap gap-1">
                        {story.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-parchment-100 dark:bg-dark-800 text-ink-700 dark:text-ink-300 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-1">
                        {story.title}
                      </h3>
                      <Link
                        to={`/profile/${story.authorId}`}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-3"
                      >
                        by {story.author}
                      </Link>
                      <p className="text-sm text-ink-600 dark:text-ink-300 mb-4 line-clamp-3 flex-1">
                        {story.summary}
                      </p>
                      <div className="mt-auto flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                            {story.collectCount}
                          </span>
                          <span className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {story.readCount}
                          </span>
                        </div>
                        <span>{formatDate(story.publishedAt)}</span>
                      </div>
                      <div className="mt-4">
                        <Link to={`/stories/${story.id}`}>
                          <Button variant="primary" size="sm" fullWidth>
                            Read Story
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoveryPage;
