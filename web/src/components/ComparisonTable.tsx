import { motion } from "framer-motion";

const ComparisonTable = () => {
  const features = [
    {
      name: "Token-based plot voting",
      plotmint: true,
      mirror: false,
      readl: false,
      jenkins: false,
      plotmintNote: "(ETH-purchasable tokens)",
    },
    {
      name: "Economic story decisions",
      plotmint: true,
      mirror: false,
      readl: false,
      jenkins: false,
      plotmintNote: "(real financial stakes)",
    },
    {
      name: "Mandatory plot options",
      plotmint: true,
      mirror: false,
      readl: false,
      jenkins: false,
      plotmintNote: "(every chapter has 2 tokens)",
    },
    {
      name: "Direct reader investment",
      plotmint: true,
      mirror: false,
      readl: false,
      jenkins: false,
      plotmintNote: "(buy tokens to vote)",
    },
    {
      name: "Creator revenue streams",
      plotmint: true,
      mirror: false,
      readl: true,
      readlNote: "(limited)",
      jenkins: false,
      plotmintNote: "(token sales + allocated tokens)",
    },
    {
      name: "Wallet-required creation",
      plotmint: true,
      mirror: false,
      readl: false,
      jenkins: false,
      plotmintNote: "(Base Sepolia network)",
    },
    {
      name: "Branching story trees",
      plotmint: true,
      mirror: false,
      readl: false,
      jenkins: false,
      plotmintNote: "(driven by token purchases)",
    },
    {
      name: "Static content publishing",
      plotmint: false,
      mirror: true,
      readl: true,
      jenkins: false,
      plotmintNote: "(all chapters have interactive tokens)",
    },
  ];

  const CheckIcon = () => (
    <svg
      className="h-5 w-5 text-green-500 dark:text-green-400"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  const CrossIcon = () => (
    <svg
      className="h-5 w-5 text-red-500 dark:text-red-400"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );

  // Mobile view comparison cards
  const MobileComparison = () => (
    <div className="md:hidden px-4 space-y-4">
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-white dark:bg-dark-900 rounded-lg border border-parchment-200 dark:border-dark-700 overflow-hidden shadow-sm"
        >
          <div className="p-4 border-b border-parchment-200 dark:border-dark-700 bg-parchment-50 dark:bg-dark-800">
            <h4 className="font-medium text-ink-900 dark:text-white">
              {feature.name}
            </h4>
          </div>
          <div className="grid grid-cols-2 divide-x divide-parchment-200 dark:divide-dark-700">
            <div className="p-4">
              <div className="text-center mb-2">
                <span className="text-xs uppercase font-semibold text-primary-700 dark:text-primary-400">
                  PlotMint
                </span>
              </div>
              <div className="flex flex-col items-center">
                {feature.plotmint ? (
                  <>
                    <CheckIcon />
                    {feature.plotmintNote && (
                      <span className="text-xs text-ink-600 dark:text-ink-300 mt-1 text-center">
                        {feature.plotmintNote}
                      </span>
                    )}
                  </>
                ) : (
                  <CrossIcon />
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="text-center mb-2">
                <span className="text-xs uppercase font-semibold text-ink-700 dark:text-ink-200">
                  Others
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-xs mb-1 block">Mirror</span>
                  {feature.mirror ? <CheckIcon /> : <CrossIcon />}
                </div>
                <div>
                  <span className="text-xs mb-1 block">Readl</span>
                  <div className="flex flex-col items-center">
                    {feature.readl ? (
                      <>
                        <CheckIcon />
                        {feature.readlNote && (
                          <span className="text-[10px] text-ink-600 dark:text-ink-300">
                            {feature.readlNote}
                          </span>
                        )}
                      </>
                    ) : (
                      <CrossIcon />
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs mb-1 block">Jenkins</span>
                  <div className="flex flex-col items-center">
                    {feature.jenkins ? (
                      <>
                        <CheckIcon />
                      </>
                    ) : (
                      <CrossIcon />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-16 md:py-20 bg-parchment-50 dark:bg-dark-950 w-full">
      <div className="content-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-10 md:mb-16 px-4 sm:px-6"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-ink-900 dark:text-white mb-4 md:mb-6">
            Why PlotMint Is Unique
          </h2>
          <p className="text-lg sm:text-xl text-ink-700 dark:text-ink-200 leading-relaxed">
            See how PlotMint's token-powered storytelling compares to other Web3 publishing platforms
          </p>
        </motion.div>

        {/* Mobile view */}
        <MobileComparison />

        {/* Desktop view */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="px-4 sm:px-6 overflow-x-auto hidden md:block"
        >
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden border border-parchment-200 dark:border-dark-700 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-parchment-200 dark:divide-dark-700">
                <thead className="bg-parchment-50 dark:bg-dark-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-ink-700 dark:text-ink-200 uppercase tracking-wider"
                    >
                      Feature
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-wider bg-primary-50 dark:bg-primary-900/20"
                    >
                      PlotMint
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-ink-700 dark:text-ink-200 uppercase tracking-wider"
                    >
                      Mirror
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-ink-700 dark:text-ink-200 uppercase tracking-wider"
                    >
                      Readl
                    </th>
                    <th
                      scope="col"
                      className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-semibold text-ink-700 dark:text-ink-200 uppercase tracking-wider"
                    >
                      Jenkins
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-900 divide-y divide-parchment-200 dark:divide-dark-700">
                  {features.map((feature, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0
                          ? "bg-white dark:bg-dark-900"
                          : "bg-parchment-50 dark:bg-dark-800"
                      }
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-ink-900 dark:text-white">
                        {feature.name}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center bg-primary-50 dark:bg-primary-900/20">
                        {feature.plotmint ? (
                          <div className="flex flex-col items-center">
                            <CheckIcon />
                            {feature.plotmintNote && (
                              <span className="text-xs text-ink-600 dark:text-ink-300 mt-1">
                                {feature.plotmintNote}
                              </span>
                            )}
                          </div>
                        ) : (
                          <CrossIcon />
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                        {feature.mirror ? (
                          <div className="flex flex-col items-center">
                            <CheckIcon />
                          </div>
                        ) : (
                          <CrossIcon />
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                        {feature.readl ? (
                          <div className="flex flex-col items-center">
                            <CheckIcon />
                            {feature.readlNote && (
                              <span className="text-xs text-ink-600 dark:text-ink-300 mt-1">
                                {feature.readlNote}
                              </span>
                            )}
                          </div>
                        ) : (
                          <CrossIcon />
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                        {feature.jenkins ? (
                          <div className="flex flex-col items-center">
                            <CheckIcon />
                          </div>
                        ) : (
                          <CrossIcon />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonTable;
