import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { ZoraService } from "./zoraService";
import type { Address } from "viem";
import type {
  PlotVoteStats,
  UserTokenHolding,
  UserTokenPortfolio,
  ChapterVotingStatus,
} from "./zora";
import type { ChapterData, StoryData } from "./storyService";
import { createPublicClient, http, erc20Abi } from "viem";
import { base } from "viem/chains";

/**
 * Service for getting user token holdings using existing ZoraService methods
 */
export class TokenHoldingsService {
  private zoraService: ZoraService;
  private publicClient: any;

  constructor() {
    this.zoraService = new ZoraService();
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });
  }

  /**
   * Get ETH to USD exchange rate
   * @returns ETH price in USD
   */
  private async getEthToUsdRate(): Promise<number> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.error("Error fetching ETH-USD rate:", error);
      // Fallback to approximate rate if API fails
      return 3500; // Approximate ETH price
    }
  }

  /**
   * Convert ETH string to USD
   * @param ethAmount - ETH amount as string
   * @param ethToUsdRate - ETH to USD conversion rate
   * @returns USD amount as string
   */
  private ethToUsd(ethAmount: string, ethToUsdRate: number): string {
    const ethValue = parseFloat(ethAmount);
    const usdValue = ethValue * ethToUsdRate;
    return usdValue.toFixed(2);
  }

  /**
   * Get actual ERC20 token balance for a user
   * @param tokenAddress - Token contract address
   * @param userAddress - User's wallet address
   * @returns Token balance as string
   */
  private async getTokenBalance(
    tokenAddress: Address,
    userAddress: Address
  ): Promise<string> {
    try {
      const balance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress],
      });

      // Convert from wei to token units (assuming 18 decimals)
      const tokenBalance = Number(balance) / 1e18;
      return tokenBalance.toString();
    } catch (error) {
      console.error(`Error getting token balance for ${tokenAddress}:`, error);
      return "0";
    }
  }

  /**
   * Calculate actual investment amount based on transaction history
   * This is a simplified approach - in a real app you'd track exact purchase amounts
   * @param tokenAddress - Token contract address
   * @param userAddress - User's wallet address
   * @returns Estimated investment in ETH
   */
  private async calculateActualInvestment(
    tokenAddress: Address,
    userAddress: Address
  ): Promise<bigint> {
    try {
      // For now, we'll use a simplified approach
      // In a real implementation, you'd track actual purchase transactions
      const balance = await this.getTokenBalance(tokenAddress, userAddress);
      const tokenBalance = parseFloat(balance);

      // Estimate based on current token price and balance
      // This is still an estimate but better than the fixed 0.01 ETH
      if (tokenBalance > 0) {
        // Assume average purchase price was around current price
        const coinInfo = await this.zoraService.getCoinInfo(tokenAddress);
        const currentPrice = this.calculateCurrentPrice(coinInfo);
        const estimatedInvestment = tokenBalance * parseFloat(currentPrice);
        return BigInt(Math.floor(estimatedInvestment * 1e18));
      }

      return BigInt(0);
    } catch (error) {
      console.error("Error calculating investment:", error);
      return BigInt(0);
    }
  }

  /**
   * Calculate voting period information for a token
   * @param tokenCreatedAt - ISO timestamp when token was created
   * @returns Voting period status and time remaining
   */
  private calculateVotingPeriod(tokenCreatedAt: string) {
    const createdTime = new Date(tokenCreatedAt);
    const currentTime = new Date();
    const votingPeriodEnd = new Date(
      createdTime.getTime() + 24 * 60 * 60 * 1000
    ); // 24 hours after creation

    const timeRemainingMs = votingPeriodEnd.getTime() - currentTime.getTime();
    const isVotingActive = timeRemainingMs > 0;

    const totalSeconds = Math.max(0, Math.floor(timeRemainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      tokenCreatedAt,
      votingPeriodEnd: votingPeriodEnd.toISOString(),
      votingTimeRemaining: {
        hours,
        minutes,
        seconds,
        totalSeconds,
        isActive: isVotingActive,
      },
      canSell: !isVotingActive, // Can only sell after voting period ends
    };
  }

  /**
   * Get voting status for a specific chapter
   * @param chapterId - Chapter ID
   * @returns Chapter voting status
   */
  public async getChapterVotingStatus(
    chapterId: string
  ): Promise<ChapterVotingStatus | null> {
    try {
      // Get plot vote stats for the chapter
      const plotVoteStats = await this.zoraService.getPlotVoteStats(chapterId);

      // Get the first token's creation time (all tokens in a chapter are created at the same time)
      const firstTokenSymbol = Object.keys(plotVoteStats)[0];
      if (!firstTokenSymbol) {
        return null;
      }

      const firstToken = plotVoteStats[firstTokenSymbol];
      const coinInfo = await this.zoraService.getCoinInfo(
        firstToken.tokenAddress
      );

      if (!coinInfo.createdAt) {
        return null;
      }

      const votingPeriod = this.calculateVotingPeriod(coinInfo.createdAt);

      return {
        chapterId,
        tokenCreatedAt: coinInfo.createdAt,
        votingPeriodEnd: votingPeriod.votingPeriodEnd,
        isVotingActive: votingPeriod.votingTimeRemaining.isActive,
        timeRemaining: {
          hours: votingPeriod.votingTimeRemaining.hours,
          minutes: votingPeriod.votingTimeRemaining.minutes,
          seconds: votingPeriod.votingTimeRemaining.seconds,
          totalSeconds: votingPeriod.votingTimeRemaining.totalSeconds,
        },
        restrictions: {
          canCreateNewChapter: !votingPeriod.votingTimeRemaining.isActive,
          canSellTokens: !votingPeriod.votingTimeRemaining.isActive,
        },
      };
    } catch (error) {
      console.error(
        `Error getting voting status for chapter ${chapterId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if creator can create a new chapter for a story
   * @param storyId - Story ID
   * @returns True if creator can create new chapter, false if restricted
   */
  public async canCreatorCreateNewChapter(storyId: string): Promise<{
    canCreate: boolean;
    reason?: string;
    activeChapter?: {
      chapterId: string;
      timeRemaining: {
        hours: number;
        minutes: number;
        seconds: number;
      };
    };
  }> {
    try {
      // Get all chapters for this story
      const chaptersCollection = collection(db, "chapters");
      const storyChaptersQuery = query(
        chaptersCollection,
        where("storyId", "==", storyId)
      );
      const chaptersSnapshot = await getDocs(storyChaptersQuery);

      // Check each chapter for active voting periods
      for (const chapterDoc of chaptersSnapshot.docs) {
        const chapterId = chapterDoc.id;
        const votingStatus = await this.getChapterVotingStatus(chapterId);

        if (votingStatus && votingStatus.isVotingActive) {
          return {
            canCreate: false,
            reason: `Cannot create new chapter while voting is active for another chapter`,
            activeChapter: {
              chapterId,
              timeRemaining: votingStatus.timeRemaining,
            },
          };
        }
      }

      return { canCreate: true };
    } catch (error) {
      console.error("Error checking if creator can create new chapter:", error);
      return {
        canCreate: false,
        reason: "Error checking chapter creation permissions",
      };
    }
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

      // Get ETH-USD rate
      const ethToUsdRate = await this.getEthToUsdRate();
      console.log(`💱 ETH-USD rate: $${ethToUsdRate}`);

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
                    voteStats.tokenAddress
                  );
                  console.log(`✅ Coin info retrieved:`, coinInfo);

                  // Get real token balance from blockchain (not vote count)
                  const actualBalance = await this.getTokenBalance(
                    voteStats.tokenAddress,
                    userAddress
                  );
                  const balanceNumber = parseFloat(actualBalance);

                  // Only process if user actually has tokens
                  if (balanceNumber > 0) {
                    console.log(
                      `✅ Real token balance: ${actualBalance} tokens`
                    );

                    // Calculate voting period information
                    const votingPeriod = coinInfo.createdAt
                      ? this.calculateVotingPeriod(coinInfo.createdAt)
                      : null;

                    // Get story and chapter details
                    const { storyData, chapterData } =
                      await this.getStoryChapterInfo(chapterId);

                    // Calculate actual investment (still estimated, but better)
                    const actualInvestment =
                      await this.calculateActualInvestment(
                        voteStats.tokenAddress,
                        userAddress
                      );

                    // Calculate current value based on real balance and current price
                    const currentPrice = this.calculateCurrentPrice(coinInfo);
                    const currentValueEth =
                      balanceNumber * parseFloat(currentPrice);
                    const currentValue = BigInt(
                      Math.floor(currentValueEth * 1e18)
                    );

                    const holding: UserTokenHolding = {
                      tokenAddress: voteStats.tokenAddress,
                      symbol: coinInfo.symbol,
                      name: coinInfo.name,
                      balance: actualBalance,
                      balanceFormatted: balanceNumber.toFixed(4),
                      storyId: storyData?.id || "",
                      storyTitle: storyData?.title || "Unknown Story",
                      chapterId: chapterId,
                      chapterTitle: chapterData?.title || "Unknown Chapter",
                      purchasePrice: this.formatEther(actualInvestment),
                      currentValue: this.formatEther(currentValue),
                      profitLoss: this.formatEther(
                        currentValue - actualInvestment
                      ),
                      profitLossPercentage: this.calculateProfitLossPercentage(
                        actualInvestment,
                        currentValue
                      ),
                      // Enhanced market data in USD
                      marketCap: this.ethToUsd(
                        coinInfo.marketCap || "0",
                        ethToUsdRate
                      ),
                      totalVolume: this.ethToUsd(
                        coinInfo.totalVolume || "0",
                        ethToUsdRate
                      ),
                      volume24h: this.ethToUsd(
                        coinInfo.volume24h || "0",
                        ethToUsdRate
                      ),
                      uniqueHolders: coinInfo.uniqueHolders || 0,
                      currentPrice: currentPrice,
                      totalSupply: coinInfo.totalSupply || "0",
                      creatorProfile: {
                        handle: coinInfo.creatorProfile?.handle,
                        avatar: coinInfo.creatorProfile?.avatar,
                      },
                      // 24-hour voting period information
                      tokenCreatedAt: coinInfo.createdAt,
                      votingPeriodEnd: votingPeriod?.votingPeriodEnd,
                      votingTimeRemaining: votingPeriod?.votingTimeRemaining,
                      canSell: votingPeriod?.canSell ?? true,
                    };

                    console.log(
                      `💼 Adding real holding to portfolio:`,
                      holding
                    );
                    holdings.push(holding);
                    totalInvested += actualInvestment;
                    totalCurrentValue += currentValue;
                  } else {
                    console.log(
                      `⚠️ User has vote record but no actual tokens for ${symbol}`
                    );
                  }
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
        totalValue: this.ethToUsd(
          this.formatEther(totalCurrentValue),
          ethToUsdRate
        ),
        totalInvested: this.ethToUsd(
          this.formatEther(totalInvested),
          ethToUsdRate
        ),
        totalProfitLoss: this.ethToUsd(
          this.formatEther(totalProfitLoss),
          ethToUsdRate
        ),
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
            voteStats.tokenAddress
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

  /**
   * Calculate current price per token from market cap and total supply
   * @param coinInfo - Coin information from Zora API
   * @returns Current price per token in ETH as string
   */
  private calculateCurrentPrice(coinInfo: any): string {
    try {
      if (!coinInfo.marketCap || !coinInfo.totalSupply) {
        return "0";
      }

      // Convert market cap from string to number (assumes it's in ETH)
      const marketCap = parseFloat(coinInfo.marketCap);
      // Convert total supply from string to number (assumes it's in token units)
      const totalSupply = parseFloat(coinInfo.totalSupply);

      if (totalSupply === 0) {
        return "0";
      }

      // Calculate price per token = market cap / total supply
      const pricePerToken = marketCap / totalSupply;

      // Format to 8 decimal places for precision
      return pricePerToken.toFixed(8);
    } catch (error) {
      console.error("Error calculating current price:", error);
      return "0";
    }
  }
}

// Export singleton instance
export const tokenHoldingsService = new TokenHoldingsService();
