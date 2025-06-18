import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChapterNFTModule = buildModule("ChapterNFTModule", (m) => {
  const chapterNFT = m.contract("ChapterNFT", ["Test Chapter", "TCHAP", m.getAccount(0)]);

  return { chapterNFT };
});

export default ChapterNFTModule;
