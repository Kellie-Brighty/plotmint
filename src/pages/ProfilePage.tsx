import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";

// Mock user data
const MOCK_USERS: Record<string, any> = {
  "user1": {
    id: "user1",
    username: "storyteller42",
    displayName: "Alex Morgan",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&q=80",
    bio: "Fiction writer specializing in sci-fi and fantasy. Building worlds one chapter at a time.",
    joined: "2023-05-15T10:30:00Z",
    isCreator: true,
    followers: 127,
    following: 43,
    stories: [
      {
        id: "story1",
        title: "The Quantum Nexus",
        coverImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&q=80",
        chaptersCount: 7,
        collectorsCount: 218,
        lastUpdated: "2023-10-22T10:15:00Z"
      },
      {
        id: "story2",
        title: "Whispers in the Void",
        coverImage: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&h=300&q=80",
        chaptersCount: 5,
        collectorsCount: 103,
        lastUpdated: "2023-09-15T14:32:00Z"
      }
    ],
    collection: [
      {
        id: "coll1",
        storyId: "story3",
        storyTitle: "Beyond the Stars",
        chapterTitle: "First Contact",
        coverImage: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=400&h=300&q=80",
        collectedAt: "2023-10-18T08:45:00Z"
      },
      {
        id: "coll2",
        storyId: "story4",
        storyTitle: "Ethereal Memories",
        chapterTitle: "The Awakening",
        coverImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=300&q=80",
        collectedAt: "2023-10-05T14:20:00Z"
      }
    ],
    activity: [
      {
        id: "act1",
        type: "publish",
        storyId: "story1",
        storyTitle: "The Quantum Nexus",
        chapterTitle: "Chapter 7: The Revelation",
        timestamp: "2023-10-22T10:15:00Z"
      },
      {
        id: "act2",
        type: "collect",
        storyId: "story3",
        storyTitle: "Beyond the Stars",
        chapterTitle: "First Contact",
        timestamp: "2023-10-18T08:45:00Z"
      },
      {
        id: "act3",
        type: "vote",
        storyId: "story5",
        storyTitle: "Chronicles of Eldoria",
        chapterTitle: "Chapter 3: The Decision",
        optionChosen: "Venture into the forbidden forest",
        timestamp: "2023-10-12T16:30:00Z"
      }
    ]
  },
  "user2": {
    id: "user2",
    username: "readerlover",
    displayName: "Jamie Wilson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&q=80",
    bio: "Avid reader and collector of digital narratives. I love stories that challenge conventional thinking.",
    joined: "2023-04-10T08:15:00Z",
    isCreator: false,
    followers: 38,
    following: 102,
    collection: [
      {
        id: "coll3",
        storyId: "story1",
        storyTitle: "The Quantum Nexus",
        chapterTitle: "Chapter 5: The Choice",
        coverImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&q=80",
        collectedAt: "2023-10-20T11:30:00Z"
      },
      {
        id: "coll4",
        storyId: "story2",
        storyTitle: "Whispers in the Void",
        chapterTitle: "Chapter 3: Echoes",
        coverImage: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&h=300&q=80",
        collectedAt: "2023-10-10T09:15:00Z"
      },
      {
        id: "coll5",
        storyId: "story6",
        storyTitle: "The Last Guardian",
        chapterTitle: "Chapter 1: Awakening",
        coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&q=80",
        collectedAt: "2023-09-28T15:40:00Z"
      }
    ],
    activity: [
      {
        id: "act4",
        type: "collect",
        storyId: "story1",
        storyTitle: "The Quantum Nexus",
        chapterTitle: "Chapter 5: The Choice",
        timestamp: "2023-10-20T11:30:00Z"
      },
      {
        id: "act5",
        type: "vote",
        storyId: "story1",
        storyTitle: "The Quantum Nexus",
        chapterTitle: "Chapter 6: Crossroads",
        optionChosen: "Follow the quantum signature",
        timestamp: "2023-10-15T13:20:00Z"
      },
      {
        id: "act6",
        type: "collect",
        storyId: "story2",
        storyTitle: "Whispers in the Void",
        chapterTitle: "Chapter 3: Echoes",
        timestamp: "2023-10-10T09:15:00Z"
      }
    ]
  }
};

type TabType = "collection" | "stories" | "activity";

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("collection");
  const [userData, setUserData] = useState(MOCK_USERS[userId || "user1"]);
  
  useEffect(() => {
    // In a real app, this would fetch user data from an API
    setUserData(MOCK_USERS[userId || "user1"]);
    
    // Set page title
    document.title = `${userData?.displayName || "User"} | PlotMint`;
  }, [userId, userData?.displayName]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get relative time string
  const getRelativeTimeString = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  };

  // Render activity icon based on type
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "publish":
        return (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "collect":
        return (
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </div>
        );
      case "vote":
        return (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 pt-24 pb-16">
        <div className="content-wrapper">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-ink-900 dark:text-white mb-4">
              User Not Found
            </h1>
            <p className="text-ink-600 dark:text-ink-300 mb-6">
              The user profile you're looking for doesn't exist or has been removed.
            </p>
            <Button variant="primary" size="md">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 pt-24 pb-16">
      <div className="content-wrapper">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden mb-8"
        >
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-primary-500 to-secondary-500 relative">
            {/* Avatar */}
            <div className="absolute -bottom-16 left-6 sm:left-8">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-dark-900 overflow-hidden shadow-md">
                <img 
                  src={userData.avatar} 
                  alt={userData.displayName} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-20 px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white mb-1">
                  {userData.displayName}
                </h1>
                <p className="text-ink-500 dark:text-ink-400 mb-2">
                  @{userData.username}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-ink-600 dark:text-ink-300">
                    <span className="font-medium text-ink-900 dark:text-white">{userData.followers}</span> Followers
                  </span>
                  <span className="text-ink-600 dark:text-ink-300">
                    <span className="font-medium text-ink-900 dark:text-white">{userData.following}</span> Following
                  </span>
                  <span className="text-ink-600 dark:text-ink-300">
                    Joined {formatDate(userData.joined)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <Button variant="primary" size="sm">
                  Follow
                </Button>
              </div>
            </div>
            
            {userData.bio && (
              <p className="text-ink-700 dark:text-ink-200 mb-6 max-w-3xl">
                {userData.bio}
              </p>
            )}
            
            {/* Tabs */}
            <div className="border-b border-parchment-200 dark:border-dark-700">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setActiveTab("collection")}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    activeTab === "collection"
                      ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
                  }`}
                >
                  Collection
                </button>
                {userData.isCreator && (
                  <button
                    onClick={() => setActiveTab("stories")}
                    className={`py-4 text-sm font-medium border-b-2 ${
                      activeTab === "stories"
                        ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
                    }`}
                  >
                    Stories
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`py-4 text-sm font-medium border-b-2 ${
                    activeTab === "activity"
                      ? "border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
                  }`}
                >
                  Activity
                </button>
              </nav>
            </div>
          </div>
        </motion.div>
        
        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {/* Collection Tab */}
          {activeTab === "collection" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userData.collection?.map((item: any) => (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-sm border border-parchment-200 dark:border-dark-700 hover:shadow-md transition-shadow"
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={item.coverImage} 
                      alt={item.storyTitle} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-1">
                      {item.storyTitle}
                    </h3>
                    <p className="text-ink-600 dark:text-ink-300 text-sm mb-3">
                      {item.chapterTitle}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-ink-500 dark:text-ink-400">
                        Collected {getRelativeTimeString(item.collectedAt)}
                      </span>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Stories Tab */}
          {activeTab === "stories" && userData.isCreator && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userData.stories?.map((story: any) => (
                <div 
                  key={story.id}
                  className="bg-white dark:bg-dark-900 rounded-xl overflow-hidden shadow-sm border border-parchment-200 dark:border-dark-700 flex flex-col sm:flex-row"
                >
                  <div className="sm:w-2/5">
                    <img 
                      src={story.coverImage} 
                      alt={story.title} 
                      className="w-full h-48 sm:h-full object-cover"
                    />
                  </div>
                  <div className="p-4 sm:p-6 flex-1">
                    <h3 className="text-xl font-bold text-ink-900 dark:text-white mb-2">
                      {story.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Chapters</p>
                        <p className="font-medium text-ink-900 dark:text-white">{story.chaptersCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">Collectors</p>
                        <p className="font-medium text-ink-900 dark:text-white">{story.collectorsCount}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-ink-500 dark:text-ink-400">
                        Updated {getRelativeTimeString(story.lastUpdated)}
                      </span>
                      <Button variant="primary" size="sm">
                        Read
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden">
              <div className="divide-y divide-parchment-200 dark:divide-dark-700">
                {userData.activity?.map((activity: any) => (
                  <div key={activity.id} className="p-4 sm:p-6 flex items-start space-x-4">
                    {renderActivityIcon(activity.type)}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                        <h4 className="font-medium text-ink-900 dark:text-white">
                          {activity.type === "publish" && "Published a new chapter"}
                          {activity.type === "collect" && "Collected a chapter"}
                          {activity.type === "vote" && "Voted on a story branch"}
                        </h4>
                        <span className="text-xs text-ink-500 dark:text-ink-400 sm:ml-4">
                          {getRelativeTimeString(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-ink-700 dark:text-ink-200 text-sm">
                        <span className="font-medium">{activity.storyTitle}</span> - {activity.chapterTitle}
                      </p>
                      {activity.type === "vote" && activity.optionChosen && (
                        <p className="mt-1 text-sm text-ink-600 dark:text-ink-300 bg-parchment-50 dark:bg-dark-800 px-3 py-2 rounded-md mt-2">
                          Voted for: "{activity.optionChosen}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
