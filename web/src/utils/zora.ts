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