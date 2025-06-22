import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/Button";
import { useAuth } from "../utils/AuthContext";
import JoinPlotMintModal from "./auth/JoinPlotMintModal";
import WalletConnect from "./WalletConnect";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser, logOut } = useAuth();

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close the mobile menu and dropdown when changing routes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location]);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-900 border-b border-parchment-200 dark:border-dark-700">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-display font-bold text-primary-600 dark:text-primary-400">
                Plot
                <span className="text-secondary-600 dark:text-secondary-400">
                  Mint
                </span>
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/stories"
                className="px-3 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white"
              >
                Explore Stories
              </Link>
              <Link
                to="/marketplace"
                className="px-3 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white"
              >
                NFT Marketplace
              </Link>
              <Link
                to="/discover"
                className="px-3 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white"
              >
                Discover
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {currentUser ? (
              <>
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span>{currentUser.email?.split("@")[0] || "User"}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`ml-2 h-4 w-4 transform transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-md shadow-lg border border-parchment-200 dark:border-dark-700 z-10">
                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                        >
                          Reader Dashboard
                        </Link>
                        <Link
                          to="/creator"
                          className="block px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                        >
                          Creator Studio
                        </Link>
                        <hr className="my-1 border-parchment-200 dark:border-dark-700" />
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-700"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                Join PlotMint
              </Button>
            )}

            <WalletConnect className="ml-2" />

            {currentUser && (
              <Link to="/creator/new-story">
                <Button variant="primary" size="sm">
                  Start Writing
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/stories"
              className="block px-3 py-2 rounded-md text-base font-medium text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
            >
              Explore Stories
            </Link>
            <Link
              to="/marketplace"
              className="block px-3 py-2 rounded-md text-base font-medium text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
            >
              NFT Marketplace
            </Link>
            <Link
              to="/discover"
              className="block px-3 py-2 rounded-md text-base font-medium text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
            >
              Discover
            </Link>
          </div>
          <div className="px-4 py-3 border-t border-parchment-200 dark:border-dark-700">
            {currentUser ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" fullWidth className="mb-2">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/creator">
                  <Button variant="outline" fullWidth className="mb-2">
                    Creator Studio
                  </Button>
                </Link>
                <div className="mb-2">
                  <WalletConnect className="w-full" />
                </div>
                <Button variant="primary" fullWidth onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  fullWidth
                  className="mb-2"
                  onClick={() => setShowAuthModal(true)}
                >
                  Join PlotMint
                </Button>
                <WalletConnect className="w-full" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <JoinPlotMintModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </nav>
  );
};

export default Navbar;
