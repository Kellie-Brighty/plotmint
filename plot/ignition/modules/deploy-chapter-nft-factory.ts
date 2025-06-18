import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChapterNFTFactoryModule = buildModule("ChapterNFTFactoryModule", (m) => {
  const chapterNFTFactory = m.contract("ChapterNFTFactory");

  return { chapterNFTFactory };
});

export default ChapterNFTFactoryModule;
