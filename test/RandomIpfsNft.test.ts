import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import type {
  ContractReturnType,
  HardhatViemHelpers,
} from "@nomicfoundation/hardhat-viem/types";
import hre from "hardhat";
import { decodeEventLog, isAddressEqual, parseEther } from "viem";
import {
  isDevelopmentChain,
  zeroGasLane,
} from "../scripts/helpers/deployment-helpers.js";

const { networkConfig } = await hre.network.connect();
const chainId = networkConfig.chainId;
const isNotDevelopmentChain = !isDevelopmentChain(chainId);

describe("RandomIpfsNft", { skip: isNotDevelopmentChain }, () => {
  const initialBaseFee = parseEther("0.01");
  const initialGasPriceLink = parseEther("1", "gwei");
  const initialWeiPerUnitLink = parseEther("0.02");

  const initialRequestFee = parseEther("0.01");
  const initialGasLane = zeroGasLane;
  const initialCallbackGasLimit = 500000;

  let viem: HardhatViemHelpers;
  let publicClient: Awaited<ReturnType<HardhatViemHelpers["getPublicClient"]>>;
  let myVrfCoordinatorV25Mock: Awaited<
    ContractReturnType<"MyVRFCoordinatorV25Mock">
  >;
  let randomIpfsNft: Awaited<ContractReturnType<"RandomIpfsNft">>;
  type RandomIpfsErrors = Extract<
    (typeof randomIpfsNft.abi)[number],
    { type: "error" }
  >["name"];
  type RandomIpfsEvents = Extract<
    (typeof randomIpfsNft.abi)[number],
    { type: "event" }
  >["name"];

  beforeEach(async () => {
    const connection = await hre.network.connect();
    viem = connection.viem;
    publicClient = await viem.getPublicClient();
    myVrfCoordinatorV25Mock = await viem.deployContract(
      "MyVRFCoordinatorV25Mock",
      [initialBaseFee, initialGasPriceLink, initialWeiPerUnitLink],
    );

    const hash = await myVrfCoordinatorV25Mock.write.createSubscription();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const firstEventLog = receipt.logs[0];
    const decodedLog = decodeEventLog({
      abi: [myVrfCoordinatorV25Mock.abi[31]],
      data: firstEventLog.data,
      topics: firstEventLog.topics,
    });
    const subscriptionId = decodedLog.args.subId;
    await myVrfCoordinatorV25Mock.write.fundSubscription([
      subscriptionId,
      parseEther("100"),
    ]);

    randomIpfsNft = await viem.deployContract("RandomIpfsNft", [
      myVrfCoordinatorV25Mock.address,
      initialRequestFee,
      initialGasLane,
      subscriptionId,
      initialCallbackGasLimit,
    ]);

    await myVrfCoordinatorV25Mock.write.addConsumer([
      subscriptionId,
      randomIpfsNft.address,
    ]);
  });

  describe("constructor", () => {
    it("initializes the contract with the correct parameters", async () => {
      const requestFee = await randomIpfsNft.read.getRequestFee();
      const gasLane = await randomIpfsNft.read.getGasLane();
      const callbackGasLimit = await randomIpfsNft.read.getCallbackGasLimit();

      assert.strictEqual(requestFee, initialRequestFee);
      assert.strictEqual(gasLane, initialGasLane);
      assert.strictEqual(callbackGasLimit, initialCallbackGasLimit);
    });
  });

  describe("requestNft", () => {
    it("reverts if the request fee is less than the required amount", async () => {
      const requestFee = await randomIpfsNft.read.getRequestFee();
      const fee = requestFee - parseEther("0.001");
      const expectedError: RandomIpfsErrors = "RandomIpfsNft__NotEnoughEthSent";

      await viem.assertions.revertWithCustomError(
        randomIpfsNft.write.requestNft({ value: fee }),
        randomIpfsNft,
        expectedError,
      );
    });

    it("emits event of RandomBreedRequested with correct parameters", async () => {
      const requestFee = await randomIpfsNft.read.getRequestFee();
      const [senderWallet] = await viem.getWalletClients();

      const hash = await randomIpfsNft.write.requestNft({
        value: requestFee,
        account: senderWallet.account.address,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // the first event log receipt.logs[0] is emitted by the MyVRFCoordinatorV25Mock contract when the requestRandomWords function is called inside the requestNft function, and the second event log receipt.logs[1] is emitted by the RandomIpfsNft contract when the requestNft function is called.
      const decodedLog = decodeEventLog({
        abi: [randomIpfsNft.abi[12]],
        data: receipt.logs[1].data,
        topics: receipt.logs[1].topics,
      });

      const expectedEventName: RandomIpfsEvents = "RandomBreedRequested";
      const eventName = decodedLog.eventName;
      assert.strictEqual(eventName, expectedEventName);

      const requestId = decodedLog.args.requestId;
      const requester = decodedLog.args.requester;
      const recordedRequestIds = await randomIpfsNft.read.getRequestIds([
        senderWallet.account.address,
      ]);
      const recordedRequester = await randomIpfsNft.read.getSender([requestId]);

      assert.strictEqual(requestId, recordedRequestIds[0]);
      assert.ok(isAddressEqual(requester, senderWallet.account.address));
      assert.ok(
        isAddressEqual(recordedRequester, senderWallet.account.address),
      );
    });
  });

  describe("fulfillRandomWords", () => {
    beforeEach(async () => {
      const requestFee = await randomIpfsNft.read.getRequestFee();
      const [senderWallet] = await viem.getWalletClients();
      await randomIpfsNft.write.requestNft({
        value: requestFee,
        account: senderWallet.account.address,
      });
    });

    it("mints an NFT to the requester with the correct token id", async () => {
      const [senderWallet] = await viem.getWalletClients();
      await myVrfCoordinatorV25Mock.write.fulfillRandomWordsWithOverride([
        1n,
        randomIpfsNft.address,
        [0n],
      ]);
      const tokenIds = await randomIpfsNft.read.getTokenIdsByMinter([
        senderWallet.account.address,
      ]);
      assert.strictEqual(tokenIds.length, 1);

      const tokenId = tokenIds[0];
      const expectedTokenId = 0n;
      assert.strictEqual(tokenId, expectedTokenId);
    });

    it("emits event of NftMinted with correct parameters", async () => {
      const [senderWallet] = await viem.getWalletClients();
      const requestFee = await randomIpfsNft.read.getRequestFee();
      const chanceToExpectedBreed = {
        50: 0,
        80: 1,
        95: 2,
        100: 0,
      };

      for (const [chance, expectedBreed] of Object.entries(
        chanceToExpectedBreed,
      )) {
        const expectedTokenId = await randomIpfsNft.read.getTokenCounter();
        const hashForRequestNft = await randomIpfsNft.write.requestNft({
          value: requestFee,
          account: senderWallet.account.address,
        });
        const receiptForRequestNft =
          await publicClient.waitForTransactionReceipt({
            hash: hashForRequestNft,
          });
        // the first event log receipt.logs[0] is emitted by the MyVRFCoordinatorV25Mock contract when the requestRandomWords function is called inside the requestNft function, and the second event log receipt.logs[1] is emitted by the RandomIpfsNft contract when the requestNft function is called.
        const decodedLogForRequestNft = decodeEventLog({
          abi: [randomIpfsNft.abi[12]],
          data: receiptForRequestNft.logs[1].data,
          topics: receiptForRequestNft.logs[1].topics,
        });
        const requestId = decodedLogForRequestNft.args.requestId;

        const hash =
          await myVrfCoordinatorV25Mock.write.fulfillRandomWordsWithOverride([
            requestId,
            randomIpfsNft.address,
            [BigInt(chance)],
          ]);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        });
        const decodedLog = decodeEventLog({
          abi: [randomIpfsNft.abi[8]],
          data: receipt.logs[0].data,
          topics: receipt.logs[0].topics,
        });

        const expectedEventName: RandomIpfsEvents = "NftMinted";
        const eventName = decodedLog.eventName;
        const breed = decodedLog.args.breed;
        const minter = decodedLog.args.minter;

        const recordedBreed = await randomIpfsNft.read.getBreedFromTokenId([
          expectedTokenId,
        ]);

        assert.strictEqual(eventName, expectedEventName);
        assert.strictEqual(breed, expectedBreed);
        assert.strictEqual(breed, recordedBreed);
        assert.ok(isAddressEqual(minter, senderWallet.account.address));
      }
    });
  });

  describe("withdraw", () => {
    it("reverts if the caller is not the owner", async () => {
      const [_, nonOwnerWallet] = await viem.getWalletClients();
      const expectedError: RandomIpfsErrors = "RandomIpfsNft__NotContractOwner";
      await viem.assertions.revertWithCustomError(
        randomIpfsNft.write.withdraw({
          account: nonOwnerWallet.account.address,
        }),
        randomIpfsNft,
        expectedError,
      );
    });

    it("allows the owner to withdraw the accumulated funds", async () => {
      const [ownerWallet] = await viem.getWalletClients();
      const requestFee = await randomIpfsNft.read.getRequestFee();
      await randomIpfsNft.write.requestNft({
        value: requestFee,
        account: ownerWallet.account.address,
      });
      const initialOwnerBalance = await publicClient.getBalance({
        address: ownerWallet.account.address,
      });
      const hash = await randomIpfsNft.write.withdraw({
        account: ownerWallet.account.address,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;
      const finalOwnerBalance = await publicClient.getBalance({
        address: ownerWallet.account.address,
      });
      assert.strictEqual(
        finalOwnerBalance,
        initialOwnerBalance + requestFee - gasUsed,
      );
    });

    it("reverts if the transfer fails", async () => {
      // Deploy a malicious contract that will revert when receiving ETH
      const maliciousContract = await viem.deployContract(
        "MaliciousContract",
        [],
      );

      // Get subscription ID for the malicious contract's RandomIpfsNft
      const hash = await myVrfCoordinatorV25Mock.write.createSubscription();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const firstEventLog = receipt.logs[0];
      const decodedLog = decodeEventLog({
        abi: [myVrfCoordinatorV25Mock.abi[31]],
        data: firstEventLog.data,
        topics: firstEventLog.topics,
      });
      const subscriptionId = decodedLog.args.subId;
      await myVrfCoordinatorV25Mock.write.fundSubscription([
        subscriptionId,
        parseEther("100"),
      ]);

      // Have the malicious contract deploy RandomIpfsNft (making it the owner)
      await maliciousContract.write.deployRandomIpfsNft([
        myVrfCoordinatorV25Mock.address,
        initialRequestFee,
        initialGasLane,
        subscriptionId,
        initialCallbackGasLimit,
      ]);

      const randomIpfsNftAddress = await maliciousContract.read.randomIpfsNft();
      const randomIpfsNftFromMalicious = await viem.getContractAt(
        "RandomIpfsNft",
        randomIpfsNftAddress,
      );

      await myVrfCoordinatorV25Mock.write.addConsumer([
        subscriptionId,
        randomIpfsNftFromMalicious.address,
      ]);

      // Fund the contract by requesting an NFT
      const [userWallet] = await viem.getWalletClients();
      await randomIpfsNftFromMalicious.write.requestNft({
        value: initialRequestFee,
        account: userWallet.account.address,
      });

      // Try to withdraw - should revert because malicious contract reverts on receive
      const expectedError: RandomIpfsErrors = "RandomIpfsNft__TransferFailed";
      await viem.assertions.revertWithCustomError(
        maliciousContract.write.callWithdraw(),
        randomIpfsNftFromMalicious,
        expectedError,
      );
    });
  });

  describe("getTokenIdsByMinter", () => {
    it("returns the correct token IDs for a given minter", async () => {
      const [senderWallet] = await viem.getWalletClients();
      const requestFee = await randomIpfsNft.read.getRequestFee();
      const hash = await randomIpfsNft.write.requestNft({
        value: requestFee,
        account: senderWallet.account.address,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const decodedLog = decodeEventLog({
        abi: [randomIpfsNft.abi[12]],
        data: receipt.logs[1].data,
        topics: receipt.logs[1].topics,
      });
      const requestId = decodedLog.args.requestId;

      await myVrfCoordinatorV25Mock.write.fulfillRandomWordsWithOverride([
        requestId,
        randomIpfsNft.address,
        [0n],
      ]);

      const tokenIds = await randomIpfsNft.read.getTokenIdsByMinter([
        senderWallet.account.address,
      ]);
      assert.deepStrictEqual(tokenIds, [0n]);
    });
  });

  describe("getBreedFromTokenId", () => {
    it("returns the 0 if the token ID is not minted yet", async () => {
      const breed = await randomIpfsNft.read.getBreedFromTokenId([99n]);
      assert.strictEqual(breed, 0);
    });

    it("returns the correct breed for a given token ID", async () => {
      const expectedTokenId = await randomIpfsNft.read.getTokenCounter();
      const [senderWallet] = await viem.getWalletClients();
      const requestFee = await randomIpfsNft.read.getRequestFee();
      const hash = await randomIpfsNft.write.requestNft({
        value: requestFee,
        account: senderWallet.account.address,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const decodedLog = decodeEventLog({
        abi: [randomIpfsNft.abi[12]],
        data: receipt.logs[1].data,
        topics: receipt.logs[1].topics,
      });
      const requestId = decodedLog.args.requestId;

      await myVrfCoordinatorV25Mock.write.fulfillRandomWordsWithOverride([
        requestId,
        randomIpfsNft.address,
        [75n],
      ]);

      const breed = await randomIpfsNft.read.getBreedFromTokenId([
        expectedTokenId,
      ]);
      assert.strictEqual(breed, 1);
    });
  });

  describe("getBreedPercentages", () => {
    it("returns the correct breed percentages", async () => {
      const breedPercentages = await randomIpfsNft.read.getBreedPercentages();
      assert.deepStrictEqual(breedPercentages, [70, 90, 100]);
    });
  });
});
