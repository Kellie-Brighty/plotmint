import type { ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { Button } from "./ui/Button";
import JoinPlotMintModal from "./auth/JoinPlotMintModal";
import { useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  showAuthPrompt?: boolean;
}

const ProtectedRoute = ({
  children,
  redirectTo = "/",
  showAuthPrompt = true,
}: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-ink-600 dark:text-ink-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  if (currentUser) {
    return <>{children}</>;
  }

  // If showAuthPrompt is false, just redirect
  if (!showAuthPrompt) {
    return <Navigate to={redirectTo} replace />;
  }

  // Show authentication prompt
  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary-600 dark:text-primary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-ink-600 dark:text-ink-300">
            You need to create an account or sign in to access PlotMint stories
            and participate in interactive storytelling.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setShowAuthModal(true)}
          >
            Join PlotMint
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <JoinPlotMintModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default ProtectedRoute;
