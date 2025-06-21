import React from "react";

interface PublishingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
}

interface PublishingProgressModalProps {
  isOpen: boolean;
  steps: PublishingStep[];
}

// Simple step icon component without heavy animations
const StepIcon: React.FC<{
  status: PublishingStep["status"];
  stepNumber: number;
}> = ({ status, stepNumber }) => {
  const getIcon = () => {
    switch (status) {
      case "completed":
        return (
          <svg
            className="w-5 h-5 text-white"
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
        );
      case "loading":
        return (
          <div className="w-5 h-5">
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                className="opacity-25"
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-white"
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
        );
      default:
        return (
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
            {stepNumber}
          </span>
        );
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "loading":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-300 dark:bg-gray-600";
    }
  };

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${getBackgroundColor()}`}
    >
      {getIcon()}
    </div>
  );
};

export const PublishingProgressModal: React.FC<
  PublishingProgressModalProps
> = ({ isOpen, steps }) => {
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-lg max-w-lg w-full shadow-lg border border-parchment-200 dark:border-dark-700">
        {/* Simple header */}
        <div className="bg-primary-600 p-6 rounded-t-lg">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Publishing Chapter
            </h2>
            <p className="text-white text-opacity-90 text-sm">
              Creating plot tokens and publishing your story...
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                <StepIcon status={step.status} stepNumber={index + 1} />

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base font-semibold ${
                      step.status === "completed"
                        ? "text-green-600 dark:text-green-400"
                        : step.status === "loading"
                        ? "text-blue-600 dark:text-blue-400"
                        : step.status === "error"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-ink-600 dark:text-ink-400 mt-1">
                    {step.description}
                  </p>

                  {/* Simple loading dots */}
                  {step.status === "loading" && (
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Simple Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-ink-700 dark:text-ink-300">
              <span>Overall Progress</span>
              <span>{completedSteps} of {totalSteps} complete</span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Simple completion message */}
          {completedSteps === totalSteps && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <span className="text-lg">í¾‰</span>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200 text-sm">
                    Chapter Published Successfully!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    Your story is now live with plot tokens ready for reader voting!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishingProgressModal;
