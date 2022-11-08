// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "../RegistryContracts/AliveRegistry.sol";
import "../../Interfaces/splitMain.sol";
import "../Songs/AliveFixedSong.sol";
import "../Songs/AliveBondedSong.sol";
import "../Songs/AliveDutchSong.sol";

contract AliveBand is Initializable, AccessControlUpgradeable {
    struct Song {
        uint256 songId;
        uint256 songType; // 1, 2, 3 etc are the types
        address songContract;
        address splitSecondaryReceiverAddress;
        address splitMintReceiverAddress;
    }

    bytes32 constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    address public aliveRegistry;
    address public bandAdmin;
    address[] public membersOfBand;
    address[] allSplits;

    uint256 public bandId;
    string public bandName;

    Song[] public allSongs;

    mapping(address => uint256) memberIdByAddress;
    mapping(uint256 => Song) songById;
    mapping(address => uint256) splitAddToId;

    // Modifiers
    modifier onlyGovernor() {
        require(
            AliveRegistry(aliveRegistry).isManagerWallet(msg.sender) == true ||
                hasRole(GOVERNANCE_ROLE, msg.sender),
            "only governor"
        );
        _;
    }

    modifier onlyAdmin() {
        require(
            AliveRegistry(aliveRegistry).isManagerWallet(msg.sender) == true
        );
        _;
    }

    // Events
    event SongCreated(address songAddress, uint256 songId, uint256 songType);
    event AdminChanged(address oldAdmin, address newAdmin);
    event SplitWalletCreated(address splitWallet, uint256 id);

    function initialize(
        uint256 _id,
        string memory _bandName,
        address _bandAdmin,
        address _aliveRegistry
    ) external initializer {
        bandId = _id;
        _grantRole(GOVERNANCE_ROLE, _bandAdmin);
        aliveRegistry = _aliveRegistry;
        bandAdmin = _bandAdmin;
        bandName = _bandName;
    }

    function createFixedSong(
        address _royaltyReceiverSecondary,
        uint96 _royaltyFeesInBips,
        address _royaltyReceiverSplit,
        uint96 _offchainRoyaltyPercentageInBips,
        string memory _songURI,
        string memory _contractURI,
        address _artist,
        uint256[3] memory _songInfos
    ) public onlyGovernor returns (address) {
        uint256 songId = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveFixedSong(address(0)).initialize.selector,
            aliveRegistry,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            _royaltyReceiverSplit,
            _offchainRoyaltyPercentageInBips,
            _songURI,
            _contractURI,
            _artist,
            songId,
            _songInfos
        );

        BeaconProxy song = new BeaconProxy(
            address(
                AliveRegistry(aliveRegistry).getAliveSongImp(1).aliveSongBeacon
            ),
            data
        );
        Song memory newSong;
        newSong.songContract = address(song);
        newSong.songId = songId;
        newSong.songType = 1;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = _royaltyReceiverSplit;
        allSongs.push(newSong);
        emit SongCreated(address(song), songId, 1);
        return address(song);
    }

    function createBondedSong(
        address _royaltyReceiverSecondary,
        uint96 _royaltyFeesInBips,
        address _royaltyReceiverSplit,
        uint96 _offchainRoyaltyPercentageInBips,
        string memory _songURI,
        string memory _contractURI,
        address _artist,
        uint256[4] memory _songInfos
    ) public onlyGovernor returns (address) {
        uint256 songId = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveBondedSong(address(0)).initialize.selector,
            aliveRegistry,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            _royaltyReceiverSplit,
            _offchainRoyaltyPercentageInBips,
            _songURI,
            _contractURI,
            _artist,
            songId,
            _songInfos
        );

        BeaconProxy song = new BeaconProxy(
            address(
                AliveRegistry(aliveRegistry).getAliveSongImp(2).aliveSongBeacon
            ),
            data
        );
        Song memory newSong;
        newSong.songContract = address(song);
        newSong.songId = songId;
        newSong.songType = 2;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = _royaltyReceiverSplit;
        allSongs.push(newSong);
        emit SongCreated(address(song), songId, 2);
        return address(song);
    }

    function createDutchSong(
        address _royaltyReceiverSecondary,
        uint96 _royaltyFeesInBips,
        address _royaltyReceiverSplit,
        uint96 _offchainRoyaltyPercentageInBips,
        string memory _songURI,
        string memory _contractURI,
        address _artist,
        uint256[5] memory _songInfos
    ) public onlyGovernor returns (address) {
        uint256 songId = allSongs.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveDutchSong(address(0)).initialize.selector,
            aliveRegistry,
            _royaltyReceiverSecondary,
            _royaltyFeesInBips,
            _royaltyReceiverSplit,
            _offchainRoyaltyPercentageInBips,
            _songURI,
            _contractURI,
            _artist,
            songId,
            _songInfos
        );

        BeaconProxy song = new BeaconProxy(
            address(
                AliveRegistry(aliveRegistry).getAliveSongImp(3).aliveSongBeacon
            ),
            data
        );
        Song memory newSong;
        newSong.songContract = address(song);
        newSong.songId = songId;
        newSong.songType = 3;
        newSong.splitSecondaryReceiverAddress = _royaltyReceiverSecondary;
        newSong.splitMintReceiverAddress = _royaltyReceiverSplit;
        allSongs.push(newSong);
        emit SongCreated(address(song), songId, 3);
        return address(song);
    }

    function getSplitWallet(uint256 id) public view returns (address) {
        return allSplits[id];
    }

    function transferAdminOwnership(address _to) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        bandAdmin = _to;
        _grantRole(DEFAULT_ADMIN_ROLE, _to);
        emit AdminChanged(msg.sender, _to);
    }

    function isContract(address _addr) public view returns (bool) {
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
        address splits = AliveRegistry(aliveRegistry).splitsAddress();
        address predictedSplit = ISplitMain(splits)
            .predictImmutableSplitAddress(accounts, percentAllocations, 0);

        if (!isContract(predictedSplit)) {
            address split1 = ISplitMain(splits).createSplit(
                accounts,
                percentAllocations,
                0,
                address(0)
            );
            uint256 id = allSplits.length;
            allSplits.push(split1);
            splitAddToId[split1] = id;
            emit SplitWalletCreated(split1, id);
            return split1;
        } else {
            emit SplitWalletCreated(
                predictedSplit,
                splitAddToId[predictedSplit]
            );
            return predictedSplit;
        }
    }

    function addMember(address _addr) public onlyAdmin returns (bool) {
        require(memberIdByAddress[_addr] == 0);
        uint256 id = membersOfBand.length + 1;
        memberIdByAddress[_addr] = id;
        membersOfBand.push(_addr);
        return true;
    }

    function addMemberBulk(address[] memory _addrs)
        public
        onlyAdmin
        returns (bool)
    {
        for (uint256 i = 0; i < _addrs.length; i++) {
            addMember(_addrs[i]);
        }
        return true;
    }

    function removeMember(address _addr) public onlyAdmin returns (bool) {
        require(memberIdByAddress[_addr] != 0, "not a member");
        uint256 idOfMember = memberIdByAddress[_addr];

        for (
            uint256 index = idOfMember - 1;
            index < membersOfBand.length - 1;
            index++
        ) {
            membersOfBand[index] = membersOfBand[index + 1];
        }
        membersOfBand.pop();
        memberIdByAddress[_addr] = 0;
        return true;
    }

    function getSongById(uint256 _id) public view returns (Song memory) {
        return songById[_id];
    }

    function getAllSongs() public view returns (Song[] memory) {
        return allSongs;
    }

    function getAllMembers() public view returns (address[] memory) {
        return membersOfBand;
    }

    function grantGovernanceRole(address _to) public {
        require(
            AliveRegistry(aliveRegistry).isManagerWallet(msg.sender) == true
        );
        _grantRole(GOVERNANCE_ROLE, _to);
    }

    function getGovernanceRole(address _to) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        require(hasRole(GOVERNANCE_ROLE, _to));
        _revokeRole(GOVERNANCE_ROLE, _to);
    }
}
