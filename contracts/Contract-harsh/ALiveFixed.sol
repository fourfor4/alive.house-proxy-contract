// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "../ERC721A/ERC721A.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AliveFixed is  ERC721A, ERC2981, AccessControl, Pausable, ReentrancyGuard
                         {
    bytes32  constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32  constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint public songId;
    uint public edition = 1;
    address payable aliveHouse;
    address public aliveManager;
    address public mintRoyaltyReceiver;
    uint96 public offchainRoyaltyPercentageInBips;

    string uri;
     
    struct Drop {
        uint dropID;
        uint dropTotalAmount;
        uint dropPerNFT;
        uint totalClaimed;
        uint dropNumber;
        
    }
    mapping(uint => uint) public claimed;

    Drop[] public allDrops;

   // events
    event fixedMintEvent(address minter, uint amount);
    event newDropEvent(uint id, uint value, uint perNftDrop, uint DropAmount);


    constructor (
        address _royaltyReceiverSecondary,  // royalityReceiver
        uint96 _royaltyFeesInBips, // this royality is for secondary sale and mint, which will be 0xsplit address of  band 
        uint _maxFixedMint,  // max total supply of fixedmint nft
        uint _fixedMintPrice,  // price of the fixedMintToken
        address royaltyReceiverSplit, uint96 _offchainRoyaltyPercentageInBips, // split wallet addres of the band
        string memory _songuri, 
        string memory _contractURI,
        uint _songID,
         address artist, address _alivemanager
        )  ERC721A("AliveE1", "AE1") { 

        
        _pause();
        songId = _songID;
        uri= _songuri;
        _grantRole(DEFAULT_ADMIN_ROLE,_alivemanager);
        _grantRole(GOVERNANCE_ROLE, _alivemanager);
        _grantRole(GOVERNANCE_ROLE,  artist);
        _grantRole(PAUSER_ROLE,  _alivemanager);
        _grantRole(PAUSER_ROLE, artist );

        mintRoyaltyReceiver = royaltyReceiverSplit;
        
        aliveHouse = payable(0x0dd68c06Af920CA069CDc27d05AA9EB65F85990A); // TODO - make it change/upgradable by taking in as a arugument

        contracturi=_contractURI; // // TODO - make it upgradable 

        _setDefaultRoyalty(_royaltyReceiverSecondary, _royaltyFeesInBips);
        offchainRoyaltyPercentageInBips = _offchainRoyaltyPercentageInBips;

        // fixed mint details
         maxFixedMint = _maxFixedMint;
         fixedMintPrice = _fixedMintPrice;

    }


    function newDrop() public payable onlyRole(GOVERNANCE_ROLE){
      require(msg.value > 1 ether, "min drop amount is 1");

      uint dropPerUnit = msg.value/totalSupply();
      uint id = allDrops.length+1;
      Drop memory newdrop =  Drop(id,msg.value,dropPerUnit, 0, totalSupply());
      allDrops.push(newdrop);

      emit newDropEvent(id, msg.value, dropPerUnit, totalSupply());

    }

   function claimAllDrop(uint tokenID) external nonReentrant returns(bool success){
       
    // require(ownerOf(tokenID) == msg.sender, "not owned by the signer");
       require(allDrops.length > 0, "no drops yet");
       require(allDrops.length > claimed[tokenID]);

       uint start = claimed[tokenID];
       for (uint i = start; i < allDrops.length; i++) {
       require(allDrops[i].totalClaimed < allDrops[i].dropNumber);
       unchecked {
       claimed[tokenID]++;
       allDrops[i].totalClaimed++;
       }
       payable(ownerOf(tokenID)).transfer(allDrops[i].dropPerNFT - 10 wei);
       }

       return true;

   }



   function claimDrop(uint dropId, uint tokenID) external nonReentrant returns(bool) {
    //    require(ownerOf(tokenID) == msg.sender, "not owned by the signer");
       require(allDrops.length >= dropId, " drops doesn't exist");
       require(allDrops[dropId-1].totalClaimed < allDrops[dropId-1].dropNumber, "drop empty");
       require(claimed[tokenID] < dropId, "already claimed");
       require(claimed[tokenID] + 1 == dropId, "need to claim the nearest unclaimed drops");
       claimed[tokenID]++;
       payable(ownerOf(tokenID)).transfer(allDrops[dropId-1].dropPerNFT - 10 wei);
       unchecked {
       allDrops[dropId-1].totalClaimed++;
       }

    return true;

   }

      function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        string memory baseURI = _baseURI();
        return bytes(baseURI).length != 0 ? string(abi.encodePacked(baseURI)) : '';
      }        

    function _baseURI() internal view override returns (string memory) {
      return uri;
    }

     function setRoyalties(uint _tokenId, address payable _royaltiesReceipientAddress, uint96 _percentageBasisPoints) public  onlyRole(GOVERNANCE_ROLE) {
       
        _setTokenRoyalty(_tokenId,_royaltiesReceipientAddress,_percentageBasisPoints );
 
      }

   string public contracturi;

    function batchAirDrop(address[] memory _arrayOfReceivers, uint _amountForEach) public  onlyRole(GOVERNANCE_ROLE) {
               
       require(totalSupply() + _arrayOfReceivers.length <= maxFixedMint, "can't mint more than supply");
        for (uint256 index = 0; index < _arrayOfReceivers.length;) {

             super._mint(_arrayOfReceivers[index], _amountForEach);

                unchecked {
                     index++;
                 }
        }    

    }
 

 function setURI(string memory _uri) public onlyRole(GOVERNANCE_ROLE) {
  uri = _uri;
 }

  function contractURI() public view returns (string memory) {
     
        return contracturi;
    }

    function setContractURI(string memory _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contracturi = _uri;
    }


    
    function pause() public  {
        require(hasRole(PAUSER_ROLE, msg.sender), "Pauseable: must have pauser role to pause");
        _pause();
    }

    function unpause() public  {
        require(hasRole(PAUSER_ROLE, msg.sender), "Pauseable: must have pauser role to unpause");
        _unpause();
    }

    uint public maxFixedMint;
    uint public fixedMintPrice;



    
    function fixedMint(address to, uint256 amount)
        public
        whenNotPaused()
        payable
        
    {   
        require(msg.value >=  fixedMintPrice* amount, "Insufficient funds!");
        require(totalSupply() + amount <= maxFixedMint, "can't mint more than supply");
        uint fee = msg.value/10; // 10% fee to alive
        payable(aliveHouse).transfer(fee);
        payable(mintRoyaltyReceiver).transfer(msg.value - fee);
        super._mint(to, amount);
        // _totalSupply[fixedMintTokenID] = _totalSupply[fixedMintTokenID] + amount;
        emit fixedMintEvent(to, amount);

    }


     function burn(uint256 tokenId) public {
        _burn(tokenId, true);
    }


    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view 
        override( ERC721A, AccessControl, ERC2981)
        returns (bool)
    {
    return 
        ERC721A.supportsInterface(interfaceId) || 
        ERC2981.supportsInterface(interfaceId);
    }


   

  

  

}


