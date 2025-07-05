import { db } from "../utils/firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  createCoin, 
  DeployCurrency, 
  setApiKey,
  tradeCoin,
  type TradeParameters
} from "@zoralabs/coins-sdk";
import { base } from "viem/chains";

import type { PublicClient, WalletClient, Address, Account } from "viem";
import type { PlotOption, PlotVoteStats, PlotWinner } from "./zora";
import logger from "./logger";

/**
 * @class ZoraService
 * @description Manages plot token creation, trading, and vote tracking using Zora Coin SDK and Firebase.
 * All coin interactions are on Base mainnet.
 */
export class ZoraService {
  private chainId: number = base.id; // Base mainnet: 8453
  private platformReferrer: Address;

  constructor() {
    this.platformReferrer = import.meta.env.VITE_PLATFORM_REFERRER as Address;
    setApiKey(import.meta.env.VITE_ZORA_API_KEY);
  }

  /**
   * Creates plot option tokens via Zora SDK and stores their metadata in Firebase
   * Now creates on Base mainnet instead of testnet
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

    logger.info(`Using wallet address: ${payerAddress}`);
    logger.info(`Creating tokens on Base mainnet (chainId: ${this.chainId})`);

    const voteData: PlotVoteStats = {};

    for (const option of options) {
      if (!option.symbol || !option.name || !option.metadataURI)
        throw new Error("Missing required coin parameters.");

      logger.info(`Creating token: ${option.name} (${option.symbol})`);
      console.log("walletClient", walletClient);

      const coin = await createCoin(
        {
          name: option.name,
          symbol: option.symbol,
          uri: option.metadataURI,
          payoutRecipient: payerAddress as Address,
          chainId: this.chainId, // Base mainnet
          platformReferrer: this.platformReferrer,
          currency: DeployCurrency.ZORA,
        },
        walletClient,
        publicClient
      );

      logger.info(`Token created at: ${coin.address}`);

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
   * Trade coins using Zora's tradeCoin function
   * @param tradeParams - Trade parameters including sell/buy tokens and amounts
   * @param walletClient - Wallet client for signing transactions
   * @param account - Account to trade from
   * @param publicClient - Public client for reading blockchain state
   * @returns Transaction receipt
   */
  public async tradeCoin(
    tradeParams: TradeParameters,
    walletClient: WalletClient,
    account: Account,
    publicClient: PublicClient
  ) {
    try {
      logger.info("Executing trade:", {
        sell: tradeParams.sell,
        buy: tradeParams.buy,
        amountIn: tradeParams.amountIn.toString(),
        slippage: tradeParams.slippage || 0.05,
      });

      const receipt = await tradeCoin({
        tradeParameters: tradeParams,
        walletClient,
        account,
        publicClient,
      });

      logger.info("Trade executed successfully! Transaction hash:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      logger.error("Trade failed:", error);
      throw error;
    }
  }

  /**
   * Get coin information including holder count for winner determination
   * @param tokenAddress - Address of the plot token
   * @returns Coin data including unique holder count
   */
  public async getCoinInfo(tokenAddress: Address) {
    try {
      const apiUrl = `https://api-sdk.zora.engineering/coin?address=${tokenAddress}&chain=${this.chainId}`;
      
      logger.info(`Fetching coin info from: ${apiUrl}`);
      
      // Make the API request
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.zora20Token) {
        throw new Error("Token not found");
      }

      const token = data.zora20Token;

      logger.info(`📊 Token info for ${tokenAddress}:`, {
        name: token.name,
        symbol: token.symbol,
        uniqueHolders: token.uniqueHolders,
        totalSupply: token.totalSupply,
        marketCap: token.marketCap,
      });

      return {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        description: token.description,
        uniqueHolders: token.uniqueHolders || 0,
        totalSupply: token.totalSupply,
        totalVolume: token.totalVolume,
        volume24h: token.volume24h,
        marketCap: token.marketCap,
        marketCapDelta24h: token.marketCapDelta24h,
        chainId: token.chainId,
        createdAt: token.createdAt,
        creator: token.creatorAddress,
        creatorEarnings: token.creatorEarnings,
        poolCurrencyToken: token.poolCurrencyToken,
        platformReferrerAddress: token.platformReferrerAddress,
        payoutRecipientAddress: token.payoutRecipientAddress,
        creatorProfile: token.creatorProfile,
        mediaContent: token.mediaContent,
        uniswapV4PoolKey: token.uniswapV4PoolKey,
      };
    } catch (error) {
      logger.error("❌ Error getting coin info:", error);
      throw error;
    }
  }

  /**
   * Determines the winning plot option based on unique holder count
   * @param chapterId - ID of the chapter
   * @returns Winner information including token with most unique holders
   */
  public async determineWinnerByHolders(chapterId: string): Promise<PlotWinner> {
    const docRef = doc(db, "plotVotes", `chapter_${chapterId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Chapter not found");

    const voteData = snap.data() as PlotVoteStats;
    
    let winner: PlotWinner | null = null;
    let maxHolders = 0;

    // Get unique holder count for each plot option
    for (const [symbol, stats] of Object.entries(voteData)) {
      try {
        const coinInfo = await this.getCoinInfo(stats.tokenAddress);
        const uniqueHolders = coinInfo.uniqueHolders;

        logger.info(`🏆 ${symbol}: ${uniqueHolders} unique holders`);

        if (uniqueHolders > maxHolders) {
          maxHolders = uniqueHolders;
          winner = {
            symbol,
            tokenAddress: stats.tokenAddress,
            totalVotes: uniqueHolders, // Using unique holders as vote count
            volumeETH: stats.volumeETH,
          };
        }
      } catch (error) {
        console.error(`Error getting holder count for ${symbol}:`, error);
      }
    }

    if (!winner) {
      throw new Error("Could not determine winner");
    }

    // Store winner in Firebase
    await setDoc(
      doc(db, "plotWinners", `chapter_${chapterId}`),
      {
        ...winner,
        determinedAt: new Date().toISOString(),
        determinationMethod: "unique_holders",
      }
    );

    logger.info(`Winner determined: ${winner.symbol} with ${maxHolders} unique holders`);
    return winner;
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
    
    if (!snap.exists()) {
      logger.error(`Plot votes document not found for chapter: ${chapterId}`);
      throw new Error(
        `Chapter plot votes not initialized. This usually means the chapter was not properly published with plot tokens. Please contact support to fix this chapter's vote tracking.`
      );
    }

    const data = snap.data() as PlotVoteStats;

    if (!data[plotSymbol]) {
      logger.error(`Plot symbol ${plotSymbol} not found in chapter ${chapterId}. Available symbols:`, Object.keys(data));
      throw new Error(
        `Plot option "${plotSymbol}" not found. Available options: ${Object.keys(data).join(", ")}`
      );
    }

    // Update vote counts
    data[plotSymbol].totalVotes++;
    data[plotSymbol].voters[voter] = (data[plotSymbol].voters[voter] || 0) + 1;

    // Update ETH volume
    const currentVolume = BigInt(data[plotSymbol].volumeETH || "0");
    const newVolume = currentVolume + BigInt(parseFloat(ethAmount) * 1e18);
    data[plotSymbol].volumeETH = newVolume.toString();

    await setDoc(docRef, data);

    logger.info(`Vote recorded for ${plotSymbol}: ${ethAmount} ETH (voter: ${voter})`);
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
   * Helper method to create trade parameters for buying plot tokens with ETH
   */
  public createBuyTradeParams(
    tokenAddress: Address,
    ethAmount: bigint,
    senderAddress: Address,
    slippage: number = 0.05
  ): TradeParameters {
    return {
      sell: { type: "eth" },
      buy: { type: "erc20", address: tokenAddress },
      amountIn: ethAmount,
      slippage,
      sender: senderAddress,
      recipient: senderAddress, // Same as sender by default
    };
  }
  /**
   * Helper method to create trade parameters for selling plot tokens for ETH
   */
  public createSellTradeParams(
    tokenAddress: Address,
    tokenAmount: bigint,
    senderAddress: Address,
    slippage: number = 0.05
  ): TradeParameters {
    return {
      sell: { type: "erc20", address: tokenAddress },
      buy: { type: "eth" },
      amountIn: tokenAmount,
      slippage,
      sender: senderAddress,
      recipient: senderAddress,
    };
  }
}
