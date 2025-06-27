import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import RichTextEditor from "./RichTextEditor";

interface ChapterEditorProps {
  onSave: (chapterData: ChapterData) => void;
  initialContent?: string;
  initialTitle?: string;
  initialHasChoicePoint?: boolean;
  initialChoiceOptions?: string[];
  initialPlotOptionPreviews?: string[];
}

export interface ChapterData {
  title: string;
  content: string;
  hasChoicePoint: boolean;
  choiceOptions: string[];
  plotOptionPreviews: string[]; // Preview snippets for each plot option
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({
  onSave,
  initialContent = "",
  initialTitle = "",
  initialHasChoicePoint = false,
  initialChoiceOptions = ["", ""],
  initialPlotOptionPreviews = ["", ""],
}) => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Track if this is the initial setup to prevent feedback loop
  const isInitialSetupRef = useRef(true);
  // Track last values to prevent unnecessary updates
  const lastInitialValuesRef = useRef({
    content: initialContent,
    title: initialTitle,
    hasChoicePoint: initialHasChoicePoint,
    choiceOptions: initialChoiceOptions,
    plotOptionPreviews: initialPlotOptionPreviews,
  });

  const [chapterData, setChapterData] = useState<ChapterData>({
    title: initialTitle,
    content: initialContent,
    hasChoicePoint: true, // Always enabled
    choiceOptions:
      initialChoiceOptions.length >= 2 ? initialChoiceOptions : ["", ""],
    plotOptionPreviews:
      initialPlotOptionPreviews.length >= 2
        ? initialPlotOptionPreviews
        : ["", ""],
  });

  // Update the chapter data when initialContent changes (but only if it's actually different)
  useEffect(() => {
    const lastValues = lastInitialValuesRef.current;

    // Check if any of the initial values have actually changed
    const hasChanged =
      initialContent !== lastValues.content ||
      initialTitle !== lastValues.title ||
      initialHasChoicePoint !== lastValues.hasChoicePoint ||
      JSON.stringify(initialChoiceOptions) !==
        JSON.stringify(lastValues.choiceOptions) ||
      JSON.stringify(initialPlotOptionPreviews) !==
        JSON.stringify(lastValues.plotOptionPreviews);

    if (hasChanged) {
      // Update our tracking reference
      lastInitialValuesRef.current = {
        content: initialContent,
        title: initialTitle,
        hasChoicePoint: initialHasChoicePoint,
        choiceOptions: initialChoiceOptions,
        plotOptionPreviews: initialPlotOptionPreviews,
      };

      // Only update state if values actually changed
      setChapterData((prevState) => {
        const newState = {
          ...prevState,
          title: initialTitle,
          content: initialContent,
          hasChoicePoint: initialHasChoicePoint,
          choiceOptions:
            initialChoiceOptions.length > 0 ? initialChoiceOptions : ["", ""],
          plotOptionPreviews:
            initialPlotOptionPreviews.length > 0
              ? initialPlotOptionPreviews
              : ["", ""],
        };

        // Only return new state if it's actually different
        if (JSON.stringify(newState) !== JSON.stringify(prevState)) {
          return newState;
        }
        return prevState;
      });
    }
  }, [
    initialContent,
    initialTitle,
    initialHasChoicePoint,
    initialChoiceOptions,
    initialPlotOptionPreviews,
  ]);

  // Notify parent component when chapter data changes (but skip initial setup)
  useEffect(() => {
    if (isInitialSetupRef.current) {
      // Skip the first call during initial setup
      isInitialSetupRef.current = false;
      return;
    }

    // Use a small delay to batch multiple rapid changes together
    const timeoutId = setTimeout(() => {
      onSave(chapterData);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [chapterData, onSave]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setChapterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setChapterData((prev) => ({ ...prev, content }));
  };

  const handleChoiceOptionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newOptions = [...chapterData.choiceOptions];
    newOptions[index] = e.target.value;
    setChapterData((prev) => ({ ...prev, choiceOptions: newOptions }));
  };

  const handlePreviewChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const newPreviews = [...chapterData.plotOptionPreviews];
    newPreviews[index] = e.target.value;
    setChapterData((prev) => ({ ...prev, plotOptionPreviews: newPreviews }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-6 mb-8"
    >
      <div className="space-y-6">
        {/* Chapter Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1"
          >
            Chapter Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={chapterData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-md border border-parchment-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter a title for this chapter"
          />
        </div>

        {/* Chapter Content - Rich Text Editor */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1"
          >
            Chapter Content <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            value={chapterData.content}
            onChange={handleContentChange}
            placeholder="Write your chapter content here..."
          />
        </div>

        {/* Plot Choice Section - Always Required */}
        <div className="mt-8 border-t border-parchment-200 dark:border-dark-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-ink-900 dark:text-white">
              Plot Choice Point
            </h3>
            <span className="px-3 py-1 text-sm font-medium text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-full">
              Required
            </span>
          </div>

          {/* Always show plot options - they are required */}
          {
            <div className="bg-parchment-50 dark:bg-dark-800 p-4 rounded-md border border-parchment-200 dark:border-dark-700 mt-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-600 dark:text-ink-400">
                  Create exactly two plot options for readers to vote on. These
                  will become tokens that readers can purchase to influence the
                  story direction.
                </p>
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded-full">
                  Exactly 2 Required
                </span>
              </div>

              <div className="space-y-6">
                {chapterData.choiceOptions.slice(0, 2).map((option, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-dark-900 p-4 rounded-lg border border-parchment-300 dark:border-dark-600"
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                          Plot Option {index + 1}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleChoiceOptionChange(e, index)}
                          placeholder={`Describe plot option ${index + 1}...`}
                          className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-900 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                          Preview Snippet
                          <span className="text-ink-500 dark:text-ink-400 font-normal ml-1">
                            (Optional)
                          </span>
                        </label>
                        <textarea
                          value={chapterData.plotOptionPreviews[index] || ""}
                          onChange={(e) => handlePreviewChange(e, index)}
                          placeholder={`Give readers a sneak peek of what happens if they choose this option...`}
                          rows={2}
                          className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-900 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                        <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                          A brief hint about what this choice might lead to (1-2
                          sentences)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Token Creation:</strong> Both plot options must be
                    filled before publishing. They will become purchasable
                    tokens on Base Sepolia.
                  </p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </motion.div>
  );
};

export default ChapterEditor;
