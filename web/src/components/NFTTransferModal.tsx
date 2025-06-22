import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChapterNFT } from "../utils/useChapterNFT";
import type { Address } from "viem";

interface NFTTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: {
    contractAddress: Address;
    tokenId: number;
    storyTitle: string;
    chapterTitle: string;
    editionNumber: number;
  };
  onTransferSuccess?: () => void;
}

export const NFTTransferModal: React.FC<NFTTransferModalProps> = ({
  isOpen,
  onClose,
  nft,
  onTransferSuccess,
}) => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { transferNFT } = useChapterNFT();

  const handleTransfer = async () => {
    if (!recipientAddress.trim()) {
      setError("Please enter a recipient address");
      return;
    }

    // Basic address validation
    if (!recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setIsTransferring(true);
    setError(null);

    try {
      await transferNFT(
        nft.contractAddress,
        nft.tokenId,
        recipientAddress as Address
      );
      setSuccess(true);
      onTransferSuccess?.();

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setRecipientAddress("");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    if (!isTransferring) {
      onClose();
      setRecipientAddress("");
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                  Transfer NFT
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isTransferring}
                  className="text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300 disabled:opacity-50"
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

              {success ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
                    Transfer Successful!
                  </h3>
                  <p className="text-ink-600 dark:text-ink-400">
                    Your NFT has been transferred successfully.
                  </p>
                </div>
              ) : (
                <>
                  {/* NFT Info */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-ink-900 dark:text-white mb-1">
                      {nft.storyTitle}
                    </h3>
                    <p className="text-ink-600 dark:text-ink-400 text-sm mb-2">
                      {nft.chapterTitle}
                    </p>
                    <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm">
                      <svg
                        className="w-4 h-4 mr-1"
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
                      Edition #{nft.editionNumber}
                    </div>
                  </div>

                  {/* Recipient Address Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-ink-900 dark:text-white mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="0x..."
                      disabled={isTransferring}
                      className="w-full px-3 py-2 border border-parchment-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-dark-800 text-ink-900 dark:text-white disabled:opacity-50"
                    />
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                      Enter the Ethereum address of the recipient
                    </p>
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                          Important Notice
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-400">
                          This transfer is permanent and cannot be undone. Make
                          sure the recipient address is correct.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                      <p className="text-red-700 dark:text-red-300 text-sm">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      disabled={isTransferring}
                      className="flex-1 px-4 py-2 border border-parchment-300 dark:border-dark-600 text-ink-700 dark:text-ink-300 font-medium rounded-lg hover:bg-parchment-50 dark:hover:bg-dark-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTransfer}
                      disabled={isTransferring || !recipientAddress.trim()}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isTransferring ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Transferring...
                        </>
                      ) : (
                        "Transfer NFT"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NFTTransferModal;
