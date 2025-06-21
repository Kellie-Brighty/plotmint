import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/Button";
import {
  subscribeToCreatorStories,
  subscribeToChapters,
} from "../utils/storyService";

interface DraftChaptersTabProps {
  userId: string;
  onPublishChapter?: (
    storyId: string,
    chapterId: string,
    storyTitle: string,
    chapterTitle: string,
    chapterOrder: number
  ) => void;
}

interface DraftChapter {
  id?: string;
  storyId: string;
  storyTitle: string;
  title: string;
  preview: string;
  status: "in-progress" | "outline" | "ready";
  wordCount: number;
  lastEdited: string;
  choices: { id: string; text: string; votes: number }[];
  order: number;
}

const DraftChaptersTab = ({
  userId,
  onPublishChapter,
}: DraftChaptersTabProps) => {
  const [drafts, setDrafts] = useState<DraftChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  // Subscribe to draft chapters
  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    // We need to get all stories first to match story titles with draft chapters
    const unsubscribeStories = subscribeToCreatorStories(
      userId,
      (creatorStories) => {
        if (creatorStories.length === 0) {
          setDrafts([]);
          setLoading(false);
          return;
        }

        // Array to store all draft chapters from all stories
        let allDrafts: DraftChapter[] = [];
        let pendingStories = creatorStories.length;
        let storySubscriptions: (() => void)[] = [];

        // For each story, subscribe to its chapters
        creatorStories.forEach((story) => {
          if (!story.id) {
            pendingStories--;
            if (pendingStories === 0) {
              setLoading(false);
            }
            return;
          }

          const unsubscribeChapters = subscribeToChapters(
            story.id,
            (chapters) => {
              // Filter for unpublished chapters only
              const storyDrafts = chapters
                .filter((chapter) => !chapter.published)
                .map((chapter) => ({
                  id: chapter.id,
                  storyId: story.id!,
                  storyTitle: story.title,
                  title: chapter.title,
                  preview: chapter.content.substring(0, 100),
                  status: "in-progress" as "in-progress" | "outline" | "ready", // Default status
                  wordCount: chapter.content.split(/\s+/).length,
                  lastEdited: chapter.updatedAt
                    ? chapter.updatedAt.toDate().toISOString()
                    : new Date().toISOString(),
                  choices: chapter.choiceOptions
                    ? chapter.choiceOptions.map((option, index) => ({
                        id: `${chapter.id}-option-${index}`,
                        text: option,
                        votes: 0,
                      }))
                    : [],
                  order: chapter.order,
                }));

              // Remove any existing drafts for this story and add the new ones
              allDrafts = allDrafts.filter((d) => d.storyId !== story.id);
              allDrafts = [...allDrafts, ...storyDrafts];

              // Update the state with all drafts
              setDrafts(allDrafts);

              // Decrement pending stories counter
              pendingStories--;
              if (pendingStories <= 0) {
                setLoading(false);
              }
            },
            false // Include unpublished chapters
          );

          storySubscriptions.push(unsubscribeChapters);
        });

        // If no stories had subscriptions created, we're done
        if (storySubscriptions.length === 0) {
          setLoading(false);
        }

        // Return cleanup function
        return () => {
          storySubscriptions.forEach((unsub) => unsub());
        };
      },
      true // Include unpublished stories
    );

    // Cleanup function
    return () => {
      unsubscribeStories();
    };
  }, [userId]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-ink-900 dark:text-white">
          Draft Chapters
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md">
          <p className="font-medium">Error loading drafts</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center">
          <h4 className="text-lg font-medium text-ink-900 dark:text-white mb-2">
            No draft chapters
          </h4>
          <p className="text-ink-600 dark:text-ink-400 mb-6">
            You don't have any chapter drafts in progress
          </p>
          <Link to="/creator/new-story">
            <Button variant="primary">Create New Story</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-parchment-200 dark:divide-dark-700">
              <thead className="bg-parchment-50 dark:bg-dark-900">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                  >
                    Chapter
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                  >
                    Story
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                  >
                    Last Edited
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                  >
                    Words
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-parchment-200 dark:divide-dark-700">
                {drafts.map((draft) => (
                  <tr key={draft.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink-900 dark:text-white">
                        {draft.title}
                      </div>
                      {draft.preview && (
                        <div className="text-xs text-ink-500 dark:text-ink-400 mt-1 line-clamp-1">
                          {draft.preview.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-ink-900 dark:text-white">
                        {draft.storyTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getDraftStatusBadge(draft.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600 dark:text-ink-300">
                      {formatDate(draft.lastEdited)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600 dark:text-ink-300">
                      {draft.wordCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-3 justify-end">
                      <Link
                        to={`/creator/edit-chapter/${draft.id}`}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Edit
                      </Link>
                        {draft.status === "ready" && onPublishChapter && (
                          <button
                            onClick={() =>
                              onPublishChapter(
                                draft.storyId,
                                draft.id!,
                                draft.storyTitle,
                                draft.title,
                                draft.order
                              )
                            }
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftChaptersTab;
