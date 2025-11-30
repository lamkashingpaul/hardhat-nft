// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title A basic implementation of ERC721
 * @author Paul Lam
 * @notice This contract is for creating a basic NFT collection. It allows users to mint NFTs and provides a fixed token URI for all tokens.
 * @dev The token URI is hardcoded and does not change based on the token ID.
 */
contract BasicNft is ERC721 {
    /**
     * @notice The token URI for all NFTs in this collection. It points to a JSON file on IPFS that contains metadata about the NFT, such as its name, description, and image.
     */
    string public constant TOKEN_URI = // solhint-disable-line gas-small-strings
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    /**
     * @notice A counter to keep track of the number of tokens minted. It is used to assign unique token IDs to each newly minted NFT.
     */
    uint256 private s_tokenCounter;

    /**
     * @notice The constructor initializes the ERC721 contract with a name and symbol for the NFT collection. It also sets the initial token counter to zero.
     */
    constructor() ERC721("Dogie", "DOG") {
        s_tokenCounter = 0;
    }

    /**
     * @notice Mints a new NFT to the caller's address. The token ID is assigned based on the current value of the token counter, which is then incremented for the next minting.
     * @return The token ID of the newly minted NFT.
     */
    function mintNft() public returns (uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        ++s_tokenCounter;
        return s_tokenCounter - 1;
    }

    /**
     * @notice Returns the token URI for a given token ID. In this implementation, all tokens share the same URI, which points to a JSON file on IPFS containing metadata about the NFT.
     * @return The token URI for the specified token ID, which is the same for all
     */
    // solhint-disable-next-line use-natspec
    function tokenURI(
        uint256 /*tokenId*/
    ) public pure override returns (string memory) {
        return TOKEN_URI;
    }

    /**
     * @notice Returns the current value of the token counter, which indicates how many NFTs have been minted so far. This can be used to track the total supply of NFTs in this collection.
     * @return The current token counter value.
     */
    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
