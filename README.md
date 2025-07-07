<br/>

<div align="center">
  Like this project ? Leave us a star ⭐
</div>

<br/>

<div align="center">
  <a href="https://github.com/Kellie-Brighty/plotmint" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/plot.png">
    <img src="./assets/plot.png" alt="plot logo">
  </picture>
  </a>
</div>

<br/>

<p align="center">
 <a href="LICENSE">
   <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
 </a>
 <a href="https://zora.co">
   <img src="https://img.shields.io/badge/hackathon-Zora%20Coinathon-purple" alt="Zora Coinathon">
 </a>
 <a href="https://reactjs.org/">
   <img src="https://img.shields.io/badge/built%20with-React-61DAFB" alt="Built with React">
 </a>
 <a href="https://base.org">
   <img src="https://img.shields.io/badge/powered%20by-Base-0052FF" alt="Powered by Base">
 </a>
</p>

<!-- ![PlotMint Icon](./public/icon.png) -->

**PlotMint** is a revolutionary decentralized storytelling platform where narratives evolve through tokenized plot choices. Readers purchase Zora-powered tokens to vote on story directions, creating liquid prediction markets for narrative outcomes while giving creators sustainable revenue streams.

## Plotmint Preview
![PlotMint Demo](./assets/demo.gif)

---

<p align="center">
 <a href="https://dev-plotmint.web.app">
   <strong>📺 Live Site</strong>
 </a>
 |
 <a href="./docs/TECHNICAL_PAPER.md">
   <strong>📄 Technical Paper</strong>
 </a>
 |
 <a href="https://your-video-link">
   <strong>🎥 Full Demo Video</strong>
 </a>
 <a href="https://eu.docworkspace.com/d/sIIDq49-zAsHMrsMG?sa=601.1037">
   <strong>📊 Slide Deck</strong>
 </a>
</p>

---

## 🌟 Project Goals

### **Primary Objective**
Transform storytelling from passive consumption to active participation by creating **economic stakes in narrative outcomes**. PlotMint bridges entertainment and DeFi, allowing readers to literally invest in plot directions they believe will succeed.

### **Impact & Vision**
- **For Readers**: Turn story engagement into potential profit through narrative speculation
- **For Creators**: Generate revenue from plot token sales and retain equity in story success  
- **For the Web3 Ecosystem**: Demonstrate practical utility of tokens beyond traditional DeFi use cases

---

## 🔥 Key Features

### 📈 **Tokenized Plot Voting**
- Every chapter offers exactly 2 plot options as tradeable ERC-20 tokens
- Readers purchase tokens with ETH to vote for their preferred story direction
- Winning plot holders can claim victory collectibles

### 💰 **Creator Revenue Streams**
- **Token Sales**: Earn from initial plot option token sales
- **Token Allocation**: Receive allocated tokens that appreciate with story popularity
- **Royalties**: Ongoing revenue from secondary token trading

### 🎯 **Prediction Market Mechanics**
- Plot tokens create liquid markets for narrative speculation
- Real-time price discovery reflects reader sentiment
- Plot token unique holders determines winning plot direction

### 🏆 **Victory Collectibles**
- NFT commemoratives for holders of winning plot tokens
- Limited edition collectibles that gain value as stories grow
- Showcase successful narrative predictions in user profiles

---

## 🔧 Sponsor Tech Integration

PlotMint leverages **Zora's Coin SDK** extensively throughout the application. Here's how Zora powers our core functionality:

| **Functionality** | **Zora Tech Used** | **Implementation Details** |
|---|---|---|
| **Plot Token Creation** | `createCoin()` from Zora Coin SDK | Creates ERC-20 tokens for each plot option with custom metadata |
| **Token Trading** | `tradeCoin()` function | Enables readers to buy/sell plot tokens with ETH |
| **Market Data** | Zora API (`api-sdk.zora.engineering`) | Real-time token prices, holder counts, and trading volume |
| **Winner Determination** | `getCoinInfo()` for holder analysis | Determines winning plot based on unique token holders |
| **Base Network Integration** | Zora SDK Base configuration | All tokens deployed on Base mainnet (chainId: 8453) |
| **Revenue Distribution** | Platform referrer system | Creators earn from token sales via Zora's referral mechanism |

### **Core Zora Service Implementation**
```typescript
// ZoraService.ts - Main integration point
class ZoraService {
  // Creates plot tokens for chapter choices
  async registerPlotOptions(chapterId, options, walletClient, publicClient)
  
  // Executes token purchases for voting
  async tradeCoin(tradeParams, walletClient, account, publicClient)
  
  // Fetches real-time token data
  async getCoinInfo(tokenAddress)
  
  // Determines plot winner by holder count
  async determineWinnerByHolders(chapterId)
}
```

---

## 🎮 User Walkthrough

### **For Story Creators:**

1. **Connect Wallet** → Link Base-compatible wallet (MetaMask, WalletConnect)
2. **Create Account** → Register with email and link wallet address
3. **Write Chapter** → Use rich text editor to craft story content
4. **Set Plot Options** → Define exactly 2 choices for readers to vote on
5. **Deploy Tokens** → Zora SDK creates ERC-20 tokens for each plot option
6. **Publish Chapter** → Story goes live with active plot token trading
7. **Monitor Performance** → Track reader engagement, token prices, and revenue
8. **Continue Story** → Write next chapter based on winning plot direction

### **For Readers:**

1. **Browse Stories** → Discover interactive narratives on the homepage
2. **Read Chapters** → Enjoy stories with immersive reading experience
3. **Vote with Tokens** → Purchase plot tokens with ETH to influence story direction
4. **Track Investments** → Monitor token performance in reader dashboard
5. **Claim Rewards** → Collect victory NFTs when your plot choice wins
6. **Build Collection** → Showcase prediction successes and story collectibles

---

## 🏗️ Technical Implementation

### **Architecture Overview**
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Authentication**: Firebase Auth + Privy (Web3)
- **Database**: Firebase Firestore
- **Blockchain**: Base (L2) via Zora Coin SDK
- **Wallet Integration**: Privy for seamless Web3 onboarding

### **Key Technologies**
```typescript
// Core dependencies showcasing Zora integration
import { createCoin, tradeCoin, setApiKey } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import { WalletClient, PublicClient, Address } from "viem";
```

### **Smart Contract Integration**
- **Token Standard**: ERC-20 via Zora's factory contracts
- **Network**: Base mainnet (chainId: 8453)
- **Gas Optimization**: Leverages Base's low-cost transactions for frequent plot voting

---

## 🚀 Setup & Installation

### **Prerequisites**
- Node.js 18+
- Bun (recommended) or npm/yarn
- Metamask wallet or Wallet Connect
- Zora API key

### **Environment Variables**
```bash
# Zora Configuration
VITE_ZORA_API_KEY=your_zora_api_key
VITE_PLATFORM_REFERRER=your_wallet_address

# Firebase Configuration  
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... additional Firebase vars

# Web3 Configuration
VITE_PRIVY_APP_ID=your_privy_app_id
```

### **Quick Start**
```bash
# Clone repository
git clone https://github.com/Kellie-Brighty/plotmint
cd plotmint/web

# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

---

## 🎯 Impact & Metrics

### **Hackathon Goals Achieved**
- ✅ **Novel Utility**: First-ever tokenized storytelling platform using Zora
- ✅ **Real Trading**: Functional plot token marketplace on Base mainnet  
- ✅ **Creator Economy**: Sustainable revenue model for story creators
- ✅ **User Engagement**: Interactive narrative participation via token ownership

### **Technical Achievements**
- 🔧 Full Zora Coin SDK integration with custom metadata
- ⚡ Responsive Web3 UX with Privy wallet abstraction
- 🎨 Production-ready UI with dark mode and mobile optimization
- 📊 Real-time market data integration and price discovery

### **Market Potential**
- **TAM**: $2.3B+ interactive entertainment market
- **Innovation**: First mover in narrative prediction markets
- **Scalability**: Framework applicable to any choice-driven content

---

## 👥 Contributors

| **Role** | **Contributor** | **GitHub** |
|---|---|---|
| **Frontend Development** | Kelly Brighty | [@Kellie-Brighty](https://github.com/Kellie-Brighty) |
| **Smart Contract & Zora SDK Integration** | Amos Ehiguese | [@amosehiguese](https://github.com/amosehiguese) |

---

## 📚 Documentation

- 📄 **[Technical Paper](./docs/TECHNICAL_PAPER.md)** - Deep dive into tokenomics and architecture
- 🐛 **[Bug Reports](https://github.com/yourusername/plotmint/issues)** - Report issues here

---

## 🏆 Acknowledgments

- **Zora Labs** for the innovative Coin SDK enabling this novel use case
- **Base** for providing cost-effective L2 infrastructure  
- **Privy** for seamless Web3 wallet integration
- **Firebase** for reliable backend infrastructure

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Quick Links

- 🌐 **[Live](https://dev-plotmint.web.app)**
- 📹 **[Demo Video](https://your-video-link)**
- 📄 **[Technical Paper](./docs/TECHNICAL_PAPER.md)**

---

<div align="center">

**Built with ❤️ for the Zora Coinathon**

*Where prediction markets meet storytelling* 📚⚡

</div>
