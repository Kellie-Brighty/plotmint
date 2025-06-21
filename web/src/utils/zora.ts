import type { Address } from "viem";

export interface PlotOption {
  name: string;
  symbol: string;
  metadataURI: string; // metadataURI (an IPFS URI is recommended)
}

export interface PlotVoteStats {
  [symbol: string]: {
    tokenAddress: Address;
    totalVotes: number;
    volumeETH?: string;
    voters: {
      [walletAddress: string]: number;
    };
  };
}

export interface PlotWinner {
  winningSymbol: string;
  tokenAddress: Address;
}
