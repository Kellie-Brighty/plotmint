import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

// Mock data for creator's stories
const MOCK_CREATOR_STORIES = [
  {
    id: "1",
    title: "The Quantum Nexus",
    coverImage:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&q=80",
    chapters: 7,
    published: 3,
    inProgress: 1,
    drafts: 3,
    status: "in-progress",
    readers: 482,
    collectors: 218,
    totalVotes: 895,
    lastUpdated: "2023-10-22T10:15:00Z",
  },
  {
    id: "3",
    title: "Whispers in the Void",
    coverImage:
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=600&q=80",
    chapters: 5,
    published: 5,
    inProgress: 0,
    drafts: 0,
    status: "completed",
    readers: 214,
    collectors: 103,
    totalVotes: 390,
    lastUpdated: "2023-09-15T14:32:00Z",
  },
  {
    id: "7",
    title: "Echoes of Tomorrow",
    coverImage:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&q=80",
    chapters: 2,
    published: 0,
    inProgress: 0,
    drafts: 2,
    status: "draft",
    readers: 0,
    collectors: 0,
    totalVotes: 0,
    lastUpdated: "2023-11-05T08:45:00Z",
  },
];

// Mock data for analytics
const MOCK_ANALYTICS = {
  totalReaders: 696,
  totalCollectors: 321,
  totalVotes: 1285,
  totalRevenue: 4.37,
  readerGrowth: 12,
  collectorGrowth: 8,
  weeklyChartData: [
    { day: "Mon", readers: 42, collectors: 18, votes: 76 },
    { day: "Tue", readers: 38, collectors: 15, votes: 62 },
    { day: "Wed", readers: 55, collectors: 22, votes: 95 },
    { day: "Thu", readers: 47, collectors: 20, votes: 87 },
    { day: "Fri", readers: 59, collectors: 25, votes: 112 },
    { day: "Sat", readers: 75, collectors: 32, votes: 142 },
    { day: "Sun", readers: 68, collectors: 28, votes: 125 },
  ],
  storyPerformance: [
    {
      id: "1",
      title: "The Quantum Nexus",
      reads: 482,
      collections: 218,
      votes: 895,
      revenue: 3.15,
    },
    {
      id: "3",
      title: "Whispers in the Void",
      reads: 214,
      collections: 103,
      votes: 390,
      revenue: 1.22,
    },
  ],
};

// Mock data for chapter drafts
const MOCK_DRAFTS = [
  {
    id: "draft1",
    storyId: "1",
    storyTitle: "The Quantum Nexus",
    title: "Crossroads",
    preview:
      "Maya's discovery has drawn attention from multiple dimensions. As shadowy organizations close in, she must decide who to trust with her revolutionary technology...",
    status: "in-progress",
    wordCount: 2150,
    lastEdited: "2023-11-10T09:20:00Z",
    choices: [
      { id: "ch4-opt1", text: "Accept government protection", votes: 0 },
      { id: "ch4-opt2", text: "Go into hiding with Dr. Harrison", votes: 0 },
    ],
  },
  {
    id: "draft2",
    storyId: "1",
    storyTitle: "The Quantum Nexus",
    title: "Dimensional Rifts",
    preview: "",
    status: "outline",
    wordCount: 350,
    lastEdited: "2023-11-08T14:45:00Z",
    choices: [],
  },
  {
    id: "draft3",
    storyId: "1",
    storyTitle: "The Quantum Nexus",
    title: "The Convergence",
    preview: "",
    status: "outline",
    wordCount: 150,
    lastEdited: "2023-11-05T17:30:00Z",
    choices: [],
  },
  {
    id: "draft4",
    storyId: "7",
    storyTitle: "Echoes of Tomorrow",
    title: "First Contact",
    preview:
      "The year is 2157. Humanity's first deep space exploration vessel, the Artemis, detects an anomalous signal from a supposedly uninhabited world...",
    status: "in-progress",
    wordCount: 1850,
    lastEdited: "2023-11-09T20:15:00Z",
    choices: [
      { id: "ec1-opt1", text: "Investigate the signal source", votes: 0 },
      { id: "ec1-opt2", text: "Report back to Earth command", votes: 0 },
    ],
  },
  {
    id: "draft5",
    storyId: "7",
    storyTitle: "Echoes of Tomorrow",
    title: "Strange Horizons",
    preview: "",
    status: "outline",
    wordCount: 280,
    lastEdited: "2023-11-06T11:20:00Z",
    choices: [],
  },
];

type Tab = "stories" | "analytics" | "chapters";

const CreatorDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("stories");

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status badge based on story status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Completed
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            Draft
          </span>
        );
      default:
        return null;
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
            </div>

            <div className="grid grid-cols-1 gap-6">
              {MOCK_CREATOR_STORIES.map((story) => (
                <div
                  key={story.id}
                  className="bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-md border border-parchment-200 dark:border-dark-700 flex flex-col sm:flex-row"
                >
                  <div className="sm:w-1/4 md:w-1/5 relative">
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-full h-48 sm:h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(story.status)}
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-ink-900 dark:text-white mb-2">
                          {story.title}
                        </h3>
                        <p className="text-sm text-ink-500 dark:text-ink-400">
                          Last updated: {formatDate(story.lastUpdated)}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                        <Link to={`/stories/${story.id}`}>
                          <Button variant="outline" size="sm">
                            View Story
                          </Button>
                        </Link>
                        <Button variant="primary" size="sm">
                          Edit Story
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="bg-parchment-50 dark:bg-dark-800 p-3 rounded-lg">
                        <div className="text-sm text-ink-500 dark:text-ink-400 mb-1">
                          Chapters
                        </div>
                        <div className="text-lg font-bold text-ink-900 dark:text-white">
                          {story.published} / {story.chapters}
                        </div>
                      </div>
                      <div className="bg-parchment-50 dark:bg-dark-800 p-3 rounded-lg">
                        <div className="text-sm text-ink-500 dark:text-ink-400 mb-1">
                          Readers
                        </div>
                        <div className="text-lg font-bold text-ink-900 dark:text-white">
                          {story.readers}
                        </div>
                      </div>
                      <div className="bg-parchment-50 dark:bg-dark-800 p-3 rounded-lg">
                        <div className="text-sm text-ink-500 dark:text-ink-400 mb-1">
                          Collectors
                        </div>
                        <div className="text-lg font-bold text-ink-900 dark:text-white">
                          {story.collectors}
                        </div>
                      </div>
                      <div className="bg-parchment-50 dark:bg-dark-800 p-3 rounded-lg">
                        <div className="text-sm text-ink-500 dark:text-ink-400 mb-1">
                          Votes
                        </div>
                        <div className="text-lg font-bold text-ink-900 dark:text-white">
                          {story.totalVotes}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {story.drafts > 0 && (
                        <div className="text-sm px-3 py-1 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-300 rounded-full">
                          {story.drafts} Draft{story.drafts !== 1 ? "s" : ""}
                        </div>
                      )}
                      {story.inProgress > 0 && (
                        <div className="text-sm px-3 py-1 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 rounded-full">
                          {story.inProgress} In Progress
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-primary-600 dark:text-primary-400"
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
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-ink-500 dark:text-ink-400">
                      Total Readers
                    </h3>
                    <div className="flex items-end">
                      <p className="text-2xl font-bold text-ink-900 dark:text-white">
                        {MOCK_ANALYTICS.totalReaders}
                      </p>
                      <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                        +{MOCK_ANALYTICS.readerGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                <div className="flex items-center">
                  <div className="p-2 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-secondary-600 dark:text-secondary-400"
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
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-ink-500 dark:text-ink-400">
                      Collectors
                    </h3>
                    <div className="flex items-end">
                      <p className="text-2xl font-bold text-ink-900 dark:text-white">
                        {MOCK_ANALYTICS.totalCollectors}
                      </p>
                      <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                        +{MOCK_ANALYTICS.collectorGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-600 dark:text-purple-400"
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
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-ink-500 dark:text-ink-400">
                      Total Votes
                    </h3>
                    <p className="text-2xl font-bold text-ink-900 dark:text-white">
                      {MOCK_ANALYTICS.totalVotes}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-600 dark:text-green-400"
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
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-ink-500 dark:text-ink-400">
                      Revenue (ETH)
                    </h3>
                    <p className="text-2xl font-bold text-ink-900 dark:text-white">
                      {MOCK_ANALYTICS.totalRevenue}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-sm border border-parchment-200 dark:border-dark-700">
              <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-4">
                Story Performance
              </h3>
              <div className="overflow-x-auto">
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
                        Revenue (ETH)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-200 dark:divide-dark-700">
                    {MOCK_ANALYTICS.storyPerformance.map((story) => (
                      <tr key={story.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-ink-900 dark:text-white">
                          {story.title}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-ink-700 dark:text-ink-200">
                          {story.reads}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-ink-700 dark:text-ink-200">
                          {story.collections}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-ink-700 dark:text-ink-200">
                          {story.votes}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-ink-700 dark:text-ink-200">
                          {story.revenue}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          <Link
                            to={`/stories/${story.id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "chapters":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-ink-900 dark:text-white">
                Chapter Drafts
              </h3>
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
                New Chapter
              </Button>
            </div>

            <div className="space-y-4">
              {MOCK_DRAFTS.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-sm border border-parchment-200 dark:border-dark-700"
                >
                  <div className="p-5 border-b border-parchment-200 dark:border-dark-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-3 sm:mb-0">
                        <div className="flex items-center">
                          <h3 className="text-lg font-bold text-ink-900 dark:text-white mr-3">
                            {draft.title}
                          </h3>
                          {getDraftStatusBadge(draft.status)}
                        </div>
                        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                          Story: {draft.storyTitle}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit
                        </Button>
                        {draft.status === "ready" && (
                          <Button variant="primary" size="sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-ink-500 dark:text-ink-400">
                          Word Count
                        </div>
                        <div className="text-lg font-medium text-ink-900 dark:text-white mt-1">
                          {draft.wordCount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-ink-500 dark:text-ink-400">
                          Last Edited
                        </div>
                        <div className="text-lg font-medium text-ink-900 dark:text-white mt-1">
                          {new Date(draft.lastEdited).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-ink-500 dark:text-ink-400">
                          Choices
                        </div>
                        <div className="text-lg font-medium text-ink-900 dark:text-white mt-1">
                          {draft.choices.length}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-ink-500 dark:text-ink-400">
                          Estimated
                        </div>
                        <div className="text-lg font-medium text-ink-900 dark:text-white mt-1">
                          {Math.ceil(draft.wordCount / 250)} min
                        </div>
                      </div>
                    </div>

                    {draft.preview && (
                      <div className="bg-parchment-50 dark:bg-dark-800 p-4 rounded-lg mb-4">
                        <h4 className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-2">
                          Preview
                        </h4>
                        <p className="text-sm text-ink-600 dark:text-ink-300 line-clamp-3">
                          {draft.preview}
                        </p>
                      </div>
                    )}

                    {draft.choices.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-2">
                          Reader Choices
                        </h4>
                        <div className="space-y-2">
                          {draft.choices.map((choice) => (
                            <div
                              key={choice.id}
                              className="p-3 bg-white dark:bg-dark-800 border border-parchment-200 dark:border-dark-700 rounded-lg text-sm text-ink-800 dark:text-ink-100"
                            >
                              {choice.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 pt-24 pb-16">
      <div className="content-wrapper">
        {/* Dashboard Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white mb-2">
            Creator Dashboard
          </h1>
          <p className="text-ink-600 dark:text-ink-300">
            Manage your stories, track performance, and grow your audience.
          </p>
        </motion.div>

        {/* Dashboard Tabs */}
        <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 mb-8">
          <div className="flex border-b border-parchment-200 dark:border-dark-700">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "stories"
                  ? "text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400"
                  : "text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
              }`}
              onClick={() => setActiveTab("stories")}
            >
              My Stories
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "chapters"
                  ? "text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400"
                  : "text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
              }`}
              onClick={() => setActiveTab("chapters")}
            >
              Chapter Drafts
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "analytics"
                  ? "text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400"
                  : "text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
              }`}
              onClick={() => setActiveTab("analytics")}
            >
              Analytics
            </button>
          </div>
          <div className="p-4 sm:p-6 md:p-8">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboardPage;
