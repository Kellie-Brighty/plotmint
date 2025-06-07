import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

// Mock data for collections
const MOCK_COLLECTIONS = [
  {
    id: "col1",
    storyId: "1",
    storyTitle: "The Quantum Nexus",
    chapterIds: ["ch1", "ch2", "ch3"],
    coverImage:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&q=80",
    totalChapters: 7,
    collectedChapters: 3,
    author: "Elena Voss",
  },
  {
    id: "col2",
    storyId: "2",
    storyTitle: "Shadows of Eldoria",
    chapterIds: ["ch1", "ch2"],
    coverImage:
      "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&h=600&q=80",
    totalChapters: 12,
    collectedChapters: 2,
    author: "Marcus Chen",
  },
  {
    id: "col3",
    storyId: "6",
    storyTitle: "Neon Streets",
    chapterIds: ["ch1", "ch2", "ch3", "ch4"],
    coverImage:
      "https://images.unsplash.com/photo-1520995051695-8dce7195e159?w=800&h=600&q=80",
    totalChapters: 8,
    collectedChapters: 4,
    author: "Koji Yamamoto",
  },
];

// Mock data for reading history
const MOCK_READING_HISTORY = [
  {
    id: "read1",
    storyId: "1",
    storyTitle: "The Quantum Nexus",
    chapterId: "ch3",
    chapterTitle: "The Watchers",
    coverImage:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&q=80",
    readAt: "2023-11-10T15:20:00Z",
    progress: 100,
  },
  {
    id: "read2",
    storyId: "6",
    storyTitle: "Neon Streets",
    chapterId: "ch4",
    chapterTitle: "Digital Specters",
    coverImage:
      "https://images.unsplash.com/photo-1520995051695-8dce7195e159?w=800&h=600&q=80",
    readAt: "2023-11-08T22:45:00Z",
    progress: 100,
  },
  {
    id: "read3",
    storyId: "2",
    storyTitle: "Shadows of Eldoria",
    chapterId: "ch2",
    chapterTitle: "The Forbidden Forest",
    coverImage:
      "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&h=600&q=80",
    readAt: "2023-11-05T18:30:00Z",
    progress: 75,
  },
  {
    id: "read4",
    storyId: "3",
    storyTitle: "Whispers in the Void",
    chapterId: "ch1",
    chapterTitle: "Strange Signals",
    coverImage:
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=600&q=80",
    readAt: "2023-11-01T12:15:00Z",
    progress: 50,
  },
];

// Mock data for voting history
const MOCK_VOTING_HISTORY = [
  {
    id: "vote1",
    storyId: "1",
    storyTitle: "The Quantum Nexus",
    chapterId: "ch2",
    chapterTitle: "Parallel Lines",
    coverImage:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&q=80",
    choice: "Contact Dr. Harrison for help",
    votedAt: "2023-10-25T14:22:00Z",
    totalVotes: 156,
    choiceVotes: 105,
  },
  {
    id: "vote2",
    storyId: "6",
    storyTitle: "Neon Streets",
    chapterId: "ch3",
    chapterTitle: "Corporate Shadows",
    coverImage:
      "https://images.unsplash.com/photo-1520995051695-8dce7195e159?w=800&h=600&q=80",
    choice: "Accept the mysterious client's offer",
    votedAt: "2023-10-20T09:17:00Z",
    totalVotes: 198,
    choiceVotes: 130,
  },
  {
    id: "vote3",
    storyId: "2",
    storyTitle: "Shadows of Eldoria",
    chapterId: "ch1",
    chapterTitle: "The Ancient Prophecy",
    coverImage:
      "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&h=600&q=80",
    choice: "Venture into the ruins",
    votedAt: "2023-10-15T20:45:00Z",
    totalVotes: 217,
    choiceVotes: 142,
  },
];

// Mock data for notifications
const MOCK_NOTIFICATIONS = [
  {
    id: "notif1",
    type: "chapter_published",
    storyId: "1",
    storyTitle: "The Quantum Nexus",
    chapterId: "ch4",
    chapterTitle: "Crossroads",
    timestamp: "2023-11-11T08:00:00Z",
    read: false,
  },
  {
    id: "notif2",
    type: "vote_results",
    storyId: "6",
    storyTitle: "Neon Streets",
    chapterId: "ch3",
    chapterTitle: "Corporate Shadows",
    result: "Accept the mysterious client's offer",
    timestamp: "2023-10-21T12:00:00Z",
    read: true,
  },
  {
    id: "notif3",
    type: "collect_success",
    storyId: "2",
    storyTitle: "Shadows of Eldoria",
    chapterId: "ch2",
    chapterTitle: "The Forbidden Forest",
    timestamp: "2023-10-18T15:30:00Z",
    read: true,
  },
  {
    id: "notif4",
    type: "author_update",
    storyId: "1",
    storyTitle: "The Quantum Nexus",
    authorName: "Elena Voss",
    message: "Working on Chapter 5 - should be ready next week!",
    timestamp: "2023-10-12T17:20:00Z",
    read: true,
  },
];

type Tab = "collections" | "reading" | "voting" | "notifications";

const ReaderDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("collections");

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Function to render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "collections":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_COLLECTIONS.map((collection) => (
              <div
                key={collection.id}
                className="bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-md border border-parchment-200 dark:border-dark-700"
              >
                <Link
                  to={`/stories/${collection.storyId}`}
                  className="block relative pt-[60%] overflow-hidden"
                >
                  <img
                    src={collection.coverImage}
                    alt={collection.storyTitle}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 text-white">
                    <h3 className="text-lg font-bold mb-1">
                      {collection.storyTitle}
                    </h3>
                    <p className="text-sm opacity-90">by {collection.author}</p>
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-ink-600 dark:text-ink-300">
                      Collected:
                    </span>
                    <span className="text-sm font-medium">
                      {collection.collectedChapters} of{" "}
                      {collection.totalChapters} chapters
                    </span>
                  </div>
                  <div className="w-full bg-parchment-200 dark:bg-dark-700 rounded-full h-2 mb-4">
                    <div
                      className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (collection.collectedChapters /
                            collection.totalChapters) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <Button variant="primary" fullWidth onClick={() => {}}>
                    Continue Reading
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case "reading":
        return (
          <div className="space-y-4">
            {MOCK_READING_HISTORY.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-dark-900 rounded-lg overflow-hidden shadow-sm border border-parchment-200 dark:border-dark-700 flex flex-col sm:flex-row"
              >
                <div className="sm:w-1/4 md:w-1/5 relative">
                  <img
                    src={item.coverImage}
                    alt={item.storyTitle}
                    className="w-full h-40 sm:h-full object-cover"
                  />
                </div>
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-1">
                          {item.storyTitle}
                        </h3>
                        <p className="text-primary-600 dark:text-primary-400 font-medium">
                          {item.chapterTitle}
                        </p>
                      </div>
                      <span className="text-sm text-ink-500 dark:text-ink-400">
                        {formatDate(item.readAt)}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink-600 dark:text-ink-300">
                          Progress
                        </span>
                        <span className="font-medium">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-parchment-200 dark:bg-dark-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      to={`/stories/${item.storyId}/chapters/${item.chapterId}`}
                    >
                      <Button variant="primary" size="sm">
                        {item.progress < 100
                          ? "Continue Reading"
                          : "Read Again"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "voting":
        return (
          <div className="space-y-4">
            {MOCK_VOTING_HISTORY.map((vote) => (
              <div
                key={vote.id}
                className="bg-white dark:bg-dark-900 rounded-lg overflow-hidden shadow-sm border border-parchment-200 dark:border-dark-700 flex flex-col sm:flex-row"
              >
                <div className="sm:w-1/4 md:w-1/5 relative">
                  <img
                    src={vote.coverImage}
                    alt={vote.storyTitle}
                    className="w-full h-40 sm:h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-primary-600 dark:bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                    Voted
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-1">
                        {vote.storyTitle}
                      </h3>
                      <p className="text-primary-600 dark:text-primary-400 font-medium">
                        {vote.chapterTitle}
                      </p>
                    </div>
                    <span className="text-sm text-ink-500 dark:text-ink-400">
                      {formatDate(vote.votedAt)}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-parchment-50 dark:bg-dark-800 rounded-lg border border-parchment-200 dark:border-dark-700">
                    <p className="text-sm text-ink-700 dark:text-ink-200 mb-2">
                      <span className="font-medium">Your choice:</span>{" "}
                      {vote.choice}
                    </p>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink-600 dark:text-ink-300">
                        Vote results
                      </span>
                      <span className="font-medium">
                        {Math.round((vote.choiceVotes / vote.totalVotes) * 100)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-parchment-200 dark:bg-dark-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (vote.choiceVotes / vote.totalVotes) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link to={`/stories/${vote.storyId}`}>
                      <Button variant="outline" size="sm">
                        View Story
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "notifications":
        return (
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden">
            <ul className="divide-y divide-parchment-200 dark:divide-dark-700">
              {MOCK_NOTIFICATIONS.map((notification) => (
                <li
                  key={notification.id}
                  className={`p-4 sm:p-5 ${
                    !notification.read
                      ? "bg-primary-50 dark:bg-primary-900/10"
                      : ""
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === "chapter_published"
                          ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                          : notification.type === "vote_results"
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : notification.type === "collect_success"
                          ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                          : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {notification.type === "chapter_published" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                      )}
                      {notification.type === "vote_results" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                      )}
                      {notification.type === "collect_success" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {notification.type === "author_update" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-ink-900 dark:text-white">
                          {notification.type === "chapter_published" &&
                            "New Chapter Published"}
                          {notification.type === "vote_results" &&
                            "Voting Results"}
                          {notification.type === "collect_success" &&
                            "Chapter Collected"}
                          {notification.type === "author_update" &&
                            "Author Update"}
                        </p>
                        <p className="text-xs text-ink-500 dark:text-ink-400">
                          {formatDate(notification.timestamp)} at{" "}
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-ink-700 dark:text-ink-200">
                        {notification.type === "chapter_published" && (
                          <>
                            A new chapter{" "}
                            <strong>{notification.chapterTitle}</strong> has
                            been published for{" "}
                            <strong>{notification.storyTitle}</strong>.
                          </>
                        )}
                        {notification.type === "vote_results" && (
                          <>
                            The voting results are in for{" "}
                            <strong>{notification.storyTitle}</strong>:
                            <strong>{notification.result}</strong> won!
                          </>
                        )}
                        {notification.type === "collect_success" && (
                          <>
                            You successfully collected{" "}
                            <strong>{notification.chapterTitle}</strong> from
                            <strong> {notification.storyTitle}</strong>.
                          </>
                        )}
                        {notification.type === "author_update" && (
                          <>
                            <strong>{notification.authorName}</strong>:{" "}
                            {notification.message}
                          </>
                        )}
                      </p>
                      <div className="mt-2">
                        <Link
                          to={`/stories/${notification.storyId}`}
                          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        >
                          View Story →
                        </Link>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="ml-3 flex-shrink-0">
                        <div className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-ink-900 dark:text-white mb-2">
                  My Dashboard
                </h1>
                <p className="text-lg text-ink-600 dark:text-ink-300">
                  Manage your collections, reading history, and notifications.
                </p>
              </div>
              <Link to="/stories" className="self-start">
                <Button variant="outline">
                  <span className="mr-2">Explore Stories</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="mb-8 border-b border-parchment-200 dark:border-dark-700">
            <nav className="flex overflow-x-auto pb-px" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("collections")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                  activeTab === "collections"
                    ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:border-ink-300 dark:hover:border-dark-600"
                }`}
              >
                My Collections
              </button>
              <button
                onClick={() => setActiveTab("reading")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                  activeTab === "reading"
                    ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:border-ink-300 dark:hover:border-dark-600"
                }`}
              >
                Reading History
              </button>
              <button
                onClick={() => setActiveTab("voting")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                  activeTab === "voting"
                    ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:border-ink-300 dark:hover:border-dark-600"
                }`}
              >
                Voting History
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "notifications"
                    ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:border-ink-300 dark:hover:border-dark-600"
                }`}
              >
                Notifications
                <span className="ml-2 bg-primary-600 dark:bg-primary-400 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                  1
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-12"
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReaderDashboardPage;
