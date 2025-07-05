import React, { useState } from "react";
import { useWallet } from "../utils/useWallet";
import { useAuth } from "../utils/AuthContext";

interface WalletConnectProps {
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  className = "",
}) => {
  const { currentUser } = useAuth();
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const {
    isConnected,
    address,
    isConnecting,
    isCorrectNetwork,
    connectMetaMask,
    connectWalletConnect,
    disconnect,
    switchToBaseMainnet,
  } = useWallet();

  const handleConnectMetaMask = async () => {
    try {
      await connectMetaMask();
      setShowWalletOptions(false);
    } catch (error: any) {
      console.error("MetaMask connection error:", error);
      if (error.message.includes("MetaMask connector not found")) {
        alert("Please install MetaMask extension first");
      }
    }
  };

  const handleConnectWalletConnect = async () => {
    try {
      await connectWalletConnect();
      setShowWalletOptions(false);
    } catch (error: any) {
      console.error("WalletConnect connection error:", error);
      if (error.message.includes("WalletConnect connector not found")) {
        alert("WalletConnect is not available");
      }
    }
  };

  const handleConnect = () => {
    // Show wallet options immediately when connect button is clicked
    setShowWalletOptions(true);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Only show wallet connect when user is authenticated
  if (!currentUser) {
    return null;
  }

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {!isCorrectNetwork && (
          <button
            onClick={switchToBaseMainnet}
            className="px-3 py-1 text-sm bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
          >
            Switch to Base
          </button>
        )}
        <div className="flex items-center gap-2 px-3 py-2 bg-parchment-100 dark:bg-dark-800 border border-parchment-200 dark:border-dark-700 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-3 py-2 text-sm text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
    <button
      onClick={handleConnect}
      disabled={isConnecting}
        className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>

      {/* Wallet Options Dropdown */}
      {showWalletOptions && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-dark-800 border border-parchment-200 dark:border-dark-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-2 px-2">
              Choose Wallet
            </div>

            {/* MetaMask Option */}
            <button
              onClick={handleConnectMetaMask}
              disabled={isConnecting}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-parchment-50 dark:hover:bg-dark-700 rounded-md transition-colors disabled:opacity-50"
            >
              <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <span className="text-sm text-ink-700 dark:text-ink-300">
                MetaMask
              </span>
            </button>

            {/* WalletConnect Option */}
            <button
              onClick={handleConnectWalletConnect}
              disabled={isConnecting}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-parchment-50 dark:hover:bg-dark-700 rounded-md transition-colors disabled:opacity-50"
            >
              <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center text-white text-xs font-bold">
                W
              </div>
              <span className="text-sm text-ink-700 dark:text-ink-300">
                WalletConnect
              </span>
            </button>

            <button
              onClick={() => setShowWalletOptions(false)}
              className="w-full mt-2 px-3 py-1 text-xs text-ink-500 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-300 border-t border-parchment-200 dark:border-dark-700 pt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showWalletOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWalletOptions(false)}
        />
      )}
    </div>
  );
};

export default WalletConnect;
