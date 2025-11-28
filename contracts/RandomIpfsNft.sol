// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

error RandomIpfsNft__NotContractOwner();
error RandomIpfsNft__NotEnoughEthSent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2Plus {
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    uint16 private constant REQUEST_CONFIRMATIONS = 3;

    uint256 private immutable I_REQUEST_FEE;
    bytes32 private immutable I_GAS_LANE;
    uint256 private immutable I_SUBSCRIPTION_ID;
    uint32 private immutable I_CALLBACK_GAS_LIMIT;

    address private immutable i_owner;
    uint256 private s_tokenCounter;
    uint16[] private s_breedPercentages = [10, 30, 100];

    mapping(uint256 => Breed) private s_tokenIdToBreed;
    mapping(uint256 => address) private s_requestIdToSender;
    mapping(address => uint256[]) private s_minterToTokenIds;

    event RandomBreedRequested(uint256 indexed requestId, address requester);

    event NftRequested(uint256 indexed requestId, address requester);

    event NftMinted(Breed breed, address minter);

    modifier onlyContractOwner() {
        if (msg.sender != i_owner) {
            revert RandomIpfsNft__NotContractOwner();
        }
        _;
    }

    constructor(
        address vrfCoordinator,
        uint256 requestFee,
        bytes32 gasLane,
        uint256 subscriptionId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        I_REQUEST_FEE = requestFee;
        I_GAS_LANE = gasLane;
        I_SUBSCRIPTION_ID = subscriptionId;
        I_CALLBACK_GAS_LIMIT = callbackGasLimit;

        i_owner = msg.sender;
        s_tokenCounter = 0;
    }

    function requestNft() public payable {
        if (msg.value < I_REQUEST_FEE) {
            revert RandomIpfsNft__NotEnoughEthSent();
        }

        uint256 requestId = requestRandomBreed(false);
        emit RandomBreedRequested(requestId, msg.sender);
    }

    function requestRandomBreed(
        bool enableNativePayment
    ) internal returns (uint256 requestId) {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: I_GAS_LANE,
                subId: I_SUBSCRIPTION_ID,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: I_CALLBACK_GAS_LIMIT,
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: enableNativePayment
                    })
                )
            })
        );
        s_requestIdToSender[requestId] = msg.sender;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        uint256 chance = randomWords[0] % 100;
        Breed breed = getBreedFromChance(chance);
        address minter = s_requestIdToSender[requestId];
        uint256 tokenId = s_tokenCounter;

        s_tokenIdToBreed[tokenId] = breed;
        s_minterToTokenIds[minter].push(tokenId);
        s_tokenCounter++;

        emit NftMinted(breed, minter);
    }

    function getBreedFromChance(uint256 chance) internal view returns (Breed) {
        for (uint16 i = 0; i < s_breedPercentages.length; i++) {
            if (chance < s_breedPercentages[i]) {
                return Breed(i);
            }
        }
        return Breed(s_breedPercentages.length - 1);
    }

    function withdraw() public onlyContractOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(i_owner).call{value: balance}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }
}
