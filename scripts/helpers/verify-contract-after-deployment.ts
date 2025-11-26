import {
  type VerifyContractArgs,
  verifyContract,
} from "@nomicfoundation/hardhat-verify/verify";
import hre from "hardhat";

export const verifyContractAfterDeployment = async (
  verifyContractArgs: VerifyContractArgs,
) => {
  await verifyContract({ provider: "etherscan", ...verifyContractArgs }, hre);
};
