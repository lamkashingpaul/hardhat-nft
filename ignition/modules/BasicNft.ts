import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BasicNft", (m) => {
  const basicNft = m.contract("BasicNft", []);
  return { basicNft };
});
