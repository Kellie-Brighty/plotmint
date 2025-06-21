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
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Switch Network
          </button>
        )}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">{formatAddress(address)}</span>
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
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
      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
};

export default WalletConnect;
