import { db } from "../utils/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  createCoin,
  tradeCoin,
  DeployCurrency,
  setApiKey,
} from "@zoralabs/coins-sdk";

import type { PublicClient, WalletClient, Address} from "viem";
import { parseEther } from 'viem';
import type {
  PlotOption,
  VotePayload,
  PlotVoteStats,
  PlotWinner,
} from "./zora";

/**
 * @class ZoraService
 * @description Manages plot token creation, voting, and results tracking using Zora Coin SDK and Firebase.
 */
export class ZoraService {
  private chainId: number; // Base Sepolia
  private platformReferrer: Address;

  constructor() {
    this.chainId = parseInt(import.meta.env.VITE_CHAINID as string) || 84532;
    this.platformReferrer = import.meta.env.VITE_PLATFORM_REFERRER as Address 
    setApiKey(import.meta.env.VITE_ZORA_API_KEY)
  }

  /**
   * Creates two plot option coins via Zora SDK and stores their metadata in Firebase
   */
  public async registerPlotOptions(
    chapterId: string,
    options: PlotOption[],
    walletClient: WalletClient,
    publicClient: PublicClient
  ): Promise<void> {
    if (options.length !== 2)
      throw new Error("Exactly two plot options are required.");

    const docRef = doc(collection(db, "plotVotes"), `chapter_${chapterId}`);
    const existing = await getDoc(docRef);
    if (existing.exists()) throw new Error("Chapter already initialized.");

    const payerAddress = walletClient.account?.address;
    if (!payerAddress) throw new Error("Wallet not connected or missing address");

    const voteData: PlotVoteStats = {};

    for (const option of options) {
      if (!option.symbol || !option.name || !option.metadataURI)
        throw new Error("Missing required coin parameters.");

      const coin = await createCoin(
        {
          name: option.name,
          symbol: option.symbol,
          uri: option.metadataURI,
          payoutRecipient: payerAddress,
          chainId: this.chainId,
          platformReferrer: this.platformReferrer,
          currency: DeployCurrency.ETH,
        },
        walletClient,
        publicClient
      );

      voteData[option.symbol] = {
        tokenAddress: coin.address as Address,
        totalVotes: 0,
        volumeETH: BigInt(0),
        voters: {},
      };
    }

    await setDoc(docRef, voteData);
  }

  /**
   * Performs token purchase via Zora tradeCoin and logs the vote in Firebase
   */
    public async voteWithETH(
        payload: VotePayload,
        walletClient: WalletClient,
        publicClient: PublicClient
    ): Promise<void> {
        const { chapterId, plotSymbol, tokenAddress, voter, amount, orderSize } = payload;

        const recipient = walletClient.account?.address;
        if (!recipient) throw new Error("Wallet client not connected.");

        const buyParams = {
            direction: "buy" as const,
            target: tokenAddress,
            args: {
            recipient,
            orderSize: parseEther(orderSize),   
            minAmountOut: 0n                   
            }
        };

        // Execute buy
        await tradeCoin(buyParams, walletClient, publicClient);

        // Firebase 
        const docRef = doc(db, "plotVotes", `chapter_${chapterId}`);
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new Error("Chapter not found");
        const data = snap.data() as PlotVoteStats;

        data[plotSymbol].totalVotes++;
        data[plotSymbol].voters[voter] = (data[plotSymbol].voters[voter] || 0) + amount;
        data[plotSymbol].volumeETH = (data[plotSymbol].volumeETH || BigInt(0)) + (parseEther(orderSize) || BigInt(0));

        await setDoc(docRef, data);
    }

    public async sellToken(
        tokenAddress: Address,
        recipient: Address,
        amountToSell: bigint,
        minEthOut: bigint,
        walletClient: WalletClient,
        publicClient: PublicClient
  ): Promise<string> {
        if (!walletClient.account?.address) throw new Error("Wallet not connected");

        const sellParams = {
        direction: "sell" as const,
        target: tokenAddress,
        args: {
            recipient,
            orderSize: amountToSell,
            minAmountOut: minEthOut,
        },
        };

        const result = await tradeCoin(sellParams, walletClient, publicClient);
        return result.hash;
  }


  /**
   * Returns current vote statistics from Firebase for the chapter
   */
  public async getPlotVoteStats(chapterId: string): Promise<PlotVoteStats> {
    const docRef = doc(db, "plotVotes", `chapter_${chapterId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Chapter not found");
    return snap.data() as PlotVoteStats;
  }

  /**
   * Determines and stores the winning plot option based on vote counts
   */
  public async finalizePlot(chapterId: string): Promise<void> {
    const docRef = doc(db, "plotVotes", `chapter_${chapterId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Chapter not found");

    const data = snap.data() as PlotVoteStats;
    let maxVotes = -1;
    let winningSymbol = "";

    for (const symbol of Object.keys(data)) {
      if (data[symbol].totalVotes > maxVotes) {
        maxVotes = data[symbol].totalVotes;
        winningSymbol = symbol;
      }
    }

    if (!winningSymbol) throw new Error("No votes cast");

    await setDoc(doc(db, "plotWinners", `chapter_${chapterId}`), {
      winningSymbol,
      tokenAddress: data[winningSymbol].tokenAddress,
    });
  }

  /**
   * Fetches the winning token and symbol for a given chapter
   */
  public async getWinner(chapterId: string): Promise<PlotWinner> {
    const docRef = doc(db, "plotWinners", `chapter_${chapterId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Winner not finalized");
    return snap.data() as PlotWinner;
  }
}
