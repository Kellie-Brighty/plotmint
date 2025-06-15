import { motion } from "framer-motion";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Writer Connects Wallet",
      description:
        "Writer connects their crypto wallet to PlotMint, creates a story with title and introduction, then writes the first chapter.",
      colorClass:
        "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300",
      dotColorClass: "bg-primary-600 dark:bg-primary-500",
    },
    {
      number: "02",
      title: "Create Two Plot Options",
      description:
        "Every chapter must include exactly two plot options that readers can vote on. These options automatically become purchasable tokens on Base Sepolia.",
      colorClass:
        "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300",
      dotColorClass: "bg-primary-600 dark:bg-primary-500",
    },
    {
      number: "03",
      title: "Readers Buy Tokens to Vote",
      description:
        "Readers purchase plot tokens with ETH to vote for their preferred story direction. Each token purchase directly influences the story outcome.",
      colorClass:
        "bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300",
      dotColorClass: "bg-secondary-600 dark:bg-secondary-500",
    },
    {
      number: "04",
      title: "Most Purchased Option Wins",
      description:
        "The plot option with the highest token sales automatically becomes the canonical direction for the next chapter of the story.",
      colorClass:
        "bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300",
      dotColorClass: "bg-secondary-600 dark:bg-secondary-500",
    },
    {
      number: "05",
      title: "Writer Continues Story",
      description:
        "The writer creates the next chapter following the winning plot direction, again with exactly two new options that become tokens.",
      colorClass:
        "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300",
      dotColorClass: "bg-primary-600 dark:bg-primary-500",
    },
    {
      number: "06",
      title: "Economic Story Tree",
      description:
        "The cycle repeats, creating a community-driven story where every plot decision has real economic value and reader investment.",
      colorClass:
        "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300",
      dotColorClass: "bg-primary-600 dark:bg-primary-500",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-parchment-100 dark:bg-dark-900 w-full">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-ink-900 dark:text-white mb-4 md:mb-6">
            How PlotMint Works
          </h2>
          <p className="text-lg sm:text-xl text-ink-600 dark:text-ink-300 leading-relaxed">
            A simple process that creates endless storytelling possibilities
          </p>
        </div>

        <div className="relative px-4 sm:px-6">
          {/* Connecting line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-parchment-200 dark:bg-dark-700 hidden md:block"></div>

          <div className="space-y-10 md:space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className={`flex flex-col ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center`}
              >
                <div
                  className={`md:w-1/2 ${
                    index % 2 === 0
                      ? "md:pr-12 lg:pr-16 md:text-right"
                      : "md:pl-12 lg:pl-16"
                  } mb-6 md:mb-0`}
                >
                  <div
                    className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold uppercase mb-3 ${step.colorClass} shadow-sm`}
                  >
                    Step {step.number}
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-2xl font-bold text-ink-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-ink-600 dark:text-ink-300 text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="md:w-1/2 relative flex justify-center mb-4 md:mb-0">
                  <div
                    className={`z-10 w-16 h-16 md:w-16 md:h-16 rounded-full flex items-center justify-center text-lg md:text-xl font-bold ${step.dotColorClass} text-white shadow-md`}
                  >
                    {step.number}
                  </div>
                  {/* Horizontal connecting line for mobile */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1 h-10 bg-parchment-200 dark:bg-dark-700 md:hidden"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
