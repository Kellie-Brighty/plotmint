import { useState } from "react";
import { Button } from "./ui/Button";

const WalletConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Mock wallet connection function
  // In a real app, this would use ethers.js, web3.js, or a similar library
  const connectWallet = async (walletType: string) => {
    setIsConnecting(true);

    try {
      // In a real app, this would be actual wallet connection logic
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
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress("");
    setIsConnected(false);
    localStorage.removeItem("connectedWallet");
  };

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
