import type { Address } from "viem";

// CoinTrader Contract ABI
export const COIN_TRADER_ABI = [
  {
    type: "function",
    name: "tradeCoin",
    stateMutability: "payable",
    inputs: [
      { name: "token", type: "address" },
      { name: "isBuy", type: "bool" },
      { name: "recipient", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
      { name: "sqrtPriceLimitX96", type: "uint160" },
      { name: "tradeReferrer", type: "address" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "event",
    name: "TradeExecuted",
    inputs: [
      { name: "trader", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "isBuy", type: "bool", indexed: false },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "minAmountOut", type: "uint256", indexed: false },
      { name: "recipient", type: "address", indexed: false },
    ],
  },
] as const;

// Contract address from deployment
export const COIN_TRADER_ADDRESS: Address =
  "0x74d182cAe4FeF35b308deEBC2EEA5bc41F8605B0";

// Platform configuration
export const PLATFORM_CONFIG = {
  chainId: 84532, // Base Sepolia
  platformReferrer:
    (import.meta.env.VITE_PLATFORM_REFERRER as Address) ||
    ("0x0000000000000000000000000000000000000000" as Address),
};

// Plot token purchase parameters
export interface PlotTokenPurchase {
  tokenAddress: Address;
  ethAmount: string;
  recipient: Address;
  minTokensOut?: bigint;
}
