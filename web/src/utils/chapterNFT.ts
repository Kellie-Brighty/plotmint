import type { Address } from "viem";

// ChapterNFTFactory Contract ABI (extracted from deployment artifacts)
export const CHAPTER_NFT_FACTORY_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "ChapterNFTCreated",
    inputs: [
      { name: "chapterNFT", type: "address", indexed: true },
      { name: "chapterId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
    ],
  },
  {
    type: "function",
    name: "createChapterNFT",
    stateMutability: "nonpayable",
    inputs: [
      { name: "chapterId", type: "uint256" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getChapterNFT",
    stateMutability: "view",
    inputs: [{ name: "chapterId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "isChapterNFT",
    stateMutability: "view",
    inputs: [{ name: "nftAddress", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ChapterNFT Contract ABI (key functions for creator)
export const CHAPTER_NFT_ABI = [
  {
    type: "function",
    name: "mintFirstEdition",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "mintEdition",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "currentEdition",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_EDITIONS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MINT_PRICE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // ERC721 functions for ownership checking
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  // ERC721 transfer functions
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getApproved",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  // Marketplace functions
  {
    type: "function",
    name: "listForSale",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelListing",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "buyListed",
    stateMutability: "payable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "listings",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "royaltyInfo",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "salePrice", type: "uint256" },
    ],
    outputs: [
      { name: "receiver", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "EditionMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "minter", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ListingCreated",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ListingCancelled",
    inputs: [{ name: "tokenId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "ListingSold",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: false },
      { name: "buyer", type: "address", indexed: false },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
] as const;

// Deployed contract addresses
export const CHAPTER_NFT_FACTORY_ADDRESS: Address =
  "0x19a62632D810d5923E87E374443EeC2486f85d96";

// Configuration
export const NFT_CONFIG = {
  chainId: 84532, // Base Sepolia
  maxEditions: 100,
  mintPrice: "0.001", // ETH
};

// Types
export interface ChapterNFTData {
  contractAddress: Address;
  chapterId: string;
  name: string;
  symbol: string;
  creator: Address;
  currentEdition: number;
  maxEditions: number;
  mintPrice: string;
}

export interface CreateChapterNFTParams {
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  chapterNumber: number;
}
