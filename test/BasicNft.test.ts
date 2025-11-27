import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import type {
  ContractReturnType,
  HardhatViemHelpers,
} from "@nomicfoundation/hardhat-viem/types";
import hre from "hardhat";
import { isDevelopmentChain } from "../scripts/helpers/deployment-helpers.js";

const { networkConfig } = await hre.network.connect();
const chainId = networkConfig.chainId;
const isNotDevelopmentChain = !isDevelopmentChain(chainId);

describe("BasicNft", { skip: isNotDevelopmentChain }, () => {
  let viem: HardhatViemHelpers;
  let publicClient: Awaited<ReturnType<HardhatViemHelpers["getPublicClient"]>>;
  let basicNft: Awaited<ContractReturnType<"BasicNft">>;

  beforeEach(async () => {
    const connection = await hre.network.connect();
    viem = connection.viem;
    publicClient = await viem.getPublicClient();
    basicNft = await viem.deployContract("BasicNft");
  });

  describe("constructor", () => {
    it("initializes the token counter to zero", async () => {
      const tokenCounter = await basicNft.read.getTokenCounter();
      assert.strictEqual(
        tokenCounter,
        0n,
        "Token counter should be initialized to zero",
      );
    });

    it("sets the correct name and symbol for the NFT collection", async () => {
      const name = await basicNft.read.name();
      const symbol = await basicNft.read.symbol();
      assert.strictEqual(name, "Dogie", "Name should be 'Dogie'");
      assert.strictEqual(symbol, "DOG", "Symbol should be 'DOG'");
    });
  });

  describe("tokenURI", () => {
    it("returns the correct token URI for any token ID", async () => {
      const tokenId = 0n;
      const tokenURI = await basicNft.read.tokenURI([tokenId]);
      const expectedURI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";
      assert.strictEqual(
        tokenURI,
        expectedURI,
        "Token URI should match the expected URI",
      );
    });
  });

  describe("mintNft", () => {
    it("returns the correct token ID when minting a new NFT", async () => {
      const { result: tokenId } = await publicClient.simulateContract({
        address: basicNft.address,
        abi: basicNft.abi,
        functionName: "mintNft",
      });
      assert.strictEqual(
        tokenId,
        0n,
        "Token ID of the first minted NFT should be 0",
      );
    });

    it("mints a new NFT and increments the token counter", async () => {
      const initialTokenCounter = await basicNft.read.getTokenCounter();
      await basicNft.write.mintNft();
      const newTokenCounter = await basicNft.read.getTokenCounter();
      assert.strictEqual(
        newTokenCounter,
        initialTokenCounter + 1n,
        "Token counter should be incremented by 1 after minting",
      );
    });
  });
});
