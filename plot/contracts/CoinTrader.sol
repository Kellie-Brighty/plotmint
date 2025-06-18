// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICoinV4 } from "./interfaces/ICoinV4.sol";

/**
 * @title CoinTrader
 * @notice Unified contract for buying and selling Zora CoinV4 tokens
 * @dev This contract wraps direct calls to CoinV4's `buy` and `sell` methods
 *      and emits an event for traceability. 
 */
contract CoinTrader is ReentrancyGuard {
    /**
     * @notice Emitted when a trade (buy or sell) is executed
     * @param trader Address of the user initiating the trade
     * @param token Address of the CoinV4 token being traded
     * @param isBuy True if trade is a buy; false if it's a sell
     * @param amountIn ETH sent for buy or token amount for sell
     * @param minAmountOut Slippage control - min expected output
     * @param recipient Address receiving the tokens (buy) or ETH (sell)
     */
    event TradeExecuted(
        address indexed trader,
        address indexed token,
        bool isBuy,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    );

    /**
     * @notice Executes a trade by calling buy or sell on a CoinV4 token
     * @dev Buy requires msg.value == amountIn. Sell expects prior approval.
     * @param token CoinV4 token address
     * @param isBuy Set to true for buy, false for sell
     * @param recipient Address that receives the output (tokens or ETH)
     * @param amountIn ETH (for buy) or token amount (for sell)
     * @param minAmountOut Minimum amount of output expected
     * @param sqrtPriceLimitX96 Limit for price slippage, set to 0 for none
     * @param tradeReferrer Platform or app that referred the trade
     * @return success Boolean indicating trade success
     */
    function tradeCoin(
        address token,
        bool isBuy,
        address recipient,
        uint256 amountIn,
        uint256 minAmountOut,
        uint160 sqrtPriceLimitX96,
        address tradeReferrer
    ) external payable nonReentrant returns (bool success) {
        if (isBuy) {
            require(msg.value == amountIn, "ETH must match amountIn for buy");

            ICoinV4(token).buy{value: amountIn}(
                recipient,
                amountIn,
                minAmountOut,
                sqrtPriceLimitX96,
                tradeReferrer
            );
        } else {
            require(msg.value == 0, "Do not send ETH for sell");

            ICoinV4(token).sell(
                recipient,
                amountIn,
                minAmountOut,
                sqrtPriceLimitX96,
                tradeReferrer
            );
        }

        emit TradeExecuted(
            msg.sender,
            token,
            isBuy,
            amountIn,
            minAmountOut,
            recipient
        );

        return true;
    }

    /// @notice Accept ETH fallback
    receive() external payable {}
}
