const hre = require("hardhat");
const { ethers } = require("hardhat");

// const abi = require("artifacts/contracts/NewBandContract.sol/N456Factory.json")
// const fetch = require("node-fetch");
// const https = require('https');

async function main() {
  const [manager, artist, royaltyReceiver] = await ethers.getSigners();

  console.log(manager.address);
  console.log(artist.address);

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

  
  
  // let owner
  // let's try calling the create band proxy function to create a new band now with the artist's address

  const createBandProxy = await alivecore.createBandProxy(
    artist.address,
    "Harsh's band"
  );
  await createBandProxy.wait();
  console.log("createBandProxy res", createBandProxy);
  console.log("all bands", await alivecore.returnAllBands());
  let allbands = await alivecore.returnAllBands();
  // now that we are able to create band contract proxies, let's try creating a song from the band

  let band1 = allbands[0].bandAddress;
  console.log("band 1", band1);

  let Band = BandImplementation.attach(band1);

  let _royaltyReceiverSecondary = manager.address;
  let _royaltyFeesInBips = 20;
  let _maxFixedMint = 10;
  let _fixedMintPrice = 0;
  let _royaltyReceiverSplit = manager.address;
  let _contractURI =
    "https://gateway.pinata.cloud/ipfs/Qmcy1npWh2BLFnqpEATrd3Z82xffYN2UQh17wzkAdpXHv6";
  let _uri =
    "https://gateway.pinata.cloud/ipfs/QmYVgKfZbKmdLf7MNAGVZBVLP3xYQGAxtHGJccLDPeaidW/1.json";

  let songDep = await Band.createSongFixed(
    _royaltyReceiverSecondary,
    _royaltyReceiverSplit,
    100,
    _uri,
    _contractURI,
    _royaltyFeesInBips,
    _maxFixedMint,
    _fixedMintPrice,
    artist.address, {gasLimit: 10000000}
  );

  let txReceipt = await songDep.wait();
  // console.log('txR', txReceipt);
  
  let songAddress = txReceipt.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[0]; //

  let Song = alivefixedImp.attach(songAddress);
  console.log('id', await Song.songId());
  
  let songId = txReceipt.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[1]; //

  let songType = txReceipt.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[2]; // if 1, i.e fixed mint
  console.log(
    `New song created at address ${songAddress}. song id = ${songId}`
  );
  let songDep2 = await Band.createSongBonded(
    _royaltyReceiverSecondary,
    _royaltyReceiverSplit,
    100,
    _uri,
    _contractURI,
    _royaltyFeesInBips,
    artist.address,[10, 10, 10],  {gasLimit: 10000000}
  );

  let txReceipt2 = await songDep2.wait();
  // console.log('txR', txReceipt2);
  
  let songAddress2 = txReceipt2.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[0]; //

  let Song2 = alivefixedImp.attach(songAddress2);
  console.log('id', await Song2.songId());
  
  let songId2 = txReceipt2.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[1]; //

  let songType2 = txReceipt2.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[2]; // if 1, i.e fixed mint
  console.log(
    `New song created of type bonded curve at address ${songAddress2}. song id = ${songId2}`
  );


  let pricedecreasePerHour = ethers.utils.parseEther(
    "0.000001"
  );
  console.log( 2000000*0.000001);
  

  let time = new Date();
  console.log('epoch', time.getTime()/1000, "", Date.parse(time)/1000);
  

  let songDep3 = await Band.createSongDutch(
    _royaltyReceiverSecondary,
    _royaltyReceiverSplit,
    100,
    _uri,
    _contractURI,
    _royaltyFeesInBips,
    artist.address, [100, ethers.utils.parseEther("1"), ethers.utils.parseEther("0.0003"), Date.parse(time)/1000 - 10, pricedecreasePerHour],  {gasLimit: 10000000}
  );

  let txReceipt3 = await songDep3.wait();
  // console.log('txR', txReceipt3);
  
  let songAddress3 = txReceipt3.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[0]; //

  let Song3 = alivefixedImp.attach(songAddress3);
  console.log('id', await Song3.songId());
  
  let songId3 = txReceipt3.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[1]; //

  let songType3 = txReceipt3.events.filter(
    (event) => event.event == "songAdded"
  )[0].args[2]; // if 3, i.e dutch mint

  console.log(
    `New song created of type dutch auction at address ${songAddress3}. song id = ${songId3}`
  );

  let dutch = aliveDutchImp.attach(songAddress3);
  

 
 
  console.log('start time', Number(await dutch.startAt()));
  
  console.log('price',    ethers.utils.formatEther(await dutch.getPrice(1)));
  console.log('balance before', await royaltyReceiver.getBalance());
  
  let mint = await dutch.dutchAuction(manager.address, 1, {value: await dutch.getPrice(1) });
  let txReceipt4 = await mint.wait();
  let id = txReceipt4.events.filter(
    (event) => event.event == "Transfer"
  )[0].args[2]; // if 3, i.e dutch mint
  console.log('id', id);
  console.log('balance after', await royaltyReceiver.getBalance());

  }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
