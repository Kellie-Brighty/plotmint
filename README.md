# PlotMint - Decentralized Storytelling Platform

PlotMint is a decentralized storytelling platform built on Zora Network where writers create interactive stories and readers vote on plot directions by minting NFTs. Each chapter becomes an NFT, and readers influence the story's direction through voting mechanisms that reward both writers and engaged readers.

## 🌟 How It Works

1. **Writers** mint each chapter as an NFT and propose 2-4 plot directions
2. **Readers** vote on plot directions by minting NFTs tied to their preferred options
3. **The plot option with the most votes** becomes the canonical next chapter
4. **Winners are rewarded** with ETH and special badges for their participation

### Key Features

- **ETH-based Economy**: All transactions use native ETH
- **Zora Protocol V3 Integration**: Leverages ZoraCreator1155Impl for NFT minting
- **Reward Distribution**: 80% to writers, 20% to winning voters
- **Badge System**: Winners and early voters receive special NFT badges
- **Rarity Mechanics**: NFTs have traits based on voting behavior and timing

## 💰 Economics Model

### Minting Fees
- Each vote costs a fixed fee (default: 0.001 ETH)
- Fee distribution:
  - **80%** → Story writer
  - **20%** → Chapter reward pool

### Voter Rewards
- Voters who choose the winning plot direction share the reward pool
- Distribution is equal among all winning voters
- Winning voters receive special "Winning Voter" badge metadata

### NFT Badges & Rarity
- 🥇 **Winning Voter Badge** - For voters who chose the winning option
- 🕒 **Early Voter Badge** - First 10 voters on any chapter
- 🎖️ **Rare Edition Traits** - Based on mint order and chapter logic

## 🔐 Security Features

- **Access Control**: Only story creators can propose options and finalize voting
- **Reentrancy Protection**: Guards against reentrancy attacks on ETH transfers
- **Double Voting Prevention**: Each address can only vote once per chapter
- **Input Validation**: Comprehensive bounds checking and validation
- **Pull Payment Pattern**: Safe ETH distribution mechanisms

---

**Built with ❤️ for decentralized storytelling on Zora Network**