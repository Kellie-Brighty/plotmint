import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChapterNFT } from "../utils/useChapterNFT";
import type { Address } from "viem";

interface NFTMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftContractAddress: Address;
  tokenId: number;
  storyTitle: string;
  chapterTitle: string;
  editionNumber: number;
  currentOwner: Address;
  userAddress?: Address;
}

interface ListingInfo {
  seller: Address;
  price: string;
  active: boolean;
}

export const NFTMarketplaceModal: React.FC<NFTMarketplaceModalProps> = ({
  isOpen,
  onClose,
  nftContractAddress,
  tokenId,
  storyTitle,
  chapterTitle,
  editionNumber,
  currentOwner,
  userAddress,
}) => {
  const {
    listNFTForSale,
    cancelNFTListing,
    buyListedNFT,
    getNFTListing,
    getRoyaltyInfo,
    error,
    clearError,
  } = useChapterNFT();

  const [listingInfo, setListingInfo] = useState<ListingInfo | null>(null);
  const [royaltyInfo, setRoyaltyInfo] = useState<{
    receiver: Address;
    amount: string;
  } | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "buy" | "cancel">("list");

  // Check if user owns the NFT
  const isOwner =
    userAddress && currentOwner.toLowerCase() === userAddress.toLowerCase();

  // Fetch listing information when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchListingInfo();
    }
  }, [isOpen, tokenId]);

  const fetchListingInfo = async () => {
    try {
      const listing = await getNFTListing(nftContractAddress, tokenId);
      setListingInfo(listing);

      // If there's an active listing, fetch royalty info
      if (listing && listing.active) {
        const royalty = await getRoyaltyInfo(
          nftContractAddress,
          tokenId,
          (Number(listing.price) / 1e18).toString()
        );
        setRoyaltyInfo(royalty);
      }

      // Set appropriate tab based on ownership and listing status
      if (listing && listing.active) {
        if (
          isOwner &&
          listing.seller.toLowerCase() === userAddress?.toLowerCase()
        ) {
          setActiveTab("cancel");
        } else {
          setActiveTab("buy");
        }
      } else if (isOwner) {
        setActiveTab("list");
      } else {
        setActiveTab("buy");
      }
    } catch (error) {
      console.error("Error fetching listing info:", error);
    }
  };

  const handleListForSale = async () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await listNFTForSale(nftContractAddress, tokenId, listingPrice);
      await fetchListingInfo(); // Refresh listing info
      setListingPrice("");
    } catch (error) {
      console.error("Error listing NFT:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelListing = async () => {
    setIsLoading(true);
    clearError();

    try {
      await cancelNFTListing(nftContractAddress, tokenId);
      await fetchListingInfo(); // Refresh listing info
    } catch (error) {
      console.error("Error cancelling listing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNFT = async () => {
    setIsLoading(true);
    clearError();

    try {
      await buyListedNFT(nftContractAddress, tokenId);
      await fetchListingInfo(); // Refresh listing info
      // Close modal after successful purchase
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error("Error buying NFT:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatETH = (wei: string) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  const calculateRoyalty = (_price: string) => {
    if (!royaltyInfo) return "0";
    return (Number(royaltyInfo.amount) / 1e18).toFixed(4);
  };

  const calculateSellerAmount = (price: string) => {
    if (!royaltyInfo) return formatETH(price);
    const royaltyAmount = Number(royaltyInfo.amount);
    const sellerAmount = Number(price) - royaltyAmount;
    return (sellerAmount / 1e18).toFixed(4);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                NFT Marketplace
              </h2>
              <button
                onClick={onClose}
                className="text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* NFT Info */}
            <div className="mb-6 p-4 bg-parchment-50 dark:bg-dark-800 rounded-lg">
              <h3 className="font-semibold text-ink-900 dark:text-white mb-1">
                {storyTitle}
              </h3>
              <p className="text-ink-600 dark:text-ink-400 text-sm mb-2">
                {chapterTitle}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  Edition #{editionNumber}
                </span>
                <span className="text-ink-500 dark:text-ink-400">
                  Owner:{" "}
                  {isOwner
                    ? "You"
                    : `${currentOwner.slice(0, 6)}...${currentOwner.slice(-4)}`}
                </span>
              </div>
            </div>

            {/* Current Listing Status */}
            {listingInfo && listingInfo.active && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Currently Listed
                  </span>
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p>
                    Price:{" "}
                    <span className="font-bold">
                      {formatETH(listingInfo.price)} ETH
                    </span>
                  </p>
                  <p>
                    Seller: {listingInfo.seller.slice(0, 6)}...
                    {listingInfo.seller.slice(-4)}
                  </p>
                  {royaltyInfo && (
                    <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                      <p>
                        Creator Royalty: {calculateRoyalty(listingInfo.price)}{" "}
                        ETH (10%)
                      </p>
                      <p>
                        Seller Receives:{" "}
                        {calculateSellerAmount(listingInfo.price)} ETH
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex mb-6 bg-parchment-100 dark:bg-dark-800 rounded-lg p-1">
              {isOwner && (
                <button
                  onClick={() => setActiveTab("list")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "list"
                      ? "bg-white dark:bg-dark-700 text-ink-900 dark:text-white shadow-sm"
                      : "text-ink-600 dark:text-ink-400"
                  }`}
                  disabled={listingInfo?.active}
                >
                  List for Sale
                </button>
              )}

              {listingInfo?.active && !isOwner && (
                <button
                  onClick={() => setActiveTab("buy")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "buy"
                      ? "bg-white dark:bg-dark-700 text-ink-900 dark:text-white shadow-sm"
                      : "text-ink-600 dark:text-ink-400"
                  }`}
                >
                  Buy Now
                </button>
              )}

              {listingInfo?.active &&
                isOwner &&
                listingInfo.seller.toLowerCase() ===
                  userAddress?.toLowerCase() && (
                  <button
                    onClick={() => setActiveTab("cancel")}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "cancel"
                        ? "bg-white dark:bg-dark-700 text-ink-900 dark:text-white shadow-sm"
                        : "text-ink-600 dark:text-ink-400"
                    }`}
                  >
                    Cancel Listing
                  </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === "list" && isOwner && !listingInfo?.active && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">
                    Listing Price (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="0.001"
                    className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-ink-900 dark:text-white"
                  />
                </div>

                {listingPrice && parseFloat(listingPrice) > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Breakdown:
                    </h4>
                    <div className="space-y-1 text-blue-700 dark:text-blue-300">
                      <div className="flex justify-between">
                        <span>Listing Price:</span>
                        <span>{listingPrice} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Creator Royalty (10%):</span>
                        <span>
                          {(parseFloat(listingPrice) * 0.1).toFixed(4)} ETH
                        </span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-blue-200 dark:border-blue-800 pt-1">
                        <span>You'll Receive:</span>
                        <span>
                          {(parseFloat(listingPrice) * 0.9).toFixed(4)} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleListForSale}
                  disabled={
                    isLoading || !listingPrice || parseFloat(listingPrice) <= 0
                  }
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {isLoading ? "Listing..." : "List for Sale"}
                </button>
              </div>
            )}

            {activeTab === "buy" && listingInfo?.active && !isOwner && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div className="text-sm">
                      <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                        Purchase Confirmation
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        You're about to purchase this NFT for{" "}
                        {formatETH(listingInfo.price)} ETH. This transaction
                        cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {royaltyInfo && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                      Transaction Breakdown:
                    </h4>
                    <div className="space-y-1 text-purple-700 dark:text-purple-300">
                      <div className="flex justify-between">
                        <span>NFT Price:</span>
                        <span>{formatETH(listingInfo.price)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Creator Royalty:</span>
                        <span>{calculateRoyalty(listingInfo.price)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seller Receives:</span>
                        <span>
                          {calculateSellerAmount(listingInfo.price)} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBuyNFT}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {isLoading
                    ? "Purchasing..."
                    : `Buy for ${formatETH(listingInfo.price)} ETH`}
                </button>
              </div>
            )}

            {activeTab === "cancel" && listingInfo?.active && isOwner && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div className="text-sm">
                      <p className="text-red-800 dark:text-red-200 font-medium mb-1">
                        Cancel Listing
                      </p>
                      <p className="text-red-700 dark:text-red-300">
                        This will remove your NFT from the marketplace. You can
                        list it again later.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCancelListing}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {isLoading ? "Cancelling..." : "Cancel Listing"}
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Info Section */}
            <div className="mt-6 pt-4 border-t border-parchment-200 dark:border-dark-700">
              <div className="text-xs text-ink-500 dark:text-ink-400 space-y-1">
                <p>• All transactions are secured by smart contracts</p>
                <p>• Creator royalties (10%) are automatically distributed</p>
                <p>• Marketplace fees: 0% (gas fees apply)</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NFTMarketplaceModal;
