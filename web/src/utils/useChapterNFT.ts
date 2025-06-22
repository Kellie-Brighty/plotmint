import { useState } from "react";
import { encodePacked, keccak256, decodeEventLog } from "viem";
import { baseSepolia } from "viem/chains";
import type { Address } from "viem";
import { useWallet } from "./useWallet";
import {
  CHAPTER_NFT_FACTORY_ABI,
  CHAPTER_NFT_FACTORY_ADDRESS,
  CHAPTER_NFT_ABI,
  type CreateChapterNFTParams,
  type ChapterNFTData,
} from "./chapterNFT";

export function useChapterNFT() {
  const [isCreating, setIsCreating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { getWalletClient, getPublicClient, address, isConnected } =
    useWallet();

  // Generate a numeric chapter ID from string ID (for contract compatibility)
  const generateChapterIdNumber = (chapterId: string): bigint => {
    const hash = keccak256(encodePacked(["string"], [chapterId]));
    // Take first 8 bytes and convert to number to avoid overflow
    const truncated = hash.slice(0, 18); // "0x" + 16 hex chars = 8 bytes
    return BigInt(truncated);
  };

  // Create a new Chapter NFT collection
  const createChapterNFT = async ({
    chapterId,
    storyTitle,

    chapterNumber,
  }: CreateChapterNFTParams) => {
    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Wallet client not available");
      }

      setIsCreating(true);
      setError(null);
      setIsConfirmed(false);
      setTxHash(null);

      // Generate contract-compatible chapter ID
      const chapterIdNumber = generateChapterIdNumber(chapterId);

      // Create NFT collection name and symbol
      const name = `${storyTitle} - Chapter ${chapterNumber}`;
      const symbol = `${storyTitle.slice(0, 4).toUpperCase()}${chapterNumber}`;

      console.log("🎨 Creating Chapter NFT Collection:", {
        chapterId,
        chapterIdNumber: chapterIdNumber.toString(),
        name,
        symbol,
        factory: CHAPTER_NFT_FACTORY_ADDRESS,
      });

      // Call factory contract to create new ChapterNFT
      const hash = await walletClient.writeContract({
        address: CHAPTER_NFT_FACTORY_ADDRESS,
        abi: CHAPTER_NFT_FACTORY_ABI,
        functionName: "createChapterNFT",
        args: [chapterIdNumber, name, symbol],
        chain: baseSepolia,
        account: address,
      });

      setTxHash(hash);
      console.log("📝 NFT Creation transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log("✅ NFT Collection created:", receipt);
      setIsConfirmed(true);
      setIsCreating(false);

      // Extract the new NFT contract address from events
      const chapterNFTCreatedEvent = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: CHAPTER_NFT_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "ChapterNFTCreated";
        } catch {
          return false;
        }
      });

      let nftContractAddress: Address | null = null;
      if (chapterNFTCreatedEvent) {
        const decoded = decodeEventLog({
          abi: CHAPTER_NFT_FACTORY_ABI,
          data: chapterNFTCreatedEvent.data,
          topics: chapterNFTCreatedEvent.topics,
        });
        nftContractAddress = (decoded as any).args.chapterNFT;
        console.log("🎯 New NFT Contract Address:", nftContractAddress);
      }

      return { hash, receipt, nftContractAddress };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create NFT collection";
      console.error("❌ Error creating Chapter NFT:", err);
      setError(errorMessage);
      setIsCreating(false);
      throw err;
    }
  };

  // Mint first edition (creator only)
  const mintFirstEdition = async (nftContractAddress: Address) => {
    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Wallet client not available");
      }

      setIsMinting(true);
      setError(null);
      setIsConfirmed(false);
      setTxHash(null);

      console.log("🥇 Minting first edition:", {
        nftContract: nftContractAddress,
        creator: address,
      });

      // Call mintFirstEdition on the ChapterNFT contract
      const hash = await walletClient.writeContract({
        address: nftContractAddress,
        abi: CHAPTER_NFT_ABI,
        functionName: "mintFirstEdition",
        args: [],
        chain: baseSepolia,
        account: address,
      });

      setTxHash(hash);
      console.log("📝 First edition mint transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log("✅ First edition minted:", receipt);
      setIsConfirmed(true);
      setIsMinting(false);

      return { hash, receipt };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to mint first edition";
      console.error("❌ Error minting first edition:", err);
      setError(errorMessage);
      setIsMinting(false);
      throw err;
    }
  };

  // Mint public edition (readers)
  const mintEdition = async (nftContractAddress: Address) => {
    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Wallet client not available");
      }

      setIsMinting(true);
      setError(null);
      setIsConfirmed(false);
      setTxHash(null);

      console.log("🎨 Minting public edition:", {
        nftContract: nftContractAddress,
        minter: address,
      });

      // Get the mint price from the contract
      const mintPrice = await publicClient.readContract({
        address: nftContractAddress,
        abi: CHAPTER_NFT_ABI,
        functionName: "MINT_PRICE",
      });

      console.log("💰 Mint price:", mintPrice.toString(), "wei");

      // Call mintEdition on the ChapterNFT contract with payment
      const hash = await walletClient.writeContract({
        address: nftContractAddress,
        abi: CHAPTER_NFT_ABI,
        functionName: "mintEdition",
        args: [],
        value: mintPrice as bigint,
        chain: baseSepolia,
        account: address,
      });

      setTxHash(hash);
      console.log("📝 Public edition mint transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log("✅ Public edition minted:", receipt);
      setIsConfirmed(true);
      setIsMinting(false);

      return { hash, receipt };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to mint edition";
      console.error("❌ Error minting public edition:", err);
      setError(errorMessage);
      setIsMinting(false);
      throw err;
    }
  };

  // Get Chapter NFT contract address for a chapter
  const getChapterNFTAddress = async (
    chapterId: string
  ): Promise<Address | null> => {
    try {
      const publicClient = getPublicClient();
      if (!publicClient) return null;

      const chapterIdNumber = generateChapterIdNumber(chapterId);

      const result = await publicClient.readContract({
        address: CHAPTER_NFT_FACTORY_ADDRESS,
        abi: CHAPTER_NFT_FACTORY_ABI,
        functionName: "getChapterNFT",
        args: [chapterIdNumber],
      });

      // Return null if address is zero address (not created yet)
      if (result === "0x0000000000000000000000000000000000000000") {
        return null;
      }

      return result as Address;
    } catch (err) {
      console.error("Error getting Chapter NFT address:", err);
      return null;
    }
  };

  // Get Chapter NFT data
  const getChapterNFTData = async (
    nftContractAddress: Address
  ): Promise<ChapterNFTData | null> => {
    try {
      const publicClient = getPublicClient();
      if (!publicClient) return null;

      const [currentEdition, maxEditions, mintPrice, owner] = await Promise.all(
        [
          publicClient.readContract({
            address: nftContractAddress,
            abi: CHAPTER_NFT_ABI,
            functionName: "currentEdition",
          }),
          publicClient.readContract({
            address: nftContractAddress,
            abi: CHAPTER_NFT_ABI,
            functionName: "MAX_EDITIONS",
          }),
          publicClient.readContract({
            address: nftContractAddress,
            abi: CHAPTER_NFT_ABI,
            functionName: "MINT_PRICE",
          }),
          publicClient.readContract({
            address: nftContractAddress,
            abi: CHAPTER_NFT_ABI,
            functionName: "owner",
          }),
        ]
      );

      return {
        contractAddress: nftContractAddress,
        chapterId: "", // Will be filled by caller
        name: "", // Will be filled by caller
        symbol: "", // Will be filled by caller
        creator: owner as Address,
        currentEdition: Number(currentEdition),
        maxEditions: Number(maxEditions),
        mintPrice: (Number(mintPrice) / 1e18).toString(), // Convert wei to ETH
      };
    } catch (err) {
      console.error("Error getting Chapter NFT data:", err);
      return null;
    }
  };

  // Check how many NFTs a user owns from a specific contract
  const getUserNFTBalance = async (
    nftContractAddress: Address,
    userAddress: Address
  ): Promise<number> => {
    try {
      const publicClient = getPublicClient();
      if (!publicClient) {
        return 0;
      }

      const balance = await publicClient.readContract({
        address: nftContractAddress,
        abi: CHAPTER_NFT_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      });

      return Number(balance);
    } catch (err) {
      console.error("Error getting user NFT balance:", err);
      return 0;
    }
  };

  // Get the specific token IDs owned by a user (brute force approach for small collections)
  const getUserOwnedTokenIds = async (
    nftContractAddress: Address,
    userAddress: Address
  ): Promise<number[]> => {
    try {
      const publicClient = getPublicClient();
      if (!publicClient) {
        return [];
      }

      // First check how many NFTs the user owns
      const balance = await getUserNFTBalance(nftContractAddress, userAddress);
      if (balance === 0) {
        return [];
      }

      // Get the current edition to know how many tokens exist
      const currentEdition = await publicClient.readContract({
        address: nftContractAddress,
        abi: CHAPTER_NFT_ABI,
        functionName: "currentEdition",
      });

      const ownedTokens: number[] = [];

      // Check each token ID from 1 to currentEdition
      for (let tokenId = 1; tokenId <= Number(currentEdition); tokenId++) {
        try {
          const owner = await publicClient.readContract({
            address: nftContractAddress,
            abi: CHAPTER_NFT_ABI,
            functionName: "ownerOf",
            args: [BigInt(tokenId)],
          });

          // Normalize addresses for comparison (convert to lowercase)
          const normalizedOwner = (owner as string).toLowerCase();
          const normalizedUser = userAddress.toLowerCase();

          if (normalizedOwner === normalizedUser) {
            ownedTokens.push(tokenId);
          }
        } catch (error) {
          // Token doesn't exist or other error, skip
          continue;
        }
      }

      return ownedTokens;
    } catch (err) {
      console.error("Error getting user owned token IDs:", err);
      return [];
    }
  };

  // Transfer NFT to another address
  const transferNFT = async (
    nftContractAddress: Address,
    tokenId: number,
    toAddress: Address
  ) => {
    try {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !publicClient) {
        throw new Error("Wallet client not available");
      }

      setError(null);

      console.log("🔄 Transferring NFT:", {
        contract: nftContractAddress,
        tokenId,
        from: address,
        to: toAddress,
      });

      // Call transferFrom on the ChapterNFT contract
      const hash = await walletClient.writeContract({
        address: nftContractAddress,
        abi: CHAPTER_NFT_ABI,
        functionName: "transferFrom",
        args: [address, toAddress, BigInt(tokenId)],
        chain: baseSepolia,
        account: address,
      });

      console.log("📝 NFT transfer transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      console.log("✅ NFT transferred successfully:", receipt);
      return { hash, receipt };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to transfer NFT";
      console.error("❌ Error transferring NFT:", err);
      setError(errorMessage);
      throw err;
    }
  };

  // Check if user can transfer a specific NFT (they own it)
  const canTransferNFT = async (
    nftContractAddress: Address,
    tokenId: number,
    userAddress: Address
  ): Promise<boolean> => {
    try {
      const publicClient = getPublicClient();
      if (!publicClient) return false;

      const owner = await publicClient.readContract({
        address: nftContractAddress,
        abi: CHAPTER_NFT_ABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });

      // Normalize addresses for comparison
      const normalizedOwner = (owner as string).toLowerCase();
      const normalizedUser = userAddress.toLowerCase();

      return normalizedOwner === normalizedUser;
    } catch (err) {
      console.error("Error checking NFT ownership:", err);
      return false;
    }
  };

  return {
    // Creation functions
    createChapterNFT,
    mintFirstEdition,
    mintEdition,

    // Query functions
    getChapterNFTAddress,
    getChapterNFTData,
    getUserNFTBalance,
    getUserOwnedTokenIds,

    // Transaction state
    isCreating,
    isMinting,
    isConfirmed,
    txHash,
    error,

    // Helper methods
    clearError: () => setError(null),
    isLoading: isCreating || isMinting,

    // New functions
    transferNFT,
    canTransferNFT,
  };
}
