import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/Button";

interface NavbarProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const Navbar = ({ theme, toggleTheme }: NavbarProps) => {
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
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || isOpen
          ? "bg-white dark:bg-dark-900 shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 font-display text-2xl font-bold text-ink-900 dark:text-white"
          >
            <span className="text-primary-600 dark:text-primary-500">Plot</span>
            <span>Mint</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium ${
                  location.pathname === "/"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                Home
              </Link>
              <Link
                to="/stories"
                className={`text-sm font-medium ${
                  location.pathname.includes("/stories")
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                Explore Stories
              </Link>
              <a
                href="#"
                className="text-sm font-medium text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
              >
                How It Works
              </a>
              <a
                href="#"
                className="text-sm font-medium text-ink-700 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400"
              >
                For Creators
              </a>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              <Button variant="outline" size="sm">
                Connect Wallet
              </Button>
              <Button variant="primary" size="sm">
                Start Writing
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-ink-900 dark:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-[72px] bottom-0 bg-white dark:bg-dark-900 z-50 overflow-y-auto">
          <div className="px-4 py-6 space-y-6">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`text-base font-medium px-3 py-2 rounded-md ${
                  location.pathname === "/"
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
                }`}
              >
                Home
              </Link>
              <Link
                to="/stories"
                className={`text-base font-medium px-3 py-2 rounded-md ${
                  location.pathname.includes("/stories")
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
                }`}
              >
                Explore Stories
              </Link>
              <a
                href="#"
                className="text-base font-medium px-3 py-2 rounded-md text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
              >
                How It Works
              </a>
              <a
                href="#"
                className="text-base font-medium px-3 py-2 rounded-md text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
              >
                For Creators
              </a>
            </div>

            <div className="pt-6 border-t border-parchment-200 dark:border-dark-700">
              <div className="flex flex-col space-y-3">
                <Button variant="outline" size="md" fullWidth>
                  Connect Wallet
                </Button>
                <Button variant="primary" size="md" fullWidth>
                  Start Writing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
