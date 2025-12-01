import type { NetworkConnection } from "hardhat/types/network";
import RandomIpfsNftModule from "../../ignition/modules/RandomIpfsNft.js";
import type { MyVRFCoordinatorV25Mock } from "./deploy-my-vrf-coordinator-v2-5-mock.js";
import { isDevelopmentChain } from "./deployment-helpers.js";
import { verifyContractAfterDeployment } from "./verify-contract-after-deployment.js";

export const deployRandomIpfsNft = async (
  connection: NetworkConnection,
  vrfCoordinator: MyVRFCoordinatorV25Mock,
  requestFee: bigint,
  gasLane: string,
  subscriptionId: bigint,
  callbackGasLimit: number,
) => {
  const { networkName, networkConfig, ignition, viem } = connection;
  const chainId = networkConfig.chainId;

  console.log(
    `Deploying RandomIpfsNft on ${networkName} (chainId: ${chainId})...`,
  );
  const { randomIpfsNft } = await ignition.deploy(RandomIpfsNftModule, {
    parameters: {
      RandomIpfsNft: {
        vrfCoordinator: vrfCoordinator.address,
        requestFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
      },
    },
  });
  const randomIpfsNftAddress = randomIpfsNft.address;
  console.log(`RandomIpfsNft deployed at: ${randomIpfsNftAddress}`);

  if (isDevelopmentChain(chainId)) {
    const publicClient = await viem.getPublicClient();
    const hash = await vrfCoordinator.write.addConsumer([
      subscriptionId,
      randomIpfsNftAddress,
    ]);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      `Added RandomIpfsNft as a consumer to the VRF subscription (ID: ${subscriptionId}) on development chain.`,
    );
  }

  if (!isDevelopmentChain(chainId) && process.env.ETHERSCAN_API_KEY) {
    await verifyContractAfterDeployment({
      address: randomIpfsNftAddress,
      constructorArgs: [
        vrfCoordinator.address,
        requestFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
      ],
    });
  }

  return randomIpfsNft;
};
