import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/Button";

interface NavbarProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const Navbar = ({ theme, toggleTheme }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      <div className="content-wrapper">
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

              {/* Dropdown menu for dashboards */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>Connect Wallet</span>
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
                      <Link
                        to="/creator/new-story"
                        className="block px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-parchment-100 dark:hover:bg-dark-700"
                      >
                        Create New Story
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/creator/new-story">
                <Button variant="primary" size="sm">
                  Start Writing
                </Button>
              </Link>
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

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-dark-900 shadow-lg border-t border-parchment-200 dark:border-dark-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/"
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                  : "text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
              }`}
            >
              Home
            </Link>
            <Link
              to="/stories"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname.includes("/stories")
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                  : "text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
              }`}
            >
              Explore Stories
            </Link>
            <Link
              to="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/dashboard"
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                  : "text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
              }`}
            >
              Reader Dashboard
            </Link>
            <Link
              to="/creator"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/creator"
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                  : "text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
              }`}
            >
              Creator Studio
            </Link>
            <Link
              to="/creator/new-story"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/creator/new-story"
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                  : "text-primary-600 dark:text-primary-400 hover:bg-parchment-100 dark:hover:bg-dark-800"
              }`}
            >
              Create New Story
            </Link>
            <a
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
            >
              How It Works
            </a>
            <a
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-ink-700 dark:text-ink-200 hover:bg-parchment-100 dark:hover:bg-dark-800"
            >
              For Creators
            </a>
          </div>
          <div className="px-4 py-3 border-t border-parchment-200 dark:border-dark-700">
            <Button variant="primary" fullWidth>
              Connect Wallet
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
