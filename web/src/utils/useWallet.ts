import { useState, useEffect } from "react";
import { walletConnector, type WalletState } from "./walletConnector";
import type { WalletClient, PublicClient } from "viem";

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>(
    walletConnector.getState()
  );

  useEffect(() => {
    // Check for existing connection on mount
    walletConnector.checkConnection();

    // Subscribe to wallet state changes
    const unsubscribe = walletConnector.subscribe(setWalletState);

    return unsubscribe;
  }, []);

  const connect = async () => {
    try {
      await walletConnector.connect();
      // Switch to Base Sepolia if not already on it
      if (walletState.chainId !== 84532) {
        await walletConnector.switchToBaseSepolia();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const disconnect = () => {
    walletConnector.disconnect();
  };

  const switchToBaseSepolia = async () => {
    try {
      await walletConnector.switchToBaseSepolia();
    } catch (error) {
      console.error("Failed to switch network:", error);
      throw error;
    }
  };

  const getWalletClient = (): WalletClient | null => {
    return walletConnector.getWalletClient();
  };

  const getPublicClient = (): PublicClient | null => {
    return walletConnector.getPublicClient();
  };

  const isCorrectNetwork = walletState.chainId === 84532;

  return {
    ...walletState,
    connect,
    disconnect,
    switchToBaseSepolia,
    getWalletClient,
    getPublicClient,
    isCorrectNetwork,
  };
};
