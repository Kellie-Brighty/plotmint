// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICoinV4
 * @notice Interface for interacting with Zora CoinV4 contracts
 */
interface ICoinV4 {
    function buy(
        address recipient,
        uint256 orderSize,
        uint256 minAmountOut,
        uint160 sqrtPriceLimitX96,
        address tradeReferrer
    ) external payable;

    function sell(
        address recipient,
        uint256 orderSize,
        uint256 minAmountOut,
        uint160 sqrtPriceLimitX96,
        address tradeReferrer
    ) external;
}