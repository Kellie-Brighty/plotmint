import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import RichTextEditor from "./RichTextEditor";

interface ChapterEditorProps {
  onSave: (chapterData: ChapterData) => void;
  initialContent?: string;
  initialTitle?: string;
  initialHasChoicePoint?: boolean;
  initialChoiceOptions?: string[];
}

export interface ChapterData {
  title: string;
  content: string;
  hasChoicePoint: boolean;
  choiceOptions: string[];
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({
  onSave,
  initialContent = "",
  initialTitle = "",
  initialHasChoicePoint = false,
  initialChoiceOptions = ["", ""],
}) => {
  const [chapterData, setChapterData] = useState<ChapterData>({
    title: initialTitle,
    content: initialContent,
    hasChoicePoint: initialHasChoicePoint,
    choiceOptions: initialChoiceOptions,
  });

  // Update the chapter data when initialContent changes
  useEffect(() => {
    setChapterData(prevState => ({
      ...prevState,
      title: initialTitle,
      content: initialContent,
      hasChoicePoint: initialHasChoicePoint,
      choiceOptions: initialChoiceOptions.length > 0 ? initialChoiceOptions : ["", ""],
    }));
  }, [initialContent, initialTitle, initialHasChoicePoint, initialChoiceOptions]);

  // Any time chapter data changes, notify the parent component
  useEffect(() => {
    onSave(chapterData);
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

  const addChoiceOption = () => {
    setChapterData((prev) => ({
      ...prev,
      choiceOptions: [...prev.choiceOptions, ""],
    }));
  };

  const removeChoiceOption = (index: number) => {
    if (chapterData.choiceOptions.length <= 2) {
      // Require at least 2 options
      return;
    }

    const newOptions = [...chapterData.choiceOptions];
    newOptions.splice(index, 1);
    setChapterData((prev) => ({ ...prev, choiceOptions: newOptions }));
  };

  const toggleChoicePoint = () => {
    setChapterData((prev) => ({
      ...prev,
      hasChoicePoint: !prev.hasChoicePoint,
    }));
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

        {/* Plot Choice Section - More Prominent */}
        <div className="mt-8 border-t border-parchment-200 dark:border-dark-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-ink-900 dark:text-white">
              Plot Choice Point
            </h3>
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-3 text-sm text-ink-700 dark:text-ink-300">
                {chapterData.hasChoicePoint ? "Enabled" : "Disabled"}
              </span>
              <div
                className={`relative w-11 h-6 transition-colors duration-200 ease-in-out rounded-full ${
                  chapterData.hasChoicePoint
                    ? "bg-primary-600"
                    : "bg-parchment-300 dark:bg-dark-700"
                }`}
                onClick={toggleChoicePoint}
              >
                <div
                  className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out transform ${
                    chapterData.hasChoicePoint ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>

          {chapterData.hasChoicePoint && (
            <div className="bg-parchment-50 dark:bg-dark-800 p-4 rounded-md border border-parchment-200 dark:border-dark-700 mt-2">
              <p className="text-sm text-ink-600 dark:text-ink-400 mb-4">
                Add choices for your readers to vote on what happens next in the
                story. Each choice should lead to a different path.
              </p>

              <div className="space-y-3">
                {chapterData.choiceOptions.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-ink-700 dark:text-ink-300 w-7">
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleChoiceOptionChange(e, index)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-parchment-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-900 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeChoiceOption(index)}
                      disabled={chapterData.choiceOptions.length <= 2}
                      className="ml-2 text-ink-500 dark:text-ink-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 disabled:hover:text-ink-500 dark:disabled:hover:text-ink-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addChoiceOption}
                  className="mt-2 w-full py-2 flex items-center justify-center text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 border border-primary-200 dark:border-primary-900/40 rounded-md transition-colors"
                >
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Another Option
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChapterEditor;
