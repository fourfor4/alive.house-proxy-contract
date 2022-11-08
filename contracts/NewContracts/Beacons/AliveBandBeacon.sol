// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AliveBandBeacon is Ownable {
    UpgradeableBeacon public immutable aliveBandBeacon;

    constructor(address _initBlueprint) {
        aliveBandBeacon = new UpgradeableBeacon(_initBlueprint);
    }

    function implementation() public view returns (address) {
        return aliveBandBeacon.implementation();
    }

    function update(address _newBlueprint) public {
        aliveBandBeacon.upgradeTo((_newBlueprint));
    }
}
