// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../Interfaces/splitMain.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./BeaconProxy/BeaconNFTContract.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "./AliveFixedUpgradeable.sol";
import "./AliveBondedUpgradeable.sol";
import "./AliveDutchUpgradeable.sol";
import "./Registry/Registry.sol";
import "../Interfaces/IRegistry.sol";


/**
 * @title BandContract
 * @author harsh singh <harshsingh.eth@gmail.com>
 */

contract BandContract is Initializable, AccessControlUpgradeable {
    bytes32 constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    address[] public allNFTsOfBand;
    uint public bandId;
    address public bandAdmin;
    string public bandName; //
    address[] public membersOfBand; // members of the band
    mapping(address => uint) addressOfMemberMappedToIndex; // each address has a bandMemberId

    address public aliveRegistry;

    Songs[] public allSongs;
    mapping(uint => Songs) songsMapping;


    address[] allSplits;
    mapping(address => uint) splitAddToId;


    event songAdded(address _song, uint _songId, uint typeOf);
    event adminChanged(address oldAdmin, address newAdmin);
    event splitWalletCreated(address splitWallet, uint id);
    event splitExist(address);

    modifier onlyGovernor() {
        require(
            Registry(aliveRegistry).isManagerWallet(msg.sender) == true ||
                hasRole(GOVERNANCE_ROLE, msg.sender),
            "only governor"
        );
        _;
    }
    
    modifier onlyAdmin() {
        require(Registry(aliveRegistry).isManagerWallet(msg.sender) == true);
        _;
    }

   
    function getSplitWallet(uint id) public view returns (address) {
        return allSplits[id];
    }
    function transferAdminOwnership(address _to) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        bandAdmin = _to;
        _grantRole(DEFAULT_ADMIN_ROLE, _to);
        emit adminChanged(msg.sender, _to);
    }





    struct Songs {
        uint songId;
        uint songType; // 1, 2, 3 etc are the types
        address nftContract;
        address splitSecondaryReceiverAddress;
        address splitMintReceiverAddress;
    }


    function initialize(
        uint _id,
        address _bandAdmin,
        address _aliveRegistry,
        string memory _bandName
        // NFTBeacon[] calldata _nftBeacons
    ) external initializer {
        bandId = _id;

        _grantRole(GOVERNANCE_ROLE, _bandAdmin);

        aliveRegistry = _aliveRegistry;

        bandAdmin = _bandAdmin;
        bandName = _bandName;
        //  splits = address(0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE); // TODO - upgradable - currently it is testnet

        
        
    }

    // TODO - revert if wrong arguments passed, do a checking.

    function createSongFixed(
        address _royaltyReceiverSecondary,
        address royaltyReceiverMint,
        uint96 _offchainRoyalty,
        string memory _uri,
        string memory _contractURI,
        uint96 _royaltyFeesInBips,
        uint maxFixedMints,
        uint fixedMintPrice,
        address _artist
    ) public onlyGovernor returns (address) {
        uint id = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveFixedUpgradeable(address(0)).initialize.selector,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            maxFixedMints,
            fixedMintPrice,
            royaltyReceiverMint,
            _offchainRoyalty,
            _uri,
            _contractURI,
            id,
            _artist,
            aliveRegistry
        );
        BeaconProxy song = new BeaconProxy(address(Registry(aliveRegistry).nftBeacons()[0]), data);

        // AliveFixed song = new BeaconProxy(_royaltyReceiverSecondary, _royaltyFeesInBips, maxFixedMints, fixedMintPrice, royaltyReceiverMint,_offchainRoyalty, _uri,_contractURI, id , _artist, address(msg.sender));
        Songs memory newSong;
        newSong.nftContract = address(song);
        newSong.songId = id;
        newSong.songType = 1;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = royaltyReceiverMint;
        allSongs.push(newSong);
        emit songAdded(address(song), allSongs.length, 1);
        return address(song);
    }

    function createSongBonded(
        address _royaltyReceiverSecondary,
        address royaltyReceiverMint,
        uint96 _offchainRoyalty,
        string memory _uri,
        string memory _contractURI,
        uint96 _royaltyFeesInBips,
        address _artist,
        uint[3] calldata _configureBondedCurve
    ) public onlyGovernor returns (address) {
        uint id = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveBondedUpgradeable(address(0)).initialize.selector,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            royaltyReceiverMint,
            _offchainRoyalty,
            _uri,
            _contractURI,
            id,
            _artist,
            aliveRegistry,
            _configureBondedCurve
        );

        BeaconProxy song = new BeaconProxy(address(Registry(aliveRegistry).nftBeacons()[1]), data);

        Songs memory newSong;
        newSong.nftContract = address(song);
        newSong.songId = id;
        newSong.songType = 2;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = royaltyReceiverMint;
        allSongs.push(newSong);
        emit songAdded(address(song), allSongs.length, 2);
        return address(song);
    }

    function createSongDutch(
        address _royaltyReceiverSecondary,
        address royaltyReceiverMint,
        uint96 _offchainRoyalty,
        string memory _uri,
        string memory _contractURI,
        uint96 _royaltyFeesInBips,
        address _artist,
        uint[5] calldata _configureDutchAuction
    ) public onlyGovernor returns (address) {
        uint id = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveDutchUpgradeable(address(0)).initialize.selector,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            royaltyReceiverMint,
            _offchainRoyalty,
            _uri,
            _contractURI,
            id,
            _artist,
            aliveRegistry,
            _configureDutchAuction
        );

        BeaconProxy song = new BeaconProxy(address(Registry(aliveRegistry).nftBeacons()[2]), data);

        Songs memory newSong;
        newSong.nftContract = address(song);
        newSong.songId = id;
        newSong.songType = 3;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = royaltyReceiverMint;
        allSongs.push(newSong);
        emit songAdded(address(song), allSongs.length, 3);
        return address(song);
    }

    // TODO - revert if wrong arguments passed, do a checking.
  
    function isContract(address _addr)
        public
        view
        returns (bool isContractorNot)
    {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function createSplitWallet(
        address[] memory accounts,
        uint32[] calldata percentAllocations
    ) public onlyGovernor returns (address) {
        address splits = Registry(aliveRegistry).splitsImp();
        address predictedSplit = ISplitMain(splits)
            .predictImmutableSplitAddress(accounts, percentAllocations, 0);

        if (!isContract(predictedSplit)) {
            address split1 = ISplitMain(splits).createSplit(
                accounts,
                percentAllocations,
                0,
                address(0)
            );
            uint id = allSplits.length;
            allSplits.push(split1);
            splitAddToId[split1] = id;
            emit splitWalletCreated(split1, id);
            return split1;
        } else {
            emit splitWalletCreated(
                predictedSplit,
                splitAddToId[predictedSplit]
            );
            return predictedSplit;
        }
    }



    function addMember(address _add) public onlyAdmin returns (bool) {
        require(addressOfMemberMappedToIndex[_add] == 0);
        uint id = membersOfBand.length;
        addressOfMemberMappedToIndex[_add] = id;

        membersOfBand.push(_add);

        return true;
    }

    function addMemberBulk(address[] memory _add)
        public
        onlyAdmin
        returns (bool)
    {
        for (uint256 index = 0; index < _add.length; ) {
            require(addressOfMemberMappedToIndex[_add[index]] == 0);
            uint id = membersOfBand.length;
            addressOfMemberMappedToIndex[_add[index]] = id;

            membersOfBand.push(_add[index]);
            unchecked {
                index++;
            }
        }

        return true;
    }

    // TODO test
    function removeMember(address _add) public onlyAdmin returns (bool) {
        require(addressOfMemberMappedToIndex[_add] != 0, "not a member");
        uint id = addressOfMemberMappedToIndex[_add] - 1;

        for (uint256 index = id; index < membersOfBand.length; index++) {
            membersOfBand[index] = membersOfBand[index + 1];
            membersOfBand.pop();
        }

        addressOfMemberMappedToIndex[_add] = 0;
        return true;
    }

    function getSongFromId(uint id) public view returns (Songs memory) {
        return songsMapping[id];
    }

    function getAllSongs() public view returns (Songs[] memory) {
        return allSongs;
    }

    function getAllMembers() public view returns (address[] memory) {
        return membersOfBand;
    }

    function giveGovernanceRole(address _to) public {
        require(Registry(aliveRegistry).isManagerWallet(msg.sender) == true);

        //  require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "only Admin");

        _grantRole(GOVERNANCE_ROLE, _to);
    }

    function retriveGovernanceRole(address _to) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        require(hasRole(GOVERNANCE_ROLE, _to));

        _revokeRole(GOVERNANCE_ROLE, _to);
    }
}
