// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {RandomIpfsNft} from "../RandomIpfsNft.sol";

/**
 * @title MaliciousContract
 * @notice Mock contract that deploys RandomIpfsNft and reverts when receiving ETH
 * @dev Used for testing the withdraw failure scenario
 */
contract MaliciousContract {
    RandomIpfsNft public randomIpfsNft;

    /**
     * @notice Deploys a new RandomIpfsNft contract with this contract as the owner
     */
    function deployRandomIpfsNft(
        address vrfCoordinator,
        uint256 requestFee,
        bytes32 gasLane,
        uint256 subscriptionId,
        uint32 callbackGasLimit
    ) external {
        randomIpfsNft = new RandomIpfsNft(
            vrfCoordinator,
            requestFee,
            gasLane,
            subscriptionId,
            callbackGasLimit
        );
    }

    /**
     * @notice Calls withdraw on the RandomIpfsNft contract
     */
    function callWithdraw() external {
        randomIpfsNft.withdraw();
    }

    /**
     * @notice Reverts when receiving ETH to simulate transfer failure
     */
    receive() external payable {
        revert("Transfer failed");
    }
}
