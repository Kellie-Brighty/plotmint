// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PlotMintTypes
 * @notice Core data structures for PlotMint platform
 */
library PlotMintTypes {
    /// @notice Represents a story chapter
    struct Chapter {
        uint256 id;
        string uri;
        bool isFinalized;
        uint256 timestamp;
        uint256 totalVotes;
    }

    /// @notice Represents a plot option for a chapter
    struct PlotOption {
        uint256 id;
        string uri;
        uint256 voteCount;
        bool exists;
    }

    /// @notice Vote information for NFT metadata
    struct VoteInfo {
        uint256 chapterId;
        uint256 optionId;
        address voter;
        uint256 timestamp;
        bool isWinner;
        bool isEarlyVoter;
    }

    /// @notice Badge types for NFT metadata
    enum BadgeType {
        NONE,
        WINNING_VOTER,
        EARLY_VOTER,
        BOTH
    }

    /// @notice Events
    event ChapterCreated(uint256 indexed chapterId, string uri);
    event PlotOptionAdded(uint256 indexed chapterId, uint256 indexed optionId, string uri);
    event VoteCast(uint256 indexed chapterId, uint256 indexed optionId, address indexed voter, uint256 tokenId);
    event VotingFinalized(uint256 indexed chapterId, uint256 winningOptionId);
    event RewardsDistributed(uint256 indexed chapterId, uint256 totalReward, uint256 winnerCount);
}