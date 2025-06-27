import { db } from "../utils/firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { createCoin, DeployCurrency, setApiKey } from "@zoralabs/coins-sdk";

import type { PublicClient, WalletClient, Address } from "viem";
import type { PlotOption, PlotVoteStats, PlotWinner } from "./zora";

/**
 * @class ZoraService
 * @description Manages plot token creation and vote tracking using Zora Coin SDK and Firebase.
 * Trading is handled separately via CoinTrader contract.
 */
export class ZoraService {
  private chainId: number; // Base Sepolia
  private platformReferrer: Address;

  constructor() {
    this.chainId = parseInt(import.meta.env.VITE_CHAINID as string) || 84532;
    this.platformReferrer = import.meta.env.VITE_PLATFORM_REFERRER as Address;
    setApiKey(import.meta.env.VITE_ZORA_API_KEY);
  }

  /**
   * Creates plot option tokens via Zora SDK and stores their metadata in Firebase
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

    // Get wallet address from account or from the wallet client
    let payerAddress: Address;
    if (walletClient.account) {
      payerAddress = walletClient.account.address;
    } else {
      // Fallback: get addresses from wallet client
      const addresses = await walletClient.getAddresses();
      if (!addresses || addresses.length === 0) {
        throw new Error("Wallet not connected or missing address");
      }
      payerAddress = addresses[0];
    }

    console.log(`🔗 Using wallet address: ${payerAddress}`);

    const voteData: PlotVoteStats = {};

    for (const option of options) {
      if (!option.symbol || !option.name || !option.metadataURI)
        throw new Error("Missing required coin parameters.");

      console.log(`🚀 Creating token: ${option.name} (${option.symbol})`);

      const coin = await createCoin(
        {
          name: option.name,
          symbol: option.symbol,
          uri: option.metadataURI,
          payoutRecipient: payerAddress as Address,
          chainId: this.chainId,
          platformReferrer: this.platformReferrer,
          currency: DeployCurrency.ETH,
        },
        walletClient,
        publicClient
      );

      console.log(`✅ Token created at: ${coin.address}`);

      voteData[option.symbol] = {
        tokenAddress: coin.address as Address,
        totalVotes: 0,
        volumeETH: "0",
        voters: {},
      };
    }

    await setDoc(docRef, voteData);
  }

  /**
   * Records a plot vote in Firebase (called after successful token purchase)
   */
  public async recordPlotVote(
    chapterId: string,
    plotSymbol: string,
    voter: Address,
    ethAmount: string
  ): Promise<void> {
    const docRef = doc(db, "plotVotes", `chapter_${chapterId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Chapter not found");

    const data = snap.data() as PlotVoteStats;

    if (!data[plotSymbol]) {
      throw new Error(`Plot option ${plotSymbol} not found`);
    }

    // Update vote counts
    data[plotSymbol].totalVotes++;
    data[plotSymbol].voters[voter] = (data[plotSymbol].voters[voter] || 0) + 1;

    // Update ETH volume
    const currentVolume = BigInt(data[plotSymbol].volumeETH || "0");
    const newVolume = currentVolume + BigInt(parseFloat(ethAmount) * 1e18);
    data[plotSymbol].volumeETH = newVolume.toString();

    await setDoc(docRef, data);

    console.log(`✅ Vote recorded for ${plotSymbol}: ${ethAmount} ETH`);
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