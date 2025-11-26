import hre from "hardhat";
import { deployBasicNft } from "./helpers/deploy-basic-nft.js";

const main = async () => {
  const connection = await hre.network.connect();
  await deployBasicNft(connection);
};

main().catch(console.error);
