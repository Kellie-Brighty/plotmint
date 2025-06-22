import { useState, useEffect } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// import RichTextEditor from "../components/RichTextEditor";
import ChapterEditor from "../components/ChapterEditor";
import { useAuth } from "../utils/AuthContext";
import { useWallet } from "../utils/useWallet";
import {
  createChapter,
  createChapterWithTokens,
  createPlotOptionsFromChoices,
  addPlotTokensToChapter,
  getStoryById,
  getChapterById,
  notifyFollowersOfNewChapter,
  updateChapter,
  updateChapterWithNFT,
  type StoryData,
} from "../utils/storyService";
import { serverTimestamp, type Timestamp } from "firebase/firestore";
import ChapterNFTCreator from "../components/ChapterNFTCreator";
import PublishingProgressModal from "../components/PublishingProgressModal";

interface ChapterData {
  title: string;
  content: string;
  hasChoicePoint: boolean;
  choiceOptions: string[];
}

interface PublishingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
}

const ChapterEditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { chapterId } = useParams<{ chapterId: string }>();
  const [searchParams] = useSearchParams();

  // Get storyId from URL query parameters if not provided in location state
  const storyIdFromUrl = searchParams.get("storyId");
  const isNewStory = location.state?.newStory || false;
  const isEditingDraft = !!chapterId;

  const [chapterData, setChapterData] = useState<ChapterData>({
    title: "",
    content: "",
    hasChoicePoint: true, // Always required
    choiceOptions: ["", ""],
  });
  const [storyData, setStoryData] = useState<StoryData | null>(
    location.state?.storyData || null
  );
  const [loading, setLoading] = useState(
    (!!storyIdFromUrl && !storyData) || !!chapterId
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNFTCreator, setShowNFTCreator] = useState(false);
  const [pendingChapterId, setPendingChapterId] = useState<string | null>(null);
  const [chapterPublished, setChapterPublished] = useState(false);
  const [showPublishingProgress, setShowPublishingProgress] = useState(false);
  const [publishingSteps, setPublishingSteps] = useState<PublishingStep[]>([]);
  const [chapterNumber, setChapterNumber] = useState<number>(1);

  const { currentUser } = useAuth();
  const { getWalletClient, getPublicClient, isConnected } = useWallet();

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
              // Set chapter number for existing drafts
              const chapterCount = fetchedStory.chapterCount || 0;
              setChapterNumber(chapterCount + 1);
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
            // Calculate chapter number based on existing chapters
            const chapterCount = fetchedStory.chapterCount || 0;
            setChapterNumber(chapterCount + 1);
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

    // Set chapter number when storyData is available
    if (storyData && chapterNumber === 1) {
      const chapterCount = storyData.chapterCount || 0;
      setChapterNumber(chapterCount + 1);
    }
  }, [isNewStory, storyData, navigate, isEditingDraft, chapterNumber]);

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
    // Check if we have the minimum required content
    if (!chapterData.title.trim() || !chapterData.content.trim()) {
      setError("Please add both a title and content for your chapter");
      return;
    }

    // Validate plot options
    const filledOptions = chapterData.choiceOptions.filter(
      (option) => option.trim().length > 0
    );

    if (filledOptions.length !== 2) {
      setError("Please provide exactly two plot options for reader voting");
      return;
    }

    setIsSaving(true);
    setError(null);

    // Initialize and show progress modal
    initializePublishingSteps(filledOptions);
    setShowPublishingProgress(true);

    try {
      // Ensure we have required data
      if (!storyData?.id || !currentUser) {
        throw new Error("Missing required data to publish chapter");
      }

      // Step 1: Create first plot token
      updateStepStatus("plot1", "loading");
      console.log("🚀 Creating first plot token...");

      // Generate plot options with metadata
      const plotOptions = await createPlotOptionsFromChoices(
        filledOptions,
        storyData.title,
        chapterData.title
      );

      updateStepStatus("plot1", "completed");
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief pause for UX

      // Step 2: Create second plot token (already included in plotOptions)
      updateStepStatus("plot2", "loading");
      console.log("🚀 Creating second plot token...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate token creation time
      updateStepStatus("plot2", "completed");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get wallet clients for token creation
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Please connect your wallet to create plot tokens");
      }

      // Step 3: Publish chapter
      updateStepStatus("chapter", "loading");
      console.log("📖 Publishing chapter...");

      let publishedChapterId;

      if (isEditingDraft && chapterId) {
        // For existing drafts, add plot tokens to the existing chapter
        await addPlotTokensToChapter(
          chapterId,
          plotOptions,
          walletClient,
          publicClient
        );

        // Now publish the chapter
        await updateChapter(chapterId, {
          title: chapterData.title,
          content: chapterData.content,
          hasChoicePoint: chapterData.hasChoicePoint,
          choiceOptions: filledOptions,
          published: true,
          updatedAt: serverTimestamp() as Timestamp,
        });

        publishedChapterId = chapterId;
      } else {
        // Create new chapter with plot tokens
        publishedChapterId = await createChapterWithTokens(
          {
            storyId: storyData.id,
            title: chapterData.title,
            content: chapterData.content,
            hasChoicePoint: true,
            choiceOptions: filledOptions,
            published: true,
          },
          currentUser.uid,
          plotOptions,
          walletClient,
          publicClient
        );
      }

      updateStepStatus("chapter", "completed");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 4: Notify followers
      updateStepStatus("notify", "loading");
      console.log("📢 Notifying followers...");

      await notifyFollowersOfNewChapter(storyData.id!, publishedChapterId);

      updateStepStatus("notify", "completed");
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("✅ Chapter published with plot tokens");

      // Hide progress modal and show success state
      setShowPublishingProgress(false);
      setChapterPublished(true);
      setPendingChapterId(publishedChapterId);
      setShowNFTCreator(true);
      setIsSaving(false);
    } catch (error) {
      console.error("Error publishing chapter:", error);

      // Update current step to error
      const currentStep = publishingSteps.find(
        (step) => step.status === "loading"
      );
      if (currentStep) {
        updateStepStatus(currentStep.id, "error");
      }

      setError(
        `Failed to publish chapter: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsSaving(false);

      // Hide progress modal after error
      setTimeout(() => setShowPublishingProgress(false), 3000);
    }
  };

  const handleNFTCreated = (nftContractAddress: string) => {
    // Don't close modal yet - wait for first edition to be minted
    console.log("🎨 NFT Collection created:", nftContractAddress);

    // Save the NFT contract address to the chapter immediately
    if (pendingChapterId) {
      updateChapterWithNFT(pendingChapterId, nftContractAddress).catch((err) =>
        console.error("Failed to save NFT address:", err)
      );
    }

    // Modal stays open for first edition minting
  };

  const handleFirstEditionMinted = () => {
    // Now close the modal after first edition is minted
    setShowNFTCreator(false);
    setPendingChapterId(null);
    // Stay on page to show published state
  };

  const handleNFTSkipped = () => {
    setShowNFTCreator(false);
    setPendingChapterId(null);
    // Stay on page to show published state
  };

  const handleNextStep = (step: "tokens" | "publish" | "draft") => {
    switch (step) {
      case "tokens":
        // Chapter already has tokens, redirect to creator dashboard
        setShowNFTCreator(false);
        setPendingChapterId(null);
        navigate("/creator");
        break;
      case "publish":
        // Chapter is already published, redirect to creator dashboard
        setShowNFTCreator(false);
        setPendingChapterId(null);
        navigate("/creator");
        break;
      case "draft":
        // Chapter is already published, redirect to creator dashboard
        setShowNFTCreator(false);
        setPendingChapterId(null);
        navigate("/creator");
        break;
    }
  };

  const handleChapterUpdate = (updatedChapter: ChapterData) => {
    setChapterData(updatedChapter);
  };

  // Initialize publishing steps
  const initializePublishingSteps = (plotOptions: string[]) => {
    const steps: PublishingStep[] = [
      {
        id: "plot1",
        title: `Creating "${plotOptions[0]}" token`,
        description: "Deploying first plot option as tradeable token",
        status: "pending",
      },
      {
        id: "plot2",
        title: `Creating "${plotOptions[1]}" token`,
        description: "Deploying second plot option as tradeable token",
        status: "pending",
      },
      {
        id: "chapter",
        title: "Publishing chapter",
        description: "Saving chapter content and metadata to database",
        status: "pending",
      },
      {
        id: "notify",
        title: "Notifying followers",
        description: "Sending notifications to story followers",
        status: "pending",
      },
    ];
    setPublishingSteps(steps);
    return steps;
  };

  // Update a specific step status
  const updateStepStatus = (
    stepId: string,
    status: PublishingStep["status"]
  ) => {
    setPublishingSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-ink-600 dark:text-ink-400">Loading chapter...</p>
        </div>
      </div>
    );
  }

  // Show published state
  if (chapterPublished) {
    return (
      <div className="min-h-screen bg-parchment-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-2">
              Chapter Published! 🎉
            </h2>
            <p className="text-ink-600 dark:text-ink-400 mb-6">
              Your chapter is now live with plot tokens. Readers can vote on the
              story direction!
            </p>

            <div className="space-y-3">
              <button
                onClick={() =>
                  navigate("/creator/new-chapter", {
                    state: { storyData },
                  })
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Write Next Chapter
              </button>

              <button
                onClick={() => navigate("/creator")}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-ink-700 dark:text-ink-300 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>

              <button
                onClick={() => navigate(`/stories/${storyData?.id}`)}
                className="w-full text-emerald-600 hover:text-emerald-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                View Story Page
              </button>
            </div>
          </div>
        </div>

        {/* NFT Creator Modal - Moved inside published state */}
        <AnimatePresence>
          {(() => {
            const shouldShowModal =
              showNFTCreator && pendingChapterId && storyData;

            return shouldShowModal;
          })() && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-dark-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold text-ink-900 dark:text-white">
                      Create NFT Collection (Optional)
                    </h2>
                    <button
                      onClick={() => {
                        setShowNFTCreator(false);
                        setPendingChapterId(null);
                      }}
                      className="text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="mb-6 p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg">
                    <h3 className="font-semibold text-ink-900 dark:text-white mb-2">
                      {storyData!.title} - {chapterData.title}
                    </h3>
                    <p className="text-ink-600 dark:text-ink-400 text-sm">
                      Your chapter is now published with plot tokens! Optionally
                      create a limited edition NFT collection to give your
                      readers exclusive collectibles.
                    </p>
                  </div>

                  <ChapterNFTCreator
                    chapterId={pendingChapterId!}
                    storyTitle={storyData!.title}
                    chapterTitle={chapterData.title}
                    chapterNumber={chapterNumber}
                    onNFTCreated={handleNFTCreated}
                    onFirstEditionMinted={handleFirstEditionMinted}
                    onNextStep={handleNextStep}
                  />

                  {/* Skip NFT option */}
                  <div className="mt-6 pt-6 border-t border-parchment-200 dark:border-dark-700">
                    <button
                      onClick={handleNFTSkipped}
                      className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-ink-700 dark:text-ink-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
                    >
                      Skip NFT Creation
                    </button>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-2 text-center">
                      You can always create NFT collections for published
                      chapters later
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
      <div className="content-wrapper">
        <div className="max-w-4xl mx-auto">
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
                <span className="text-sm font-medium">{storyData.title}</span>
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
                  Use the rich text editor to format your story with headings,
                  emphasis, and more.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>
                  Create choice points to let readers vote on where the story
                  goes next.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>
                  Plot options automatically become tokens that readers can
                  purchase to vote - connect your wallet to enable this feature.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>
                  Each choice option should present an interesting direction for
                  the story.
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
        </div>
      </div>

      {/* Publishing Progress Modal */}
      <PublishingProgressModal
        isOpen={showPublishingProgress}
        steps={publishingSteps}
      />
    </div>
  );
};

export default ChapterEditorPage;
