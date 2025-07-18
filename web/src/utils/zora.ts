import type { Address } from "viem";
import type { ValidMetadataURI } from "@zoralabs/coins-sdk";

/**
 * Plot option data for token creation
 */
export interface PlotOption {
  name: string;
  symbol: string;
  metadataURI: ValidMetadataURI; // metadataURI (an IPFS URI is recommended)
}

/**
 * Vote statistics stored in Firebase
 */
export interface PlotVoteStats {
  [symbol: string]: {
    tokenAddress: Address;
    totalVotes: number;
    volumeETH: string;
    voters: {
      [walletAddress: string]: number;
    };
  };
}

/**
 * Winner information for a chapter
 */
export interface PlotWinner {
  symbol: string;
  tokenAddress: Address;
  totalVotes: number;
  volumeETH: string;
}

/**
 * User's token holding information
 */
export interface UserTokenHolding {
  tokenAddress: Address;
  symbol: string;
  name: string;
  balance: string; // Token balance as string to handle large numbers
  balanceFormatted: string; // Human-readable balance (e.g., "1.23")
  storyId: string;
  storyTitle: string;
  chapterId: string;
  chapterTitle: string;
  purchasePrice: string; // Amount of ETH spent to acquire tokens
  currentValue: string; // Current market value in ETH
  profitLoss: string; // Profit/loss in ETH
  profitLossPercentage: number; // Profit/loss percentage
  // Enhanced market data (now in USD)
  marketCap?: string; // Market cap in USD
  totalVolume?: string; // Total trading volume in USD
  volume24h?: string; // 24h trading volume in USD
  uniqueHolders?: number; // Number of unique holders
  currentPrice?: string; // Current price per token in ETH
  totalSupply?: string; // Total token supply
  creatorProfile?: {
    handle?: string;
    avatar?: {
      previewImage?: {
        small?: string;
        medium?: string;
      };
    };
  };
  // 24-hour voting period information
  tokenCreatedAt?: string; // ISO timestamp when token was created
  votingPeriodEnd?: string; // ISO timestamp when voting period ends (24h after creation)
  votingTimeRemaining?: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isActive: boolean; // true if still within 24h voting period
  };
  canSell?: boolean; // false during voting period
}

/**
 * Voting period status for a chapter
 */
export interface ChapterVotingStatus {
  chapterId: string;
  tokenCreatedAt: string;
  votingPeriodEnd: string;
  isVotingActive: boolean;
  timeRemaining: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  };
  restrictions: {
    canCreateNewChapter: boolean; // false for creator during voting
    canSellTokens: boolean; // false for everyone during voting
  };
}

/**
 * Enhanced market statistics for a token
 */
export interface TokenMarketStats {
  address: Address;
  name: string;
  symbol: string;
  totalSupply: string;
  uniqueHolders: number;
  marketCap: string; // Market cap in ETH
  marketCapUSD?: string; // Market cap in USD (if available)
  currentPrice: string; // Current price per token in ETH
  currentPriceUSD?: string; // Current price in USD (if available)
  volume24h: string; // 24h trading volume in ETH
  volume24hUSD?: string; // 24h trading volume in USD
  priceChange24h: number; // 24h price change percentage
  allTimeHigh: string; // All-time high price in ETH
  allTimeLow: string; // All-time low price in ETH
  createdAt: string; // Token creation timestamp
  creator: Address; // Token creator address
}

/**
 * User's complete token portfolio
 */
export interface UserTokenPortfolio {
  totalValue: string; // Total portfolio value in USD
  totalInvested: string; // Total amount invested in USD
  totalProfitLoss: string; // Total profit/loss in USD
  totalProfitLossPercentage: number; // Total profit/loss percentage
  holdings: UserTokenHolding[]; // Individual token holdings
  lastUpdated: string; // Last update timestamp
}

/**
 * Token price history point
 */
export interface TokenPricePoint {
  timestamp: string;
  price: string; // Price in ETH
  priceUSD?: string; // Price in USD
  volume: string; // Trading volume
}

/**
 * Token trading activity
 */
export interface TokenTransaction {
  hash: string;
  timestamp: string;
  type: "buy" | "sell";
  tokenAmount: string;
  ethAmount: string;
  price: string; // Price per token in ETH
  user: Address;
  blockNumber: number;
}
