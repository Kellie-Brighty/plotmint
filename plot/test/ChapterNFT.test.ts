import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ChapterNFT } from "../typechain-types";

describe("ChapterNFT", function () {
    let chapterNFT: ChapterNFT
    let owner: HardhatEthersSigner;
    let nonOwner: HardhatEthersSigner;
    let buyer: HardhatEthersSigner;
    let addrs: HardhatEthersSigner[];
    const MINT_PRICE = ethers.parseEther("0.001");

    beforeEach(async function () {
        [owner, nonOwner, buyer, ...addrs] = await ethers.getSigners();
        
        const ChapterNFT = await ethers.getContractFactory("ChapterNFT");
        chapterNFT = await ChapterNFT.deploy(
            "Test Chapter",
            "TEST",
            owner.address
        );
    });

    describe("Initialization", function () {
        it("Should initialize with correct name and symbol", async function () {
            expect(await chapterNFT.name()).to.equal("Test Chapter");
            expect(await chapterNFT.symbol()).to.equal("TEST");
        });

        it("Should set correct owner", async function () {
            expect(await chapterNFT.owner()).to.equal(owner.address);
        });

        it("Should start with edition counter at 0", async function () {
            expect(await chapterNFT.currentEdition()).to.equal(0);
        });
    });

    describe("First Edition Minting", function () {
        it("Should allow owner to mint first edition", async function () {
            await chapterNFT.connect(owner).mintFirstEdition();
            expect(await chapterNFT.currentEdition()).to.equal(1);
            expect(await chapterNFT.ownerOf(1)).to.equal(owner.address);
        });

        it("Should not allow non-owner to mint first edition", async function () {
            await expect(
                chapterNFT.connect(nonOwner).mintFirstEdition()
            ).to.be.revertedWithCustomError(chapterNFT, "OwnableUnauthorizedAccount");
        });

        it("Should not allow minting first edition twice", async function () {
            await chapterNFT.connect(owner).mintFirstEdition();
            await expect(
                chapterNFT.connect(owner).mintFirstEdition()
            ).to.be.revertedWith("First edition already minted");
        });
    });

    describe("Public Edition Minting", function () {
        beforeEach(async function () {
            await chapterNFT.connect(owner).mintFirstEdition();
        });

        it("Should allow public minting with correct payment", async function () {
            await chapterNFT.connect(buyer).mintEdition({ value: MINT_PRICE });
            expect(await chapterNFT.currentEdition()).to.equal(2);
            expect(await chapterNFT.ownerOf(2)).to.equal(buyer.address);
        });

        it("Should not allow minting without sufficient payment", async function () {
            await expect(
                chapterNFT.connect(buyer).mintEdition({ value: 0 })
            ).to.be.revertedWith("Insufficient payment");
        });

        it("Should refund excess payment", async function () {
            const excessAmount = ethers.parseEther("0.2");
            const initialBalance = await ethers.provider.getBalance(buyer.address);
            
            const tx = await chapterNFT.connect(buyer).mintEdition({ 
                value: MINT_PRICE + excessAmount 
            });
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            
            const finalBalance = await ethers.provider.getBalance(buyer.address);
            const expectedBalance = initialBalance - MINT_PRICE - gasUsed;
            
            expect(finalBalance).to.equal(expectedBalance);
        });

        it("Should not allow minting before first edition", async function () {
            const newNFT = await (await ethers.getContractFactory("ChapterNFT")).deploy(
                "New Chapter",
                "NEW",
                owner.address
            );
            
            await expect(
                newNFT.connect(buyer).mintEdition({ value: MINT_PRICE })
            ).to.be.revertedWith("First edition not minted yet");
        });

        it("Should not allow minting beyond max editions", async function () {
            const maxEditions = await chapterNFT.MAX_EDITIONS();
            
            // Mint up to max editions
            for(let i = 2; i <= Number(maxEditions); i++) {
                await chapterNFT.connect(buyer).mintEdition({ value: MINT_PRICE });
            }
            
            await expect(
                chapterNFT.connect(buyer).mintEdition({ value: MINT_PRICE })
            ).to.be.revertedWith("Max editions reached");
        });
    });

    describe("Marketplace", function () {
        let tokenId: number;
        const listingPrice = ethers.parseEther("0.5");

        beforeEach(async function () {
            await chapterNFT.connect(owner).mintFirstEdition();
            tokenId = 1;
        });

        describe("Listing", function () {
            it("Should allow token owner to list", async function () {
                await chapterNFT.connect(owner).listForSale(tokenId, listingPrice);
                const listing = await chapterNFT.listings(tokenId);
                expect(listing.seller).to.equal(owner.address);
                expect(listing.price).to.equal(listingPrice);
                expect(listing.active).to.be.true;
            });

            it("Should not allow non-owner to list", async function () {
                await expect(
                    chapterNFT.connect(nonOwner).listForSale(tokenId, listingPrice)
                ).to.be.revertedWith("Not token owner");
            });

            it("Should not allow listing at zero price", async function () {
                await expect(
                    chapterNFT.connect(owner).listForSale(tokenId, 0)
                ).to.be.revertedWith("Price must be greater than 0");
            });

            it("Should not allow listing already listed token", async function () {
                await chapterNFT.connect(owner).listForSale(tokenId, listingPrice);
                await expect(
                    chapterNFT.connect(owner).listForSale(tokenId, listingPrice)
                ).to.be.revertedWith("Already listed");
            });
        });

        describe("Cancelling Listing", function () {
            beforeEach(async function () {
                await chapterNFT.connect(owner).listForSale(tokenId, listingPrice);
            });

            it("Should allow seller to cancel listing", async function () {
                await chapterNFT.connect(owner).cancelListing(tokenId);
                const listing = await chapterNFT.listings(tokenId);
                expect(listing.active).to.be.false;
            });

            it("Should not allow non-seller to cancel", async function () {
                await expect(
                    chapterNFT.connect(nonOwner).cancelListing(tokenId)
                ).to.be.revertedWith("Not seller");
            });
        });

        describe("Buying", function () {
            beforeEach(async function () {
                await chapterNFT.connect(owner).listForSale(tokenId, listingPrice);
            });

            it("Should allow buying with correct payment", async function () {
                await chapterNFT.connect(buyer).buyListed(tokenId, { value: listingPrice });
                expect(await chapterNFT.ownerOf(tokenId)).to.equal(buyer.address);
                const listing = await chapterNFT.listings(tokenId);
                expect(listing.active).to.be.false;
            });

            it("Should not allow buying without sufficient payment", async function () {
                await expect(
                    chapterNFT.connect(buyer).buyListed(tokenId, { value: 0 })
                ).to.be.revertedWith("Insufficient payment");
            });

            it("Should handle royalties correctly", async function () {
                const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
                
                const tx = await chapterNFT.connect(buyer).buyListed(tokenId, { 
                    value: listingPrice 
                });
                const receipt = await tx.wait();
                
                const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
                const royaltyAmount = (listingPrice * 1000n) / 10000n; // 10%
                const sellerAmount = listingPrice - royaltyAmount; // 90%
                
                // Owner gets both the seller amount and the royalties since they're both seller and creator
                const expectedTotal = sellerAmount + royaltyAmount;
                expect(finalOwnerBalance - initialOwnerBalance).to.equal(expectedTotal);
            });

            it("Should refund excess payment", async function () {
                const excessAmount = ethers.parseEther("0.1");
                const initialBalance = await ethers.provider.getBalance(buyer.address);
                
                const tx = await chapterNFT.connect(buyer).buyListed(tokenId, { 
                    value: listingPrice + excessAmount 
                });
                const receipt = await tx.wait();
                const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
                
                const finalBalance = await ethers.provider.getBalance(buyer.address);
                const expectedBalance = initialBalance - listingPrice - gasUsed;
                
                expect(finalBalance).to.equal(expectedBalance);
            });
        });
    });
});