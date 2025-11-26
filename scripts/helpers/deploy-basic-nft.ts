import type { NetworkConnection } from "hardhat/types/network";
import BasicNftModule from "../../ignition/modules/BasicNft.js";
import { isDevelopmentChain } from "./deployment-helpers.js";
import { verifyContractAfterDeployment } from "./verify-contract-after-deployment.js";

export const deployBasicNft = async (connection: NetworkConnection) => {
  const { networkName, networkConfig, ignition } = connection;
  const chainId = networkConfig.chainId;

  console.log(`Deploying BasicNft on ${networkName} (chainId: ${chainId})...`);
  const { basicNft } = await ignition.deploy(BasicNftModule);
  const basicNftAddress = basicNft.address;

  console.log(`BasicNft deployed at: ${basicNftAddress}`);

  if (!isDevelopmentChain(chainId) && process.env.ETHERSCAN_API_KEY) {
    await verifyContractAfterDeployment({
      address: basicNftAddress,
      constructorArgs: [],
    });
  }

  return basicNft;
};
