import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/Button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-dark-950/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 md:h-20 px-4 md:px-0">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-display font-bold text-primary-600 dark:text-primary-400">
                Plot
                <span className="text-secondary-600 dark:text-secondary-400">
                  Mint
                </span>
              </span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === "/"
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/stories"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === "/stories"
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
                  }`}
                >
                  Explore Stories
                </Link>
                <Link
                  to="/how-it-works"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === "/how-it-works"
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
                  }`}
                >
                  How It Works
                </Link>
                <Link
                  to="/creators"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === "/creators"
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
                  }`}
                >
                  For Creators
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="md">
              Connect Wallet
            </Button>
            <Button variant="primary" size="md">
              Start Writing
            </Button>
          </div>
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2.5 ml-3 rounded-md text-ink-400 hover:text-ink-500 hover:bg-ink-50 dark:hover:bg-dark-800 dark:text-ink-300 dark:hover:text-ink-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
              aria-expanded={isOpen}
              aria-label="Main menu"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
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
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
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
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 absolute w-full max-h-[calc(100vh-4rem)] overflow-y-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pt-3 pb-4 space-y-2">
              <Link
                to="/"
                className={`block px-4 py-3 rounded-md text-base font-medium ${
                  location.pathname === "/"
                    ? "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950"
                    : "text-ink-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:bg-ink-50 dark:hover:bg-dark-800"
                }`}
              >
                Home
              </Link>
              <Link
                to="/stories"
                className={`block px-4 py-3 rounded-md text-base font-medium ${
                  location.pathname === "/stories"
                    ? "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950"
                    : "text-ink-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:bg-ink-50 dark:hover:bg-dark-800"
                }`}
              >
                Explore Stories
              </Link>
              <Link
                to="/how-it-works"
                className={`block px-4 py-3 rounded-md text-base font-medium ${
                  location.pathname === "/how-it-works"
                    ? "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950"
                    : "text-ink-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:bg-ink-50 dark:hover:bg-dark-800"
                }`}
              >
                How It Works
              </Link>
              <Link
                to="/creators"
                className={`block px-4 py-3 rounded-md text-base font-medium ${
                  location.pathname === "/creators"
                    ? "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950"
                    : "text-ink-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:bg-ink-50 dark:hover:bg-dark-800"
                }`}
              >
                For Creators
              </Link>
            </div>
            <div className="px-4 pt-5 pb-6 border-t border-gray-200 dark:border-dark-700 space-y-4">
              <Button variant="outline" size="md" fullWidth className="py-3">
                Connect Wallet
              </Button>
              <Button variant="primary" size="md" fullWidth className="py-3">
                Start Writing
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
