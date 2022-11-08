// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../Registry/Registry.sol";

// import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";


contract BandBeacon is Ownable {
   UpgradeableBeacon immutable public bandBeacon;

   address public blueprint;
  address public registry;
 

  function implementation() public view returns (address) {
        return bandBeacon.implementation();
    }
  //  function owner() public view override  returns (address) {
  //       return 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  //   }
  

   constructor(address _initBlueprint) {
    bandBeacon = new UpgradeableBeacon(_initBlueprint) ;
    blueprint = _initBlueprint;
   }

   function update(address _newBlueprint) public  {
     bandBeacon.upgradeTo(_newBlueprint);
   }
}