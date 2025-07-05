import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { metaMask, walletConnect, injected } from "wagmi/connectors";

// WalletConnect Project ID - you'll need to get this from https://cloud.walletconnect.com/
const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "your-project-id-here";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "PlotMint",
        url: window.location.origin,
        iconUrl: `${window.location.origin}/vite.svg`,
      },
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: "PlotMint",
        description: "Interactive storytelling platform with plot voting",
        url: window.location.origin,
        icons: [`${window.location.origin}/vite.svg`],
      },
    }),
    injected({
      target: "metaMask",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
