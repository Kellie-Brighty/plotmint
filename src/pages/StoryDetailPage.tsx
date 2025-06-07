import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";

// Mock data for a single story
const MOCK_STORY = {
  id: "1",
  title: "The Quantum Nexus",
  coverImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=600&q=80",
  author: "Elena Voss",
  authorAvatar: "https://i.pravatar.cc/150?u=ElenaVoss",
  createdAt: "2023-09-15T14:32:00Z",
  updatedAt: "2023-10-22T10:15:00Z",
  description:
    "A journey through the multiverse that challenges our understanding of reality and fate. When physicist Dr. Maya Chen discovers a way to peer into parallel universes, she unwittingly becomes the target of shadowy organizations seeking to control this revolutionary technology. As she navigates through different realities, each decision branches into infinite possibilities, creating a complex web of storylines that readers can explore and influence.",
  tags: [
    "science fiction",
    "multiverse",
    "adventure",
    "quantum physics",
    "conspiracy",
  ],
  genre: "Sci-Fi",
  chapters: [
    {
      id: "ch1",
      title: "The Discovery",
      published: true,
      publishedAt: "2023-09-15T14:32:00Z",
      votes: 182,
      collectors: 98,
      preview:
        "Dr. Maya Chen had always known that reality was more complex than most people imagined, but even she wasn't prepared for what she found when her quantum resonance experiment finally succeeded...",
      estimatedReadingTime: 12,
      choices: [
        { id: "ch1-opt1", text: "Focus on stabilizing the quantum field" },
        { id: "ch1-opt2", text: "Expand the observation window" },
      ],
    },
    {
      id: "ch2",
      title: "Parallel Lines",
      published: true,
      publishedAt: "2023-09-22T09:45:00Z",
      votes: 156,
      collectors: 87,
      preview:
        "The resonance viewer hummed quietly as Maya adjusted the calibration. Through the viewer's lens, she could see fragments of another world—a world where different choices had been made...",
      estimatedReadingTime: 15,
      choices: [
        { id: "ch2-opt1", text: "Contact Dr. Harrison for help" },
        { id: "ch2-opt2", text: "Keep the discovery secret" },
      ],
    },
    {
      id: "ch3",
      title: "The Watchers",
      published: true,
      publishedAt: "2023-09-29T16:20:00Z",
      votes: 144,
      collectors: 73,
      preview:
        "The black sedan had been parked across from her apartment for three days now. Maya knew she wasn't being paranoid—someone was watching her, someone who knew what she had discovered...",
      estimatedReadingTime: 10,
      choices: [
        { id: "ch3-opt1", text: "Confront the watchers" },
        { id: "ch3-opt2", text: "Flee to a safe location" },
      ],
    },
    {
      id: "ch4",
      title: "Crossroads",
      published: false,
      publishedAt: null,
      votes: 0,
      collectors: 0,
      preview: "Coming soon...",
      estimatedReadingTime: null,
      choices: [],
    },
  ],
};

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
const getAvatarUrl = (authorName: string) => {
  return `https://i.pravatar.cc/150?u=${authorName.replace(/\s+/g, "")}`;
};

const StoryDetailPage = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "chapters">(
    "overview"
  );

  // In a real app, you would fetch the story based on storyId
  const story = MOCK_STORY;

  // Formatted dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get cover image URL
  const getCoverImageUrl = () => {
    if (story.coverImage && story.coverImage.startsWith("http")) {
      return story.coverImage;
    }
    return getPlaceholderImage(story.genre);
  };

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
                  target.src =
                    "https://source.unsplash.com/random/1200x600/?book";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
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
                    target.src =
                      "https://source.unsplash.com/random/1200x600/?book";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-500 text-white mb-2">
                    {story.genre}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
                    {story.title}
                  </h1>
                </div>
              </div>

              {/* Desktop Title Section */}
              <div className="hidden md:block">
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-500 text-white mb-2">
                  {story.genre}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-2">
                  {story.title}
                </h1>
                <div className="flex items-center text-white/90">
                  <img
                    src={getAvatarUrl(story.author)}
                    alt={story.author}
                    className="w-8 h-8 rounded-full mr-2 object-cover"
                  />
                  <span className="font-medium">{story.author}</span>
                  <span className="mx-2">•</span>
                  <span>
                    {story.chapters.filter((ch) => ch.published).length}{" "}
                    Chapters
                  </span>
                  <span className="mx-2">•</span>
                  <span>Updated {formatDate(story.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Author Info */}
          <div className="flex items-center md:hidden mb-6 text-ink-700 dark:text-ink-200">
            <img
              src={getAvatarUrl(story.author)}
              alt={story.author}
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
            <span className="font-medium">{story.author}</span>
            <span className="mx-2">•</span>
            <span>
              {story.chapters.filter((ch) => ch.published).length} Chapters
            </span>
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
                      {story.chapters
                        .filter((chapter) => chapter.published)
                        .slice(0, 3)
                        .map((chapter) => (
                          <Link
                            key={chapter.id}
                            to={`/stories/${story.id}/chapters/${chapter.id}`}
                            className="block p-4 bg-white dark:bg-dark-900 rounded-lg border border-parchment-200 dark:border-dark-700 hover:shadow-md transition-shadow"
                          >
                            <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-2">
                              {chapter.title}
                            </h3>
                            <p className="text-ink-600 dark:text-ink-300 text-sm line-clamp-2 mb-3">
                              {chapter.preview}
                            </p>
                            <div className="flex items-center justify-between text-sm text-ink-500 dark:text-ink-400">
                              <span>{formatDate(chapter.publishedAt!)}</span>
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

                    {story.chapters.map((chapter, index) => (
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
                            <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-2">
                              {chapter.title}
                            </h3>

                            <p className="text-ink-600 dark:text-ink-300 text-sm mb-4">
                              {chapter.preview}
                            </p>

                            {chapter.published ? (
                              <div className="flex flex-wrap items-center justify-between gap-y-4">
                                <div className="flex items-center text-sm text-ink-500 dark:text-ink-400 space-x-4">
                                  <span>
                                    {formatDate(chapter.publishedAt!)}
                                  </span>
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
                        {story.chapters.filter((ch) => ch.published).length} of{" "}
                        {story.chapters.length}
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
                      to={`/stories/${story.id}/chapters/${story.chapters[0].id}`}
                      className="block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400 rounded-md text-center font-medium transition-colors"
                    >
                      Start Reading
                    </Link>

                    <button className="block w-full py-3 px-4 bg-white hover:bg-gray-50 text-ink-900 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-white rounded-md text-center font-medium border border-parchment-200 dark:border-dark-700 transition-colors">
                      <div className="flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                        Add to Library
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-parchment-200 dark:border-dark-700 shadow-sm">
                  <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-4">
                    About the Author
                  </h3>

                  <div className="flex items-center mb-4">
                    <img
                      src={getAvatarUrl(story.author)}
                      alt={story.author}
                      className="w-12 h-12 rounded-full mr-3 object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-ink-900 dark:text-white">
                        {story.author}
                      </h4>
                      <p className="text-sm text-ink-500 dark:text-ink-400">
                        Writer • 12 Stories
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
