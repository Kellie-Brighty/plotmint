import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../utils/AuthContext";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import TokenHoldings from "../components/TokenHoldings";
import ReaderNFTCollection from "../components/ReaderNFTCollection";
import {
  subscribeToReaderCollections,
  subscribeToReadingHistory,
  subscribeToVotingHistory,
  subscribeToReaderNotifications,
  type ReaderCollection,
  type ReadingHistory,
  type VotingHistory,
  type ReaderNotification,
} from "../utils/storyService";

type Tab =
  | "collections"
  | "reading"
  | "voting"
  | "nfts"
  | "tokens"
  | "notifications";

const ReaderDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("collections");
  const [collections, setCollections] = useState<ReaderCollection[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
  const [votingHistory, setVotingHistory] = useState<VotingHistory[]>([]);
  const [notifications, setNotifications] = useState<ReaderNotification[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [readingLoading, setReadingLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const { currentUser } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Subscribe to real-time collections data
  useEffect(() => {
    if (!currentUser) {
      setCollections([]);
      setCollectionsLoading(false);
      return () => {};
    }

    setCollectionsLoading(true);
    const unsubscribe = subscribeToReaderCollections(
      currentUser.uid,
      (fetchedCollections) => {
        setCollections(fetchedCollections);
        setCollectionsLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Subscribe to real-time reading history data
  useEffect(() => {
    if (!currentUser) {
      setReadingHistory([]);
      setReadingLoading(false);
      return () => {};
    }

    setReadingLoading(true);
    const unsubscribe = subscribeToReadingHistory(
      currentUser.uid,
      (fetchedHistory) => {
        setReadingHistory(fetchedHistory);
        setReadingLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Subscribe to real-time voting history data
  useEffect(() => {
    if (!currentUser) {
      setVotingHistory([]);
      setVotingLoading(false);
      return () => {};
    }

    setVotingLoading(true);
    const unsubscribe = subscribeToVotingHistory(
      currentUser.uid,
      (fetchedHistory) => {
        setVotingHistory(fetchedHistory);
        setVotingLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Subscribe to real-time notifications data
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setNotificationsLoading(false);
      return () => {};
    }

    setNotificationsLoading(true);
    const unsubscribe = subscribeToReaderNotifications(
      currentUser.uid,
      (fetchedNotifications) => {
        setNotifications(fetchedNotifications);
        setNotificationsLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

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
            {collectionsLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : collections.length === 0 ? (
              <EmptyStateCard
                title="No collections yet"
                description="Start collecting chapters from your favorite stories to see them here."
                action={
                  <Link to="/stories">
                    <Button variant="primary">Browse Stories</Button>
                  </Link>
                }
              />
            ) : (
              collections.map((collection) => (
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
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4 text-white">
                      <h3 className="text-lg font-bold mb-1">
                        {collection.storyTitle}
                      </h3>
                      <p className="text-sm opacity-90">
                        by {collection.author}
                      </p>
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
                    <Link to={`/stories/${collection.storyId}`}>
                      <Button variant="primary" fullWidth>
                        Continue Reading
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case "reading":
        return (
          <div className="space-y-4">
            {readingLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : readingHistory.length === 0 ? (
              <EmptyStateCard
                title="No reading history yet"
                description="Start reading stories to track your progress here."
                action={
                  <Link to="/stories">
                    <Button variant="primary">Browse Stories</Button>
                  </Link>
                }
              />
            ) : (
              readingHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-dark-900 rounded-lg overflow-hidden shadow-sm border border-parchment-200 dark:border-dark-700 flex flex-col sm:flex-row"
                >
                  <div className="w-full sm:w-1/4 md:w-1/5 relative">
                    <img
                      src={item.coverImage}
                      alt={item.storyTitle}
                      className="w-full h-40 sm:h-full object-cover"
                    />
                  </div>
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div>
                          <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-1">
                            {item.storyTitle}
                          </h3>
                          <p className="text-primary-600 dark:text-primary-400 font-medium">
                            {item.chapterTitle}
                          </p>
                        </div>
                        <span className="text-sm text-ink-500 dark:text-ink-400 mt-1 sm:mt-0">
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
              ))
            )}
          </div>
        );

      case "voting":
        return (
          <div className="space-y-4">
            {votingLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : votingHistory.length === 0 ? (
              <EmptyStateCard
                title="No voting history yet"
                description="Vote on story choices to influence how they develop!"
                action={
                  <Link to="/stories">
                    <Button variant="primary">Browse Stories</Button>
                  </Link>
                }
              />
            ) : (
              votingHistory.map((vote) => (
                <div
                  key={vote.id}
                  className="bg-white dark:bg-dark-900 rounded-lg overflow-hidden shadow-sm border border-parchment-200 dark:border-dark-700 flex flex-col sm:flex-row"
                >
                  <div className="w-full sm:w-1/4 md:w-1/5 relative">
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
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <div>
                        <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-1">
                          {vote.storyTitle}
                        </h3>
                        <p className="text-primary-600 dark:text-primary-400 font-medium">
                          {vote.chapterTitle}
                        </p>
                      </div>
                      <span className="text-sm text-ink-500 dark:text-ink-400 mt-1 sm:mt-0">
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
                          {Math.round(
                            (vote.choiceVotes / vote.totalVotes) * 100
                          )}
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
              ))
            )}
          </div>
        );

      case "nfts":
        return <ReaderNFTCollection userId={currentUser?.uid || ""} />;

      case "tokens":
        return <TokenHoldings userId={currentUser?.uid || ""} />;

      case "notifications":
        return (
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden">
            {notificationsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <EmptyStateCard
                title="No notifications yet"
                description="You'll receive notifications about new chapters, voting results, and more."
              />
            ) : (
              <ul className="divide-y divide-parchment-200 dark:divide-dark-700">
                {notifications.map((notification) => (
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
                            : notification.type === "nft_mint_success"
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
                        {notification.type === "nft_mint_success" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
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
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <p className="text-sm font-medium text-ink-900 dark:text-white">
                            {notification.type === "chapter_published" &&
                              "New Chapter Published"}
                            {notification.type === "vote_results" &&
                              "Voting Results"}
                            {notification.type === "collect_success" &&
                              "Chapter Collected"}
                            {notification.type === "nft_mint_success" &&
                              "NFT Successfully Minted"}
                            {notification.type === "author_update" &&
                              "Author Update"}
                          </p>
                          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 sm:mt-0">
                            {formatDate(notification.timestamp)} at{" "}
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">
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
                          {notification.type === "nft_mint_success" && (
                            <>
                              You successfully minted edition{" "}
                              <strong>#{notification.editionNumber}</strong> of{" "}
                              <strong>{notification.chapterTitle}</strong> from{" "}
                              <strong>{notification.storyTitle}</strong>.
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
            )}
          </div>
        );

      default:
        return null;
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
            Reader Dashboard
          </h1>
          <p className="text-ink-600 dark:text-ink-300">
            Track your collection, reading progress, and voting history.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 border-b border-parchment-200 dark:border-dark-700 overflow-x-auto">
          <div className="flex -mb-px whitespace-nowrap">
            <button
              className={`mr-4 sm:mr-8 py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "collections"
                  ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
              }`}
              onClick={() => setActiveTab("collections")}
            >
              Collections
            </button>
            <button
              className={`mr-4 sm:mr-8 py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "reading"
                  ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
              }`}
              onClick={() => setActiveTab("reading")}
            >
              <span className="hidden xs:inline">Reading History</span>
              <span className="xs:hidden">Reading</span>
            </button>
            <button
              className={`mr-4 sm:mr-8 py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "voting"
                  ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
              }`}
              onClick={() => setActiveTab("voting")}
            >
              <span className="hidden xs:inline">Voting History</span>
              <span className="xs:hidden">Voting</span>
            </button>
            <button
              className={`mr-4 sm:mr-8 py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "nfts"
                  ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
              }`}
              onClick={() => setActiveTab("nfts")}
            >
              <span className="hidden xs:inline">NFT Collection</span>
              <span className="xs:hidden">NFTs</span>
            </button>
            <button
              className={`mr-4 sm:mr-8 py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "tokens"
                  ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
              }`}
              onClick={() => setActiveTab("tokens")}
            >
              <span className="hidden xs:inline">Token Holdings</span>
              <span className="xs:hidden">Tokens</span>
            </button>
            <button
              className={`py-4 px-1 text-sm font-medium border-b-2 ${
                activeTab === "notifications"
                  ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
              }`}
              onClick={() => setActiveTab("notifications")}
            >
              <span className="hidden xs:inline">Notifications</span>
              <span className="xs:hidden">Alerts</span>
              {notifications.filter((notif) => !notif.read).length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 dark:bg-primary-500 rounded-full">
                  {notifications.filter((notif) => !notif.read).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default ReaderDashboardPage;
