import type { Address } from "viem";

export const zeroGasLane =
  `0x0000000000000000000000000000000000000000000000000000000000000000` as Address;

export const developmentChainIds = new Set<number>([
  31337, // Hardhat
  1337, // Localhost
]);

export const isDevelopmentChain = (chainId?: number): boolean => {
  if (chainId === undefined) {
    throw new Error("Chain ID is undefined");
  }

  return developmentChainIds.has(chainId);
};
