// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./NewBandContract.sol";
import "./BeaconProxy/BeaconBandContract.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "./Registry/Registry.sol";



/**
 * @title Alivecore
 * @author Harsh Singh <harshsingh.eth@gmail.com>
 */

contract AliveCore is Initializable {
   
    address public admin; // admin 
    address public aliveRegistry; // registr contract address

    Band[] public allBands;

    mapping(uint => Band) mappingOfIdToBand;

    struct Band {
        uint bandId;
        string bandName;
        address bandAddress;
        address deployer;
    }

    modifier onlyAdmin() {
        require(
            Registry(aliveRegistry).owner() == msg.sender,
            "only Admin"
        );
        _;
    }



    modifier onlyGovernor() {
        require(
            Registry(aliveRegistry).isManagerWallet(msg.sender) == true,
            "only governor"
        );
        _;
    }

 
    event BandCreated(
        address bandAddress,
        address adminAddress,
        uint bandId,
        string bandName
    );
    event BandCreationConstructor(address beacon, bytes data);



    function initialize( address _aliveRegistry)
        public
        initializer
    {
        aliveRegistry = _aliveRegistry;
    }

    //    proxy band creation
    function createBandProxy(address _bandAdmin, string memory _bandName)
        public
        onlyGovernor
        returns (address)
    {
        uint id = allBands.length + 1;

        bytes memory data = abi.encodeWithSelector(
            BandContract(address(0)).initialize.selector,
            id,
            _bandAdmin,
            aliveRegistry,
            _bandName
        );
        BeaconProxy band = new BeaconProxy(
            address(Registry(aliveRegistry).bandBeacon()),
            data
        );
        // emit BandCreationConstructor(address(band), data);
        Band memory bandNew;
        bandNew.bandId = id;
        bandNew.bandName = _bandName;
        bandNew.bandAddress = address(band);
        bandNew.deployer = _bandAdmin;

        allBands.push(bandNew);

        mappingOfIdToBand[id] = bandNew;

        emit BandCreated(address(band), _bandAdmin, id, _bandName);
        return address(band);
    }

    function returnAllBands() public view returns (Band[] memory) {
        return allBands;
    }

    function getBandFromId(uint id) public view returns (Band memory) {
        return mappingOfIdToBand[id];
    }
}
