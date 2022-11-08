// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "../erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Registry/Registry.sol";

contract AliveDutchUpgradeable is
    ERC721AUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    bytes32 constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public songId;
    uint256 public edition;
    address public aliveRegistry;
    address public mintRoyaltyReceiver;
    uint96 public offchainRoyaltyPercentageInBips;

    string uri;

    struct Drop {
        uint256 dropID;
        uint256 dropTotalAmount;
        uint256 dropPerNFT;
        uint256 totalClaimed;
        uint256 dropNumber;
    }
    mapping(uint256 => uint256) public claimed;

    Drop[] public allDrops;

    string public contracturi;

    uint256 public maxdutchAuction;
    uint256 public auctionCeilPrice;
    uint256 public auctionFloorPrice;
    uint256 public startAt;
    uint256 public discountRate; // per secod the price will be decreased by 10

    event bondedCurveMintEvent(address minter, uint256 amount, uint256 atPrice);
    event newDropEvent(
        uint256 id,
        uint256 value,
        uint256 perNftDrop,
        uint256 DropAmount
    );

    modifier onlyGovernor() {
        require(
            Registry(aliveRegistry).isManagerWallet(msg.sender) == true ||
                hasRole(GOVERNANCE_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "only governor"
        );
        _;
    }

    modifier onlyAdmin() {
        require(Registry(aliveRegistry).isManagerWallet(msg.sender) == true);
        _;
    }

    function initialize(
        address _royaltyReceiverSecondary, // royalityReceiver
        uint96 _royaltyFeesInBips, // this royality is for secondary sale and mint, which will be 0xsplit address of  band
        address royaltyReceiverSplit,
        uint96 _offchainRoyaltyPercentageInBips, // split wallet addres of the band
        string memory _songuri,
        string memory _contractURI,
        uint256 _songID,
        address artist,
        address _aliveRegistry,
        uint256[5] memory _configureDutchAuction // total supply, price increase per sale, start price
    ) public initializer initializerERC721A {
        __ERC721A_init("AliveE3", "AE3");

        // _pause();
        songId = _songID;
        uri = _songuri;

        _grantRole(GOVERNANCE_ROLE, artist);
        _grantRole(PAUSER_ROLE, artist);

        mintRoyaltyReceiver = royaltyReceiverSplit;
        contracturi = _contractURI; // // TODO - make it upgradable

        _setDefaultRoyalty(_royaltyReceiverSecondary, _royaltyFeesInBips);
        offchainRoyaltyPercentageInBips = _offchainRoyaltyPercentageInBips;

        aliveRegistry = _aliveRegistry;
        // dutch details

        maxdutchAuction = _configureDutchAuction[0];
        auctionCeilPrice = _configureDutchAuction[1];
        auctionFloorPrice = _configureDutchAuction[2];
        startAt = _configureDutchAuction[3];
        discountRate = _configureDutchAuction[4];

        edition = 3;
    }

    function getPrice(uint256 amount) public view returns (uint256) {
        require(block.timestamp > startAt);
        uint256 timeElapsed = block.timestamp - startAt;

        uint256 discount = discountRate * timeElapsed;

        if (
            discount > auctionCeilPrice ||
            auctionFloorPrice > auctionCeilPrice - discount
        ) {
            return auctionFloorPrice * amount;
        } else {
            return (auctionCeilPrice - discount) * amount;
        }
    }

    function dutchAuction(address to, uint256 amount)
        public
        payable
        whenNotPaused
        nonReentrant
    {
        require(
            amount <= Registry(aliveRegistry).maxMintPerTxn()[2],
            "amount limit per txn"
        );
        require(startAt < block.timestamp);
        uint256 price = getPrice(amount);
        require(msg.value >= price, "Insufficient funds!");
        require(
            totalSupply() + amount <= maxdutchAuction,
            "can't mint more than supply"
        );
        uint256 feePercentage = Registry(aliveRegistry).feePercentage();
        uint256 fee = (price * feePercentage) / 100;
        payable(Registry(aliveRegistry).aliveHouseRoyaltyReceiver()).transfer(
            fee
        ); // Todo - Upgradeble to alive, use a beacon meachnaism
        payable(mintRoyaltyReceiver).transfer(price - fee);

        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        super._mint(to, amount);
    }

    function newDrop() public payable onlyRole(GOVERNANCE_ROLE) {
        require(msg.value > 1 ether, "min drop amount is 1");

        uint256 dropPerUnit = msg.value / totalSupply();
        uint256 id = allDrops.length + 1;
        Drop memory newdrop = Drop(
            id,
            msg.value,
            dropPerUnit,
            0,
            totalSupply()
        );
        allDrops.push(newdrop);

        emit newDropEvent(id, msg.value, dropPerUnit, totalSupply());
    }

    function claimAllDrop(uint256 tokenID)
        external
        nonReentrant
        returns (bool success)
    {
        // require(ownerOf(tokenID) == msg.sender, "not owned by the signer");
        require(allDrops.length > 0, "no drops yet");
        require(allDrops.length > claimed[tokenID]);

        uint256 start = claimed[tokenID];
        for (uint256 i = start; i < allDrops.length; i++) {
            require(allDrops[i].totalClaimed < allDrops[i].dropNumber);
            unchecked {
                claimed[tokenID]++;
                allDrops[i].totalClaimed++;
            }
            payable(ownerOf(tokenID)).transfer(allDrops[i].dropPerNFT - 10 wei);
        }

        return true;
    }

    function claimDrop(uint256 dropId, uint256 tokenID)
        external
        nonReentrant
        returns (bool)
    {
        //    require(ownerOf(tokenID) == msg.sender, "not owned by the signer");
        require(allDrops.length >= dropId, " drops doesn't exist");
        require(
            allDrops[dropId - 1].totalClaimed < allDrops[dropId - 1].dropNumber,
            "drop empty"
        );
        require(claimed[tokenID] < dropId, "already claimed");
        require(
            claimed[tokenID] + 1 == dropId,
            "need to claim the nearest unclaimed drops"
        );
        unchecked {
            claimed[tokenID]++;
            allDrops[dropId - 1].totalClaimed++;
        }
        payable(ownerOf(tokenID)).transfer(
            allDrops[dropId - 1].dropPerNFT - 10 wei
        );

        return true;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length != 0 ? string(abi.encodePacked(baseURI)) : "";
    }

    function _baseURI() internal view override returns (string memory) {
        return uri;
    }

    function setRoyalties(
        uint256 _tokenId,
        address payable _royaltiesReceipientAddress,
        uint96 _percentageBasisPoints
    ) public onlyRole(GOVERNANCE_ROLE) {
        _setTokenRoyalty(
            _tokenId,
            _royaltiesReceipientAddress,
            _percentageBasisPoints
        );
    }

    function batchAirDrop(
        address[] memory _arrayOfReceivers,
        uint256 _amountForEach
    ) public onlyRole(GOVERNANCE_ROLE) {
        require(
            totalSupply() + _arrayOfReceivers.length <= maxdutchAuction,
            "can't mint more than supply"
        );
        for (uint256 index = 0; index < _arrayOfReceivers.length; ) {
            super._mint(_arrayOfReceivers[index], _amountForEach);

            unchecked {
                index++;
            }
        }
    }

    function setURI(string memory _uri) public onlyRole(GOVERNANCE_ROLE) {
        uri = _uri;
    }

    function contractURI() public view onlyAdmin returns (string memory) {
        return contracturi;
    }

    function setContractURI(string memory _uri)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        contracturi = _uri;
    }

    function pause() public {
        require(
            hasRole(PAUSER_ROLE, msg.sender) ||
                Registry(aliveRegistry).isManagerWallet(msg.sender) == true,
            "Pauseable: must have pauser role to pause"
        );
        _pause();
    }

    function unpause() public {
        require(
            hasRole(PAUSER_ROLE, msg.sender) ||
                Registry(aliveRegistry).isManagerWallet(msg.sender) == true,
            "Pauseable: must have pauser role to unpause"
        );
        _unpause();
    }

    function burn(uint256 tokenId) public {
        require(msg.sender == ownerOf(tokenId), "not owned");
        _burn(tokenId, true);
    }

    // The following functions are overrides required by Solidity.

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
}
