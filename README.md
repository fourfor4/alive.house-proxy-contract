Alive House Smart Contracts


The main functional smart contracts are
:- AliveHouse
:- BandContract
:- AliveSongs



other contracts are just helper contracts. 

  
  AliveCore

Alivecore smart contract is alive house's main smart contract that keep tracks of all the and created. 
1) Fetch all bands;
To fetch all the bands created, simply call the function returnAllBands() and it will return all the bands created in an array of object. The output will consist of  
     bandId;
     bandName;
     bandAddress;
     deployer;

2) create new band;  
to create a new band in alive core, the band contract proxy has to be already deployed and the address needs to be passed in the alive core contract as the bandContract address with other required parameters like bandName and bandAdmin. 



3) V2AliveERC1155 - It is the nft contract that each song will use to launch their collection. They consist 3 types of nfts. Experience, Explore, Own
1 type of each. The artist can decide the supply, metadata and other details of the mint and auctions. 




All the 3 contracts are independent of each other, and to deploy any of the one contract it has to be done by creating a instance of the proxy through hardhat plugin for proxy contracts.
