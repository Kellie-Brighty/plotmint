import { db } from "../utils/firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import {
  createCoin,
  tradeCoin,
  DeployCurrency,
  setApiKey,
} from "@zoralabs/coins-sdk";

import type { PublicClient, WalletClient, Address } from "viem";
import { parseEther } from "viem";
import type {
  PlotOption,
  VotePayload,
  PlotVoteStats,
  PlotWinner,
  TradeabilityStatus,
} from "./zora";

// CoinV4 Contract ABI - minimal interface for tradeability checks
const COIN_V4_ABI = [
  {
    inputs: [],
    name: "getPoolKey",
    outputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "hooks",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Standard ERC20 ABI for balance checks
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Pool Manager ABI for pool state checks
const POOL_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        name: "key",
        type: "tuple",
      },
    ],
    name: "getSlot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * @class ZoraService
 * @description Manages plot token creation, voting, and results tracking using Zora Coin SDK and Firebase.
 */
export class ZoraService {
  private chainId: number; // Base Sepolia
  private platformReferrer: Address;
  // You'll need to get this from your environment or Zora docs
  private poolManagerAddress: Address =
    "0x0000000000000000000000000000000000000000" as Address; // TODO: Replace with actual pool manager address

  constructor() {
    this.chainId = parseInt(import.meta.env.VITE_CHAINID as string) || 84532;
    this.platformReferrer = import.meta.env.VITE_PLATFORM_REFERRER as Address;
    setApiKey(import.meta.env.VITE_ZORA_API_KEY);

    // TODO: Set actual pool manager address from environment
    // this.poolManagerAddress = import.meta.env.VITE_POOL_MANAGER_ADDRESS as Address;
  }

  /**
   * Checks if a CoinV4 token is tradeable by verifying pool initialization and liquidity
   */
  public async checkTokenTradeability(
    tokenAddress: Address,
    publicClient: PublicClient
  ): Promise<TradeabilityStatus> {
    try {
      console.log(`🔍 Checking tradeability for token: ${tokenAddress}`);

      // Step 1: Get pool key from the token contract
      let poolKey;
      try {
        poolKey = await publicClient.readContract({
          address: tokenAddress,
          abi: COIN_V4_ABI,
          functionName: "getPoolKey",
        });
        console.log(`✅ Pool key retrieved:`, poolKey);
      } catch (error) {
        console.error(`❌ Failed to get pool key:`, error);
        return {
          isInitialized: false,
          hasHookBalance: false,
          poolExists: false,
          error:
            "Failed to retrieve pool key - token may not be CoinV4 contract",
        };
      }

      // Step 2: Get hook address
      let hookAddress: Address;
      try {
        hookAddress = await publicClient.readContract({
          address: tokenAddress,
          abi: COIN_V4_ABI,
          functionName: "hooks",
        });
        console.log(`✅ Hook address: ${hookAddress}`);
      } catch (error) {
        console.error(`❌ Failed to get hook address:`, error);
        return {
          isInitialized: false,
          hasHookBalance: false,
          poolExists: false,
          error: "Failed to retrieve hook address",
        };
      }

      // Step 3: Check if pool exists in PoolManager (if we have the address)
      let poolExists = true; // Default to true if we can't check
      if (
        this.poolManagerAddress !== "0x0000000000000000000000000000000000000000"
      ) {
        try {
          const slot0 = await publicClient.readContract({
            address: this.poolManagerAddress,
            abi: POOL_MANAGER_ABI,
            functionName: "getSlot0",
            args: [poolKey],
          });
          poolExists = slot0[0] !== BigInt(0); // sqrtPriceX96 should be > 0
          console.log(
            `✅ Pool exists check: ${poolExists}, sqrtPriceX96: ${slot0[0]}`
          );
        } catch (error) {
          console.warn(`⚠️ Could not verify pool existence:`, error);
          // Don't fail here, continue with other checks
        }
      }

      // Step 4: Check if hook has token balance (liquidity)
      let hasHookBalance = false;
      try {
        const hookBalance = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [hookAddress],
        });
        hasHookBalance = hookBalance > BigInt(0);
        console.log(
          `✅ Hook balance: ${hookBalance.toString()}, has balance: ${hasHookBalance}`
        );
      } catch (error) {
        console.error(`❌ Failed to check hook balance:`, error);
        return {
          isInitialized: false,
          hasHookBalance: false,
          poolExists,
          hookAddress,
          poolKey,
          error: "Failed to check hook balance",
        };
      }

      // Step 5: Determine if token is initialized (has pool key and hook)
      const isInitialized =
        !!poolKey &&
        hookAddress !== "0x0000000000000000000000000000000000000000";

      const status: TradeabilityStatus = {
        isInitialized,
        hasHookBalance,
        poolExists,
        hookAddress,
        poolKey,
      };

      console.log(`📊 Tradeability status:`, status);
      return status;
    } catch (error) {
      console.error(`💥 Unexpected error checking tradeability:`, error);
      return {
        isInitialized: false,
        hasHookBalance: false,
        poolExists: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      };
    }
  }

  /**
   * Quick check if token is ready for trading
   */
  public async isTokenTradeable(
    tokenAddress: Address,
    publicClient: PublicClient
  ): Promise<boolean> {
    const status = await this.checkTokenTradeability(
      tokenAddress,
      publicClient
    );
    return status.isInitialized && status.hasHookBalance && status.poolExists;
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
   * Performs token purchase via Zora tradeCoin and logs the vote in Firebase
   */
  public async voteWithETH(
    payload: VotePayload,
    walletClient: WalletClient,
    publicClient: PublicClient
  ): Promise<void> {
    const { chapterId, plotSymbol, tokenAddress, voter, amount, orderSize } =
      payload;

    const recipient = walletClient.account?.address;
    if (!recipient) throw new Error("Wallet client not connected.");

    const orderSizeInWei = parseEther(orderSize);

    // 🧪 TESTING: ChatGPT's systematic debugging approach
    // Original values (commented out):
    // const minAmountOut = orderSizeInWei / BigInt(1000); // Very small amount to allow for high slippage
    // tradeReferrer: this.platformReferrer, // Use platform referrer from env

    // TEST 1: Ultra-permissive parameters to isolate the issue
    const minAmountOut = BigInt(0); // Was: orderSizeInWei / BigInt(1000)
    const sqrtPriceLimitX96 = BigInt(0); // Keep as 0 (no change)
    const tradeReferrer =
      "0x0000000000000000000000000000000000000000" as Address; // Was: this.platformReferrer

    const buyParams = {
      direction: "buy" as const,
      target: tokenAddress,
      args: {
        recipient,
        orderSize: orderSizeInWei,
        minAmountOut,
        sqrtPriceLimitX96,
        tradeReferrer,
      },
    };

    console.log("🧪 TEST 1 - Ultra-permissive parameters:", {
      target: tokenAddress,
      recipient,
      orderSize: orderSizeInWei.toString(),
      minAmountOut: minAmountOut.toString(),
      sqrtPriceLimitX96: sqrtPriceLimitX96.toString(),
      tradeReferrer,
      note: "Testing with most permissive parameters first",
    });

    // Execute buy
    await tradeCoin(buyParams, walletClient, publicClient);

    // Firebase logging remains the same
    const docRef = doc(db, "plotVotes", `chapter_${chapterId}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Chapter not found");
    const data = snap.data() as PlotVoteStats;

    data[plotSymbol].totalVotes++;
    data[plotSymbol].voters[voter] =
      (data[plotSymbol].voters[voter] || 0) + amount;

    // Convert BigInt to string for Firebase storage
    const currentVolume = BigInt(data[plotSymbol].volumeETH || "0");
    const additionalVolume = orderSizeInWei;
    data[plotSymbol].volumeETH = (currentVolume + additionalVolume).toString();

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
