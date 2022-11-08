// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AliveSongBeacon is Ownable {
    UpgradeableBeacon public immutable aliveSongBeacon;

    constructor(address _initBlueprint) {
        aliveSongBeacon = new UpgradeableBeacon(_initBlueprint);
    }

    function implementation() public view returns (address) {
        return aliveSongBeacon.implementation();
    }

    function update(address _newBlueprint) public {
        aliveSongBeacon.upgradeTo((_newBlueprint));
    }
}
