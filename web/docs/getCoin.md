# getCoinInfo Method Documentation

## Overview
The `getCoinInfo` method retrieves comprehensive information about a Zora plot token from the Zora API.

## Parameters
- `tokenAddress: Address` - The contract address of the plot token

## Return Object Structure

### Basic Token Information
- `address: string` - Token contract address
- `name: string` - Token name (e.g., "The homeless man dies")
- `symbol: string` - Token symbol (e.g., "PLOT15831")
- `description: string` - Token description
- `chainId: number` - Blockchain chain ID (8453 for Base)
- `createdAt: string` - ISO timestamp of token creation

### Supply & Holder Data
- `uniqueHolders: number` - Number of unique token holders
- `totalSupply: string` - Total token supply as string

### Volume & Market Data
- `totalVolume: string` - Total trading volume in ETH
- `volume24h: string` - 24-hour trading volume in ETH
- `marketCap: string` - Current market capitalization
- `marketCapDelta24h: string` - 24-hour market cap change percentage

### Creator Information
- `creator: string` - Token creator's wallet address
- `creatorEarnings: Array` - Array of creator earnings objects
  - `amount: Object`
    - `currencyAddress: string` - Currency contract address
    - `amountRaw: string` - Raw amount as string
    - `amountDecimal: number` - Decimal amount
  - `amountUsd: string` - USD value of earnings
- `creatorProfile: Object` - Creator profile information
  - `id: string` - Profile ID
  - `handle: string` - Creator's handle/username
  - `avatar: Object` - Avatar image data
    - `previewImage: Object`
      - `blurhash: string` - Blurhash for image loading
      - `medium: string` - Medium-sized image URL
      - `small: string` - Small image URL

### Technical Details
- `poolCurrencyToken: Object` - Pool currency information
  - `address: string` - Currency token address
  - `name: string` - Currency name (e.g., "ZORA")
  - `decimals: number` - Token decimals
- `platformReferrerAddress: string` - Platform referrer address
- `payoutRecipientAddress: string` - Payout recipient address
- `uniswapV4PoolKey: Object` - Uniswap V4 pool configuration
  - `token0Address: string` - First token address
  - `token1Address: string` - Second token address
  - `fee: number` - Pool fee
  - `tickSpacing: number` - Tick spacing
  - `hookAddress: string` - Hook contract address

### Media Content
- `mediaContent: Object` - Token media information
  - `mimeType: string` - Media MIME type
  - `originalUri: string` - Original media URI
  - `previewImage: Object` - Preview image data
    - `small: string` - Small preview URL
    - `medium: string` - Medium preview URL
    - `blurhash: string` - Blurhash for image loading

## Usage Example
```typescript
const coinInfo = await zoraService.getCoinInfo("0xd6CC8B92783056346e850A406Ac4475a78867be5");
console.log(`Token: ${coinInfo.name} (${coinInfo.symbol})`);
console.log(`Holders: ${coinInfo.uniqueHolders}`);
console.log(`Market Cap: ${coinInfo.marketCap}`);
console.log(`Creator: ${coinInfo.creatorProfile.handle}`);
```