import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import RichTextEditor from "./RichTextEditor";

interface ChapterEditorProps {
  onSave: (chapterData: ChapterData) => void;
  initialContent?: string;
}

export interface ChapterData {
  title: string;
  content: string;
  hasChoicePoint: boolean;
  choiceOptions: string[];
}

const ChapterEditor = ({ onSave, initialContent = "" }: ChapterEditorProps) => {
  const navigate = useNavigate();
  const [chapterData, setChapterData] = useState<ChapterData>({
    title: "",
    content: initialContent,
    hasChoicePoint: false,
    choiceOptions: ["", ""],
  });
  const [showMetadataPrompt, setShowMetadataPrompt] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setChapterData({ ...chapterData, [name]: value });
  };

  const handleContentChange = (content: string) => {
    setChapterData({ ...chapterData, content });
  };

  const handleToggleChoicePoint = () => {
    setChapterData({
      ...chapterData,
      hasChoicePoint: !chapterData.hasChoicePoint,
    });
  };

  const handleChoiceOptionChange = (index: number, value: string) => {
    const newOptions = [...chapterData.choiceOptions];
    newOptions[index] = value;
    setChapterData({ ...chapterData, choiceOptions: newOptions });
  };

  const addChoiceOption = () => {
    if (chapterData.choiceOptions.length < 4) {
      setChapterData({
        ...chapterData,
        choiceOptions: [...chapterData.choiceOptions, ""],
      });
    }
  };

  const removeChoiceOption = (index: number) => {
    if (chapterData.choiceOptions.length > 2) {
      const newOptions = chapterData.choiceOptions.filter(
        (_, i) => i !== index
      );
      setChapterData({ ...chapterData, choiceOptions: newOptions });
    }
  };

  const handleSave = () => {
    // Check if we have the minimum required content
    if (chapterData.title.trim() && chapterData.content.trim()) {
      onSave(chapterData);
    }
  };

  const handleSaveAndCreateStory = () => {
    // Save chapter data to localStorage temporarily
    localStorage.setItem("draftChapter", JSON.stringify(chapterData));
    // Navigate to story creation with the chapter
    navigate("/creator/new-story?withChapter=true");
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-2">
            Write Your Chapter
          </h2>
          <p className="text-sm text-ink-600 dark:text-ink-300">
            Start writing your story right away. You can add story details
            later.
          </p>
        </div>

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

          {/* Choice Point Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="hasChoicePoint"
              checked={chapterData.hasChoicePoint}
              onChange={handleToggleChoicePoint}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-parchment-300 rounded"
            />
            <label
              htmlFor="hasChoicePoint"
              className="text-sm font-medium text-ink-700 dark:text-ink-200"
            >
              Add a choice point at the end of this chapter
            </label>
          </div>

          {/* Choice Options */}
          {chapterData.hasChoicePoint && (
            <div className="bg-parchment-50 dark:bg-dark-800 p-4 rounded-md space-y-4">
              <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                Choice Options (Readers will vote on these)
              </h3>

              {chapterData.choiceOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                      handleChoiceOptionChange(index, e.target.value)
                    }
                    className="flex-1 px-3 py-2 rounded-md border border-parchment-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-ink-900 dark:text-white text-sm"
                    placeholder={`Option ${index + 1}`}
                  />
                  {chapterData.choiceOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeChoiceOption(index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {chapterData.choiceOptions.length < 4 && (
                <button
                  type="button"
                  onClick={addChoiceOption}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Another Option
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-white dark:bg-dark-800 border border-parchment-300 dark:border-dark-600 text-ink-700 dark:text-ink-200 font-medium rounded-md hover:bg-parchment-50 dark:hover:bg-dark-700"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSaveAndCreateStory}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
          >
            Continue to Story Setup
          </button>
        </div>
      </motion.div>

      {/* Metadata Prompt Modal */}
      {showMetadataPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-900 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-2">
              Your chapter looks great!
            </h3>
            <p className="text-ink-600 dark:text-ink-300 mb-4">
              Now, let's create a story for this chapter with details like
              genre, cover image, and description.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowMetadataPrompt(false)}
                className="px-4 py-2 border border-parchment-300 dark:border-dark-600 text-ink-700 dark:text-ink-200 font-medium rounded-md"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={handleSaveAndCreateStory}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
              >
                Create Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterEditor;
