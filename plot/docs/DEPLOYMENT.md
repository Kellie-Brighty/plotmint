# Deployment Guide

## Overview

This project uses Hardhat Ignition for deterministic and reliable deployments. All contracts are deployed through a single deployment module.

## Contracts Deployed

1. CoinTrader
   - Independent contract for handling coin trading operations
   - No constructor arguments required

2. ChapterNFTFactory
   - Factory contract for creating new chapter NFTs
   - No constructor arguments required

3. Sample ChapterNFT (optional)
   - A test instance of ChapterNFT
   - Constructor arguments:
     - name: "Test Chapter"
     - symbol: "TCHAP"
     - owner: Deployer's address

## Deployment Steps

1. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. Deploy to Base Sepolia:
   ```bash
   npx hardhat ignition deploy ./deploy/000_deploy_all.ts --network base-sepolia
   ```

3. For local testing:
   ```bash
   npx hardhat ignition deploy ./deploy/000_deploy_all.ts --network hardhat
   ```

## After Deployment

The deployment will create these files:
- `ignition/deployments/chain-{chainId}/deployed.json` - Contains all contract addresses
- `ignition/deployments/chain-{chainId}/records.json` - Detailed deployment records

## Contract Addresses

After deployment, you can find the contract addresses in:
```bash
cat ignition/deployments/chain-84532/deployed.json # for Base Sepolia
```

## Verification

To verify contracts on Basescan:
```bash
npx hardhat verify --network base-sepolia <contract-address>
```

## Important Notes

1. Deployment order is deterministic:
   - CoinTrader deploys first
   - ChapterNFTFactory deploys second
   - Sample ChapterNFT deploys last (if included)

2. Factory Usage:
   After deployment, use ChapterNFTFactory to create new chapter NFTs:
   ```typescript
   const factory = await ethers.getContractAt("ChapterNFTFactory", FACTORY_ADDRESS);
   await factory.createChapterNFT(chapterId, name, symbol);
   ```

3. Gas Considerations:
   - Base Sepolia might require higher gas limits
   - Ensure your account has sufficient BASE for deployment
