import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
// import RichTextEditor from "../components/RichTextEditor";
import ChapterEditor from "../components/ChapterEditor";
import { useAuth } from "../utils/AuthContext";
import { useWallet } from "../utils/useWallet";
import {
  createChapter,
  createChapterWithTokens,
  createPlotOptionsFromChoices,
  getStoryById,
  getChapterById,
  notifyFollowersOfNewChapter,
  updateChapter,
} from "../utils/storyService";

interface ChapterData {
  title: string;
  content: string;
  hasChoicePoint: boolean;
  choiceOptions: string[];
}

const ChapterEditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { chapterId } = useParams<{ chapterId: string }>();
  const [storyData, setStoryData] = useState(location.state?.storyData || null);
  const isNewStory = location.state?.newStory || false;
  const isEditingDraft = !!chapterId;

  // Get storyId from URL query parameters if not provided in location state
  const searchParams = new URLSearchParams(location.search);
  const storyIdFromUrl = searchParams.get("storyId");

  const { currentUser } = useAuth();
  const { isConnected, address, getWalletClient, getPublicClient } =
    useWallet();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(
    (!!storyIdFromUrl && !storyData) || !!chapterId
  );
  const [chapterData, setChapterData] = useState<ChapterData>({
    title: "",
    content: "",
    hasChoicePoint: true, // Always required
    choiceOptions: ["", ""],
  });

  // Fetch chapter data if editing an existing draft
  useEffect(() => {
    const fetchChapterData = async () => {
      if (!chapterId || !currentUser) return;

      setLoading(true);
      try {
        const fetchedChapter = await getChapterById(chapterId);

        if (fetchedChapter) {
          // Check if user is the creator of this chapter
          if (fetchedChapter.creatorId !== currentUser.uid) {
            setError("You don't have permission to edit this chapter");
            navigate("/creator");
            return;
          }

          // Set chapter data
          setChapterData({
            title: fetchedChapter.title || "",
            content: fetchedChapter.content || "",
            hasChoicePoint: fetchedChapter.hasChoicePoint || false,
            choiceOptions: fetchedChapter.choiceOptions || ["", ""],
          });

          // Fetch story data for this chapter if not already loaded
          if (!storyData) {
            const fetchedStory = await getStoryById(fetchedChapter.storyId);
            if (fetchedStory) {
              setStoryData(fetchedStory);
            }
          }
        } else {
          setError("Chapter not found");
          navigate("/creator");
        }
      } catch (err) {
        console.error("Error fetching chapter:", err);
        setError("Failed to load chapter data");
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [chapterId, currentUser, navigate, storyData]);

  // Fetch story data if we have a storyId from URL but no storyData
  useEffect(() => {
    const fetchStoryData = async () => {
      if (storyIdFromUrl && !storyData && !chapterId) {
        setLoading(true);
        try {
          const fetchedStory = await getStoryById(storyIdFromUrl);
          if (fetchedStory) {
            setStoryData(fetchedStory);
          } else {
            setError("Story not found");
            navigate("/creator");
          }
        } catch (err) {
          console.error("Error fetching story:", err);
          setError("Failed to load story data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStoryData();
  }, [storyIdFromUrl, storyData, navigate, chapterId]);

  useEffect(() => {
    // Set page title
    document.title = isEditingDraft
      ? `Edit Chapter | ${storyData?.title || "PlotMint"}`
      : isNewStory
      ? `Write First Chapter | ${storyData?.title || "PlotMint"}`
      : `Write New Chapter | ${storyData?.title || "PlotMint"}`;

    // Check if we have valid story data
    if (isNewStory && !storyData && !isEditingDraft) {
      navigate("/creator/new-story");
    }
  }, [isNewStory, storyData, navigate, isEditingDraft]);

  const handleSaveAsDraft = async () => {
    // Check if we have the minimum required content
    if (!chapterData.title.trim()) {
      setError("Please add a title for your chapter");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Ensure we have required data
      if (!storyData?.id || !currentUser) {
        throw new Error("Missing required data to save chapter");
      }

      let savedChapterId;

      if (isEditingDraft && chapterId) {
        // Update existing draft
        await updateChapter(chapterId, {
          title: chapterData.title,
          content: chapterData.content || "Draft content",
          hasChoicePoint: chapterData.hasChoicePoint,
          choiceOptions: chapterData.hasChoicePoint
            ? chapterData.choiceOptions
            : [],
          published: false, // Keep as draft
        });
        savedChapterId = chapterId;
        console.log("Chapter updated as draft with ID:", chapterId);
      } else {
        // Create new draft
        savedChapterId = await createChapter(
          {
            storyId: storyData.id,
            title: chapterData.title,
            content: chapterData.content || "Draft content",
            hasChoicePoint: chapterData.hasChoicePoint,
            // Always send an array for choiceOptions, empty if not using choice points
            choiceOptions: chapterData.hasChoicePoint
              ? chapterData.choiceOptions
              : [],
            published: false, // Explicitly set as draft
          },
          currentUser.uid
        );
        console.log("Chapter saved as draft with ID:", savedChapterId);
      }

      navigate("/creator");
    } catch (error) {
      console.error("Error saving chapter as draft:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (
          error.message.includes("invalid data") ||
          error.message.includes("undefined")
        ) {
          setError(
            "There was an issue with your chapter data. Please make sure all fields are filled correctly."
          );
        } else {
          setError(`Failed to save chapter: ${error.message}`);
        }
      } else {
        setError("Failed to save chapter. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!chapterData.title.trim()) {
      setError("Please add a title for your chapter");
      return;
    }

    if (!chapterData.content.trim()) {
      setError("Please add content to your chapter");
      return;
    }

    // Always require exactly 2 plot options (all chapters must have plot options)
    const filledOptions = chapterData.choiceOptions.filter(
      (option) => option.trim().length > 0
    );

    if (filledOptions.length !== 2) {
      setError("You must provide exactly 2 plot options before publishing");
      return;
    }

    // Always require wallet connection for token creation
    if (!isConnected) {
      setError(
        "Please connect your wallet to create plot tokens for reader voting"
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Ensure we have required data
      if (!storyData?.id || !currentUser) {
        throw new Error("Missing required data to publish chapter");
      }

      let publishedChapterId;

      if (isEditingDraft && chapterId) {
        // Update existing draft and publish it
        await updateChapter(chapterId, {
          title: chapterData.title,
          content: chapterData.content,
          hasChoicePoint: chapterData.hasChoicePoint,
          choiceOptions: chapterData.hasChoicePoint
            ? chapterData.choiceOptions.filter(
                (option) => option.trim().length > 0
              ) // Only include non-empty options
            : [],
          published: true, // Set to published
        });
        publishedChapterId = chapterId;
        console.log("Draft published with ID:", chapterId);
      } else {
        // Create new published chapter - ALWAYS with tokens since plot options are mandatory
        try {
          // Generate plot options with metadata
          const plotOptions = await createPlotOptionsFromChoices(
            filledOptions,
            storyData.title,
            chapterData.title
          );

          // Get wallet clients for token creation
          const walletClient = getWalletClient();
          const publicClient = getPublicClient();

          if (!walletClient || !publicClient) {
            throw new Error("Failed to get wallet clients for token creation");
          }

          // Double-check wallet connection before creating tokens
          if (!walletClient.account && !address) {
            throw new Error(
              "Wallet not properly connected - please reconnect your wallet"
            );
          }

          console.log("🚀 Creating chapter with plot tokens...");
          console.log(`📋 Wallet address: ${address}`);
          console.log(`🎲 Plot options: ${filledOptions.join(", ")}`);

          publishedChapterId = await createChapterWithTokens(
            {
              storyId: storyData.id,
              title: chapterData.title,
              content: chapterData.content,
              hasChoicePoint: true, // Always true now
              choiceOptions: filledOptions,
              published: true,
            },
            currentUser.uid,
            plotOptions,
            walletClient,
            publicClient
          );
          console.log(
            "✅ Chapter with plot tokens published with ID:",
            publishedChapterId
          );
        } catch (tokenError) {
          console.error("Error creating tokens:", tokenError);
          setError(
            `Token creation failed: ${
              tokenError instanceof Error ? tokenError.message : "Unknown error"
            }. Please ensure your wallet is properly connected and on Base Sepolia network, then try again.`
          );
          return;
        }
      }

      // Notify followers about the new chapter
      try {
        await notifyFollowersOfNewChapter(storyData.id, publishedChapterId);
        console.log("Followers notified about new chapter");
      } catch (notifyError) {
        console.error("Error notifying followers:", notifyError);
        // Don't block the publishing flow if notification fails
      }

      navigate("/creator");
    } catch (error) {
      console.error("Error publishing chapter:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (
          error.message.includes("invalid data") ||
          error.message.includes("undefined")
        ) {
          setError(
            "There was an issue with your chapter data. Please make sure all fields are filled correctly."
          );
        } else {
          setError(`Failed to publish chapter: ${error.message}`);
        }
      } else {
        setError("Failed to publish chapter. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChapterUpdate = (updatedChapter: ChapterData) => {
    setChapterData(updatedChapter);
  };

  return (
    <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
      <div className="content-wrapper">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white">
                    {isEditingDraft
                      ? "Edit Draft Chapter"
                      : isNewStory
                      ? "Write Your First Chapter"
                      : "Write New Chapter"}
                  </h1>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSaveAsDraft}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-sm bg-white dark:bg-dark-800 border border-parchment-300 dark:border-dark-600 text-ink-700 dark:text-ink-200 font-medium rounded-md hover:bg-parchment-50 dark:hover:bg-dark-700 disabled:opacity-50"
                    >
                      {isSaving
                        ? "Saving..."
                        : isEditingDraft
                        ? "Update Draft"
                        : "Save as Draft"}
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Publish Chapter"}
                    </button>
                  </div>
                </div>

                {storyData && (
                  <div className="flex items-center space-x-2 text-ink-600 dark:text-ink-300">
                    <span className="text-sm">For story:</span>
                    <span className="text-sm font-medium">
                      {storyData.title}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300">
                      {storyData.genre}
                    </span>
                  </div>
                )}

                {/* Wallet Status and Token Creation Info - Always show since plot options are mandatory */}
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm">
                      <div className="flex items-center mb-1">
                        <span className="text-blue-800 dark:text-blue-200 font-medium">
                          Plot Token Creation
                        </span>
                        <span
                          className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            isConnected
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {isConnected ? "Wallet Connected" : "Wallet Required"}
                        </span>
                      </div>
                      <p className="text-blue-700 dark:text-blue-300">
                        {isConnected
                          ? "Your plot options will be converted to tokens that readers can purchase to vote on the story direction."
                          : "Connect your wallet to create plot tokens for reader voting. Each plot option becomes a token that readers can buy to influence the story."}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-md">
                    <strong>Error:</strong> {error}
                  </div>
                )}
              </motion.div>

              {/* Editor Container */}
              <ChapterEditor
                onSave={handleChapterUpdate}
                initialContent={chapterData.content}
                initialTitle={chapterData.title}
                initialHasChoicePoint={chapterData.hasChoicePoint}
                initialChoiceOptions={chapterData.choiceOptions}
              />

              {/* Writing Tips Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-6"
              >
                <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-3">
                  Writing Tips
                </h3>
                <ul className="space-y-2 text-sm text-ink-700 dark:text-ink-300">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>
                      Use the rich text editor to format your story with
                      headings, emphasis, and more.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>
                      Create choice points to let readers vote on where the
                      story goes next.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>
                      Plot options automatically become tokens that readers can
                      purchase to vote - connect your wallet to enable this
                      feature.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>
                      Each choice option should present an interesting direction
                      for the story.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>
                      You can save your chapter as a draft and come back to it
                      later.
                    </span>
                  </li>
                </ul>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterEditorPage;
