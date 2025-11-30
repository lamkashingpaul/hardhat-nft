import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const baseFee = 10000000000000000n; // 0.01 LINK
const gasPrice = 1000000000n; // 1 Gwei
const weiPerUnitLink = 2000000000000000n; // 0.002 ETH per LINK

export default buildModule("MyVRFCoordinatorV25Mock", (m) => {
  const MyVRFCoordinatorV25Mock = m.contract("MyVRFCoordinatorV25Mock", [
    m.getParameter("baseFee", baseFee),
    m.getParameter("gasPrice", gasPrice),
    m.getParameter("weiPerUnitLink", weiPerUnitLink),
  ]);
  return { MyVRFCoordinatorV25Mock };
});
