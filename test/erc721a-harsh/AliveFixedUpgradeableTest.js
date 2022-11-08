const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const hre = require("hardhat");




describe(" Test", function() {
    it("Deploys AliveNft and creates proxy", async function() {
      const [manager, artist, buyer] = await ethers.getSigners();
      console.log(manager.address)
      console.log(artist.address)
      
      let _royaltyReceiverSecondary = artist.address;
      let _royaltyFeesInBips = 20;
      let _fixedMintTokenID = 1;
      let _maxFixedMint = 10;
      let _fixedMintPrice = 0;
      let _royaltyReceiverSplit = artist.address;
      let _contractURI = "https://gateway.pinata.cloud/ipfs/QmU64cH8LVn238fSjMktsqBpqdv882fXiFR7Dt3tHQGnTw";


      let BandImplementation = await hre.ethers.getContractFactory(
        "BandContract"
      );
      let bandImp = await BandImplementation.deploy();
      await bandImp.deployed();
    
      console.log("band imp", bandImp.address);
    
      let alivefixedImp = await hre.ethers.getContractFactory("AliveFixedUpgradeable");
      let aliveFixed = await alivefixedImp.deploy();
    
      await aliveFixed.deployed();
    
      console.log('aliveFixed Imp', aliveFixed.address);
    
      let aliveBondedImp = await hre.ethers.getContractFactory("AliveBondedUpgradeable");
      let aliveBonded = await aliveBondedImp.deploy();
    
      await aliveBonded.deployed();
    
    
      let aliveDutchImp = await hre.ethers.getContractFactory("AliveDutchUpgradeable");
      let aliveDutch = await aliveDutchImp.deploy();
    
      await aliveDutch.deployed();
    
      console.log('aliveBonded Imp', aliveBonded.address);
      
      let arr = [aliveFixed.address, aliveBonded.address, aliveDutch.address]
      
      /*
      Let now start with deploying a proxy of our main aliveCore contract which deploys bands and keeps tracks of them
      */
     
      
 
  let AliveRegistry = await hre.ethers.getContractFactory("Registry");
  let registry = await AliveRegistry.deploy(buyer.address, 20, manager.address,bandImp.address, arr);
  await registry.deployed();
 
console.log('registry', registry.address);
  
      const AliveNft = await hre.ethers.getContractFactory("AliveFixedUpgradeable");
      
      let alivenft = await hre.upgrades.deployProxy(
        AliveNft,
        [_royaltyReceiverSecondary, _royaltyFeesInBips,_maxFixedMint, _fixedMintPrice,_royaltyReceiverSplit, 100, "", _contractURI,1, artist.address, registry.address],
        { kind: "transparent" }
      );
      // await alivenft.deployed();

      
      console.log("AliveNft proxy deployed", alivenft.address);
    //   let createBand = await alivenft.createBand("Harsh's BAnd"); // creates a empty band
    //   await createBand.wait();

    console.log("contractURI",await alivenft.contractURI());
    let setURI = await alivenft.setURI("https://alive-static-assets.s3.ap-south-1.amazonaws.com/artist/huyana/1.json");
    await setURI.wait();
    // let unpause = await alivenft.unpause();
    // await unpause.wait();
    let fixedMint1 = await alivenft.fixedMint(manager.address, 1);
    await fixedMint1.wait();
    let fixedMint2 = await alivenft.fixedMint(manager.address, 1);
    await fixedMint2.wait();
    let fixedMint3 = await alivenft.fixedMint(manager.address, 5);
    await fixedMint3.wait();
    console.log('minted', await alivenft.totalSupply());

    let tranfer = await alivenft.transferFrom(manager.address, buyer.address, 2);
    await tranfer.wait();
    let tranfer2 = await alivenft.transferFrom(manager.address, artist.address, 1);
    await tranfer2.wait();
    
    let newDrop1 = await alivenft.newDrop({value: ethers.utils.parseEther("77")});
    await newDrop1.wait();
    let newDrop2 = await alivenft.newDrop({value: ethers.utils.parseEther("77")});
    await newDrop2.wait();
    console.log('buyer balance before', await buyer.getBalance());
    
    let claimDrop = await alivenft.connect(buyer).claimAllDrop(2);
    await claimDrop.wait();
    console.log('buyer balance', await buyer.getBalance());

    console.log('artist balance', await artist.getBalance());
    let bal = await alivenft.myBalance(1)
    await bal.wait();
    console.log('my bal', bal);
    
    let claimDrop2 = await alivenft.connect(artist).claimDrop(1,1);
    await claimDrop2.wait();
   
    console.log('c value', await alivenft.claimed(1));
    console.log('c value', await alivenft.claimed(2));
    let claimDrop1 = await alivenft.connect(artist).claimDrop(2,1);
    await claimDrop1.wait();
    console.log('artist balance', await artist.getBalance());

    console.log('c value', await alivenft.claimed(2));


    });
    
});

