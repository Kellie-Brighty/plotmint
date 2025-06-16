import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-parchment-100 dark:bg-dark-800 pt-12 pb-8">
      <div className="content-wrapper">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-5">
              <span className="text-2xl font-display font-bold text-primary-700 dark:text-primary-400">
                Plot
                <span className="text-secondary-600 dark:text-secondary-400">
                  Mint
                </span>
              </span>
            </Link>
            <p className="text-ink-700 dark:text-ink-200 mb-5 max-w-xs">
              The decentralized storytelling platform where chapters feature
              plot options that become purchasable tokens for reader voting.
            </p>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                Built on Base Sepolia
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-900/30 text-secondary-800 dark:text-secondary-300">
                Powered by Zora
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/stories"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition"
                >
                  Browse Stories
                </Link>
              </li>
              <li>
                <Link
                  to="/trending"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition"
                >
                  Trending Tokens
                </Link>
              </li>
              <li>
                <Link
                  to="/authors"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition"
                >
                  Featured Authors
                </Link>
              </li>
              <li>
                <Link
                  to="/collections"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition"
                >
                  Story Collections
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/creators"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition"
                >
                  For Creators
                </Link>
              </li>
              <li>
                <Link
                  to="/wallet-guide"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition"
                >
                  Wallet Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://twitter.com/plotmint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/plotmint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0773.0773 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@plotmint.com"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                  </svg>
                  Email Us
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/plotmint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-700 dark:text-ink-200 hover:text-primary-700 dark:hover:text-primary-400 transition flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-parchment-200 dark:border-dark-700 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-4 md:mb-0">
            © {currentYear} PlotMint. All rights reserved. Built with ❤️ by
            Trextechies.
          </p>
          <div className="flex items-center space-x-4 text-sm text-ink-600 dark:text-ink-300">
            <Link
              to="/privacy"
              className="hover:text-primary-700 dark:hover:text-primary-400 transition"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-primary-700 dark:hover:text-primary-400 transition"
            >
              Terms of Service
            </Link>
            <Link
              to="/cookies"
              className="hover:text-primary-700 dark:hover:text-primary-400 transition"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
