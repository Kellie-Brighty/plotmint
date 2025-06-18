// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChapterNFT
 * @notice Manages chapter-based NFT collections with built-in marketplace
 * @dev Each chapter has 100 editions with first edition reserved for creator
 */
contract ChapterNFT is ERC721, ERC2981, ReentrancyGuard, Ownable {
    /// @notice Maximum editions per chapter
    uint256 public constant MAX_EDITIONS = 100;
    
    /// @notice Royalty percentage (10%)
    uint96 private constant ROYALTY_FEE = 1000; // basis points: 10%
    
    /// @notice Edition minting price
    uint256 public immutable MINT_PRICE = 0.001 ether;

    /// @notice Current edition counter
    uint256 private _currentEdition = 0;
    
    /// @notice Gets the current edition counter
    function currentEdition() external view returns (uint256) {
        return _currentEdition;
    }

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    /// @notice Mapping from token ID to market listing
    mapping(uint256 => Listing) public listings;

    /**
     * @notice Emitted when a new edition is minted
     * @param tokenId The ID of the newly minted token
     * @param minter The address that minted the token
     */
    event EditionMinted(uint256 indexed tokenId, address indexed minter);

    /**
     * @notice Emitted when a token is listed for sale
     * @param tokenId The ID of the token being listed
     * @param price The listing price in wei
     */
    event ListingCreated(uint256 indexed tokenId, uint256 price);

    /**
     * @notice Emitted when a listing is cancelled by the seller
     * @param tokenId The ID of the token whose listing was cancelled
     */
    event ListingCancelled(uint256 indexed tokenId);

    /**
     * @notice Emitted when a listed token is sold
     * @param tokenId The ID of the token that was sold
     * @param seller The address of the seller
     * @param buyer The address of the buyer
     * @param price The price the token was sold for in wei
     */
    event ListingSold(uint256 indexed tokenId, address seller, address buyer, uint256 price);

    /**
     * @notice Initializes the NFT collection for a specific chapter
     * @param name_ The name of the NFT collection
     * @param symbol_ The symbol of the NFT collection
     * @param initialOwner The initial owner of the contract
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        // Set default royalty for this collection
        _setDefaultRoyalty(initialOwner, ROYALTY_FEE);
    }

    /**
     * @notice Mint first edition (creator only)
     * @dev Only the contract owner (creator) can mint the first edition
     */
    function mintFirstEdition() external onlyOwner {
        require(_currentEdition == 0, "First edition already minted");
        _mintEdition(msg.sender);
    }

    /**
     * @notice Mint subsequent editions (public)
     * @dev Anyone can mint editions 2-100 for the mint price
     */
    function mintEdition() external payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(_currentEdition > 0, "First edition not minted yet");
        require(_currentEdition < MAX_EDITIONS, "Max editions reached");
        
        _mintEdition(msg.sender);
        
        // Return excess payment if any
        uint256 excess = msg.value - MINT_PRICE;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
    }

    /**
     * @notice List NFT for sale
     * @param tokenId Token to list
     * @param price Listing price
     */
    function listForSale(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].active, "Already listed");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit ListingCreated(tokenId, price);
    }

    /**
     * @notice Cancel NFT listing
     * @param tokenId Token to delist
     */
    function cancelListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not seller");
        delete listings[tokenId];
        emit ListingCancelled(tokenId);
    }

    /**
     * @notice Buy listed NFT
     * @param tokenId Token to buy
     */
    function buyListed(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 price = listing.price;
        
        delete listings[tokenId];
        
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(tokenId, price);
        uint256 sellerAmount = price - royaltyAmount;
        
        _transfer(seller, msg.sender, tokenId);
        
        (bool success1, ) = royaltyReceiver.call{value: royaltyAmount}("");
        require(success1, "Royalty transfer failed");
        
        (bool success2, ) = seller.call{value: sellerAmount}("");
        require(success2, "Seller transfer failed");
        
        // Refund excess payment if any
        uint256 excess = msg.value - price;
        if (excess > 0) {
            (bool success3, ) = msg.sender.call{value: excess}("");
            require(success3, "Refund transfer failed");
        }
        
        emit ListingSold(tokenId, seller, msg.sender, price);
    }

    /**
     * @notice Internal function to mint an edition
     * @param to The address to mint the edition to
     */
    function _mintEdition(address to) private {
        require(_currentEdition < MAX_EDITIONS, "Max editions reached");
        uint256 newTokenId = _currentEdition + 1;
        _currentEdition = newTokenId;
        _safeMint(to, newTokenId);
        emit EditionMinted(newTokenId, to);
    }

    /**
     * @dev Required override for royalty support
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
