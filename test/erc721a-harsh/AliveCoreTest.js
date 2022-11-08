const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { before } = require("lodash");



describe("Environment setup ", async function() {
  it("should deploy band contracts", async ()=> {
    const [manager, artist, royaltyReceiver] = await ethers.getSigners();

  console.log(manager.address);
  console.log(artist.address);
//  before( async () => {
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
  let registry = await AliveRegistry.deploy(royaltyReceiver.address, 20, manager.address,bandImp.address, arr);
  await registry.deployed();
 
console.log('registry', registry.address);
  

  // let removeM = await registry.removeMangerWallet([manager.address]);
  // await removeM.wait();

  const AliveCore = await hre.ethers.getContractFactory("AliveCore");
  let alivecore = await hre.upgrades.deployProxy(
    AliveCore,
    [registry.address],
    { kind: "transparent" }
  );
  console.log("done", alivecore.address);
  console.log("beacon", await registry.bandBeacon());

  let BandBeaconImp = await hre.ethers.getContractFactory("BandBeacon");


//  let  add = await alivecore.bandBeacon();
  let bandB = BandBeaconImp.attach(await registry.bandBeacon());
  console.log('owner ', await bandB.owner());

  // });


  // describe("BandContract creation", async() => {
      // const [manager, artist, royaltyReceiver] = await ethers.getSigners();

      console.log('alivecore', alivecore.address);
      const createBandProxy = await alivecore.createBandProxy(
        artist.address,
        "Harsh's band"
      );
      await createBandProxy.wait();
      // console.log("createBandProxy res", createBandProxy);
      console.log("all bands", await alivecore.returnAllBands());
      let allbands = await alivecore.returnAllBands();
      
      assert.isTrue(allbands.length > 0, "length should be greater than 0")
    // })
  })

});

