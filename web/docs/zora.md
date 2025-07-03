# ZoraService Documentation

## Overview

The `ZoraService` class manages plot token creation and voting for PlotMint chapters. It creates ERC-20 tokens on Base mainnet using Zora's SDK and tracks votes in Firebase.

## Setup

```typescript
import { ZoraService } from './utils/zoraService';

const zoraService = new ZoraService();
```

**Required Environment Variables:**
```env
VITE_ZORA_API_KEY=your_zora_api_key
VITE_PLATFORM_REFERRER=0x1234...your_wallet_address
```

**Wallet Requirements:**
- MetaMask or WalletConnect compatible wallet
- Connected to Base mainnet (chainId: 8453)
- Sufficient ETH balance for transactions

## Methods

### registerPlotOptions()
Creates plot tokens for a chapter (exactly 2 options required).

```typescript
await zoraService.registerPlotOptions(
  chapterId: string,
  options: PlotOption[],
  walletClient: WalletClient,
  publicClient: PublicClient
);
```

### tradeCoin()
Executes token trades (buy/sell plot tokens).

```typescript
const receipt = await zoraService.tradeCoin(
  tradeParams: TradeParameters,
  walletClient: WalletClient,
  account: Account,
  publicClient: PublicClient
);
```

### recordPlotVote()
Records a vote after successful token purchase.

```typescript
await zoraService.recordPlotVote(
  chapterId: string,
  plotSymbol: string,
  voter: Address,
  ethAmount: string
);
```

### getPlotVoteStats()
Gets current voting statistics.

```typescript
const stats = await zoraService.getPlotVoteStats(chapterId: string);
```

### determineWinnerByHolders()
Determines winner based on unique token holders.

```typescript
const winner = await zoraService.determineWinnerByHolders(chapterId: string);
```

## Helper Methods

### createBuyTradeParams()
Creates parameters for buying tokens with ETH.

```typescript
const tradeParams = zoraService.createBuyTradeParams(
  tokenAddress: Address,
  ethAmount: bigint,
  senderAddress: Address,
  slippage?: number // default 0.05 (5%)
);
```

### createSellTradeParams()
Creates parameters for selling tokens for ETH.

```typescript
const tradeParams = zoraService.createSellTradeParams(
  tokenAddress: Address,
  tokenAmount: bigint,
  senderAddress: Address,
  slippage?: number
);
```

## Types

```typescript
interface PlotOption {
  name: string;
  symbol: string;
  metadataURI: ValidMetadataURI;
}

interface PlotVoteStats {
  [symbol: string]: {
    tokenAddress: Address;
    totalVotes: number;
    volumeETH: string;
    voters: { [walletAddress: string]: number };
  };
}

interface PlotWinner {
  symbol: string;
  tokenAddress: Address;
  totalVotes: number;
  volumeETH: string;
}
```

## Example Usage

```typescript
// 1. Create plot options (chapter creator)
const plotOptions = [
  { name: "Save Princess", symbol: "SAVE", metadataURI: "ipfs://..." },
  { name: "Fight Dragon", symbol: "FIGHT", metadataURI: "ipfs://..." }
];

await zoraService.registerPlotOptions("chapter_1", plotOptions, walletClient, publicClient);

// 2. Vote by buying tokens (reader)
const tradeParams = zoraService.createBuyTradeParams(
  tokenAddress,
  parseEther("0.01"),
  userAddress
);

const receipt = await zoraService.tradeCoin(tradeParams, walletClient, account, publicClient);

// 3. Record the vote
await zoraService.recordPlotVote("chapter_1", "SAVE", userAddress, "0.01");

// 4. Check results
const winner = await zoraService.determineWinnerByHolders("chapter_1");
```

## Network

- **Chain:** Base mainnet (chainId: 8453)
- **Currency:** ETH for trading
- **Storage:** Firebase for vote tracking