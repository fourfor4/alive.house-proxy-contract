// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../BeaconProxy/BeaconNFTContract.sol";
import "../BeaconProxy/BeaconBandContract.sol";

contract Registry is Ownable {
    address public aliveHouseRoyaltyReceiver;
    uint public feePercentage;

    mapping(address => bool) public isManagerWallet; // deployement and other function controls

    address public splitsImp = 0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE; // testnet

    address[] public imps; // TODO - upgradeable
    
    NFTBeacon[] public nftBeaconContracts; // nft beacon address array (in orde f, b, d etc);
    BandBeacon public bandBeacon; // band beacon 
    
    
    
    uint[] public maxMintPertxn = [10, 1, 1]; // max mint that can happen in single txns (fixed, bonded, dutch, etc)
  
    function maxMintPerTxn() external view returns(uint[] memory){
        return maxMintPertxn;
    }

    constructor(
        address _aliveHouseRoyaltyReceiver,
        uint _feePercentage,
        address managerWallet,
        address bandImp, // band implementation address 
        address[] memory _imps // nft contracts implementaion array 
    ) {
        require(feePercentage < 100, "percentage less than 100");
        isManagerWallet[managerWallet] = true;
        imps = _imps;
        aliveHouseRoyaltyReceiver = _aliveHouseRoyaltyReceiver;
        feePercentage = _feePercentage;

          bandBeacon = new BandBeacon(bandImp);

           unchecked {

            for (uint i = 0; i < imps.length; i++) {
                
                nftBeaconContracts.push(new NFTBeacon(imps[i]));
                
                }
            }
         }


    function updateMaxMintPerTxn(uint[] calldata _maxMintPerTxn) external onlyOwner {
     require(_maxMintPerTxn.length >= 3);
     maxMintPertxn = _maxMintPerTxn;
     }

    function reset(
        address _aliveHouseRoyaltyReceiver,
        uint _feePercentage,
        address managerWallet,address bandImp,
        address[] memory _imps) external onlyOwner {

        require(feePercentage < 100, "percentage less than 100");
        isManagerWallet[managerWallet] = true;
        imps = _imps;
        aliveHouseRoyaltyReceiver = _aliveHouseRoyaltyReceiver;
        feePercentage = _feePercentage;

          bandBeacon = new BandBeacon(bandImp);
          NFTBeacon[] memory nftBeacon;
           unchecked {
            for (uint i = 0; i < imps.length; i++) {
                
                nftBeacon[i] = new NFTBeacon(imps[i]);
                
                }
            
            }

            nftBeaconContracts = nftBeacon;

      }


    function updateSplitsImp(address _newSplit) external onlyOwner {
        splitsImp = _newSplit;
     }


    function updateAliveHouseRoyaltyReceiver(address _newAdd) external onlyOwner {
        aliveHouseRoyaltyReceiver = _newAdd;
     } 


    function changePrimaryRoyaltyFee(uint newFee) external onlyOwner{
      require(newFee<100);
      feePercentage = newFee;
     }


    function nftBeacons() public view returns(NFTBeacon[] memory) {
      return nftBeaconContracts;
      }

    function upgradeBandImplementation(address _to) public onlyOwner returns(bool){
       bandBeacon.update(_to);
       return true;
     }

    function upgradeSongImplementation(address songAddress, address _to) public onlyOwner returns(bool){ 
       NFTBeacon(songAddress).update(_to);
       return true;
     }

    function updateSplitAddress(address splitsMain) public onlyOwner {
        splitsImp = splitsMain;
     }

    function Imps() public view returns (address[] memory) {
        return imps;
     }

    function addNewImp(address newImp) public onlyOwner{
      NFTBeacon newBeacon = new NFTBeacon(newImp);
      nftBeaconContracts.push(newBeacon);

     }

    



    function addMangerWallet(address[] calldata _addresses) external onlyOwner {
        for (uint i = 0; i < _addresses.length; i++) {
            isManagerWallet[_addresses[i]] = true;
        }
     }

    function removeMangerWallet(address[] calldata _addresses)
        external
        onlyOwner
       {
        for (uint i = 0; i < _addresses.length; i++) {
            isManagerWallet[_addresses[i]] = false;
        }
        }
     }
