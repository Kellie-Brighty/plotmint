import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "./firebase";
import type { User } from "./firebase";

import { updateUserProfile } from "./userService";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  walletAddress: string | null;
  isWalletConnected: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  logOut: () => Promise<void>;
  linkWalletToUser: (address: string) => Promise<void>;
  unlinkWallet: () => Promise<void>;
  walletDebug: string | null;
  forceWalletDetection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress] = useState<string | null>(null);
  const [isWalletConnected, _setIsWalletConnected] = useState(false);
  const [walletDebug, _setWalletDebug] = useState<string | null>(
    "Web3 functionality is disabled"
  );

  // Initialize or update user profile in Firestore
  const initializeUserProfile = useCallback(async (user: User) => {
    if (!user) return;

    try {
      // Ensure user profile exists
      await updateUserProfile(user, {});
      console.log("User profile initialized or updated");
    } catch (error) {
      console.error("Error initializing user profile:", error);
    }
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        // Initialize user profile when user logs in
        initializeUserProfile(user);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [initializeUserProfile]);

  // Stub function - no longer connects to wallet
  const linkWalletToUser = async (_address: string): Promise<void> => {
    console.log("Web3 functionality is disabled - wallet linking skipped");
    return Promise.resolve();
  };

  // Stub function - no longer disconnects wallet
  const unlinkWallet = async (): Promise<void> => {
    console.log("Web3 functionality is disabled - wallet unlinking skipped");
    return Promise.resolve();
  };

  // Stub function - no longer forces wallet detection
  const forceWalletDetection = async (): Promise<boolean> => {
    console.log("Web3 functionality is disabled - wallet detection skipped");
    return Promise.resolve(false);
  };

  const signUp = async (email: string, password: string): Promise<User> => {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Initialize user profile on signup
    await initializeUserProfile(user);

    return user;
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    // Update user profile on signin
    await initializeUserProfile(user);

    return user;
  };

  const logOut = async (): Promise<void> => {
    await signOut(auth);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    walletAddress,
    isWalletConnected,
    signUp,
    signIn,
    logOut,
    linkWalletToUser,
    unlinkWallet,
    walletDebug,
    forceWalletDetection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
