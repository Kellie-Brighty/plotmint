import { useState } from "react";
import { motion } from "framer-motion";
import StoryCard from "../components/story/StoryCard";
import StoryFilter from "../components/story/StoryFilter";

// Temporary mock data for stories
const MOCK_STORIES = [
  {
    id: "1",
    title: "The Quantum Nexus",
    coverImage:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&q=80",
    author: "Elena Voss",
    authorAvatar: "https://i.pravatar.cc/150?u=ElenaVoss",
    chapters: 7,
    genre: "Sci-Fi",
    votes: 482,
    collectors: 218,
    description:
      "A journey through the multiverse that challenges our understanding of reality and fate.",
    tags: ["science fiction", "multiverse", "adventure"],
  },
  {
    id: "2",
    title: "Shadows of Eldoria",
    coverImage:
      "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&h=600&q=80",
    author: "Marcus Chen",
    authorAvatar: "https://i.pravatar.cc/150?u=MarcusChen",
    chapters: 12,
    genre: "Fantasy",
    votes: 376,
    collectors: 195,
    description:
      "An epic tale of magic, betrayal, and courage in the ancient realm of Eldoria.",
    tags: ["fantasy", "magic", "adventure"],
  },
  {
    id: "3",
    title: "Whispers in the Void",
    coverImage:
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=600&q=80",
    author: "Aisha Johnson",
    authorAvatar: "https://i.pravatar.cc/150?u=AishaJohnson",
    chapters: 5,
    genre: "Horror",
    votes: 214,
    collectors: 103,
    description:
      "Strange voices call from beyond the stars, leading a small town into madness.",
    tags: ["horror", "cosmic", "mystery"],
  },
  {
    id: "4",
    title: "Chronicles of New Albion",
    coverImage:
      "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=800&h=600&q=80",
    author: "Thomas Wright",
    authorAvatar: "https://i.pravatar.cc/150?u=ThomasWright",
    chapters: 9,
    genre: "Steampunk",
    votes: 301,
    collectors: 147,
    description:
      "Steam-powered automatons and aristocratic intrigue in an alternate Victorian London.",
    tags: ["steampunk", "alternate history", "mystery"],
  },
  {
    id: "5",
    title: "The Last Dreamer",
    coverImage:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&q=80",
    author: "Sofia Mendes",
    authorAvatar: "https://i.pravatar.cc/150?u=SofiaMendes",
    chapters: 6,
    genre: "Fantasy",
    votes: 267,
    collectors: 128,
    description:
      "When dreams begin to fade from the world, one person holds the key to their return.",
    tags: ["fantasy", "dreams", "adventure"],
  },
  {
    id: "6",
    title: "Neon Streets",
    coverImage:
      "https://images.unsplash.com/photo-1520995051695-8dce7195e159?w=800&h=600&q=80",
    author: "Koji Yamamoto",
    authorAvatar: "https://i.pravatar.cc/150?u=KojiYamamoto",
    chapters: 8,
    genre: "Cyberpunk",
    votes: 342,
    collectors: 163,
    description:
      "A hacker's fight for survival in a corporate-controlled dystopian future.",
    tags: ["cyberpunk", "future", "thriller"],
  },
];

// Filter and sort options
const GENRE_FILTERS = [
  "All",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Cyberpunk",
  "Steampunk",
];
const SORT_OPTIONS = ["Trending", "Most Collected", "Newest", "Most Chapters"];

const StoriesPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Trending");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter stories based on selected genre
  const filteredStories =
    activeFilter === "All"
      ? MOCK_STORIES
      : MOCK_STORIES.filter((story) => story.genre === activeFilter);

  return (
    <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 md:mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-ink-900 dark:text-white mb-4">
              Explore Stories
            </h1>
            <p className="text-lg text-ink-700 dark:text-ink-200 max-w-3xl">
              Discover interactive stories where your choices shape the
              narrative. Collect chapters, vote on plot directions, and join a
              community of storytellers.
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

          {/* Stories Grid */}
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
            {filteredStories.map((story) => (
              <StoryCard key={story.id} story={story} viewMode={viewMode} />
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredStories.length === 0 && (
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
    </div>
  );
};

export default StoriesPage;
