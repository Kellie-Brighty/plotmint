import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ChapterNFT, ChapterNFTFactory } from "../typechain-types";

describe("ChapterNFTFactory", function () {
  let factory: ChapterNFTFactory;
  let owner: SignerWithAddress;
  let writer: SignerWithAddress;
  let reader: SignerWithAddress;

  beforeEach(async function () {
    [owner, writer, reader] = await ethers.getSigners();

    // Deploy factory
    const Factory = await ethers.getContractFactory("ChapterNFTFactory");
    factory = await Factory.deploy();
  });

  describe("createChapterNFT", function () {
    it("should create a new ChapterNFT contract", async function () {
      const tx = await factory.connect(writer).createChapterNFT(
        1, // chapterId
        "My Chapter NFT",
        "CHAP1"
      );
      
      const receipt = await tx.wait();
      
      // Get event data
      const event = receipt?.logs?.find(
        (e: any) => e.fragment?.name === "ChapterNFTCreated"
      ) as EventLog;
      expect(event).to.not.be.undefined;
      
      const [nftAddress, chapterId, creator] = event!.args!;
      
      // Verify mappings
      expect(await factory.chapterNFTs(1)).to.equal(nftAddress);
      expect(await factory.nftChapterIds(nftAddress)).to.equal(1);
      expect(creator).to.equal(writer.address);
      
      // Verify NFT contract state
      const nft = await ethers.getContractAt("ChapterNFT", nftAddress);
      expect(await nft.name()).to.equal("My Chapter NFT");
      expect(await nft.symbol()).to.equal("CHAP1");
      expect(await nft.owner()).to.equal(writer.address);
    });

    it("shouldn't allow creating duplicate chapter NFTs", async function () {
      await factory.connect(writer).createChapterNFT(1, "First", "ONE");
      await expect(
        factory.connect(writer).createChapterNFT(1, "Duplicate", "DUP")
      ).to.be.revertedWith("Chapter NFT already exists");
    });
  });

  describe("getChapterNFT", function () {
    it("should return the correct NFT address", async function () {
      const tx = await factory.connect(writer).createChapterNFT(1, "Test", "TEST");
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        (log: any) => log.fragment?.name === "ChapterNFTCreated"
      ) as EventLog;
      const nftAddress = event!.args![0];

      expect(await factory.getChapterNFT(1)).to.equal(nftAddress);
    });

    it("should return zero address for non-existent chapters", async function () {
      expect(await factory.getChapterNFT(999)).to.equal(
        ethers.ZeroAddress
      );
    });
  });

  describe("isChapterNFT", function () {
    it("should correctly identify ChapterNFT contracts", async function () {
      const tx = await factory.connect(writer).createChapterNFT(1, "Test", "TEST");
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        (log: any) => log.fragment?.name === "ChapterNFTCreated"
      ) as EventLog;
      const nftAddress = event!.args![0];

      expect(await factory.isChapterNFT(nftAddress)).to.be.true;
      expect(await factory.isChapterNFT(factory.target)).to.be.false;
    });
  });

  describe("ChapterNFT integration", function () {
    let chapterNFT: ChapterNFT;

    beforeEach(async function () {
      const tx = await factory.connect(writer).createChapterNFT(1, "Test", "TEST");
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        (log: any) => log.fragment?.name === "ChapterNFTCreated"
      ) as EventLog;
      const nftAddress = event!.args![0];
      chapterNFT = await ethers.getContractAt("ChapterNFT", nftAddress);
    });

    it("should allow creator to mint first edition", async function () {
      await chapterNFT.connect(writer).mintFirstEdition();
      const currentEdition = await chapterNFT.currentEdition();
      expect(currentEdition).to.equal(1);
      expect(await chapterNFT.ownerOf(1)).to.equal(writer.address);
    });

    it("should allow readers to mint subsequent editions", async function () {
      // Creator mints first
      await chapterNFT.connect(writer).mintFirstEdition();
      
      // Reader mints second
      const mintPrice = await chapterNFT.MINT_PRICE();
      await chapterNFT.connect(reader).mintEdition({ value: mintPrice });
      
      expect(await chapterNFT.currentEdition()).to.equal(2);
      expect(await chapterNFT.ownerOf(2)).to.equal(reader.address);
    });

    it("shouldn't allow non-creator to mint first edition", async function () {
      await expect(
        chapterNFT.connect(reader).mintFirstEdition()
      ).to.be.revertedWithCustomError(chapterNFT, "OwnableUnauthorizedAccount");
    });

    it("shouldn't allow minting before first edition", async function () {
      const mintPrice = await chapterNFT.MINT_PRICE();
      await expect(
        chapterNFT.connect(reader).mintEdition({ value: mintPrice })
      ).to.be.revertedWith("First edition not minted yet");
    });
  });
});
