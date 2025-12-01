import hre from "hardhat";
import { deployRandomIpfsNft } from "./helpers/deploy-random-ipfs-nft.js";
import { evaluateRandomIpfsNftParameters } from "./helpers/evaluate-random-ipfs-nft-parameters.js";

const main = async () => {
  const connection = await hre.network.connect();
  const params = await evaluateRandomIpfsNftParameters(connection);
  await deployRandomIpfsNft(
    connection,
    params.vrfCoordinator,
    params.requestFee,
    params.gasLane,
    params.subscriptionId,
    params.callbackGasLimit,
  );
};

main().catch(console.error);
