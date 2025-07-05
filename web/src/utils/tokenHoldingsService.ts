import { db } from "./firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { ZoraService } from "./zoraService";
import type { Address } from "viem";
import type {
  PlotVoteStats,
  UserTokenHolding,
  UserTokenPortfolio,
} from "./zora";
import type { ChapterData, StoryData } from "./storyService";

/**
 * Service for getting user token holdings using existing ZoraService methods
 */
export class TokenHoldingsService {
  private zoraService: ZoraService;

  constructor() {
    this.zoraService = new ZoraService();
  }

  /**
   * Get all token holdings for a user by scanning plotVotes documents
   * @param userAddress - User's wallet address
   * @returns User's complete token portfolio
   */
  public async getUserTokenPortfolio(
    userAddress: Address
  ): Promise<UserTokenPortfolio> {
    try {
      console.log(`🔍 Getting token portfolio for user: ${userAddress}`);
      console.log(`🔍 User address details:`, {
        original: userAddress,
        lowercase: userAddress.toLowerCase(),
        length: userAddress.length,
        type: typeof userAddress,
      });

      // Get all plotVotes documents
      const plotVotesRef = collection(db, "plotVotes");
      const plotVotesSnapshot = await getDocs(plotVotesRef);

      console.log(
        `📊 Found ${plotVotesSnapshot.docs.length} plotVotes documents`
      );

      const holdings: UserTokenHolding[] = [];
      let totalInvested = BigInt(0);
      let totalCurrentValue = BigInt(0);

      for (const plotVoteDoc of plotVotesSnapshot.docs) {
        try {
          const docId = plotVoteDoc.id;
          const chapterId = docId.replace("chapter_", "");
          const plotVoteData = plotVoteDoc.data() as PlotVoteStats;

          console.log(`📄 Processing plotVotes document:`, {
            docId: docId,
            chapterId: chapterId,
            hasData: !!plotVoteData,
            dataKeys: Object.keys(plotVoteData || {}),
            totalKeys: Object.keys(plotVoteData || {}).length,
            firstKey: Object.keys(plotVoteData || {})[0],
            sampleVoterData:
              Object.keys(plotVoteData || {}).length > 0
                ? Object.entries(plotVoteData)[0]?.[1]?.voters
                : "no voters data",
          });

          console.log(`📊 Checking chapter ${chapterId} for user tokens...`);

          // Safety check: ensure plotVoteData exists and is an object
          if (!plotVoteData || typeof plotVoteData !== "object") {
            console.log(`⚠️ Invalid plot vote data for chapter ${chapterId}`);
            continue;
          }

          // Check each plot option in this chapter
          for (const [symbol, voteStats] of Object.entries(plotVoteData)) {
            try {
              console.log(
                `🔍 Processing symbol ${symbol} in chapter ${chapterId}:`,
                {
                  tokenAddress: voteStats.tokenAddress,
                  totalVotes: voteStats.totalVotes,
                  volumeETH: voteStats.volumeETH,
                  votersObject: voteStats.voters,
                  votersType: typeof voteStats.voters,
                  votersKeys: voteStats.voters
                    ? Object.keys(voteStats.voters)
                    : "no voters",
                }
              );

              // Check if user has voted/purchased this token
              // Safety check: ensure voteStats.voters exists and is an object
              if (!voteStats.voters || typeof voteStats.voters !== "object") {
                console.log(
                  `⚠️ No voters data for ${symbol} in chapter ${chapterId}`,
                  {
                    voters: voteStats.voters,
                    votersType: typeof voteStats.voters,
                  }
                );
                continue;
              }

              console.log(
                `👥 Checking if user ${userAddress} exists in voters:`,
                {
                  userAddress: userAddress,
                  userAddressLower: userAddress.toLowerCase(),
                  votersObject: voteStats.voters,
                  votersKeys: Object.keys(voteStats.voters),
                  votersKeysLower: Object.keys(voteStats.voters).map((k) =>
                    k.toLowerCase()
                  ),
                  directLookup: voteStats.voters[userAddress],
                  allVotersEntries: Object.entries(voteStats.voters),
                }
              );

              const userVotes = voteStats.voters[userAddress];

              // Also try case-insensitive lookup since Ethereum addresses might be stored in different cases
              let actualUserVotes = userVotes;

              if (!actualUserVotes) {
                console.log(
                  `❌ Direct lookup failed, trying case-insensitive search...`
                );
                const userAddressLower = userAddress.toLowerCase();

                for (const [voterAddr, votes] of Object.entries(
                  voteStats.voters
                )) {
                  console.log(
                    `🔍 Comparing: "${voterAddr.toLowerCase()}" === "${userAddressLower}"`
                  );
                  if (voterAddr.toLowerCase() === userAddressLower) {
                    actualUserVotes = votes as number;
                    console.log(
                      `🔄 Found user with case-insensitive match: ${voterAddr} -> ${userAddress} (votes: ${actualUserVotes})`
                    );
                    break;
                  }
                }
              } else {
                console.log(
                  `✅ Direct address match found: ${userAddress} (votes: ${actualUserVotes})`
                );
              }

              if (actualUserVotes && actualUserVotes > 0) {
                console.log(
                  `✅ Found user holding: ${symbol} (${actualUserVotes} purchases)`
                );

                try {
                  // Get current token market info using existing ZoraService method
                  console.log(
                    `📊 Getting coin info for ${voteStats.tokenAddress}...`
                  );
                  const coinInfo = await this.zoraService.getCoinInfo(
                    voteStats.tokenAddress,
                  );
                  console.log(`✅ Coin info retrieved:`, coinInfo);

                  // Get story and chapter details
                  const { storyData, chapterData } =
                    await this.getStoryChapterInfo(chapterId);
                  console.log(`📚 Story/Chapter info:`, {
                    storyData: storyData?.title,
                    chapterData: chapterData?.title,
                  });

                  // Calculate user's investment and current value
                  // Note: This is a simplified calculation - in reality, we'd need to track exact purchase amounts
                  const estimatedInvestment =
                    BigInt(actualUserVotes) * BigInt("10000000000000000"); // 0.01 ETH per vote (estimate)
                  const estimatedCurrentValue = this.calculateTokenValue(
                    coinInfo,
                    actualUserVotes
                  );

                  const holding: UserTokenHolding = {
                    tokenAddress: voteStats.tokenAddress,
                    symbol: coinInfo.symbol,
                    name: coinInfo.name,
                    balance: actualUserVotes.toString(),
                    balanceFormatted: actualUserVotes.toString(),
                    storyId: storyData?.id || "",
                    storyTitle: storyData?.title || "Unknown Story",
                    chapterId: chapterId,
                    chapterTitle: chapterData?.title || "Unknown Chapter",
                    purchasePrice: this.formatEther(estimatedInvestment),
                    currentValue: this.formatEther(estimatedCurrentValue),
                    profitLoss: this.formatEther(
                      estimatedCurrentValue - estimatedInvestment
                    ),
                    profitLossPercentage: this.calculateProfitLossPercentage(
                      estimatedInvestment,
                      estimatedCurrentValue
                    ),
                  };

                  console.log(`💼 Adding holding to portfolio:`, holding);
                  holdings.push(holding);
                  totalInvested += estimatedInvestment;
                  totalCurrentValue += estimatedCurrentValue;
                } catch (error) {
                  console.error(
                    `❌ Error getting coin info for ${symbol}:`,
                    error
                  );

                  // Still create a holding entry with the data we have
                  console.log(
                    `🔄 Creating holding with available data for ${symbol}`
                  );

                  try {
                    // Get story and chapter details
                    const { storyData, chapterData } =
                      await this.getStoryChapterInfo(chapterId);
                    console.log(`📚 Story/Chapter info (no API):`, {
                      storyData: storyData?.title,
                      chapterData: chapterData?.title,
                    });

                    // Calculate user's investment (we can still do this)
                    const estimatedInvestment =
                      BigInt(actualUserVotes) * BigInt("10000000000000000"); // 0.01 ETH per vote

                    const holding: UserTokenHolding = {
                      tokenAddress: voteStats.tokenAddress,
                      symbol: symbol, // Use the symbol from Firebase
                      name: `${symbol} Token`, // Generate a name
                      balance: actualUserVotes.toString(),
                      balanceFormatted: actualUserVotes.toString(),
                      storyId: storyData?.id || "",
                      storyTitle: storyData?.title || "Unknown Story",
                      chapterId: chapterId,
                      chapterTitle: chapterData?.title || "Unknown Chapter",
                      purchasePrice: this.formatEther(estimatedInvestment),
                      currentValue: "0.000000", // Can't calculate without API data
                      profitLoss: this.formatEther(-estimatedInvestment), // Show as loss since we can't get current value
                      profitLossPercentage: -100, // Show as 100% loss since we can't get current value
                    };

                    console.log(
                      `💼 Adding holding (no API data) to portfolio:`,
                      holding
                    );
                    holdings.push(holding);
                    totalInvested += estimatedInvestment;
                    // Don't add to totalCurrentValue since we can't calculate it
                  } catch (fallbackError) {
                    console.error(
                      `❌ Error creating holding entry for ${symbol}:`,
                      fallbackError
                    );
                  }
                }
              } else {
                console.log(
                  `❌ User ${userAddress} not found in voters for ${symbol} or has 0 votes. UserVotes:`,
                  actualUserVotes
                );
              }
            } catch (symbolError) {
              console.error(
                `❌ Error processing symbol ${symbol} in chapter ${chapterId}:`,
                symbolError
              );
            }
          }
        } catch (chapterError) {
          console.error(
            `❌ Error processing chapter ${plotVoteDoc.id}:`,
            chapterError
          );
        }
      }

      const totalProfitLoss = totalCurrentValue - totalInvested;
      const totalProfitLossPercentage = this.calculateProfitLossPercentage(
        totalInvested,
        totalCurrentValue
      );

      const portfolio: UserTokenPortfolio = {
        totalValue: this.formatEther(totalCurrentValue),
        totalInvested: this.formatEther(totalInvested),
        totalProfitLoss: this.formatEther(totalProfitLoss),
        totalProfitLossPercentage,
        holdings,
        lastUpdated: new Date().toISOString(),
      };

      console.log(`📈 Portfolio summary for ${userAddress}:`, {
        totalHoldings: holdings.length,
        totalValue: portfolio.totalValue,
        totalInvested: portfolio.totalInvested,
        profitLoss: portfolio.totalProfitLoss,
      });

      return portfolio;
    } catch (error) {
      console.error("❌ Error getting user token portfolio:", error);
      throw error;
    }
  }

  /**
   * Get detailed market stats for a specific token using existing ZoraService
   * @param tokenAddress - Token contract address
   * @returns Enhanced market statistics
   */
  public async getTokenMarketStats(tokenAddress: Address) {
    try {
      // Use existing ZoraService method
      const coinInfo = await this.zoraService.getCoinInfo(tokenAddress);

      return {
        address: coinInfo.address,
        name: coinInfo.name,
        symbol: coinInfo.symbol,
        totalSupply: coinInfo.totalSupply || "0",
        uniqueHolders: coinInfo.uniqueHolders,
        marketCap: coinInfo.marketCap || "0",
        creator: coinInfo.creator,
        // Additional fields would need more data sources
        currentPrice: "0", // Would need price calculation
        volume24h: "0", // Would need trading data
        priceChange24h: 0, // Would need historical data
      };
    } catch (error) {
      console.error("❌ Error getting token market stats:", error);
      throw error;
    }
  }

  /**
   * Get user's holdings for a specific chapter
   * @param userAddress - User's wallet address
   * @param chapterId - Chapter ID
   * @returns User's holdings for this chapter
   */
  public async getUserChapterHoldings(
    userAddress: Address,
    chapterId: string
  ): Promise<UserTokenHolding[]> {
    try {
      // Use existing ZoraService method to get plot vote stats
      const plotVoteStats = await this.zoraService.getPlotVoteStats(chapterId);

      const holdings: UserTokenHolding[] = [];

      for (const [symbol, voteStats] of Object.entries(plotVoteStats)) {
        // Safety check: ensure voteStats.voters exists and is an object
        if (!voteStats.voters || typeof voteStats.voters !== "object") {
          console.log(`⚠️ No voters data for ${symbol}`);
          continue;
        }

        const userVotes = voteStats.voters[userAddress];

        if (userVotes && userVotes > 0) {
          const coinInfo = await this.zoraService.getCoinInfo(
            voteStats.tokenAddress,
          );
          const { storyData, chapterData } = await this.getStoryChapterInfo(
            chapterId
          );

          const estimatedInvestment =
            BigInt(userVotes) * BigInt("10000000000000000"); // 0.01 ETH estimate
          const estimatedCurrentValue = this.calculateTokenValue(
            coinInfo,
            userVotes
          );

          holdings.push({
            tokenAddress: voteStats.tokenAddress,
            symbol: coinInfo.symbol,
            name: coinInfo.name,
            balance: userVotes.toString(),
            balanceFormatted: userVotes.toString(),
            storyId: storyData?.id || "",
            storyTitle: storyData?.title || "Unknown Story",
            chapterId: chapterId,
            chapterTitle: chapterData?.title || "Unknown Chapter",
            purchasePrice: this.formatEther(estimatedInvestment),
            currentValue: this.formatEther(estimatedCurrentValue),
            profitLoss: this.formatEther(
              estimatedCurrentValue - estimatedInvestment
            ),
            profitLossPercentage: this.calculateProfitLossPercentage(
              estimatedInvestment,
              estimatedCurrentValue
            ),
          });
        }
      }

      return holdings;
    } catch (error) {
      console.error(
        `❌ Error getting user holdings for chapter ${chapterId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Helper method to get story and chapter information
   */
  private async getStoryChapterInfo(chapterId: string): Promise<{
    storyData: StoryData | null;
    chapterData: ChapterData | null;
  }> {
    try {
      // Get chapter data
      const chapterRef = doc(db, "chapters", chapterId);
      const chapterSnap = await getDoc(chapterRef);

      if (!chapterSnap.exists()) {
        return { storyData: null, chapterData: null };
      }

      const chapterData = {
        id: chapterSnap.id,
        ...chapterSnap.data(),
      } as ChapterData;

      // Get story data
      const storyRef = doc(db, "stories", chapterData.storyId);
      const storySnap = await getDoc(storyRef);

      if (!storySnap.exists()) {
        return { storyData: null, chapterData };
      }

      const storyData = {
        id: storySnap.id,
        ...storySnap.data(),
      } as StoryData;

      return { storyData, chapterData };
    } catch (error) {
      console.error("Error getting story/chapter info:", error);
      return { storyData: null, chapterData: null };
    }
  }

  /**
   * Calculate the current value of tokens based on market cap and user's holdings
   */
  private calculateTokenValue(coinInfo: any, userVotes: number): bigint {
    try {
      // Simple market cap based valuation
      const marketCap = BigInt(coinInfo.marketCap || "0");
      const totalSupply = BigInt(coinInfo.totalSupply || "1");

      if (totalSupply === BigInt(0)) {
        return BigInt(0);
      }

      // Calculate per-token value and multiply by user's holdings
      const perTokenValue = marketCap / totalSupply;
      const userTokens = BigInt(userVotes) * BigInt("1000000000000000000"); // Assume 1 token per vote

      return (perTokenValue * userTokens) / BigInt("1000000000000000000");
    } catch (error) {
      console.error("Error calculating token value:", error);
      return BigInt(0);
    }
  }

  /**
   * Calculate profit/loss percentage
   */
  private calculateProfitLossPercentage(
    invested: bigint,
    current: bigint
  ): number {
    if (invested === BigInt(0)) return 0;

    const difference = current - invested;
    const percentage = (Number(difference) / Number(invested)) * 100;

    return Math.round(percentage * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Format wei values to ETH string
   */
  private formatEther(weiValue: bigint): string {
    return (Number(weiValue) / 1e18).toFixed(6);
  }
}

// Export singleton instance
export const tokenHoldingsService = new TokenHoldingsService();
