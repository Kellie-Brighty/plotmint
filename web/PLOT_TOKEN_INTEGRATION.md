# Plot Token Integration - CoinTrader Contract

## Overview

This integration uses your deployed `CoinTrader` contract to enable readers to purchase plot option tokens directly, implementing a clean and efficient voting system.

## Architecture

```
Frontend → CoinTrader Contract → Zora CoinV4 Token → Vote Recorded
```

### Components:

1. **CoinTrader Contract** (`0x74d182cAe4FeF35b308deEBC2EEA5bc41F8605B0`)

   - Deployed on Base Sepolia
   - Handles buy/sell operations for Zora CoinV4 tokens
   - Emits `TradeExecuted` events for tracking

2. **Plot Token Creation** (via ZoraService)

   - Creates plot option tokens using `@zoralabs/coins-sdk`
   - Stores token metadata in Firebase
   - Each chapter gets 2 plot option tokens

3. **Direct Contract Integration** (via useCoinTrader hook)

   - Direct calls to CoinTrader contract
   - Proper error handling and transaction states
   - Real-time feedback to users

4. **Vote Recording** (via simplified ZoraService)
   - Records votes in Firebase after successful token purchases
   - Tracks ETH volume and voter participation
   - Determines winning plot options

## Key Benefits

✅ **Simple & Clean** - Direct contract calls, no complex wrappers
✅ **Reliable** - Uses your deployed contracts properly
✅ **User-Friendly** - Clear transaction states and error messages
✅ **Gas Efficient** - Optimized contract calls with proper slippage
✅ **Extensible** - Easy to add selling functionality later

## Usage Flow

1. **Reader visits chapter page**
2. **Plot options load** from `chapter.plotTokens`
3. **Reader selects option** and enters ETH amount
4. **Transaction submitted** via CoinTrader contract
5. **Vote recorded** in Firebase after confirmation
6. **Results displayed** with real-time updates

## Environment Variables Required

```bash
VITE_CHAINID=84532
VITE_PLATFORM_REFERRER=your_wallet_address
VITE_ZORA_API_KEY=your_zora_api_key
# + Firebase config variables
```

## Files Modified

- `utils/coinTrader.ts` - Contract ABI and configuration
- `utils/useCoinTrader.ts` - Wagmi hook for contract interaction
- `utils/zoraService.ts` - Simplified to handle only token creation and vote recording
- `components/PlotVoting.tsx` - Updated to use direct contract calls
- `utils/zora.ts` - Cleaned up unused types

## Transaction Flow

```javascript
// 1. User clicks "Purchase PLOT1 Tokens"
await purchasePlotTokens({
  tokenAddress: "0x123...", // From chapter.plotTokens
  ethAmount: "0.01",
  recipient: userAddress,
});

// 2. CoinTrader.tradeCoin() called with:
// - token: plot token address
// - isBuy: true
// - recipient: user address
// - amountIn: 0.01 ETH
// - minAmountOut: calculated slippage
// - sqrtPriceLimitX96: 0 (no price limit)
// - tradeReferrer: platform address

// 3. Vote recorded in Firebase
await zoraService.recordPlotVote(chapterId, plotSymbol, userAddress, ethAmount);
```

This implementation is production-ready and follows best practices for smart contract integration.
