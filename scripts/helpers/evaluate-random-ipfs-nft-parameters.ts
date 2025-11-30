import type { NetworkConnection } from "hardhat/types/network";
import { decodeEventLog, getContract, parseEther } from "viem";
import {
  deployMyVRFCoordinatorV25Mock,
  type MyVRFCoordinatorV25Mock,
} from "./deploy-my-vrf-coordinator-v2-5-mock.js";
import { isDevelopmentChain, zeroGasLane } from "./deployment-helpers.js";

export const evaluateRandomIpfsNftParameters = async (
  connection: NetworkConnection,
) => {
  const { networkConfig, viem } = connection;
  const chainId = networkConfig.chainId;
  const publicClient = await viem.getPublicClient();

  if (isDevelopmentChain(chainId)) {
    const MyVRFCoordinatorV25Mock =
      await deployMyVRFCoordinatorV25Mock(connection);
    const hash = await MyVRFCoordinatorV25Mock.write.createSubscription();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt) {
      throw new Error("Failed to create VRF subscription");
    }

    const firstLog = receipt.logs[0];
    const decodedLog = decodeEventLog({
      abi: [MyVRFCoordinatorV25Mock.abi[31]],
      data: firstLog.data,
      topics: firstLog.topics,
    });
    const subscriptionId = decodedLog.args.subId;
    await MyVRFCoordinatorV25Mock.write.fundSubscription([
      subscriptionId,
      parseEther("100"),
    ]);

    return {
      vrfCoordinator: MyVRFCoordinatorV25Mock,
      requestFee: parseEther("0.1"),
      gasLane: zeroGasLane,
      subscriptionId,
      callbackGasLimit: 500000,
    };
  }

  if (chainId === 11155111) {
    const vrfCoordinatorAddress = process.env.SEPOLIA_VRF_COORDINATOR_ADDRESS;
    const requestFee = process.env.SEPOLIA_RANDOM_IPFS_NFT_REQUEST_FEE;
    const gasLane = process.env.SEPOLIA_RANDOM_IPFS_NFT_GAS_LANE;
    const subscriptionId = process.env.SEPOLIA_RANDOM_IPFS_NFT_SUBSCRIPTION_ID;
    const callbackGasLimit =
      process.env.SEPOLIA_RANDOM_IPFS_NFT_CALLBACK_GAS_LIMIT;

    const vrfCoordinator = getContract({
      address: vrfCoordinatorAddress,
      abi: [],
      client: publicClient,
    }) as unknown as MyVRFCoordinatorV25Mock;

    return {
      vrfCoordinator,
      requestFee: parseEther(requestFee),
      gasLane,
      subscriptionId: BigInt(subscriptionId),
      callbackGasLimit: parseInt(callbackGasLimit, 10),
    };
  }

  throw new Error(`Unsupported network with chain ID ${chainId}`);
};
