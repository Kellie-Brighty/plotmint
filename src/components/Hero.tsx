import { motion } from "framer-motion";
import { Button, LinkButton } from "./ui/Button";

const Hero = () => {
  return (
    <div className="relative bg-gradient-to-b from-parchment-50 to-parchment-100 dark:from-dark-950 dark:to-dark-900 pt-28 pb-20 md:pt-32 md:pb-24 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-300 dark:bg-primary-600 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary-300 dark:bg-secondary-600 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary-100 dark:bg-primary-900/60 text-primary-800 dark:text-primary-200 rounded-full text-sm md:text-base font-medium mb-5 md:mb-6">
              Powered by Zora Protocol
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-ink-900 dark:text-white mb-6 md:mb-8 leading-tight">
              Stories that{" "}
              <span className="text-primary-600 dark:text-primary-400 italic">
                Evolve
              </span>{" "}
              with
              <span className="text-secondary-600 dark:text-secondary-400">
                {" "}
                Community
              </span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-2xl text-ink-700 dark:text-ink-200 mb-8 md:mb-10 font-serif leading-relaxed">
              PlotMint is a decentralized storytelling platform where each
              chapter is minted as a collectible. Readers don't just read — they
              collect, vote, and influence the story's direction.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-5 md:gap-6">
              <LinkButton
                to="/stories"
                variant="primary"
                size="lg"
                className="text-lg md:text-xl py-4 sm:py-4 shadow-sm hover:shadow-md"
              >
                Explore Stories
              </LinkButton>
              <LinkButton
                to="/create"
                variant="outline"
                size="lg"
                className="text-lg md:text-xl py-4 sm:py-4"
              >
                Start Writing
              </LinkButton>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto max-w-4xl px-4 sm:px-6"
        >
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-chapter dark:shadow-dark-chapter overflow-hidden border border-gray-200 dark:border-dark-700">
            <div className="p-4 sm:p-5 bg-ink-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <div className="ml-2 sm:ml-4 text-sm sm:text-base font-medium text-ink-500 dark:text-ink-300">
                  PlotMint Story Viewer
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm font-medium text-ink-400 dark:text-ink-400">
                  Chapter 3 of Series
                </span>
                <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-800 dark:text-primary-200">
                    3
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6 md:p-8 bg-white dark:bg-dark-900">
              <div className="text-center mb-5 md:mb-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-ink-900 dark:text-white font-display mb-1 md:mb-2">
                  The Quantum Nexus
                </h3>
                <p className="text-ink-500 dark:text-ink-400 text-sm sm:text-base">
                  Chapter 3: The Decision
                </p>
              </div>
              <div className="prose mx-auto max-w-2xl">
                <p className="text-base sm:text-lg md:text-xl text-ink-700 dark:text-ink-200 font-serif leading-relaxed mb-4">
                  The ship's AI flickered to life, bathing the bridge in a soft
                  blue glow. "Three paths detected," it announced, its voice
                  calm despite the gravity of the situation.
                </p>
                <p className="text-base sm:text-lg md:text-xl text-ink-700 dark:text-ink-200 font-serif leading-relaxed">
                  Captain Elara gripped the console, her knuckles white. "Show
                  me the options."
                </p>
              </div>
              <div className="mt-7 md:mt-8 space-y-3 md:space-y-4">
                <div className="border border-gray-200 dark:border-dark-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition cursor-pointer">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-ink-900 dark:text-white text-base sm:text-lg">
                      Navigate through the quantum field
                    </h4>
                    <div className="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 text-sm px-2 py-1 rounded-full flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 4L4 20H20L12 4Z" fill="currentColor" />
                      </svg>
                      <span>48 Mints</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 dark:border-dark-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition cursor-pointer">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-ink-900 dark:text-white text-base sm:text-lg">
                      Attempt communication with the void entity
                    </h4>
                    <div className="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 text-sm px-2 py-1 rounded-full flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 4L4 20H20L12 4Z" fill="currentColor" />
                      </svg>
                      <span>37 Mints</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 dark:border-dark-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition cursor-pointer">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-ink-900 dark:text-white text-base sm:text-lg">
                      Activate the temporal shield
                    </h4>
                    <div className="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 text-sm px-2 py-1 rounded-full flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 4L4 20H20L12 4Z" fill="currentColor" />
                      </svg>
                      <span>29 Mints</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 md:mt-10 text-center">
                <Button
                  variant="primary"
                  size="lg"
                  className="shadow-sm hover:shadow py-3 px-6 w-full sm:w-auto"
                >
                  <span>Mint your choice to vote</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Paper texture elements for aesthetic */}
          <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-parchment-200 dark:bg-dark-700 opacity-70 hidden md:block"></div>
          <div className="absolute -bottom-8 -left-8 w-16 h-16 rounded-full bg-parchment-200 dark:bg-dark-700 opacity-70 hidden md:block"></div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
