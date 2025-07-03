import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PlotMintModule = buildModule("PlotMintModule", (m) => {
  // Deploy ChapterNFTFactory
  const chapterNFTFactory = m.contract("ChapterNFTFactory");

  // Deploy a sample ChapterNFT (for testing)
  const sampleChapterNFT = m.contract("ChapterNFT", ["Test Chapter", "TCHAP", m.getAccount(0)]);

  return {
    chapterNFTFactory,
    sampleChapterNFT
  };
});

export default PlotMintModule;
