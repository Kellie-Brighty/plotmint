import React from "react";

interface StoryFilterProps {
  genres: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  sortOptions: string[];
  activeSort: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

const StoryFilter: React.FC<StoryFilterProps> = ({
  genres,
  activeFilter,
  onFilterChange,
  sortOptions,
  activeSort,
  onSortChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-2 border-b border-parchment-200 dark:border-dark-700">
      {/* Genre filters */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onFilterChange(genre)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === genre
                ? "bg-primary-600 text-white dark:bg-primary-500"
                : "bg-parchment-100 text-ink-700 hover:bg-parchment-200 dark:bg-dark-800 dark:text-ink-200 dark:hover:bg-dark-700"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Sort and view options */}
      <div className="flex items-center justify-between md:justify-end space-x-4">
        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-white dark:bg-dark-800 border border-parchment-200 dark:border-dark-700 rounded-md pl-4 pr-10 py-2 text-sm font-medium text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg
              className="h-4 w-4 text-ink-500 dark:text-ink-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-parchment-200 dark:border-dark-700 rounded-md">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 ${
              viewMode === "grid"
                ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                : "bg-white text-ink-500 hover:text-ink-700 dark:bg-dark-800 dark:text-ink-400 dark:hover:text-ink-200"
            }`}
            aria-label="Grid view"
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 ${
              viewMode === "list"
                ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                : "bg-white text-ink-500 hover:text-ink-700 dark:bg-dark-800 dark:text-ink-400 dark:hover:text-ink-200"
            }`}
            aria-label="List view"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryFilter;
