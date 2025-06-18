// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ChapterNFT} from "./ChapterNFT.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChapterNFTFactory
 * @notice Factory contract for deploying per-chapter NFT collections
 * @dev Creates new ChapterNFT instances for each chapter
 */
contract ChapterNFTFactory is Ownable {
    /// @notice Emitted when a new chapter NFT collection is created
    event ChapterNFTCreated(address indexed chapterNFT, uint256 indexed chapterId, address indexed creator);

    /// @notice Mapping from chapter ID to ChapterNFT contract address
    mapping(uint256 => address) public chapterNFTs;
    
    /// @notice Mapping from ChapterNFT address to chapter ID
    mapping(address => uint256) public nftChapterIds;

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Creates a new ChapterNFT collection for a specific chapter
     * @param chapterId The unique identifier for the chapter
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @return The address of the newly created ChapterNFT contract
     */
    function createChapterNFT(
        uint256 chapterId,
        string memory name,
        string memory symbol
    ) external returns (address) {
        require(chapterNFTs[chapterId] == address(0), "Chapter NFT already exists");
        
        // Deploy new ChapterNFT contract
        ChapterNFT nft = new ChapterNFT(name, symbol, msg.sender);
        
        // Store mappings
        chapterNFTs[chapterId] = address(nft);
        nftChapterIds[address(nft)] = chapterId;
        
        emit ChapterNFTCreated(address(nft), chapterId, msg.sender);
        
        return address(nft);
    }

    /**
     * @notice Retrieves the ChapterNFT contract address for a given chapter ID
     * @param chapterId The chapter identifier to look up
     * @return The address of the ChapterNFT contract
     */
    function getChapterNFT(uint256 chapterId) external view returns (address) {
        return chapterNFTs[chapterId];
    }

    /**
     * @notice Checks if a given address is a ChapterNFT contract created by this factory
     * @param nftAddress The address to check
     * @return True if the address is a ChapterNFT created by this factory
     */
    function isChapterNFT(address nftAddress) public view returns (bool) {
        return nftChapterIds[nftAddress] != 0;
    }
}
