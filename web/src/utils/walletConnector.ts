import { createWalletClient, createPublicClient, http, custom } from "viem";
import { baseSepolia } from "viem/chains";
import type { WalletClient, PublicClient, Address } from "viem";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  isConnected: boolean;
  address: Address | null;
  chainId: number | null;
  isConnecting: boolean;
}

class WalletConnector {
  private walletClient: WalletClient | null = null;
  private publicClient: PublicClient | null = null;
  private listeners: ((state: WalletState) => void)[] = [];
  private state: WalletState = {
    isConnected: false,
    address: null,
    chainId: null,
    isConnecting: false,
  };

  constructor() {
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    }) as any;

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on(
        "accountsChanged",
        this.handleAccountsChanged.bind(this)
      );
      window.ethereum.on("chainChanged", this.handleChainChanged.bind(this));
      window.ethereum.on("disconnect", this.handleDisconnect.bind(this));
    }
  }

  private handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      this.disconnect();
    } else {
      // Recreate wallet client with new account
      if (window.ethereum) {
        this.walletClient = createWalletClient({
          chain: baseSepolia,
          transport: custom(window.ethereum),
          account: accounts[0] as Address,
        });
      }

      this.updateState({
        address: accounts[0] as Address,
        isConnected: true,
      });
    }
  };

  private handleChainChanged = (chainId: string) => {
    this.updateState({
      chainId: parseInt(chainId, 16),
    });
  };

  private handleDisconnect = () => {
    this.disconnect();
  };

  private updateState(updates: Partial<WalletState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((listener) => listener(this.state));
  }

  public subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async connect(): Promise<void> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    this.updateState({ isConnecting: true });

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Create wallet client with explicit account
      this.walletClient = createWalletClient({
        chain: baseSepolia,
        transport: custom(window.ethereum),
        account: accounts[0] as Address,
      });

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      this.updateState({
        isConnected: true,
        address: accounts[0] as Address,
        chainId: parseInt(chainId, 16),
        isConnecting: false,
      });
    } catch (error) {
      this.updateState({ isConnecting: false });
      throw error;
    }
  }

  public disconnect(): void {
    this.walletClient = null;
    this.updateState({
      isConnected: false,
      address: null,
      chainId: null,
      isConnecting: false,
    });
  }

  public async switchToBaseSepolia(): Promise<void> {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x14a34" }], // Base Sepolia chainId in hex
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x14a34",
              chainName: "Base Sepolia",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://sepolia.base.org"],
              blockExplorerUrls: ["https://sepolia-explorer.base.org"],
            },
          ],
        });
      }
    }
  }

  public getWalletClient(): WalletClient | null {
    return this.walletClient;
  }

  public getPublicClient(): PublicClient | null {
    return this.publicClient;
  }

  public getState(): WalletState {
    return this.state;
  }

  public async checkConnection(): Promise<void> {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        // Create wallet client with explicit account
        this.walletClient = createWalletClient({
          chain: baseSepolia,
          transport: custom(window.ethereum),
          account: accounts[0] as Address,
        });

        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        this.updateState({
          isConnected: true,
          address: accounts[0] as Address,
          chainId: parseInt(chainId, 16),
        });
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  }
}

export const walletConnector = new WalletConnector();
