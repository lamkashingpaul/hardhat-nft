// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

/**
 * @title A mock VRFCoordinatorV2_5 contract
 * @notice This contract is for testing purposes only
 * @dev This contract extends the VRFCoordinatorV2_5Mock from Chainlink
 * @author Paul Lam
 */
contract MyVRFCoordinatorV25Mock is VRFCoordinatorV2_5Mock {
    constructor(
        uint96 _baseFee,
        uint96 _gasPrice,
        int256 _weiPerUnitLink
    ) VRFCoordinatorV2_5Mock(_baseFee, _gasPrice, _weiPerUnitLink) {}
}
