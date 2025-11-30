import type { NetworkConnection } from "hardhat/types/network";
import MyVRFCoordinatorV25MockModule from "../../ignition/modules/mocks/MyVRFCoordinatorV25Mock.js";

export const deployMyVRFCoordinatorV25Mock = async (
  connection: NetworkConnection,
) => {
  const { networkName, ignition } = connection;

  console.log(`Deploying MyVRFCoordinatorV25Mock on ${networkName} ...`);
  const { MyVRFCoordinatorV25Mock } = await ignition.deploy(
    MyVRFCoordinatorV25MockModule,
  );

  const address = MyVRFCoordinatorV25Mock.address;
  console.log(`MyVRFCoordinatorV25Mock deployed at: ${address}`);

  return MyVRFCoordinatorV25Mock;
};

export type MyVRFCoordinatorV25Mock = Awaited<
  ReturnType<typeof deployMyVRFCoordinatorV25Mock>
>;
