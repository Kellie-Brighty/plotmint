# Privy Integration in PlotMint

This document outlines the integration of Privy for wallet connections in the PlotMint application.

## Overview

PlotMint uses a dual authentication system:

1. **Firebase Authentication** for user accounts, email login, and profile management
2. **Privy** for Web3 wallet connections and blockchain interactions

## Implementation Details

### Configuration

The Privy configuration is set up in `main.tsx` with the PrivyProvider component, using an app ID from environment variables:

```typescript
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "placeholder-app-id";

<PrivyProvider
  appId={PRIVY_APP_ID}
  config={{
    loginMethods: ["email", "wallet"],
    appearance: {
      theme: "light",
      accentColor: "#7f56d9",
      logo: "/logo.png",
    },
    embeddedWallets: {
      createOnLogin: "users-without-wallets",
      noPromptOnSignature: true,
    },
  }}
>
  <App />
</PrivyProvider>;
```

### Authentication Context

The `AuthContext.tsx` file maintains both Firebase authentication and Privy wallet state, providing:

- User login state from Firebase
- Wallet connection state from Privy
- Methods to link/unlink wallets
- Storage of wallet addresses in Firestore

### Wallet Connection Component

The `WalletConnect.tsx` component offers UI for:

- Connecting an existing wallet via Privy
- Creating a new wallet via Privy
- Displaying connected wallet address
- Disconnecting wallet

### Database Storage

When a user connects a wallet:

1. The wallet address is stored in the Firestore database
2. The connection is associated with the user's Firebase account
3. This enables maintaining user identity across both authentication systems

## Environment Variables

To configure Privy, set the following environment variable:

```
VITE_PRIVY_APP_ID=your-privy-app-id
```

## Next Steps

- Implement wallet signature verification
- Connect wallet functionality to smart contracts
- Add multi-wallet support if needed
