import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import { base } from "wagmi/chains";
import type { WalletClient, PublicClient, Address } from "viem";

export interface WalletState {
  isConnected: boolean;
  address: Address | null;
  chainId: number | null;
  isConnecting: boolean;
}

export const useWalletNew = () => {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Check if we're on the correct network (Base mainnet)
  const isCorrectNetwork = chainId === base.id;

  const connectMetaMask = async () => {
    const metamaskConnector = connectors.find(
      (connector) => connector.id === "metaMask"
    );
    if (metamaskConnector) {
      try {
        await connect({ connector: metamaskConnector });
        // Switch to Base mainnet if not already on it
        if (chainId !== base.id) {
          await switchToBaseMainnet();
        }
      } catch (error) {
        console.error("Failed to connect MetaMask:", error);
        throw error;
      }
    } else {
      throw new Error("MetaMask connector not found");
    }
  };

  const connectWalletConnect = async () => {
    const wcConnector = connectors.find(
      (connector) => connector.id === "walletConnect"
    );
    if (wcConnector) {
      try {
        await connect({ connector: wcConnector });
        // Switch to Base mainnet if not already on it
        if (chainId !== base.id) {
          await switchToBaseMainnet();
        }
      } catch (error) {
        console.error("Failed to connect WalletConnect:", error);
        throw error;
      }
    } else {
      throw new Error("WalletConnect connector not found");
    }
  };

  const connectWallet = async () => {
    // Try MetaMask first, then fallback to WalletConnect
    try {
      await connectMetaMask();
    } catch (error) {
      console.warn("MetaMask connection failed, trying WalletConnect:", error);
      await connectWalletConnect();
    }
  };

  const switchToBaseMainnet = async () => {
    try {
      await switchChain({ chainId: base.id });
    } catch (error) {
      console.error("Failed to switch to Base mainnet:", error);
      throw error;
    }
  };

  const getWalletClient = (): WalletClient | null => {
    return walletClient || null;
  };

  const getPublicClient = (): PublicClient | null => {
    return (publicClient as PublicClient) || null;
  };

  // Create wallet state object for compatibility
  const walletState: WalletState = {
    isConnected,
    address: address || null,
    chainId: chainId || null,
    isConnecting,
  };

  return {
    // Wallet state
    ...walletState,

    // Connection methods
    connect: connectWallet,
    connectMetaMask,
    connectWalletConnect,
    disconnect,

    // Network methods
    switchToBaseMainnet,
    isCorrectNetwork,

    // Client methods
    getWalletClient,
    getPublicClient,

    // Available connectors
    availableConnectors: connectors.map((connector) => ({
      id: connector.id,
      name: connector.name,
      icon: connector.icon,
    })),
  };
};
