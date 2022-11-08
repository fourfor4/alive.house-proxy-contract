const { toContainHTML } = require("@testing-library/jest-dom/dist/matchers");
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
  let _maxFixedMint = 50;
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
      [_maxFixedMint, _initialPrice]
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
  });

  it("Mint and Drop Fixed Song", async () => {
    const mintOption1 = {
      value: ethers.utils.parseEther("30"),
    };

    console.log(
      "Fixed Song Each Price : ",
      (await fixedsongImpOfBand1.initialPrice()) / 10 ** 18
    );
    await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .mint(NFTMinter1.address, 4, mintOption1);
    console.log(
      "Manager Balance : ",
      (await ethers.provider.getBalance(Manager.address)) / 10 ** 18
    );
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log(
      "Artist Balance : ",
      (await ethers.provider.getBalance(Artist.address)) / 10 ** 18
    );

    const dropOption1 = {
      value: ethers.utils.parseEther("12"),
    };

    await fixedsongImpOfBand1.newDrop(dropOption1);
    console.log("All Drops", await fixedsongImpOfBand1.getAllDrops());

    const mintOption2 = {
      value: ethers.utils.parseEther("30"),
    };

    await fixedsongImpOfBand1
      .connect(NFTMinter2)
      .mint(NFTMinter2.address, 2, mintOption2);

    const dropOption2 = {
      value: ethers.utils.parseEther("30"),
    };

    await fixedsongImpOfBand1.newDrop(dropOption2);
    console.log("All Drops", await fixedsongImpOfBand1.getAllDrops());

    const mintOption3 = {
      value: ethers.utils.parseEther("30"),
    };

    await fixedsongImpOfBand1
      .connect(NFTMinter3)
      .mint(NFTMinter3.address, 2, mintOption3);

    const dropOption3 = {
      value: ethers.utils.parseEther("16"),
    };

    await fixedsongImpOfBand1.newDrop(dropOption3);
    console.log("All Drops", await fixedsongImpOfBand1.getAllDrops());
  });

  // it("Batch Air Drop", async () => {
  //   console.log("Max Mint Amount: ", await fixedsongImpOfBand1.maxMintAmount());
  //   await fixedsongImpOfBand1.batchAirDrop(
  //     [NFTMinter1.address, NFTMinter2.address, NFTMinter3.address],
  //     4
  //   );
  //   const dropOption4 = {
  //     value: ethers.utils.parseEther("50"),
  //   };
  //   await fixedsongImpOfBand1.newDrop(dropOption4);
  //   console.log("All Drops", await fixedsongImpOfBand1.getAllDrops());
  // });

  it("Claim", async () => {
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    let claimDrop1_1 = await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .claimDrop(1, 1);
    await claimDrop1_1.wait();
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log("-----------------------");

    // console.log(
    //   "NFTMinter1 Balance : ",
    //   (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    // );
    // let claimDrop1_1_1 = await fixedsongImpOfBand1
    //   .connect(NFTMinter1)
    //   .claimDrop(1, 1);
    // await claimDrop1_1_1.wait();
    // console.log(
    //   "NFTMinter1 Balance : ",
    //   (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    // );
    // console.log("-----------------------");

    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    let claimDrop2_1 = await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .claimDrop(2, 1);
    await claimDrop2_1.wait();
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log("-----------------------");

    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    let claimDrop3_1 = await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .claimDrop(3, 1);
    await claimDrop3_1.wait();
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log("-----------------------");

    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    let claimDrop1_2 = await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .claimDrop(1, 2);
    await claimDrop1_2.wait();
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log("-----------------------");

    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    let claimDrop1_3 = await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .claimDrop(1, 3);
    await claimDrop1_3.wait();
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log("-----------------------");

    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    let claimDrop1_4 = await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .claimDrop(1, 4);
    await claimDrop1_4.wait();
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log("-----------------------");

    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    let claimDrop3_5 = await fixedsongImpOfBand1
      .connect(NFTMinter1)
      .claimDrop(3, 5);
    await claimDrop3_5.wait();
    console.log(
      "NFTMinter1 Balance : ",
      (await ethers.provider.getBalance(NFTMinter1.address)) / 10 ** 18
    );
    console.log("-----------------------");

    console.log(
      "Claim Drop 1, Token 1 : ",
      await fixedsongImpOfBand1.getClaimStatusByTokenID(2)
    );

    console.log("Owner of Token ID : ", await fixedsongImpOfBand1.ownerOf(8));
    console.log(
      "Balance : ",
      await fixedsongImpOfBand1.balanceOf(NFTMinter1.address)
    );
    console.log(
      "TokenIDs by Owner : ",
      await fixedsongImpOfBand1.getAllTokensByOwner(NFTMinter3.address)
    );
  });
});
