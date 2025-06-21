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
      console.log(
        "Ethereum provider detected:",
        window.ethereum.isMetaMask ? "MetaMask" : "Unknown"
      );

      window.ethereum.on(
        "accountsChanged",
        this.handleAccountsChanged.bind(this)
      );
      window.ethereum.on("chainChanged", this.handleChainChanged.bind(this));
      window.ethereum.on("disconnect", this.handleDisconnect.bind(this));
    } else {
      console.log("No Ethereum provider detected");
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
    // Check if Ethereum provider is available
    if (typeof window === "undefined") {
      throw new Error("Window is not available");
    }

    console.log("🔍 Checking wallet availability:", {
      windowExists: typeof window !== "undefined",
      ethereumExists: !!window.ethereum,
      ethereumType: window.ethereum ? typeof window.ethereum : "undefined",
      isMetaMask: window.ethereum?.isMetaMask,
      isCoinbaseWallet: window.ethereum?.isCoinbaseWallet,
      providers: window.ethereum?.providers
        ? window.ethereum.providers.length
        : 0,
    });

    if (!window.ethereum) {
      throw new Error(
        "No Ethereum wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet."
      );
    }

    this.updateState({ isConnecting: true });

    try {
      console.log("🚀 Requesting wallet connection...");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("✅ Accounts received:", accounts);

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

      console.log("Wallet connected successfully:", {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
      });

      this.updateState({
        isConnected: true,
        address: accounts[0] as Address,
        chainId: parseInt(chainId, 16),
        isConnecting: false,
      });
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
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
