import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RandomIpfsNft", (m) => {
  const randomIpfsNft = m.contract("RandomIpfsNft", [
    m.getParameter("vrfCoordinator"),
    m.getParameter("requestFee"),
    m.getParameter("gasLane"),
    m.getParameter("subscriptionId"),
    m.getParameter("callbackGasLimit"),
  ]);

  return { randomIpfsNft };
});
