// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "./RegistryContracts/AliveRegistry.sol";
import "./BandContracts/AliveBand.sol";

contract AliveHouse is Initializable {
    address public aliveRegistry;
    struct Band {
        uint256 bandId;
        string bandName;
        address bandAddress;
        address bandAdmin;
    }

    Band[] public allBands;
    mapping(uint256 => Band) bandById;

    // Modifier
    modifier onlyAdmin() {
        require(
            AliveRegistry(aliveRegistry).adminAddress() == msg.sender,
            "Only Admin!"
        );
        _;
    }

    modifier onlyGovernor() {
        require(
            AliveRegistry(aliveRegistry).isManagerWallet(msg.sender) == true,
            "Only Governor!"
        );
        _;
    }

    // Events
    event BandCreated(
        uint256 bandId,
        string bandName,
        address bandAddress,
        address bandAdmin
    );

    function initialize(address _aliveRegistry) public initializer {
        aliveRegistry = _aliveRegistry;
    }

    function createAliveBand(address _bandAdmin, string memory _bandName)
        public
        onlyGovernor
        returns (address)
    {
        uint256 id = allBands.length + 1;
        bytes memory data = abi.encodeWithSelector(
            AliveBand(address(0)).initialize.selector,
            id,
            _bandName,
            _bandAdmin,
            aliveRegistry
        );
        BeaconProxy bandImp = new BeaconProxy(
            address(AliveRegistry(aliveRegistry).aliveBandBeacon()),
            data
        );
        Band memory newBand;

        newBand.bandId = id;
        newBand.bandName = _bandName;
        newBand.bandAddress = address(bandImp);
        newBand.bandAdmin = _bandAdmin;

        allBands.push(newBand);
        bandById[id] = newBand;

        emit BandCreated(id, _bandName, address(bandImp), _bandAdmin);
        return address(bandImp);
    }

    function getAllBands() public view returns (Band[] memory) {
        return allBands;
    }

    function getBandById(uint256 _id) public view returns (Band memory) {
        return bandById[_id];
    }
}
