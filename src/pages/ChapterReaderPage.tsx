import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";

// Mock data for a chapter
const MOCK_CHAPTER = {
  id: "ch1",
  storyId: "1",
  title: "The Discovery",
  content: `
  Dr. Maya Chen had always known that reality was more complex than most people imagined, but even she wasn't prepared for what she found when her quantum resonance experiment finally succeeded.
  
  The university lab was quiet at 3 AM. Maya preferred working during these hours—no administrators wandering through, no students asking questions, just the soft hum of equipment and the occasional distant sound from the night custodial staff.
  
  "Final calibration sequence," she murmured to herself, fingers flying across the keyboard. The quantum resonance scanner—her own design, built with a mix of university funding and her own savings—hummed to life. A soft blue glow emanated from the central chamber, where a single hydrogen atom was suspended in a magnetic field.
  
  According to her calculations, the scanner would allow her to observe not just the position and momentum of the atom's electron (impossible, according to traditional quantum mechanics) but also its state in parallel realities. If she was right, this would be the first empirical evidence of the multiverse hypothesis—proof that our universe was just one of many.
  
  Maya held her breath as the machine reached full power. The holographic display above the scanner flickered and then stabilized, showing a three-dimensional rendering of the atom. So far, nothing unusual. But then the image seemed to split, showing overlapping states simultaneously.
  
  "It's working," she whispered, eyes wide. According to conventional physics, this shouldn't be possible.
  
  The display continued to split, showing more and more overlapping states. Four, then eight, then sixteen variations of the same atom, each slightly different. The machine wasn't just showing quantum states—it was showing alternate realities.
  
  Maya's hands trembled as she adjusted the controls, focusing the scanner on a single parallel state. The image stabilized, showing a version of the atom that was subtly different from the one in her lab. She was looking into another universe.
  
  The implications were staggering. If she could observe parallel universes, could she eventually find a way to interact with them? To communicate across realities? To travel between them?
  
  Lost in her thoughts, Maya almost didn't notice when the scanner's image began to change again. The parallel atom was moving in ways that didn't match any known quantum behavior. It was as if something—or someone—on the other side was manipulating it.
  
  As if they knew they were being watched.
  
  A chill ran down Maya's spine. She wasn't just observing another universe—something in that universe was observing her back.
  
  The scanner suddenly emitted a high-pitched whine. The holographic display flickered wildly, showing hundreds, thousands of overlapping realities in rapid succession. The quantum field was destabilizing.
  
  Maya had a choice to make, and quickly.
  `,
  publishedAt: "2023-09-15T14:32:00Z",
  estimatedReadingTime: 12,
  votes: 182,
  collectors: 98,
  choices: [
    {
      id: "ch1-opt1",
      text: "Focus on stabilizing the quantum field",
      votes: 105,
      leadsToChatperId: "ch2",
    },
    {
      id: "ch1-opt2",
      text: "Expand the observation window",
      votes: 77,
      leadsToChatperId: "ch2b",
    },
  ],
  nextChapterId: "ch2",
  previousChapterId: null,
};

// Mock story data for navigation
const MOCK_STORY = {
  id: "1",
  title: "The Quantum Nexus",
  author: "Elena Voss",
  chapterCount: 7,
};

// Function to get avatar image
const getAvatarUrl = (authorName: string) => {
  return `https://i.pravatar.cc/150?u=${authorName.replace(/\s+/g, "")}`;
};

const ChapterReaderPage = () => {
  const { storyId, chapterId } = useParams<{
    storyId: string;
    chapterId: string;
  }>();

  // In a real app, you would fetch the chapter based on storyId and chapterId
  const chapter = MOCK_CHAPTER;
  const story = MOCK_STORY;

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCollector, setIsCollector] = useState(false);
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [showCollectConfirmation, setShowCollectConfirmation] = useState(false);

  // Format the timestamp
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate percentage for each choice
  const getTotalVotes = () => {
    return chapter.choices.reduce((sum, choice) => sum + choice.votes, 0);
  };

  const getVotePercentage = (votes: number) => {
    const total = getTotalVotes();
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };

  // Handle voting
  const handleVote = () => {
    if (selectedChoice && !hasVoted) {
      // In a real app, this would send the vote to the server
      setHasVoted(true);
      setShowVoteConfirmation(true);

      // Hide confirmation after a delay
      setTimeout(() => {
        setShowVoteConfirmation(false);
      }, 3000);
    }
  };

  // Handle collecting
  const handleCollect = () => {
    if (!isCollector) {
      // In a real app, this would trigger a wallet connection and NFT minting
      setIsCollector(true);
      setShowCollectConfirmation(true);

      // Hide confirmation after a delay
      setTimeout(() => {
        setShowCollectConfirmation(false);
      }, 3000);
    }
  };

  // Removed manual scroll handling as it's now handled by the global ScrollToTop component

  return (
    <div className="bg-parchment-50 dark:bg-dark-950 min-h-screen pt-24 pb-16">
      {/* Chapter Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-dark-900 border-b border-parchment-200 dark:border-dark-700 shadow-sm py-2">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to={`/stories/${storyId}`}
                className="inline-flex items-center text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="font-medium text-sm hidden sm:inline">
                  Back to Story
                </span>
              </Link>

              <div className="hidden sm:block mx-4 h-5 w-px bg-parchment-300 dark:bg-dark-600"></div>

              <div className="hidden sm:block text-sm">
                <span className="text-ink-500 dark:text-ink-400">
                  {story.title}
                </span>
                <span className="mx-2 text-ink-400 dark:text-ink-500">•</span>
                <span className="text-ink-700 dark:text-ink-200">
                  {chapter.title}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {chapter.previousChapterId && (
                <Link
                  to={`/stories/${storyId}/chapters/${chapter.previousChapterId}`}
                  className="p-1.5 sm:p-2 rounded-md text-ink-600 dark:text-ink-300 hover:bg-parchment-100 dark:hover:bg-dark-800"
                  title="Previous Chapter"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Link>
              )}

              {chapter.nextChapterId && (
                <Link
                  to={`/stories/${storyId}/chapters/${chapter.nextChapterId}`}
                  className="p-1.5 sm:p-2 rounded-md text-ink-600 dark:text-ink-300 hover:bg-parchment-100 dark:hover:bg-dark-800"
                  title="Next Chapter"
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto">
          {/* Chapter Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink-900 dark:text-white mb-3">
              {chapter.title}
            </h1>

            <div className="flex flex-wrap items-center text-sm text-ink-600 dark:text-ink-300 mb-6">
              <span className="mr-3">By {story.author}</span>
              <span className="mr-3">•</span>
              <span className="mr-3">
                Published {formatDate(chapter.publishedAt)}
              </span>
              <span className="mr-3">•</span>
              <span>{chapter.estimatedReadingTime} min read</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-ink-500 dark:text-ink-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                {chapter.votes} votes
              </div>

              <div className="flex items-center text-ink-500 dark:text-ink-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                {chapter.collectors} collectors
              </div>
            </div>
          </div>

          {/* Chapter Content */}
          <div className="prose prose-lg prose-brown dark:prose-invert max-w-none mb-12 sm:mb-16">
            {chapter.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mb-6 text-ink-800 dark:text-ink-100">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Voting Section */}
          <div className="bg-white dark:bg-dark-900 rounded-xl border border-parchment-200 dark:border-dark-700 shadow-sm p-6 sm:p-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white mb-4">
              What should Dr. Maya do next?
            </h2>

            <p className="text-ink-600 dark:text-ink-300 mb-6">
              Cast your vote to influence the story's direction. The option with
              the most votes will determine the next chapter.
            </p>

            <div className="space-y-4 mb-6">
              {chapter.choices.map((choice) => (
                <div
                  key={choice.id}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    selectedChoice === choice.id
                      ? "border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-parchment-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-800"
                  } ${hasVoted ? "cursor-default" : "cursor-pointer"}`}
                  onClick={() => !hasVoted && setSelectedChoice(choice.id)}
                >
                  <div className="flex items-start sm:items-center">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                        selectedChoice === choice.id
                          ? "border-primary-600 dark:border-primary-500"
                          : "border-parchment-300 dark:border-dark-600"
                      }`}
                    >
                      {selectedChoice === choice.id && (
                        <div className="w-3 h-3 rounded-full bg-primary-600 dark:bg-primary-500"></div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <p
                        className={`font-medium ${
                          selectedChoice === choice.id
                            ? "text-primary-900 dark:text-primary-300"
                            : "text-ink-800 dark:text-ink-100"
                        }`}
                      >
                        {choice.text}
                      </p>

                      {hasVoted && (
                        <div className="mt-3">
                          <div className="w-full bg-parchment-100 dark:bg-dark-700 rounded-full h-2.5 mb-1">
                            <div
                              className="bg-primary-600 dark:bg-primary-500 h-2.5 rounded-full"
                              style={{
                                width: `${getVotePercentage(choice.votes)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-ink-500 dark:text-ink-400">
                            <span>{choice.votes} votes</span>
                            <span>{getVotePercentage(choice.votes)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                disabled={!selectedChoice || hasVoted}
                onClick={handleVote}
                fullWidth
              >
                {hasVoted ? "You've Voted" : "Cast Your Vote"}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleCollect}
                disabled={isCollector}
                fullWidth
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                {isCollector ? "Collected" : "Collect This Chapter"}
              </Button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between py-4 border-t border-parchment-200 dark:border-dark-700">
            {chapter.previousChapterId ? (
              <Link
                to={`/stories/${storyId}/chapters/${chapter.previousChapterId}`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous Chapter
              </Link>
            ) : (
              <div></div>
            )}

            {chapter.nextChapterId ? (
              <Link
                to={`/stories/${storyId}/chapters/${chapter.nextChapterId}`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
              >
                Next Chapter
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-5 right-5 z-50">
        {showVoteConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-md"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">Your vote has been recorded!</p>
              </div>
            </div>
          </motion.div>
        )}

        {showCollectConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-primary-100 border-l-4 border-primary-500 text-primary-700 p-4 rounded-md shadow-md mt-4"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-primary-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 2a2 2 0 00-2 2v14l7-3 7 3V4a2 2 0 00-2-2H5zm4 4a1 1 0 011-1h2a1 1 0 110 2H10a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">Chapter collected successfully!</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChapterReaderPage;
