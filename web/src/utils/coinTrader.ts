import type { Address } from "viem";

// Zora Coin Trader Contract ABI
export const ZORA_COIN_TRADER_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_router", type: "address", internalType: "address" },
      { name: "_poolManager", type: "address", internalType: "address" },
      { name: "_permit2", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "receive", stateMutability: "payable" },
  {
    type: "function",
    name: "approveTokenWithPermit2",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "amount", type: "uint160", internalType: "uint160" },
      { name: "expiration", type: "uint48", internalType: "uint48" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyCoin",
    inputs: [
      {
        name: "key",
        type: "tuple",
        internalType: "struct PoolKey",
        components: [
          { name: "currency0", type: "address", internalType: "Currency" },
          { name: "currency1", type: "address", internalType: "Currency" },
          { name: "fee", type: "uint24", internalType: "uint24" },
          { name: "tickSpacing", type: "int24", internalType: "int24" },
          { name: "hooks", type: "address", internalType: "contract IHooks" },
        ],
      },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "minAmountOut", type: "uint128", internalType: "uint128" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "tradeReferrer", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256", internalType: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "permit2",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IPermit2" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolManager",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IPoolManager" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "router",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract UniversalRouter" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sellCoin",
    inputs: [
      {
        name: "key",
        type: "tuple",
        internalType: "struct PoolKey",
        components: [
          { name: "currency0", type: "address", internalType: "Currency" },
          { name: "currency1", type: "address", internalType: "Currency" },
          { name: "fee", type: "uint24", internalType: "uint24" },
          { name: "tickSpacing", type: "int24", internalType: "int24" },
          { name: "hooks", type: "address", internalType: "contract IHooks" },
        ],
      },
      { name: "amountIn", type: "uint128", internalType: "uint128" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "minAmountOut", type: "uint128", internalType: "uint128" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "tradeReferrer", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "TradeExecuted",
    inputs: [
      {
        name: "trader",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "coinAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "isBuy", type: "bool", indexed: false, internalType: "bool" },
      {
        name: "amountIn",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amountOut",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "referrer",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "DeadlineExpired", inputs: [] },
  { type: "error", name: "InsufficientOutputAmount", inputs: [] },
  { type: "error", name: "InvalidPoolKey", inputs: [] },
  { type: "error", name: "InvalidTradeDirection", inputs: [] },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
  },
] as const;

// ERC20 ABI for token approvals
export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Keep legacy ABI name for backward compatibility
export const COIN_TRADER_ABI = ZORA_COIN_TRADER_ABI;

// Zora Coin Trader Contract address
export const ZORA_COIN_TRADER_ADDRESS: Address =
  "0x17CdB2a31E55669f3eb4185CBc702ad052A12A27";

// Keep legacy address name for backward compatibility
export const COIN_TRADER_ADDRESS: Address = ZORA_COIN_TRADER_ADDRESS;

// Platform configuration
export const PLATFORM_CONFIG = {
  chainId: 8453, // Base Mainnet
  platformReferrer:
    (import.meta.env.VITE_PLATFORM_REFERRER as Address) ||
    ("0x0000000000000000000000000000000000000000" as Address),
};

// Pool configuration for PLOT tokens
export const PLOT_TOKEN_CONFIG = {
  // ETH address (currency0) - Base Mainnet
  WETH_ADDRESS: "0x4200000000000000000000000000000000000006" as Address,
  // Standard pool fee (0.3%)
  DEFAULT_FEE: 3000,
  // Standard tick spacing for 0.3% fee
  DEFAULT_TICK_SPACING: 60,
  // No hooks contract
  DEFAULT_HOOKS: "0x0000000000000000000000000000000000000000" as Address,
  // Default deadline (20 minutes from now)
  DEFAULT_DEADLINE_MINUTES: 20,
};

// Helper function to create PoolKey for PLOT token trading
export const createPlotTokenPoolKey = (plotTokenAddress: Address) => {
  const wethAddress = PLOT_TOKEN_CONFIG.WETH_ADDRESS;

  // Order currencies: lower address first
  const isWethFirst =
    wethAddress.toLowerCase() < plotTokenAddress.toLowerCase();

  return {
    currency0: isWethFirst ? wethAddress : plotTokenAddress,
    currency1: isWethFirst ? plotTokenAddress : wethAddress,
    fee: PLOT_TOKEN_CONFIG.DEFAULT_FEE,
    tickSpacing: PLOT_TOKEN_CONFIG.DEFAULT_TICK_SPACING,
    hooks: PLOT_TOKEN_CONFIG.DEFAULT_HOOKS,
  };
};

// Helper function to get deadline timestamp
export const getTradeDeadline = (
  minutesFromNow: number = PLOT_TOKEN_CONFIG.DEFAULT_DEADLINE_MINUTES
): bigint => {
  return BigInt(Math.floor(Date.now() / 1000) + minutesFromNow * 60);
};

// Plot token purchase parameters (updated for Zora Coin Trader)
export interface PlotTokenPurchase {
  tokenAddress: Address;
  ethAmount: string;
  recipient: Address;
  minTokensOut?: bigint;
  deadline?: bigint;
}

// Plot token sale parameters
export interface PlotTokenSale {
  tokenAddress: Address;
  tokenAmount: bigint;
  recipient: Address;
  minEthOut?: bigint;
  deadline?: bigint;
}
