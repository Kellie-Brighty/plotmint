import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";
import * as dotenv from "dotenv";

dotenv.config();

const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY;
if (!TEST_PRIVATE_KEY) {
  throw new Error("Please set your TEST_PRIVATE_KEY in a .env file");
}

const MAIN_PRIVATE_KEY = process.env.MAIN_PRIVATE_KEY;
if (!MAIN_PRIVATE_KEY) {
  throw new Error("Please set your MAIN_PRIVATE_KEY in a .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    "base": {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [MAIN_PRIVATE_KEY],
      chainId: 8453,
      gasPrice: "auto"
    },
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [TEST_PRIVATE_KEY],
      chainId: 84532,
      gasPrice: "auto"
    }
  },
  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASESCAN_API_KEY || "" 
    },
  }
};

export default config;
