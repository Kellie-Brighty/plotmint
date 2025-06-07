import { motion } from "framer-motion";

const Features = () => {
  const features = [
    {
      title: "Token-Gated Branching Storytelling",
      description:
        "Each chapter ends with multiple plot paths. Readers vote by minting their preferred option, and the most minted branch becomes the canonical next chapter.",
      icon: (
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: "Gamified Co-Creation Loop",
      description:
        "Readers don't passively consume; they influence, compete, and collect. Writers build with fan involvement, not just after-the-fact feedback.",
      icon: (
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Fully On-Chain Chapter Tree",
      description:
        "Each chapter is minted with metadata linking it to the parent chapter and selected branch, forming a narrative graph instead of a simple sequence.",
      icon: (
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
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      title: "Incentivized Reader-Writer Economy",
      description:
        "Writers earn from every chapter mint and future forks. Readers who mint early and back winning plot directions can resell rare chapters from popular trees.",
      icon: (
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Story Worlds, Not Just Books",
      description:
        "Enable collaborative universes where multiple writers build in the same world with shared lore, multiple plotlines, and collectible story artifacts.",
      icon: (
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
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
    },
    {
      title: "Built on Zora Protocol",
      description:
        "Leveraging the power of Zora for minting chapters and voting, ensuring a seamless and transparent web3 experience for all users.",
      icon: (
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-white dark:bg-dark-950 w-full">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16 px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-ink-900 dark:text-white mb-4 md:mb-6">
            What Makes PlotMint Uniquely Powerful
          </h2>
          <p className="text-lg sm:text-xl text-ink-600 dark:text-ink-300 leading-relaxed">
            PlotMint redefines storytelling with innovative Web3 mechanics that
            bring readers and writers together.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8 px-4 sm:px-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-parchment-50 dark:bg-dark-900 rounded-xl p-6 md:p-7 border border-parchment-200 dark:border-dark-700 hover:shadow-md hover:border-primary-100 dark:hover:border-primary-800 transition duration-300 h-full"
            >
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 mb-5 md:mb-6 shadow-sm">
                <div className="w-7 h-7">{feature.icon}</div>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-ink-900 dark:text-white mb-3 md:mb-4">
                {feature.title}
              </h3>
              <p className="text-ink-600 dark:text-ink-300 text-base leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
