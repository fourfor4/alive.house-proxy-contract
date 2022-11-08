// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "../../erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../RegistryContracts/AliveRegistry.sol";

contract AliveCommonSong is
    ERC721AUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    /** @dev A struct that is a drop, a drop is a Matic Drop, that will be available for all the token holders at particular time to be able to claim and receive their share of matic  **/

    struct Drop {
        uint256 dropID;
        uint256 dropTotalAmount;
        uint256 dropPerNFT;
        uint256 totalClaimed;
        uint256 dropNumber;
    }

    /** @dev mapping for keeping track of drops and claims */

    mapping(uint256 => mapping(uint256 => bool)) public claimedOfTokenId;

    bytes32 constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    /** @dev some state variables */

    address public aliveRegistry; // address of the AliveRegistry contract, that stores all the important and dynamic data
    address public mintRoyaltyReceiver; // tha address where the funds will be sent to in each txn
    address public band; // address of the band, off which this song or nft is part of

    string baseURI; // the baseURI
    string public contractURI; // the song contract URI(for opensea)

    uint256 public offchainRoyaltyPercentageInBips; // the streaming revenue distribution of this particular edition, this is not each nft,
    // but each edition offchain distribution, to calculate how much a particular nft holder will get, we need to divide this by totalSupply

    uint256 public maxMintAmount; // masSupply of the nft collection

    Drop[] public allDrops; // collection of all the drops done by the artist for this particular edition

    mapping(address => uint256[]) public addressTokenIds;

    // Modifier
    modifier onlyGovernor() {
        require(
            AliveRegistry(aliveRegistry).isManagerWallet(msg.sender) == true ||
                hasRole(GOVERNANCE_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "only governor"
        );
        _;
    }

    // manager is fetched from registry contract, a manger has permission for functions that deploy some sort of contract or reste some data

    modifier onlyAdmin() {
        require(
            AliveRegistry(aliveRegistry).isManagerWallet(msg.sender) == true
        );
        _;
    }

    // Events
    event SongMinted(
        address owner,
        uint256 quantity,
        uint256 totalSupply,
        address songAddress
    );

    event ClaimDrop(
        address owner,
        uint256 dropID,
        uint256 tokenID,
        uint256 amount
    );

    event ClaimAllDrop(address owner, uint256 tokenID);

    /** @dev function that creates new drop, so artist or manager can send money through this function and it will use it as a drop which can be claimd equally by all token holders */

    function newDrop() public payable onlyGovernor {
        require(
            msg.value > 1 ether,
            "Min drop amount must be bigger than 1 ether!"
        );

        uint256 dropPerUnit = getdropPerUnit(msg.value, totalSupply());
        uint256 id = allDrops.length + 1;
        Drop memory newdrop = Drop(
            id,
            msg.value,
            dropPerUnit,
            0,
            totalSupply()
        );
        allDrops.push(newdrop);
        if (msg.value % totalSupply() != 0) {
            payable(msg.sender).transfer(msg.value % totalSupply());
        }
    }

    /** @dev a function to claim all the drops and send the money to particular token holder at the moment */

    function claimAllDrop(uint256 tokenID)
        external
        nonReentrant
        returns (bool success)
    {
        require(allDrops.length > 0, "No drops yet");

        unchecked {
            for (uint256 i = 1; i <= allDrops.length; i++) {
                if (
                    claimedOfTokenId[i][tokenID] == false &&
                    allDrops[i - 1].totalClaimed < allDrops[i - 1].dropNumber
                ) {
                    _claimDrop(i, tokenID);
                }
            }
        }
        emit ClaimAllDrop(ownerOf(tokenID), tokenID);
        return true;
    }

    function _claimDrop(uint256 dropID, uint256 tokenID) internal {
        require(claimedOfTokenId[dropID][tokenID] == false, "Already claimed");

        payable(ownerOf(tokenID)).transfer(allDrops[dropID - 1].dropPerNFT);
        claimedOfTokenId[dropID][tokenID] = true;
        emit ClaimDrop(
            ownerOf(tokenID),
            dropID,
            tokenID,
            allDrops[dropID - 1].dropPerNFT
        );

        unchecked {
            allDrops[dropID - 1].totalClaimed++;
        }
    }

    /** @dev function to claim a Drop that was done by the artist/owner. notice that this function doesn't require the msg.sender to be the holder of the nft, it distributes the funds on basis of token id ansd theiir holder and the time of distribution */
    function claimDrop(uint256 dropID, uint256 tokenID)
        public
        nonReentrant
        returns (bool)
    {
        require(allDrops.length >= dropID, "Drop doesn't exist");
        require(
            allDrops[dropID - 1].totalClaimed < allDrops[dropID - 1].dropNumber,
            "Drop empty"
        );
        _claimDrop(dropID, tokenID);
        return true;
    }

    // Get Claimed Status by Token ID - for instance : [true, false, ...] or [false, false, ...]

    function getClaimStatusByTokenID(uint256 tokenID)
        public
        view
        returns (bool[] memory)
    {
        uint256 length = allDrops.length;
        bool[] memory returnVal = new bool[](length);
        for (uint256 i = 1; i <= length; i++) {
            returnVal[i - 1] = claimedOfTokenId[i][tokenID];
        }
        return returnVal;
    }

    // get balance available from the drops which is unclaimed

    function myTotalBalance(uint256 _tokenId) public view returns (uint256) {
        require(allDrops.length > 0, "no drops yet");
        uint256 bal;
        uint256 start = 1;
        unchecked {
            for (uint256 i = start; i <= allDrops.length; i++) {
                if (
                    allDrops[i - 1].totalClaimed < allDrops[i - 1].dropNumber &&
                    claimedOfTokenId[i][_tokenId] == false
                ) {
                    bal = bal + allDrops[i - 1].dropPerNFT;
                }
            }
        }

        return bal;
    }

    // Get all token IDs by owner

    function getAllTokensByOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 length = addressTokenIds[_owner].length;
        uint256[] memory tokenIDs = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            tokenIDs[i] = addressTokenIds[_owner][i];
        }
        return tokenIDs;
    }

    function batchAirDrop(
        address[] memory _arrayOfReceivers,
        uint256 _amountForEach
    ) public onlyGovernor {
        require(
            totalSupply() + _arrayOfReceivers.length * _amountForEach <=
                maxMintAmount,
            "can't mint more than supply"
        );
        unchecked {
            for (uint256 i = 0; i < _arrayOfReceivers.length; i++) {
                super._mint(_arrayOfReceivers[i], _amountForEach);
            }
        }
    }

    function getAllDrops() public view returns (Drop[] memory) {
        return allDrops;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        string memory tempBaseURI = _baseURI();
        return
            bytes(tempBaseURI).length != 0
                ? string(abi.encodePacked(tempBaseURI))
                : "";
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setRoyalties(
        uint256 _tokenId,
        address payable _royaltiesReceipientAddress,
        uint96 _percentageBasisPoints
    ) public onlyAdmin {
        _setTokenRoyalty(
            _tokenId,
            _royaltiesReceipientAddress,
            _percentageBasisPoints
        );
    }

    function updateRoyalty(address receiver, uint96 feeNumerator)
        public
        onlyAdmin
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setURI(string memory _uri) public onlyAdmin {
        baseURI = _uri;
    }

    function getContractURI() public view returns (string memory) {
        return contractURI;
    }

    function setContractURI(string memory _uri) external onlyAdmin {
        contractURI = _uri;
    }

    function pause() public onlyGovernor {
        _pause();
    }

    function unpause() public onlyGovernor {
        _unpause();
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId, true);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(
            ERC721AUpgradeable,
            ERC2981Upgradeable,
            AccessControlUpgradeable
        )
        returns (bool)
    {
        return
            ERC721AUpgradeable.supportsInterface(interfaceId) ||
            ERC2981Upgradeable.supportsInterface(interfaceId);
    }

    // calculates drop amount for per nft

    function getdropPerUnit(uint256 totalVal, uint256 totalSupply)
        internal
        pure
        returns (uint256)
    {
        return (totalVal - (totalVal % totalSupply)) / totalSupply;
    }
}
