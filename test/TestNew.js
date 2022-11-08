const { assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");

describe("Upgradeable Alive NFT", () => {
  let Manager;
  let Artist;
  let RoyaltyReceiver;

  let aliveBand;
  let aliveFixedSong;
  let aliveBondedSong;
  let aliveDutchSong;

  let aliveRegistry;
  let aliveHouse;

  let aliveNewSong;
  let aliveBandV2;
  let aliveBondedSongV2;
  let aliveRegistryV2;

  let aliveSongProxys = [];

  let band1Imp;

  let fixedsongImpOfBand1;
  let bondedsongImpOfBand1;
  let dutchsongImpOfBand1;
  let newsongImpOfBand1;

  let _feePercent = 20;
  let _maxMintAmountsPerTx = [100, 100, 100];

  let _royaltyReceiverSecondary;
  let _royaltyFeesInBips = 20;
  let _royaltyReceiverSplit;
  let _offchainRoyaltyPercentageInBips = 100;
  let _maxFixedMint = 10;
  let _initialPrice = ethers.utils.parseEther("3");
  let _upcountRate = ethers.utils.parseEther("0.1");
  let _discountRate = ethers.utils.parseEther("0.1");

  let _ceilPrice = ethers.utils.parseEther("3");
  let _floorPrice = ethers.utils.parseEther("0.0003");
  let _discountPrice = ethers.utils.parseEther("0.000001");

  let _contractURI =
    "https://gateway.pinata.cloud/ipfs/Qmcy1npWh2BLFnqpEATrd3Z82xffYN2UQh17wzkAdpXHv6";
  let _songURI =
    "https://gateway.pinata.cloud/ipfs/QmYVgKfZbKmdLf7MNAGVZBVLP3xYQGAxtHGJccLDPeaidW/1.json";

  before(async () => {
    [Manager, Artist, RoyaltyReceiver] = await ethers.getSigners();
    _royaltyReceiverSecondary = Manager.address;
    _royaltyReceiverSplit = Manager.address;
    console.log("Manager : ", Manager.address);
    console.log("Artist : ", Artist.address);
    console.log("RoyaltyReceiver : ", RoyaltyReceiver.address);
  });

  it("Deploy the Band and NFT contracts", async () => {
    let AliveBand = await ethers.getContractFactory("AliveBand");
    aliveBand = await AliveBand.deploy();
    await aliveBand.deployed;
    console.log(
      "Initial Band Contract Implementation Addr: ",
      aliveBand.address
    );

    let AliveFixedSong = await ethers.getContractFactory("AliveFixedSong");
    aliveFixedSong = await AliveFixedSong.deploy();
    await aliveFixedSong.deployed();
    console.log(
      "Initial Fixed Song Contract Implementation Addr : ",
      aliveFixedSong.address
    );

    let AliveBondedSong = await ethers.getContractFactory("AliveBondedSong");
    aliveBondedSong = await AliveBondedSong.deploy();
    await aliveBondedSong.deployed();
    console.log(
      "Initial Bonded Song Contract Implementation Addr : ",
      aliveBondedSong.address
    );

    let AliveDutchSong = await ethers.getContractFactory("AliveDutchSong");
    aliveDutchSong = await AliveDutchSong.deploy();
    await aliveDutchSong.deployed();
    console.log(
      "Initial Dutch Song Contract Implementation Addr : ",
      aliveDutchSong.address
    );
  });

  it("Deploy the Registry Contract", async () => {
    let AliveRegistry = await ethers.getContractFactory("AliveRegistry");
    let songImps = [
      aliveFixedSong.address,
      aliveBondedSong.address,
      aliveDutchSong.address,
    ];
    console.log(songImps);
    aliveRegistry = await upgrades.deployProxy(
      AliveRegistry,
       [
        RoyaltyReceiver.address,
        _feePercent,
        Manager.address,
        aliveBand.address,
        songImps,
        _maxMintAmountsPerTx,
        Manager.address,
        Manager.address,
      ],
       {
        kind: "transparent",
      }
    );
    console.log("Registry Contract : ", aliveRegistry.address);
    console.log(
      "Max Mint Per Tx for Song Type 3 : ",
      aliveRegistry.getAliveSongMaxMintPerTxByType(3)
    );
  });

  it("Deploy the AliveHouse Contract", async () => {
    let AliveHouse = await ethers.getContractFactory("AliveHouse");
    aliveHouse = await upgrades.deployProxy(
      AliveHouse,
      [aliveRegistry.address],
      { kind: "transparent" }
    );
    console.log("Alive House Contract : ", aliveHouse.address);
  });

  it("Create Band 1", async () => {
    await aliveHouse.createAliveBand(Artist.address, "Mykolas's Band");
    console.log("All Bands : ", await aliveHouse.getAllBands());
  });

  it("Band 1 creates songs", async () => {
    let Band1 = await aliveHouse.getBandById(1);
    console.log("Band 1 : ", Band1);
    band1Imp = await aliveBand.attach(Band1.bandAddress);
    console.log("-------- Fixed Song Start ---------");

    let fixedSong = await band1Imp.createFixedSong(
      _royaltyReceiverSecondary,
      _royaltyFeesInBips,
      _royaltyReceiverSplit,
      _offchainRoyaltyPercentageInBips,
      _songURI,
      _contractURI,
      Artist.address,
      [_maxFixedMint, _initialPrice, 770077007],
      {
        gasLimit: 10000000,
      }
    );

    let fixedSongTxReceipt = await fixedSong.wait();

    let fixedSongAddress = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[0];
    let fixedSongId = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[1];
    let fixedSongType = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[2];
    console.log(
      `New Fixed Song with songID-${fixedSongId} type-${fixedSongType} at address-${fixedSongAddress}`
    );

    fixedsongImpOfBand1 = await aliveFixedSong.attach(fixedSongAddress);
    aliveSongProxys.push(fixedsongImpOfBand1);
    console.log("-------- Fixed Song End ---------");

    console.log("-------- Bonded Song Start ---------");

    let bondedSong = await band1Imp.createBondedSong(
      _royaltyReceiverSecondary,
      _royaltyFeesInBips,
      _royaltyReceiverSplit,
      _offchainRoyaltyPercentageInBips,
      _songURI,
      _contractURI,
      Artist.address,
      [_maxFixedMint, _initialPrice, _upcountRate,770077007 ],
      {
        gasLimit: 10000000,
      }
    );

    let bondedSongTxReceipt = await bondedSong.wait();

    let bondedSongAddress = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[0];
    let bondedSongId = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[1];
    let bondedSongType = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[2];
    console.log(
      `New Bonded Song with songID-${bondedSongId} type-${bondedSongType} at address-${bondedSongAddress}`
    );

    bondedsongImpOfBand1 = await aliveBondedSong.attach(bondedSongAddress);
    aliveSongProxys.push(bondedsongImpOfBand1);
    console.log("-------- Bonded Song End ---------");

    console.log("-------- Dutch Song Start ---------");

    let dutchSong = await band1Imp.createDutchSong(
      _royaltyReceiverSecondary,
      _royaltyFeesInBips,
      _royaltyReceiverSplit,
      _offchainRoyaltyPercentageInBips,
      _songURI,
      _contractURI,
      Artist.address,
      [_maxFixedMint, _ceilPrice, _floorPrice, 770077007,_discountPrice],
      {
        gasLimit: 10000000,
      }
    );

    let dutchSongTxReceipt = await dutchSong.wait();

    let dutchSongAddress = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[0];
    let dutchSongId = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[1];
    let dutchSongType = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[2];
    console.log(
      `New Dutch Song with songID-${dutchSongId} type-${dutchSongType} at address-${dutchSongAddress}`
    );

    dutchsongImpOfBand1 = await aliveDutchSong.attach(dutchSongAddress);
    aliveSongProxys.push(dutchsongImpOfBand1);

    console.log("-------- Dutch Song End ---------");
  });

  it("Deploy new type song contract", async () => {
    let AliveNewSong = await ethers.getContractFactory("AliveNewSong");
    aliveNewSong = await AliveNewSong.deploy();
    await aliveNewSong.deployed();
    console.log("alive new song : ", aliveNewSong.address);
  });

  it("Add aliveNewSong Imp to AliveRegistry", async () => {
    let aliveNewSongImpInfo;
    try {
      aliveNewSongImpInfo = await aliveRegistry.getAliveSongImp(3);
    } catch (error) {
      console.log("There isn't a new type of song yet!");
    }
    console.log("Alive Registry address :", aliveRegistry.address);
    await aliveRegistry.addNewSongImp(aliveNewSong.address, 44);
    try {
      aliveNewSongImpInfo = await aliveRegistry.getAliveSongImp(4);
    } catch (error) {
      console.log("I checked again, but there isn't a new type of song yet!");
    }
    console.log(aliveNewSongImpInfo);
  });

  it("Upgrade Band", async () => {
    let AliveBandV2 = await ethers.getContractFactory("AliveBandV2");
    aliveBandV2 = await AliveBandV2.deploy();
    await aliveBandV2.deployed();

    console.log("AliveBandV2 : ", aliveBandV2.address);

    await aliveRegistry.upgradeAliveBandImp(aliveBandV2.address);
  });

  it("Upgraded Band 1 creates songs", async () => {
    let Band1 = await aliveHouse.getBandById(1);
    console.log("Band 1 : ", Band1);
    band1Imp = await aliveBandV2.attach(Band1.bandAddress);
    console.log("-------- Fixed Song Start ---------");

    let fixedSong = await band1Imp.createFixedSong(
      _royaltyReceiverSecondary,
      _royaltyFeesInBips,
      _royaltyReceiverSplit,
      _offchainRoyaltyPercentageInBips,
      _songURI,
      _contractURI,
      Artist.address,
      [_maxFixedMint, _initialPrice],
      {
        gasLimit: 10000000,
      }
    );

    let fixedSongTxReceipt = await fixedSong.wait();

    let fixedSongAddress = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[0];
    let fixedSongId = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[1];
    let fixedSongType = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[2];
    console.log(
      `New Fixed Song with songID-${fixedSongId} type-${fixedSongType} at address-${fixedSongAddress}`
    );

    fixedsongImpOfBand1 = await aliveFixedSong.attach(fixedSongAddress);
    aliveSongProxys.push(fixedsongImpOfBand1);

    console.log("-------- Fixed Song End ---------");

    console.log("-------- Bonded Song Start ---------");

    let bondedSong = await band1Imp.createBondedSong(
      _royaltyReceiverSecondary,
      _royaltyFeesInBips,
      _royaltyReceiverSplit,
      _offchainRoyaltyPercentageInBips,
      _songURI,
      _contractURI,
      Artist.address,
      [_maxFixedMint, _initialPrice, _upcountRate],
      {
        gasLimit: 10000000,
      }
    );

    let bondedSongTxReceipt = await bondedSong.wait();

    let bondedSongAddress = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[0];
    let bondedSongId = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[1];
    let bondedSongType = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[2];
    console.log(
      `New Bonded Song with songID-${bondedSongId} type-${bondedSongType} at address-${bondedSongAddress}`
    );

    bondedsongImpOfBand1 = await aliveBondedSong.attach(bondedSongAddress);
    aliveSongProxys.push(bondedsongImpOfBand1);

    console.log("-------- Bonded Song End ---------");

    console.log("-------- Dutch Song Start ---------");

    let dutchSong = await band1Imp.createDutchSong(
      _royaltyReceiverSecondary,
      _royaltyFeesInBips,
      _royaltyReceiverSplit,
      _offchainRoyaltyPercentageInBips,
      _songURI,
      _contractURI,
      Artist.address,
      [_maxFixedMint, _ceilPrice, _floorPrice,68000000 ,_discountPrice],
      {
        gasLimit: 10000000,
      }
    );

    let dutchSongTxReceipt = await dutchSong.wait();

    let dutchSongAddress = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[0];
    let dutchSongId = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[1];
    let dutchSongType = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[2];
    console.log(
      `New Dutch Song with songID-${dutchSongId} type-${dutchSongType} at address-${dutchSongAddress}`
    );

    dutchsongImpOfBand1 = await aliveDutchSong.attach(dutchSongAddress);
    aliveSongProxys.push(dutchsongImpOfBand1);

    console.log("-------- Dutch Song End ---------");

    console.log("-------- New Song Start ---------");

    let newSong = await band1Imp.createNewSong(
      _royaltyReceiverSecondary,
      _royaltyFeesInBips,
      _royaltyReceiverSplit,
      _offchainRoyaltyPercentageInBips,
      _songURI,
      _contractURI,
      Artist.address,
      [_maxFixedMint, _initialPrice, _discountRate],
      {
        gasLimit: 10000000,
      }
    );

    let newSongTxReceipt = await newSong.wait();

    let newSongAddress = newSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[0];
    let newSongId = newSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[1];
    let newSongType = newSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[2];
    console.log(
      `New Type Song with songID-${newSongId} type-${newSongType} at address-${newSongAddress}`
    );

    newsongImpOfBand1 = await aliveNewSong.attach(newSongAddress);
    aliveSongProxys.push(newsongImpOfBand1);

    console.log("-------- New Song End ---------");
  });

  it("Upgrade Bonded Song", async () => {
    let aliveSongProxysAddrs = aliveSongProxys.map((item) => item.address);
    console.log("Alive Song Proxys : ", aliveSongProxysAddrs);
    console.log(
      "upcount Rate : ",
      await aliveBondedSong.attach(aliveSongProxysAddrs[1]).upcountRate()
    );
    console.log("-------- Start Upgrade Bonded Song ----------");
    let AliveBondedSongV2 = await ethers.getContractFactory(
      "AliveBondedSongV2"
    );
    aliveBondedSongV2 = await AliveBondedSongV2.deploy();
    await aliveBondedSongV2.deployed();
    await aliveRegistry.upgradeAliveSongImp(2, aliveBondedSongV2.address);
    console.log("-------- End Upgrade Bonded Song ----------");

    console.log("-------- Bonded Song Start ---------");

    let Band1 = await aliveHouse.getBandById(1);
    band1Imp = await aliveBandV2.attach(Band1.bandAddress);
    let bondedSong = await band1Imp.createBondedSongV2(
      _royaltyReceiverSecondary,
      _royaltyFeesInBips,
      _royaltyReceiverSplit,
      _offchainRoyaltyPercentageInBips,
      _songURI,
      _contractURI,
      Artist.address,
      [_maxFixedMint, _initialPrice, _upcountRate],
      {
        gasLimit: 10000000,
      }
    );

    let bondedSongTxReceipt = await bondedSong.wait();

    let bondedSongAddress = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[0];
    let bondedSongId = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[1];
    let bondedSongType = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songCreated"
    )[0].args[2];
    console.log(
      `New Bonded Song with songID-${bondedSongId} type-${bondedSongType} at address-${bondedSongAddress}`
    );

    bondedsongImpOfBand1 = await aliveBondedSongV2.attach(bondedSongAddress);
    aliveSongProxys.push(bondedsongImpOfBand1);

    console.log("-------- Bonded Song End ---------");
    try {
      await aliveBondedSongV2.attach(bondedSongAddress).setUpcountRate(2);
    } catch (error) {
      console.log(error);
    }
    console.log(
      "Upcount Rate on Bonded song : ",
      await aliveBondedSongV2.attach(bondedSongAddress).upcountRate()
    );
  });

  it("Upgrade Registry contract", async () => {
    let AliveRegistryV2 = await ethers.getContractFactory("AliveRegistryV2");
    let AliveRegistry = await ethers.getContractFactory("AliveRegistry");
    // let aliveRegistryTemp = await AliveRegistry.deploy(); // not required
    let aliveRegistryV2 = await upgrades.upgradeProxy(
      AliveRegistry.attach(aliveRegistry.address),
      AliveRegistryV2
    );
    await aliveRegistryV2.setVersion("Registry Version 2");
    console.log("Registry Version : ", await aliveRegistryV2.version());
    console.log("Fixed Song Imp : ", await aliveRegistryV2.getAliveSongImp(1));
  });

  it("Upgrade Alive House Contract", async () => {
    let AliveHouseV2 = await ethers.getContractFactory("AliveHouseV2");
    let AliveHouse = await ethers.getContractFactory("AliveHouse");
    let PAdmin = await ethers.getContractFactory("ProxyAdmin");
    let pAdmin = PAdmin.attach("0x5FC8d32690cc91D4c39d9d3abcBD16989F875707");
    
  // the contract that is the owner of all openzepplin proxy deployement
    console.log('admin', await pAdmin.getProxyAdmin(aliveHouse.address));
    
    // let aliveHouseTemp = await AliveHouse.deploy(); // not required
    let aliveHouseV2 = await upgrades.upgradeProxy(
      AliveHouse.attach(aliveHouse.address),
      AliveHouseV2
    );

    await aliveHouseV2.setVersion("Alive House Version2!");
    console.log("Alive House Verseion : ", await aliveHouseV2.version());
  });
});
