import type { Address } from "viem";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TZ: "UTC";
      NODE_ENV: NodeJS.ProcessEnv;

      ETHERSCAN_API_KEY: string;

      SEPOLIA_RPC_URL: string;
      SEPOLIA_PRIVATE_KEY: string;

      SEPOLIA_VRF_COORDINATOR_ADDRESS: Address;
      SEPOLIA_RANDOM_IPFS_NFT_REQUEST_FEE: string;
      SEPOLIA_RANDOM_IPFS_NFT_GAS_LANE: Address;
      SEPOLIA_RANDOM_IPFS_NFT_SUBSCRIPTION_ID: string;
      SEPOLIA_RANDOM_IPFS_NFT_CALLBACK_GAS_LIMIT: string;
    }
  }
}
