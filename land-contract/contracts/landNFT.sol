// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./ERC721.sol";
import "./ERC721Burnable.sol";
import "./Ownable.sol";
import "./Counters.sol";

contract LandNFT is ERC721, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;
    address private admin;

    struct landNFT {
        uint256 id;
        address owner;
        uint256 mongoId;
    }
    landNFT landnft;

    mapping(address => uint256) private ownership;
    mapping(uint256 => landNFT) private propDetails;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("LandNFT", "LNFT") {
        admin = msg.sender;
    }

    modifier tokenOwner(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "Error : unauthorized account address.");
        _;
    }

    modifier onlyAdmin () {
        require(msg.sender == admin, "Error : unauthorized admin account address.");
        _;
    }

    //create new NFT for selected land at buyers address directly only by admin account
    function safeMint(address to, uint256 _id) external onlyAdmin {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        landnft.id = tokenId;
        landnft.owner = to;
        landnft.mongoId = _id;
        propDetails[tokenId] = landnft;
        ownership[to] += 1;
    }

    //get details of land with token _id
    function landDetails (uint256 _id) external view returns (landNFT memory) {
        return propDetails[_id];
    }

    //get balance details of user
    function balOf (address _addr) external view returns (uint256) {
        return ownership[_addr];
    }

    // The following functions are overrides required by Solidity.
    function _burn(uint256 _tokenId) internal override (ERC721) {
        super._burn(_tokenId);
    }

    //burn land nft
    function deleteNFT (uint256 _tokenId) external tokenOwner(_tokenId) {
        address owner = ownerOf(_tokenId);
        ownership[owner] -= 1;
        _burn(_tokenId);
    }

    //transfer ownership of land NFT
    function safeTransfer (address to, uint256 _tokenId) external tokenOwner(_tokenId){
        safeTransferFrom(msg.sender, to, _tokenId);
        propDetails[_tokenId].owner = to;
        ownership[to] += 1;
        ownership[msg.sender] -= 1;
    }
}