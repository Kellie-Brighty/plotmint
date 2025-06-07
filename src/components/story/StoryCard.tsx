import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    coverImage: string;
    author: string;
    authorAvatar: string;
    chapters: number;
    genre: string;
    votes: number;
    collectors: number;
    description: string;
    tags: string[];
  };
  viewMode: "grid" | "list";
}

const StoryCard: React.FC<StoryCardProps> = ({ story, viewMode }) => {
  // Use specific Unsplash images for each story title
  const getPlaceholderImage = (title: string, genre: string) => {
    // Map specific story titles to hand-picked Unsplash images
    const storyImageMap: Record<string, string> = {
      "The Quantum Nexus":
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&q=80",
      "Shadows of Eldoria":
        "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&h=600&q=80",
      "Whispers in the Void":
        "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=600&q=80",
      "Chronicles of New Albion":
        "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=800&h=600&q=80",
      "The Last Dreamer":
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&q=80",
      "Neon Streets":
        "https://images.unsplash.com/photo-1520995051695-8dce7195e159?w=800&h=600&q=80",
    };

    // Return mapped image if available, otherwise use genre-based default
    if (storyImageMap[title]) {
      return storyImageMap[title];
    }

    // Fallback to genre-based images
    switch (genre.toLowerCase()) {
      case "sci-fi":
        return "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=800&h=600&q=80";
      case "fantasy":
        return "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&h=600&q=80";
      case "horror":
        return "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=600&q=80";
      case "steampunk":
        return "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&h=600&q=80";
      case "cyberpunk":
        return "https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=800&h=600&q=80";
      default:
        return "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&q=80";
    }
  };

  // Get image URL - use story.coverImage if it's a full URL, otherwise use the placeholder
  const getImageUrl = () => {
    if (story.coverImage && story.coverImage.startsWith("http")) {
      return story.coverImage;
    }
    return getPlaceholderImage(story.title, story.genre);
  };

  // Get author avatar
  const getAvatarUrl = () => {
    if (story.authorAvatar && story.authorAvatar.startsWith("http")) {
      return story.authorAvatar;
    }
    return `https://i.pravatar.cc/150?u=${story.author.replace(/\s+/g, "")}`;
  };

  if (viewMode === "grid") {
    return (
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-parchment-200 dark:border-dark-700 h-full flex flex-col"
      >
        <Link
          to={`/stories/${story.id}`}
          className="block relative pt-[56.25%] overflow-hidden bg-parchment-200 dark:bg-dark-800"
        >
          <img
            src={getImageUrl()}
            alt={story.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&q=80";
            }}
          />
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {story.chapters} {story.chapters === 1 ? "Chapter" : "Chapters"}
          </div>
        </Link>

        <div className="p-5 flex flex-col flex-grow">
          <div className="flex-grow">
            <div className="flex items-center mb-3">
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                {story.genre}
              </span>
            </div>

            <Link to={`/stories/${story.id}`}>
              <h3 className="text-xl font-display font-bold text-ink-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition">
                {story.title}
              </h3>
            </Link>

            <p className="text-ink-600 dark:text-ink-300 text-sm line-clamp-2 mb-3">
              {story.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-parchment-100 dark:border-dark-800">
            <div className="flex items-center">
              <img
                src={getAvatarUrl()}
                alt={story.author}
                className="w-8 h-8 rounded-full mr-2 object-cover"
              />
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
                {story.author}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center text-ink-500 dark:text-ink-400 text-xs">
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
                {story.votes}
              </div>

              <div className="flex items-center text-ink-500 dark:text-ink-400 text-xs">
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
                {story.collectors}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-parchment-200 dark:border-dark-700"
    >
      <div className="flex flex-col sm:flex-row">
        <Link
          to={`/stories/${story.id}`}
          className="block sm:w-56 h-40 relative overflow-hidden bg-parchment-200 dark:bg-dark-800"
        >
          <img
            src={getImageUrl()}
            alt={story.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&q=80";
            }}
          />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {story.chapters} {story.chapters === 1 ? "Chapter" : "Chapters"}
          </div>
        </Link>

        <div className="p-5 flex-grow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                {story.genre}
              </span>

              <div className="flex items-center space-x-3">
                <div className="flex items-center text-ink-500 dark:text-ink-400 text-xs">
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
                  {story.votes}
                </div>

                <div className="flex items-center text-ink-500 dark:text-ink-400 text-xs">
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
                  {story.collectors}
                </div>
              </div>
            </div>

            <Link to={`/stories/${story.id}`}>
              <h3 className="text-xl font-display font-bold text-ink-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition">
                {story.title}
              </h3>
            </Link>

            <p className="text-ink-600 dark:text-ink-300 text-sm mb-4 line-clamp-2">
              {story.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={getAvatarUrl()}
                alt={story.author}
                className="w-7 h-7 rounded-full mr-2 object-cover"
              />
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
                {story.author}
              </span>
            </div>

            <div className="flex gap-1 flex-wrap">
              {story.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-parchment-100 dark:bg-dark-800 text-ink-600 dark:text-ink-300 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {story.tags.length > 2 && (
                <span className="text-xs px-2 py-1 text-ink-500 dark:text-ink-400">
                  +{story.tags.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryCard;
