const { assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");

describe("Upgradeable Alive NFT", () => {
  let Manager;
  let Artist;
  let RoyaltyReceiver;
  let NFTMinter1;
  let NFTMinter2;
  let NFTMinter3;

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
    [Manager, Artist, RoyaltyReceiver, NFTMinter1, NFTMinter2, NFTMinter3] =
      await ethers.getSigners();
    _royaltyReceiverSecondary = Manager.address;
    _royaltyReceiverSplit = Manager.address;
    console.log("Manager : ", Manager.address);
    console.log("Artist : ", Artist.address);
    console.log("RoyaltyReceiver : ", RoyaltyReceiver.address);
    console.log("NFTMinter1 : ", NFTMinter1.address);
    console.log("NFTMinter2 : ", NFTMinter2.address);
    console.log("NFTMinter3 : ", NFTMinter3.address);
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
    console.log("Alive Registry Owner : ", await aliveRegistry.adminAddress());
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
      [_maxFixedMint, _initialPrice, 10000],
      {
        gasLimit: 10000000,
      }
    );

    let fixedSongTxReceipt = await fixedSong.wait();

    let fixedSongAddress = fixedSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
    )[0].args[0];
    let fixedSongId = fixedSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
    )[0].args[1];
    let fixedSongType = fixedSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
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
      [_maxFixedMint, _initialPrice, _upcountRate, 1000000],
      {
        gasLimit: 10000000,
      }
    );

    let bondedSongTxReceipt = await bondedSong.wait();

    let bondedSongAddress = bondedSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
    )[0].args[0];
    let bondedSongId = bondedSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
    )[0].args[1];
    let bondedSongType = bondedSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
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
      [_maxFixedMint, _ceilPrice, _floorPrice, 789797,_discountPrice],
      {
        gasLimit: 10000000,
      }
    );

    let dutchSongTxReceipt = await dutchSong.wait();

    let dutchSongAddress = dutchSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
    )[0].args[0];
    let dutchSongId = dutchSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
    )[0].args[1];
    let dutchSongType = dutchSongTxReceipt.events.filter(
      (event) => event.event === "SongCreated"
    )[0].args[2];
    console.log(
      `New Dutch Song with songID-${dutchSongId} type-${dutchSongType} at address-${dutchSongAddress}`
    );

    dutchsongImpOfBand1 = await aliveDutchSong.attach(dutchSongAddress);
    aliveSongProxys.push(dutchsongImpOfBand1);

    console.log("-------- Dutch Song End ---------");
  });

  it("Mint Fixed Songs", async () => {
    console.log(
      "Minter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log('getPrice Fixed', ethers.utils.formatEther(await fixedsongImpOfBand1.getPrice(1)), ethers.utils.formatEther(await fixedsongImpOfBand1.getPrice(2)));
    
    const options = {
      value: ethers.utils.parseEther("30"),
    };
    await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .mint(NFTMinter1.address, 10, options);

    console.log(
      "Minter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );

    console.log(
      "Fixed Song Each Price : ",
      await fixedsongImpOfBand1.initialPrice()
    );
    console.log('band', await fixedsongImpOfBand1.band());
    
  });

  it("Mint Bonded Songs", async () => {
    console.log(
      "Minter2 Balance : ",
      (await ethers.provider.getBalance(NFTMinter2.address)) / 10 ** 18
    );

    console.log('getPrice Bonded',
     ethers.utils.formatEther(await bondedsongImpOfBand1.getPrice(1)),
      ethers.utils.formatEther(await bondedsongImpOfBand1.getPrice(2)),
      ethers.utils.formatEther(await bondedsongImpOfBand1.getPrice(3)),
      ethers.utils.formatEther(await bondedsongImpOfBand1.getPrice(4)),
      ethers.utils.formatEther(await bondedsongImpOfBand1.getPrice(5)),
      
    );


    const options = {
      value: ethers.utils.parseEther("200"),
    };
    await bondedsongImpOfBand1
      .connect(NFTMinter2)
      .mint(NFTMinter2.address, 10, options);

    console.log(
      "Minter2 Balance : ",
      (await ethers.provider.getBalance(NFTMinter2.address)) / 10 ** 18
    );

    console.log(
      "Bonded Song Initial Price : ",
      await bondedsongImpOfBand1.initialPrice()
    );

    console.log(
      "Bonded Song Current Price : ",
      await bondedsongImpOfBand1.currentPrice()
    );
  });

  it("Mint Dutch Songs", async () => {
    console.log(
      "Minter3 Balance : ",
      (await ethers.provider.getBalance(NFTMinter3.address)) / 10 ** 18
    );
    const options = {
      value: ethers.utils.parseEther("200"),
    };
    await dutchsongImpOfBand1
      .connect(NFTMinter3)
      .mint(NFTMinter3.address, 10, options);

    console.log(
      "Minter3 Balance : ",
      (await ethers.provider.getBalance(NFTMinter3.address)) / 10 ** 18
    );

    console.log(
      "Dutch Song Ceil Price : ",
      await dutchsongImpOfBand1.ceilPrice()
    );

    console.log(
      "Dutch Song Current Price : ",
      ethers.utils.formatEther(await dutchsongImpOfBand1.getPrice(1)), 
      ethers.utils.formatEther(await dutchsongImpOfBand1.getPrice(2)), 

    );
  });
});
