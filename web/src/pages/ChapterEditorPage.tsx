import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
// import RichTextEditor from "../components/RichTextEditor";
import ChapterEditor from "../components/ChapterEditor";

interface ChapterData {
  title: string;
  content: string;
  hasChoicePoint: boolean;
  choiceOptions: string[];
}

const ChapterEditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const storyData = location.state?.storyData || null;
  const isNewStory = location.state?.newStory || false;

  const [isSaving, setIsSaving] = useState(false);
  const [chapterData, setChapterData] = useState<ChapterData>({
    title: "",
    content: "",
    hasChoicePoint: false,
    choiceOptions: ["", ""],
  });

  useEffect(() => {
    // Set page title
    document.title = isNewStory
      ? `Write First Chapter | ${storyData?.title || "PlotMint"}`
      : "Write New Chapter | PlotMint";

    // Check if we have valid story data
    if (isNewStory && !storyData) {
      navigate("/creator/new-story");
    }
  }, [isNewStory, storyData, navigate]);

  const handleSaveAsDraft = () => {
    // Check if we have the minimum required content
    if (!chapterData.title.trim()) {
      alert("Please add a title for your chapter");
      return;
    }

    setIsSaving(true);

    // In a real app, this would save to the server
    console.log("Saving chapter as draft:", chapterData);
    console.log("For story:", storyData);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      navigate("/creator");
    }, 1000);
  };

  const handlePublish = () => {
    // Validate required fields
    if (!chapterData.title.trim()) {
      alert("Please add a title for your chapter");
      return;
    }

    if (!chapterData.content.trim()) {
      alert("Please add content to your chapter");
      return;
    }

    if (
      chapterData.hasChoicePoint &&
      chapterData.choiceOptions.some((option) => !option.trim())
    ) {
      alert("Please fill in all choice options or remove empty ones");
      return;
    }

    setIsSaving(true);

    // In a real app, this would publish to the server
    console.log("Publishing chapter:", chapterData);
    console.log("For story:", storyData);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      navigate("/creator");
    }, 1000);
  };

  const handleChapterUpdate = (updatedChapter: ChapterData) => {
    setChapterData(updatedChapter);
  };

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
                {isNewStory ? "Write Your First Chapter" : "Write New Chapter"}
              </h1>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-dark-800 border border-parchment-300 dark:border-dark-600 text-ink-700 dark:text-ink-200 font-medium rounded-md hover:bg-parchment-50 dark:hover:bg-dark-700 disabled:opacity-50"
                >
                  Save as Draft
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

            {isNewStory && storyData && (
              <div className="flex items-center space-x-2 text-ink-600 dark:text-ink-300">
                <span className="text-sm">For story:</span>
                <span className="text-sm font-medium">{storyData.title}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300">
                  {storyData.genre}
                </span>
              </div>
            )}
          </motion.div>

          {/* Editor Container */}
          <ChapterEditor onSave={handleChapterUpdate} initialContent="" />

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
    </div>
  );
};

export default ChapterEditorPage;
