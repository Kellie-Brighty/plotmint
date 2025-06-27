import React from "react";
import { useWallet } from "../utils/useWallet";
import { useAuth } from "../utils/AuthContext";

interface WalletConnectProps {
  className?: string;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  className = "",
}) => {
  const { currentUser } = useAuth();
  const {
    isConnected,
    address,
    isConnecting,
    isCorrectNetwork,
    connect,
    disconnect,
    switchToBaseSepolia,
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error: any) {
      console.error("Wallet connection error:", error);

      if (error.code === 4001) {
        // User rejected the connection request
        console.log("User rejected wallet connection");
      } else if (error.message.includes("No Ethereum wallet detected")) {
        console.log("No wallet detected");
        // Don't show alert or open pages - just log the error
      } else {
        // Other connection errors - just log them, don't show alerts
        console.log(`Failed to connect wallet: ${error.message}`);
      }
    }
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
            onClick={switchToBaseSepolia}
            className="px-3 py-1 text-sm bg-secondary-600 dark:bg-secondary-500 text-white rounded-lg hover:bg-secondary-700 dark:hover:bg-secondary-600 transition-colors"
          >
            Switch Network
          </button>
        )}
        <div className="flex items-center gap-2 px-3 py-2 bg-parchment-100 dark:bg-dark-800 border border-parchment-200 dark:border-dark-700 rounded-lg">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          <span className="text-sm font-medium text-ink-700 dark:text-ink-200">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-2 text-sm text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
};

export default WalletConnect;
