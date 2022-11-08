// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "../Registry/Registry.sol";


contract NFTBeacon is Ownable {
   UpgradeableBeacon immutable public nftBeacon;

   address public blueprint;
     address public registry;

  function implementation() public view returns (address) {
        return nftBeacon.implementation();
    }
    // function owner() public view override returns (address) {
    //     return Registry(registry).upgraderAddress();
    // }


   constructor(address _initBlueprint) {
    nftBeacon = new UpgradeableBeacon(_initBlueprint) ;
    blueprint = _initBlueprint;
    // transferOwnership(_admin);
   }

   function update(address _newBlueprint) public onlyOwner {
     nftBeacon.upgradeTo(_newBlueprint);
   }
}