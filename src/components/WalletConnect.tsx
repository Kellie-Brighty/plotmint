import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { useAuth } from "../utils/AuthContext";
import { db } from "../utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

// Helper function to convert Firebase errors to user-friendly messages
const getFirebaseErrorMessage = (error: FirebaseError): string => {
  switch (error.code) {
    // Firestore errors
    case "permission-denied":
      return "You do not have permission to connect a wallet.";
    case "unavailable":
      return "The service is currently unavailable. Please try connecting your wallet later.";
    // Default error
    default:
      console.error("Firebase error:", error);
      return "An unexpected error occurred while connecting your wallet.";
  }
};

const WalletConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Check for existing wallet connection on component mount
  useEffect(() => {
    // Check localStorage for previously connected wallet
    const savedWallet = localStorage.getItem("connectedWallet");
    if (savedWallet && currentUser) {
      setWalletAddress(savedWallet);
      setIsConnected(true);
    }
  }, [currentUser]);

  // Connect wallet function
  const connectWallet = async (walletType: string) => {
    if (!currentUser || !currentUser.uid) return;

    setIsConnecting(true);
    setError(null);

    try {
      // In a real app, this would use ethers.js, web3.js, or a similar library
      console.log(`Connecting to ${walletType}...`);

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock successful connection
      const mockAddress =
        "0x" + Math.random().toString(16).substring(2, 14) + "...";
      setWalletAddress(mockAddress);
      setIsConnected(true);
      setShowWalletOptions(false);

      // Store connection in localStorage (for demo purposes)
      localStorage.setItem("connectedWallet", mockAddress);

      // Update user profile in Firestore with wallet address
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          walletAddress: mockAddress,
          isWalletConnected: true,
          lastWalletConnection: new Date(),
        });
      } catch (firestoreError) {
        console.error("Error updating wallet in Firestore:", firestoreError);
        if (firestoreError instanceof FirebaseError) {
          setError(getFirebaseErrorMessage(firestoreError));
        } else {
          setError("Failed to save your wallet connection. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Failed to connect your wallet. Please try again.");
      // Reset connection status on error
      setIsConnected(false);
      localStorage.removeItem("connectedWallet");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    setWalletAddress("");
    setIsConnected(false);
    localStorage.removeItem("connectedWallet");
    setError(null);

    // Update user profile in Firestore to remove wallet connection
    if (currentUser && currentUser.uid) {
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          isWalletConnected: false,
        });
      } catch (error) {
        console.error("Error updating wallet status in Firestore:", error);
        if (error instanceof FirebaseError) {
          setError(getFirebaseErrorMessage(error));
        } else {
          setError("Failed to update your wallet status. Please try again.");
        }
      }
    }
  };

  // Only render this component for authenticated users
  if (!currentUser) return null;

  // Wallet connection button
  const renderWalletButton = () => {
    if (isConnected) {
      return (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWalletOptions(!showWalletOptions)}
          >
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {walletAddress}
            </span>
          </Button>

          {showWalletOptions && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-800 ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                  role="menuitem"
                  onClick={disconnectWallet}
                >
                  Disconnect Wallet
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                  role="menuitem"
                >
                  View on Explorer
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                  role="menuitem"
                >
                  Copy Address
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        {error && (
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-2 text-xs rounded-md">
            {error}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWalletOptions(!showWalletOptions)}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>

        {showWalletOptions && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-800 ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                className="flex items-center w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                role="menuitem"
                onClick={() => connectWallet("metamask")}
              >
                <img
                  src="/img/wallets/metamask.svg"
                  alt="MetaMask"
                  className="w-5 h-5 mr-3"
                />
                MetaMask
              </button>
              <button
                className="flex items-center w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                role="menuitem"
                onClick={() => connectWallet("walletconnect")}
              >
                <img
                  src="/img/wallets/walletconnect.svg"
                  alt="WalletConnect"
                  className="w-5 h-5 mr-3"
                />
                WalletConnect
              </button>
              <button
                className="flex items-center w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                role="menuitem"
                onClick={() => connectWallet("coinbase")}
              >
                <img
                  src="/img/wallets/coinbase.svg"
                  alt="Coinbase Wallet"
                  className="w-5 h-5 mr-3"
                />
                Coinbase Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return renderWalletButton();
};

export default WalletConnect;
