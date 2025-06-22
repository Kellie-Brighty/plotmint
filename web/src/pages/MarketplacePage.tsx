import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "../utils/useWallet";
import { useChapterNFT } from "../utils/useChapterNFT";
import NFTMarketplaceModal from "../components/NFTMarketplaceModal";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import type { ChapterData, StoryData } from "../utils/storyService";
import type { Address } from "viem";

interface MarketplaceListing {
  chapterId: string;
  storyId: string;
  storyTitle: string;
  chapterTitle: string;
  contractAddress: Address;
  tokenId: number;
  editionNumber: number;
  seller: Address;
  price: string; // in wei
  priceETH: string; // formatted ETH
  mintPrice: string;
  isOwned: boolean;
}

const MarketplacePage = () => {
  const { isConnected, address } = useWallet();
  const { getNFTListing } = useChapterNFT();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] =
    useState<MarketplaceListing | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "newest" | "story">("price");
  const [filterBy, setFilterBy] = useState<"all" | "available" | "owned">(
    "available"
  );

  useEffect(() => {
    fetchMarketplaceListings();
  }, [isConnected]);

  const fetchMarketplaceListings = async () => {
    setLoading(true);
    setError(null);

    try {
      const marketplaceListings: MarketplaceListing[] = [];

      // Get all published chapters that have NFT contracts
      const chaptersRef = collection(db, "chapters");
      const chaptersQuery = query(
        chaptersRef,
        where("published", "==", true),
        where("nftContractAddress", "!=", null)
      );

      const chaptersSnapshot = await getDocs(chaptersQuery);

      for (const chapterDoc of chaptersSnapshot.docs) {
        const chapterData = chapterDoc.data() as ChapterData;

        if (!chapterData.nftContractAddress) continue;

        try {
          // Get story data
          const storyRef = doc(db, "stories", chapterData.storyId);
          const storySnap = await getDoc(storyRef);

          if (!storySnap.exists()) continue;

          const storyData = storySnap.data() as StoryData;

          // Check each token ID in the collection for active listings
          // Since NFTs have max 100 editions, we'll check the first 10 for performance
          for (let tokenId = 1; tokenId <= 10; tokenId++) {
            try {
              const listing = await getNFTListing(
                chapterData.nftContractAddress as Address,
                tokenId
              );

              if (listing && listing.active) {
                const priceETH = (Number(listing.price) / 1e18).toFixed(4);
                const isOwned =
                  address &&
                  listing.seller.toLowerCase() === address.toLowerCase();

                marketplaceListings.push({
                  chapterId: chapterData.id!,
                  storyId: storyData.id!,
                  storyTitle: storyData.title,
                  chapterTitle: chapterData.title,
                  contractAddress: chapterData.nftContractAddress as Address,
                  tokenId,
                  editionNumber: tokenId,
                  seller: listing.seller,
                  price: listing.price,
                  priceETH,
                  mintPrice: "0.001", // Default mint price
                  isOwned: !!isOwned,
                });
              }
            } catch (error) {
              // Token doesn't exist or other error, continue
              continue;
            }
          }
        } catch (error) {
          console.error(`Error processing chapter ${chapterData.id}:`, error);
        }
      }

      setListings(marketplaceListings);
    } catch (error) {
      console.error("Error fetching marketplace listings:", error);
      setError("Failed to load marketplace listings");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedListings = listings
    .filter((listing) => {
      if (filterBy === "all") return true;
      if (filterBy === "available") return !listing.isOwned;
      if (filterBy === "owned") return listing.isOwned;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === "newest") {
        return a.tokenId - b.tokenId; // Lower token IDs are newer mints
      }
      if (sortBy === "story") {
        return a.storyTitle.localeCompare(b.storyTitle);
      }
      return 0;
    });

  const handleListingClick = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedListing(null);
    // Refresh listings after any transaction
    fetchMarketplaceListings();
  };

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-dark-950 pt-24 pb-16">
      <div className="content-wrapper">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white mb-2">
            NFT Marketplace
          </h1>
          <p className="text-ink-600 dark:text-ink-300">
            Discover and collect chapter NFTs from your favorite stories
          </p>
        </motion.div>

        {/* Filters and Sorting */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-dark-800 border border-parchment-300 dark:border-dark-600 rounded-lg text-sm"
            >
              <option value="all">All Listings</option>
              <option value="available">Available to Buy</option>
              <option value="owned">My Listings</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-dark-800 border border-parchment-300 dark:border-dark-600 rounded-lg text-sm"
            >
              <option value="price">Sort by Price</option>
              <option value="newest">Sort by Newest</option>
              <option value="story">Sort by Story</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-600 dark:text-ink-400">
              {filteredAndSortedListings.length} listing
              {filteredAndSortedListings.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={fetchMarketplaceListings}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
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
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSortedListings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
              No Listings Found
            </h3>
            <p className="text-ink-600 dark:text-ink-400 mb-6">
              {filterBy === "available"
                ? "No NFTs are currently available for purchase."
                : filterBy === "owned"
                ? "You don't have any NFTs listed for sale."
                : "No NFTs are currently listed on the marketplace."}
            </p>
            <button
              onClick={() => (window.location.href = "/stories")}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Browse Stories
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && !error && filteredAndSortedListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedListings.map((listing, index) => (
              <motion.div
                key={`${listing.contractAddress}-${listing.tokenId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white dark:bg-dark-900 rounded-lg border border-parchment-200 dark:border-dark-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleListingClick(listing)}
              >
                {/* NFT Header */}
                <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Edition #{listing.editionNumber}
                        </div>
                        {listing.isOwned && (
                          <div className="text-xs opacity-90">Your Listing</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {listing.priceETH} ETH
                      </div>
                      <div className="text-xs opacity-90">Listed Price</div>
                    </div>
                  </div>
                </div>

                {/* NFT Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-ink-900 dark:text-white mb-1 line-clamp-2">
                    {listing.storyTitle}
                  </h4>
                  <p className="text-sm text-ink-600 dark:text-ink-400 mb-3 line-clamp-1">
                    {listing.chapterTitle}
                  </p>

                  <div className="flex items-center justify-between mb-3 text-xs text-ink-500 dark:text-ink-400">
                    <span>
                      Seller: {listing.seller.slice(0, 6)}...
                      {listing.seller.slice(-4)}
                    </span>
                    <span>Mint: {listing.mintPrice} ETH</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        listing.isOwned
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      }`}
                    >
                      {listing.isOwned ? "Your Listing" : "Available"}
                    </span>

                    <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors">
                      {listing.isOwned ? "Manage →" : "Buy Now →"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Connect Wallet CTA */}
        {!isConnected && (
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              Connect your wallet to buy NFTs and manage your listings
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Marketplace Modal */}
        {selectedListing && (
          <NFTMarketplaceModal
            isOpen={showModal}
            onClose={handleModalClose}
            nftContractAddress={selectedListing.contractAddress}
            tokenId={selectedListing.tokenId}
            storyTitle={selectedListing.storyTitle}
            chapterTitle={selectedListing.chapterTitle}
            editionNumber={selectedListing.editionNumber}
            currentOwner={selectedListing.seller}
            userAddress={address || undefined}
          />
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
