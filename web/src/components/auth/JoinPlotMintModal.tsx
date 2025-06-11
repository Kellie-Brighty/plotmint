import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import { useAuth } from "../../utils/AuthContext";
import { db, auth } from "../../utils/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

interface JoinPlotMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Helper function to convert Firebase error codes to user-friendly messages
const getFirebaseErrorMessage = (error: FirebaseError): string => {
  // console.log(error.code);
  switch (error.code) {
    // Authentication errors
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-credential":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Your password is too weak. Please use at least 6 characters.";
    case "auth/user-not-found":
      return "No account found with this email. Please check your email or sign up.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again or reset your password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    // Firestore errors
    case "permission-denied":
      return "You do not have permission to perform this action.";
    case "unavailable":
      return "The service is currently unavailable. Please try again later.";
    // Default error
    default:
      console.error("Firebase error:", error);
      return "An unexpected error occurred. Please try again.";
  }
};

const JoinPlotMintModal = ({
  isOpen,
  onClose,
  onSuccess,
}: JoinPlotMintModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Create the user account
        const userCredential = await signUp(email, password);

        // Create user profile in Firestore
        if (userCredential && userCredential.uid) {
          await setDoc(doc(db, "users", userCredential.uid), {
            email: email,
            username: username,
            displayName: username,
            createdAt: serverTimestamp(),
            walletAddress: null,
            isWalletConnected: false,
            profileComplete: true,
            lastLogin: serverTimestamp(),
            readingHistory: [],
            votingHistory: [],
            collections: [],
          });
        }
      } else {
        await signIn(email, password);

        // Update last login timestamp
        // Wait for auth state to update first, then update Firestore
        setTimeout(() => {
          if (auth.currentUser && auth.currentUser.uid) {
            setDoc(
              doc(db, "users", auth.currentUser.uid),
              { lastLogin: serverTimestamp() },
              { merge: true }
            ).catch((err) => console.error("Error updating last login:", err));
          }
        }, 1000);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Convert Firebase errors to user-friendly messages
      if (err instanceof FirebaseError) {
        setError(getFirebaseErrorMessage(err));
      } else {
        setError(
          err?.message || "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md z-10 relative"
        >
          <button
            className="absolute top-4 right-4 text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <h2 className="text-2xl font-display font-bold text-ink-900 dark:text-white mb-6">
            {isSignUp ? "Join PlotMint" : "Welcome Back"}
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-700 rounded-md bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-700 rounded-md bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-700 rounded-md bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <Button
              variant="primary"
              fullWidth
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Need an account? Join PlotMint"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinPlotMintModal;
