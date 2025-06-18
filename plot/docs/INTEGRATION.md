# PlotMint Integration Guide

This guide explains how to integrate the PlotMint NFT contracts with your frontend application. PlotMint uses a factory pattern to create individual NFT collections for each chapter, allowing creators to mint unique editions and readers to collect them.

## Contract Architecture

### ChapterNFTFactory

The factory contract is the main entry point for creating new chapter NFT collections. Each time a writer creates a new chapter, a new ChapterNFT contract is deployed.

### ChapterNFT

Each chapter has its own NFT collection contract that:
- Allows the creator to mint the first edition
- Allows readers to mint subsequent editions (2-100)
- Includes built-in marketplace functionality
- Manages royalties (10% to creator on secondary sales)

## Integration Steps

### 1. Contract Setup with Wagmi

```typescript
import {
  useContractRead,
  useContractWrite,
  useWaitForTransaction,
  useContractEvent
} from 'wagmi';
import { parseEther } from 'viem';
import { 
  chapterNFTFactoryABI,
  chapterNFTABI 
} from './generated';

// Constants
const FACTORY_ADDRESS = '0x...';

// Hook to interact with factory contract
export function useChapterNFTFactory() {
  return {
    // Read factory state
    useFactoryRead: (functionName: string, args?: any[]) => 
      useContractRead({
        address: FACTORY_ADDRESS,
        abi: chapterNFTFactoryABI,
        functionName,
        args
      }),

    // Write to factory
    useFactoryWrite: (functionName: string) =>
      useContractWrite({
        address: FACTORY_ADDRESS,
        abi: chapterNFTFactoryABI,
        functionName
      }),

    // Listen to factory events
    useFactoryEvent: (eventName: string, listener: (args: any) => void) =>
      useContractEvent({
        address: FACTORY_ADDRESS,
        abi: chapterNFTFactoryABI,
        eventName,
        listener
      })
  };
}
```

### 2. Creating a New Chapter NFT Collection

```typescript
export function useCreateChapterNFT() {
  const { useFactoryWrite } = useChapterNFTFactory();
  const { data, write, isLoading, isError } = useFactoryWrite('createChapterNFT');
  const { 
    isLoading: isWaiting, 
    isSuccess 
  } = useWaitForTransaction({ hash: data?.hash });

  const createChapter = async (chapterId: bigint, name: string, symbol: string) => {
    if (write) {
      write({ args: [chapterId, name, symbol] });
    }
  };

  return {
    createChapter,
    isLoading: isLoading || isWaiting,
    isSuccess,
    isError
  };
}

// Usage in component
function CreateChapterComponent() {
  const { createChapter, isLoading, isSuccess } = useCreateChapterNFT();

  const handleCreate = async () => {
    await createChapter(chapterId, "My Chapter", "CHAP");
  };

  return (
    <button 
      onClick={handleCreate}
      disabled={isLoading}
    >
      {isLoading ? 'Creating...' : 'Create Chapter NFT'}
    </button>
  );
}
```

### 3. Working with Chapter NFTs

```typescript
// Hook to interact with a specific Chapter NFT
export function useChapterNFT(nftAddress?: `0x${string}`) {
  // Read from NFT contract
  const useNFTRead = (functionName: string, args?: any[]) =>
    useContractRead({
      address: nftAddress,
      abi: chapterNFTABI,
      functionName,
      args,
      enabled: !!nftAddress
    });

  // Write to NFT contract
  const useNFTWrite = (functionName: string) =>
    useContractWrite({
      address: nftAddress,
      abi: chapterNFTABI,
      functionName
    });

  return { useNFTRead, useNFTWrite };
}

// Hook to get Chapter NFT address
export function useGetChapterNFT(chapterId: bigint) {
  const { useFactoryRead } = useChapterNFTFactory();
  const { data: nftAddress } = useFactoryRead('getChapterNFT', [chapterId]);
  
  return nftAddress;
}

// Hook for minting first edition (creator only)
export function useMintFirstEdition(nftAddress?: `0x${string}`) {
  const { useNFTWrite } = useChapterNFT(nftAddress);
  const { 
    data, 
    write: mintFirst,
    isLoading: isMinting,
    isError 
  } = useNFTWrite('mintFirstEdition');

  const { 
    isLoading: isWaiting, 
    isSuccess 
  } = useWaitForTransaction({ hash: data?.hash });

  return {
    mintFirst,
    isLoading: isMinting || isWaiting,
    isSuccess,
    isError
  };
}

// Hook for public minting
export function useMintEdition(nftAddress?: `0x${string}`) {
  const { useNFTRead, useNFTWrite } = useChapterNFT(nftAddress);
  const { data: mintPrice } = useNFTRead('MINT_PRICE');
  
  const { 
    data, 
    write: mint,
    isLoading: isMinting,
    isError 
  } = useNFTWrite('mintEdition');

  const { 
    isLoading: isWaiting, 
    isSuccess 
  } = useWaitForTransaction({ hash: data?.hash });

  const mintEdition = async () => {
    if (mint && mintPrice) {
      mint({ value: mintPrice });
    }
  };

  return {
    mintEdition,
    isLoading: isMinting || isWaiting,
    isSuccess,
    isError
  };
}

// Hook to get total editions minted
export function useEditionCount(nftAddress?: `0x${string}`) {
  const { useNFTRead } = useChapterNFT(nftAddress);
  const { data: currentEdition } = useNFTRead('currentEdition');
  
  return currentEdition;
}

// Usage in component
function MintingComponent({ nftAddress }: { nftAddress: `0x${string}` }) {
  const { mintEdition, isLoading, isSuccess } = useMintEdition(nftAddress);
  const currentEdition = useEditionCount(nftAddress);

  return (
    <div>
      <p>Current Edition: {currentEdition?.toString()}</p>
      <button 
        onClick={() => mintEdition()}
        disabled={isLoading}
      >
        {isLoading ? 'Minting...' : 'Mint Edition'}
      </button>
      {isSuccess && <p>Successfully minted!</p>}
    </div>
  );
}
```

### 4. Marketplace Functions

```typescript
// Hook for listing operations
export function useMarketplace(nftAddress?: `0x${string}`) {
  const { useNFTRead, useNFTWrite } = useChapterNFT(nftAddress);

  // List token
  const useListToken = () => {
    const { 
      data, 
      write: list,
      isLoading,
      isError 
    } = useNFTWrite('listForSale');

    const { 
      isLoading: isWaiting, 
      isSuccess 
    } = useWaitForTransaction({ hash: data?.hash });

    const listForSale = (tokenId: bigint, price: bigint) => {
      if (list) {
        list({ args: [tokenId, price] });
      }
    };

    return {
      listForSale,
      isLoading: isLoading || isWaiting,
      isSuccess,
      isError
    };
  };

  // Cancel listing
  const useCancelListing = () => {
    const { 
      data, 
      write: cancel,
      isLoading,
      isError 
    } = useNFTWrite('cancelListing');

    const { 
      isLoading: isWaiting, 
      isSuccess 
    } = useWaitForTransaction({ hash: data?.hash });

    const cancelListing = (tokenId: bigint) => {
      if (cancel) {
        cancel({ args: [tokenId] });
      }
    };

    return {
      cancelListing,
      isLoading: isLoading || isWaiting,
      isSuccess,
      isError
    };
  };

  // Buy token
  const useBuyToken = () => {
    const { 
      data, 
      write: buy,
      isLoading,
      isError 
    } = useNFTWrite('buyListed');

    const { 
      isLoading: isWaiting, 
      isSuccess 
    } = useWaitForTransaction({ hash: data?.hash });

    const buyListed = async (tokenId: bigint) => {
      // Get listing details first
      const listing = await useNFTRead('listings', [tokenId]);
      if (!listing?.active) throw new Error('Not listed');

      if (buy) {
        buy({ 
          args: [tokenId],
          value: listing.price
        });
      }
    };

    return {
      buyListed,
      isLoading: isLoading || isWaiting,
      isSuccess,
      isError
    };
  };

  // Get listing information
  const useListingInfo = (tokenId: bigint) => {
    const { data: listing } = useNFTRead('listings', [tokenId]);
    return listing;
  };

  return {
    useListToken,
    useCancelListing,
    useBuyToken,
    useListingInfo
  };
}

// Usage in component
function MarketplaceComponent({ 
  nftAddress,
  tokenId 
}: { 
  nftAddress: `0x${string}`,
  tokenId: bigint
}) {
  const { useListToken, useListingInfo } = useMarketplace(nftAddress);
  const { listForSale, isLoading, isSuccess } = useListToken();
  const listing = useListingInfo(tokenId);

  const handleList = () => {
    const price = parseEther('0.1'); // 0.1 ETH
    listForSale(tokenId, price);
  };

  return (
    <div>
      {listing?.active ? (
        <p>Listed for {listing.price.toString()} wei</p>
      ) : (
        <button 
          onClick={handleList}
          disabled={isLoading}
        >
          {isLoading ? 'Listing...' : 'List for Sale'}
        </button>
      )}
      {isSuccess && <p>Successfully listed!</p>}
    </div>
  );
}
```

### 5. Event Handling

```typescript
// Hook for contract events
export function useContractEvents(nftAddress?: `0x${string}`) {
  // Factory events
  const { useFactoryEvent } = useChapterNFTFactory();
  
  const useCreationEvent = (callback: (
    nftAddress: `0x${string}`, 
    chapterId: bigint, 
    creator: `0x${string}`
  ) => void) => {
    useFactoryEvent('ChapterNFTCreated', (args) => {
      callback(args.nftAddress, args.chapterId, args.creator);
    });
  };

  // NFT contract events
  const useEditionMinted = (callback: (
    tokenId: bigint, 
    minter: `0x${string}`
  ) => void) => {
    useContractEvent({
      address: nftAddress,
      abi: chapterNFTABI,
      eventName: 'EditionMinted',
      listener: args => callback(args.tokenId, args.minter)
    });
  };

  const useListingEvents = (callbacks: {
    onCreated?: (tokenId: bigint, price: bigint) => void;
    onCancelled?: (tokenId: bigint) => void;
    onSold?: (tokenId: bigint, seller: `0x${string}`, buyer: `0x${string}`, price: bigint) => void;
  }) => {
    // Listing created events
    useContractEvent({
      address: nftAddress,
      abi: chapterNFTABI,
      eventName: 'ListingCreated',
      listener: args => callbacks.onCreated?.(args.tokenId, args.price)
    });

    // Listing cancelled events
    useContractEvent({
      address: nftAddress,
      abi: chapterNFTABI,
      eventName: 'ListingCancelled',
      listener: args => callbacks.onCancelled?.(args.tokenId)
    });

    // Listing sold events
    useContractEvent({
      address: nftAddress,
      abi: chapterNFTABI,
      eventName: 'ListingSold',
      listener: args => callbacks.onSold?.(
        args.tokenId, 
        args.seller, 
        args.buyer, 
        args.price
      )
    });
  };

  return {
    useCreationEvent,
    useEditionMinted,
    useListingEvents
  };
}

// Usage in component
function EventsComponent({ nftAddress }: { nftAddress: `0x${string}` }) {
  const { useEditionMinted, useListingEvents } = useContractEvents(nftAddress);

  // Listen for minting events
  useEditionMinted((tokenId, minter) => {
    console.log(`New edition ${tokenId} minted by ${minter}`);
    // Update UI or trigger notifications
  });

  // Listen for marketplace events
  useListingEvents({
    onCreated: (tokenId, price) => {
      console.log(`Token ${tokenId} listed for ${price} wei`);
    },
    onCancelled: (tokenId) => {
      console.log(`Listing cancelled for token ${tokenId}`);
    },
    onSold: (tokenId, seller, buyer, price) => {
      console.log(`Token ${tokenId} sold from ${seller} to ${buyer} for ${price} wei`);
    }
  });

  return null; // Or render event history/notifications
}
```

## Constants & Configurations

```typescript
import { parseEther } from 'viem';

const MINT_PRICE = parseEther('0.001'); // 0.001 ETH
const MAX_EDITIONS = 100n;
const ROYALTY_PERCENTAGE = 10; // 10% (1000 basis points)
```

## Error Messages

Handle these specific error messages in your frontend:

```typescript
const ERRORS = {
  INSUFFICIENT_PAYMENT: "Insufficient payment",
  NOT_TOKEN_OWNER: "Not token owner",
  PRICE_ZERO: "Price must be greater than 0",
  ALREADY_LISTED: "Already listed",
  NOT_LISTED: "Not listed",
  NOT_SELLER: "Not seller",
  FIRST_EDITION_MINTED: "First edition already minted",
  MAX_EDITIONS_REACHED: "Max editions reached",
  ROYALTY_TRANSFER_FAILED: "Royalty transfer failed",
  SELLER_TRANSFER_FAILED: "Seller transfer failed",
  REFUND_TRANSFER_FAILED: "Refund transfer failed"
};
```

## Important Notes

1. Always check that users are connected to the correct network
2. Handle transaction errors and show appropriate UI feedback
3. Validate ownership before listing tokens
4. Show pending transaction states in the UI
5. Cache contract data when possible to reduce RPC calls
6. Consider using a library like wagmi for better wallet integration

## Security Considerations

1. All contracts use OpenZeppelin's secure implementations
2. Ownership is properly managed through the `Ownable` pattern
3. Reentrancy protection is in place for marketplace functions
4. Royalties are enforced through ERC2981
5. Token IDs are sequential and tracked internally

## Testing

The contract suite includes comprehensive tests for all functionality. Run them using:

```bash
npx hardhat test
```

For full coverage report:

```bash
npx hardhat coverage
```

## Handling Firestore IDs

When creating a new chapter NFT collection, you'll need to handle the conversion between Firestore's string IDs and the contract's uint256 chapter IDs.

```typescript
import { ethers } from 'ethers';

// Convert Firestore ID to uint256
function firestoreIdToUint256(firestoreId: string): bigint {
  // Use keccak256 hash of the Firestore ID and take the first 16 bytes (128 bits)
  // This ensures a deterministic but well-distributed uint256 value
  const hash = ethers.keccak256(ethers.toUtf8Bytes(firestoreId));
  return BigInt(hash.slice(0, 34)); // Take first 16 bytes (32 characters + '0x')
}

// Example usage when creating a new chapter NFT
async function createChapterNFTFromFirestore(
  firestoreId: string, 
  name: string, 
  symbol: string
) {
  const chapterId = firestoreIdToUint256(firestoreId);
  
  // Store the mapping in your frontend database for future reference
  await storeChapterMapping({
    firestoreId,
    chainId: chapterId.toString(),
    contractAddress: null // Will be filled after creation
  });

  // Create the NFT contract
  const tx = await factory.connect(signer).createChapterNFT(
    chapterId,
    name,
    symbol
  );
  const receipt = await tx.wait();
  
  // Get the new NFT contract address from the event
  const event = receipt.logs.find(
    log => log.fragment?.name === 'ChapterNFTCreated'
  );
  const contractAddress = event?.args[0];

  // Update the mapping with the contract address
  await updateChapterMapping(firestoreId, {
    contractAddress
  });

  return {
    chapterId,
    contractAddress
  };
}

// Example of retrieving NFT contract using Firestore ID
async function getChapterNFTByFirestoreId(firestoreId: string) {
  const chapterId = firestoreIdToUint256(firestoreId);
  const nftAddress = await factory.getChapterNFT(chapterId);
  
  if (nftAddress === ethers.ZeroAddress) {
    throw new Error('Chapter NFT not found');
  }
  
  return new ethers.Contract(nftAddress, ChapterNFT.abi, provider);
}
```

### Important Notes about ID Conversion

1. The conversion from Firestore ID to uint256 is one-way and deterministic
2. Store the mapping between Firestore ID and chain ID in your database
3. The conversion uses keccak256 to ensure even distribution of IDs
4. Consider using a smaller subset of the hash to save gas
5. Always test the ID conversion with your actual Firestore IDs to ensure no collisions

### Database Schema Example

```typescript
interface ChapterMapping {
  firestoreId: string;     // Firestore document ID
  chainId: string;         // uint256 ID used on chain (as string)
  contractAddress: string; // NFT contract address
  createdAt: timestamp;
  updatedAt: timestamp;
}
```
