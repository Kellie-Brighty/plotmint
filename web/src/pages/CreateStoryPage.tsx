import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../utils/AuthContext";
import { createStory } from "../utils/storyService";

// Define available genres
const AVAILABLE_GENRES = [
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Cyberpunk",
  "Steampunk",
  "Mystery",
  "Romance",
  "Adventure",
  "Historical",
  "Thriller",
];

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    tags: [] as string[],
    description: "",
    coverImage: "",
    customTag: "",
  });
  const [errors, setErrors] = useState({
    title: "",
    genre: "",
    description: "",
  });
  const [coverPreview, setCoverPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when field is updated
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle genre selection
  const handleGenreSelect = (genre: string) => {
    setFormData({ ...formData, genre });
    if (errors.genre) {
      setErrors({ ...errors, genre: "" });
    }
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (formData.customTag && formData.customTag.trim() !== "") {
      const newTag = formData.customTag.trim().toLowerCase();
      if (!formData.tags.includes(newTag) && formData.tags.length < 5) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag],
          customTag: "",
        });
      }
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Generate placeholder cover image based on genre
  const generateCoverImage = () => {
    let imageUrl;

    switch (formData.genre.toLowerCase()) {
      case "sci-fi":
        imageUrl =
          "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=800&h=600&q=80";
        break;
      case "fantasy":
        imageUrl =
          "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&h=600&q=80";
        break;
      case "horror":
        imageUrl =
          "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=600&q=80";
        break;
      case "cyberpunk":
        imageUrl =
          "https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=800&h=600&q=80";
        break;
      case "steampunk":
        imageUrl =
          "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&h=600&q=80";
        break;
      case "mystery":
        imageUrl =
          "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=600&q=80";
        break;
      case "romance":
        imageUrl =
          "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800&h=600&q=80";
        break;
      case "adventure":
        imageUrl =
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&q=80";
        break;
      case "historical":
        imageUrl =
          "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=800&h=600&q=80";
        break;
      case "thriller":
        imageUrl =
          "https://images.unsplash.com/photo-1543187018-21e458148a2e?w=800&h=600&q=80";
        break;
      default:
        imageUrl =
          "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&q=80";
    }

    setCoverPreview(imageUrl);
    setFormData({ ...formData, coverImage: imageUrl });
  };

  // Validate form for the current step
  const validateCurrentStep = () => {
    let valid = true;
    const newErrors = { ...errors };

    if (activeStep === 1) {
      if (!formData.title.trim()) {
        newErrors.title = "Title is required";
        valid = false;
      }

      if (!formData.genre) {
        newErrors.genre = "Please select a genre";
        valid = false;
      }
    } else if (activeStep === 2) {
      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
        valid = false;
      } else if (formData.description.length < 30) {
        newErrors.description = "Description should be at least 30 characters";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  // Handle next step button click
  const handleNextStep = () => {
    console.log("Attempting to move to next step from step:", activeStep);
    console.log("Current form data:", formData);

    const isValid = validateCurrentStep();
    console.log("Form validation result:", isValid);

    if (isValid) {
      if (activeStep === 1 && !coverPreview) {
        generateCoverImage();
      }

      // Force a state update with setTimeout to ensure the state change is processed
      setTimeout(() => {
        setActiveStep(activeStep + 1);
        console.log("Set active step to:", activeStep + 1);
      }, 0);
    }
  };

  // Handle previous step button click
  const handlePreviousStep = () => {
    setActiveStep(activeStep - 1);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateCurrentStep()) {
      try {
        setIsSubmitting(true);

        // Make sure we have a user
        if (!currentUser || !currentUser.email) {
          throw new Error("You must be logged in to create a story");
        }

        // Save the story to Firebase
        const storyId = await createStory(
          {
            title: formData.title,
            genre: formData.genre,
            tags: formData.tags,
            description: formData.description,
            coverImage: formData.coverImage || coverPreview,
            readerCount: 0,
          },
          currentUser.uid,
          currentUser.email
        );

        console.log("Story created with ID:", storyId);

        // Navigate to chapter editor with the new story ID
        navigate("/creator/new-chapter", {
          state: {
            newStory: true,
            storyData: {
              ...formData,
              id: storyId,
            },
          },
        });
      } catch (error) {
        console.error("Error creating story:", error);
        setErrors({
          ...errors,
          title: "Failed to create story. Please try again.",
        });
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-ink-900 dark:text-white mb-2">
              Create New Story
            </h1>
            <p className="text-lg text-ink-600 dark:text-ink-300">
              Set up your interactive story and prepare to engage readers with
              branching narratives.
            </p>

            {/* Add visibility notice */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-medium">Note:</span> Your story will only
                become visible to readers after you publish at least one
                chapter.
              </p>
            </div>
          </motion.div>

          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    activeStep >= 1
                      ? "bg-primary-600 text-white"
                      : "bg-parchment-200 dark:bg-dark-700 text-ink-500 dark:text-ink-400"
                  }`}
                >
                  1
                </div>
                <div className="ml-2">
                  <div
                    className={`text-sm font-medium ${
                      activeStep >= 1
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-ink-500 dark:text-ink-400"
                    }`}
                  >
                    Basic Info
                  </div>
                </div>
              </div>
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  activeStep >= 2
                    ? "bg-primary-600 dark:bg-primary-400"
                    : "bg-parchment-200 dark:bg-dark-700"
                }`}
              ></div>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    activeStep >= 2
                      ? "bg-primary-600 text-white"
                      : "bg-parchment-200 dark:bg-dark-700 text-ink-500 dark:text-ink-400"
                  }`}
                >
                  2
                </div>
                <div className="ml-2">
                  <div
                    className={`text-sm font-medium ${
                      activeStep >= 2
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-ink-500 dark:text-ink-400"
                    }`}
                  >
                    Story Details
                  </div>
                </div>
              </div>
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  activeStep >= 3
                    ? "bg-primary-600 dark:bg-primary-400"
                    : "bg-parchment-200 dark:bg-dark-700"
                }`}
              ></div>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    activeStep >= 3
                      ? "bg-primary-600 text-white"
                      : "bg-parchment-200 dark:bg-dark-700 text-ink-500 dark:text-ink-400"
                  }`}
                >
                  3
                </div>
                <div className="ml-2">
                  <div
                    className={`text-sm font-medium ${
                      activeStep >= 3
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-ink-500 dark:text-ink-400"
                    }`}
                  >
                    Review & Create
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {activeStep === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-6">
                    Basic Information
                  </h2>

                  <div className="space-y-6">
                    {/* Title Input */}
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1"
                      >
                        Story Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-md border ${
                          errors.title
                            ? "border-red-500 dark:border-red-500"
                            : "border-parchment-300 dark:border-dark-600"
                        } bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400`}
                        placeholder="Enter a captivating title"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Genre Selection */}
                    <div>
                      <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                        Genre <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {AVAILABLE_GENRES.map((genre) => (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => handleGenreSelect(genre)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              formData.genre === genre
                                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border-2 border-primary-500 dark:border-primary-400"
                                : "bg-parchment-100 dark:bg-dark-800 text-ink-700 dark:text-ink-200 border border-parchment-200 dark:border-dark-700 hover:bg-parchment-200 dark:hover:bg-dark-700"
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                      {errors.genre && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.genre}
                        </p>
                      )}
                    </div>

                    {/* Tags Input */}
                    <div>
                      <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                        Tags{" "}
                        <span className="text-xs text-ink-500 dark:text-ink-400">
                          (up to 5)
                        </span>
                      </label>

                      <div className="flex mb-2">
                        <input
                          type="text"
                          id="customTag"
                          name="customTag"
                          value={formData.customTag}
                          onChange={handleInputChange}
                          onKeyPress={handleTagKeyPress}
                          className="flex-1 px-4 py-2 rounded-l-md border border-parchment-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                          placeholder="Add a tag (e.g. dragons, future, mystery)"
                          disabled={formData.tags.length >= 5}
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          disabled={
                            formData.tags.length >= 5 ||
                            !formData.customTag.trim()
                          }
                          className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-r-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map((tag) => (
                          <div
                            key={tag}
                            className="bg-parchment-100 dark:bg-dark-800 text-ink-700 dark:text-ink-200 rounded-full px-3 py-1 text-sm flex items-center"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
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
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Story Details */}
              {activeStep === 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-6">
                    Story Details
                  </h2>

                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1"
                      >
                        Story Description{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={6}
                        className={`w-full px-4 py-2 rounded-md border ${
                          errors.description
                            ? "border-red-500 dark:border-red-500"
                            : "border-parchment-300 dark:border-dark-600"
                        } bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400`}
                        placeholder="Describe your story in detail. What's it about? What makes it unique? This will help readers decide if they want to engage with your story."
                      />
                      {errors.description ? (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                          Min 30 characters. {formData.description.length}/30
                          characters.
                        </p>
                      )}
                    </div>

                    {/* Cover Image */}
                    <div>
                      <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1">
                        Cover Image
                      </label>

                      <div className="mt-2 border-2 border-dashed border-parchment-300 dark:border-dark-600 rounded-lg p-4 text-center">
                        {coverPreview ? (
                          <div className="relative">
                            <img
                              src={coverPreview}
                              alt="Cover preview"
                              className="mx-auto h-64 object-cover rounded-lg"
                            />
                            <div className="mt-3">
                              <p className="text-sm text-ink-500 dark:text-ink-400">
                                Cover image generated based on your genre
                              </p>
                              <button
                                type="button"
                                onClick={generateCoverImage}
                                className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                              >
                                Generate Different Image
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="mx-auto h-12 w-12 text-ink-400 dark:text-ink-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                              Cover image will be generated based on your genre
                            </p>
                            <button
                              type="button"
                              onClick={generateCoverImage}
                              className="mt-3 inline-flex items-center px-4 py-2 border border-primary-300 dark:border-primary-700 rounded-md shadow-sm text-sm font-medium text-primary-700 dark:text-primary-300 bg-white dark:bg-dark-800 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            >
                              Generate Cover Image
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review & Create */}
              {activeStep === 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-6">
                    Review Your Story
                  </h2>

                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="md:w-1/3">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden">
                        <img
                          src={
                            formData.coverImage ||
                            "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&q=80"
                          }
                          alt="Story cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="md:w-2/3">
                      <h3 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">
                        {formData.title}
                      </h3>

                      <div className="flex items-center mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 mr-2">
                          {formData.genre}
                        </span>
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-parchment-100 dark:bg-dark-700 text-ink-700 dark:text-ink-300 mr-2"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="prose prose-sm prose-brown dark:prose-invert max-w-none">
                        {formData.description
                          .split("\n")
                          .map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-parchment-50 dark:bg-dark-800 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                      What's Next?
                    </h4>
                    <p className="text-sm text-ink-600 dark:text-ink-400">
                      After creating your story, you'll be able to add chapters
                      and define branching paths. Each chapter will have choice
                      points where readers can vote on what happens next. You
                      can publish your first chapter immediately or save it as a
                      draft to work on later.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                {activeStep > 1 ? (
                  <button
                    type="button"
                    className="px-4 py-2 bg-white dark:bg-dark-800 border border-parchment-300 dark:border-dark-600 text-ink-700 dark:text-ink-200 font-medium rounded-md hover:bg-parchment-50 dark:hover:bg-dark-700"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePreviousStep();
                    }}
                  >
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                {activeStep < 3 ? (
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(
                        "Continue button clicked, activeStep:",
                        activeStep
                      );

                      if (activeStep === 2) {
                        // Directly set the active step for step 2
                        setActiveStep(3);
                        console.log("Manually set to step 3");
                      } else {
                        handleNextStep();
                      }
                    }}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Creating Story..."
                      : "Create Story & Start First Chapter"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryPage;
