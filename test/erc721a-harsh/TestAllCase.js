const { assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, upgrades } = require("hardhat");

describe("Upgradeable Alive NFT", () => {
  let Manager;
  let Artist;
  let RoyalyReceiver;

  let bandContract;
  let aliveFixedContract;
  let aliveBondedContract;
  let aliveDutchContract;

  let aliveNewTypeContract;
  let bandV2Contract;

  let registryContract;
  let aliveCoreContract;

  let nftBeacons;

  let fixedsong_1_imp;
  let bondedsong_1_imp;
  let dutchsong_1_imp;
  let newtypesong_1_imp;

  let _royaltyReceiverSecondary;
  let _royaltyFeesInBips = 20;
  let _maxFixedMint = 10;
  let _fixedMintPrice = 10;
  let _royaltyReceiverSplit;
  let _contractURI =
    "https://gateway.pinata.cloud/ipfs/Qmcy1npWh2BLFnqpEATrd3Z82xffYN2UQh17wzkAdpXHv6";
  let _uri =
    "https://gateway.pinata.cloud/ipfs/QmYVgKfZbKmdLf7MNAGVZBVLP3xYQGAxtHGJccLDPeaidW/1.json";

  before(async () => {
    [Manager, Artist, RoyalyReceiver] = await ethers.getSigners();
    console.log(Manager);
    _royaltyReceiverSecondary = Manager.address;
    _royaltyReceiverSplit = Manager.address;
    console.log("Manager : ", Manager.address);
    console.log("Artist : ", Artist.address);
    console.log("RoyaltyReceiver : ", RoyalyReceiver.address);
  });

  it("Deploy the Band and NFT contracts", async () => {
    let BandContract = await ethers.getContractFactory("BandContract");
    bandContract = await BandContract.deploy();
    await bandContract.deployed;
    console.log("Initial Band Contract Implementation Add: ", bandContract.address);

    let AliveFixedContract = await ethers.getContractFactory(
      "AliveFixedUpgradeable"
    );
    aliveFixedContract = await AliveFixedContract.deploy();
    await aliveFixedContract.deployed();
    console.log("Initial Alive Fixed Contract Implementation Add: ", aliveFixedContract.address);

    let AliveBondedContract = await ethers.getContractFactory(
      "AliveBondedUpgradeable"
    );
    aliveBondedContract = await AliveBondedContract.deploy();
    await aliveBondedContract.deployed();
    console.log(
      "Initial Alive Bonded Contract Implementation Add: ",
      aliveBondedContract.address
    );

    let AliveDutchContract = await ethers.getContractFactory(
      "AliveDutchUpgradeable"
    );
    aliveDutchContract = await AliveDutchContract.deploy();
    await aliveDutchContract.deployed();
    console.log("Initial Alive Dutch Contract Implementation Add: ", aliveDutchContract.address);
  });

  it("Deploy the Registry Contract", async () => {
    let RegistryContract = await ethers.getContractFactory("Registry");
    registryContract = await RegistryContract.deploy(
      RoyalyReceiver.address,
      20,
      Manager.address,
      bandContract.address,
      [
        aliveFixedContract.address,
        aliveBondedContract.address,
        aliveDutchContract.address,
      ]
    );
    await registryContract.deployed();
    console.log("Registry Contract : ", registryContract.address);
  });

  it("Deploy the AliveCore Contract", async () => {
    let AliveCoreContract = await ethers.getContractFactory("AliveCore");
    aliveCoreContract = await upgrades.deployProxy(
      AliveCoreContract,
      [registryContract.address],
      { kind: "transparent" }
    );
    console.log("Alive Core Contract : ", aliveCoreContract.address);
  });

  it("Create Band", async () => {
    await aliveCoreContract.createBandProxy(Artist.address, "Harsh's Band");
    console.log("All Bands : ", await aliveCoreContract.returnAllBands());
  });

  it("Band1 create songs", async () => {
    let Band1 = await aliveCoreContract.getBandFromId(1);
    console.log("Band1 : ", Band1);
    let band_1_imp = await bandContract.attach(Band1.bandAddress);
    console.log("band 1 proxy deployement : ", band_1_imp.address);

    console.log("-------- Fixed Song Start ---------");

    let fixedSong = await band_1_imp.createSongFixed(
      _royaltyReceiverSecondary,
      _royaltyReceiverSplit,
      100,
      _uri,
      _contractURI,
      _royaltyFeesInBips,
      _maxFixedMint,
      _fixedMintPrice,
      Artist.address,
      {
        gasLimit: 10000000,
      }
    );

    let fixedSongTxReceipt = await fixedSong.wait();

    let fixedSongAddress = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[0];
    let fixedSongId = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[1];
    let fixedSongType = fixedSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[2];

    fixedsong_1_imp = await aliveFixedContract.attach(fixedSongAddress);
    console.log(
      `New Fixed Song with songID-${fixedSongId} type-${fixedSongType} at address-${fixedSongAddress}`
    );
    console.log(fixedsong_1_imp.address);

    console.log("-------- Fixed Song End ---------");

    console.log("-------- Bonded Song Start ---------");

    let bondedSong = await band_1_imp.createSongBonded(
      _royaltyReceiverSecondary,
      _royaltyReceiverSplit,
      100,
      _uri,
      _contractURI,
      _royaltyFeesInBips,
      Artist.address,
      [10, 10, 10],
      {
        gasLimit: 10000000,
      }
    );

    let bondedSongTxReceipt = await bondedSong.wait();

    let bondedSongAddress = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[0];
    let bondedSongId = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[1];
    let bondedSongType = bondedSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[2];

    bondedsong_1_imp = await aliveBondedContract.attach(bondedSongAddress);
    console.log(
      `New Bonded Song with songID-${bondedSongId} type-${bondedSongType} at address-${bondedSongAddress}`
    );

    console.log("-------- Bonded Song End ---------");

    console.log("-------- Dutch Song Start ---------");

    let price_decrease_per_hour = ethers.utils.parseEther("0.000001");
    let time = new Date();
    let dutchSong = await band_1_imp.createSongDutch(
      _royaltyReceiverSecondary,
      _royaltyReceiverSplit,
      100,
      _uri,
      _contractURI,
      _royaltyFeesInBips,
      Artist.address,
      [
        100,
        ethers.utils.parseEther("3"),
        ethers.utils.parseEther("0.0003"),
        Date.parse(time) / 1000 - 10,
        price_decrease_per_hour,
      ],
      {
        gasLimit: 10000000,
      }
    );

    let dutchSongTxReceipt = await dutchSong.wait();

    let dutchSongAddress = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[0];
    let dutchSongId = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[1];
    let dutchSongType = dutchSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[2];

    dutchsong_1_imp = await aliveDutchContract.attach(dutchSongAddress);
    console.log(
      `New Dutch Song with songID-${dutchSongId} type-${dutchSongType} at address-${dutchSongAddress}`
    );
    console.log("-------- Dutch Song End ---------");
  });

  it("Deploy NewMintType Contract", async () => {
    let AliveNewTypeContract = await ethers.getContractFactory(
      "TestNewEdition"
    );
    aliveNewTypeContract = await AliveNewTypeContract.deploy();
    await aliveNewTypeContract.deployed();
    console.log("aliveNewTypeContract Implementation: ", aliveNewTypeContract.address);
  });

  it("Add AliveNewType Imp Contract Imp to Registry", async () => {
    nftBeacons = await registryContract.nftBeacons();
    console.log("nft Beacons before add : ", nftBeacons);
    await registryContract.addNewImp(aliveNewTypeContract.address);
    nftBeacons = await registryContract.nftBeacons();
    console.log("nft Beacons after add : ", nftBeacons);
  });

  it("Upgrade Band Contract", async () => {
    let BandV2Contract = await ethers.getContractFactory("V2BandContract");
    bandV2Contract = await BandV2Contract.deploy();
    await bandV2Contract.deployed();
    console.log("bandV2Contract : ", bandV2Contract.address);

    await registryContract.upgradeBandImplementation(bandV2Contract.address);
  });

  it("Upgraded Band1 create new type of song", async () => {
    let Band1 = await aliveCoreContract.getBandFromId(1);
    let band_1_imp = await bandV2Contract.attach(Band1.bandAddress);

    console.log("-------- New Song Start ---------");

    let price_decrease_per_hour = ethers.utils.parseEther("0.000001");
    let time = new Date();
    let newTypeSong = await band_1_imp.createSongNewType(
      _royaltyReceiverSecondary,
      _royaltyReceiverSplit,
      100,
      _uri,
      _contractURI,
      _royaltyFeesInBips,
      Artist.address,
      [
        100,
        ethers.utils.parseEther("3"),
        ethers.utils.parseEther("0.0003"),
        1000,
        Date.parse(time) / 1000 - 10,
        price_decrease_per_hour,
      ],
      {
        gasLimit: 10000000,
      }
    );

    let newTypeSongTxReceipt = await newTypeSong.wait();

    let newTypeSongAddress = newTypeSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[0];
    let newTypeSongId = newTypeSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[1];
    let newTypeSongType = newTypeSongTxReceipt.events.filter(
      (event) => event.event === "songAdded"
    )[0].args[2];

    newtypesong_1_imp = await aliveNewTypeContract.attach(newTypeSongAddress);
    console.log(
      `New Type Song with songID-${newTypeSongId} type-${newTypeSongType} at address-${newTypeSongAddress}`
    );
    console.log("-------- New Song End ---------");
  });

  it("Test Reentrant", async () => {
    let AttackerContract = await ethers.getContractFactory("Attacker");
    let attackerContract = await AttackerContract.deploy(
      fixedsong_1_imp.address
    );
    await attackerContract.deployed();
    const options = {
      value: ethers.utils.parseEther("50"),
    };
    await fixedsong_1_imp.fixedMint(attackerContract.address, 1, options);
    console.log(
      "Manager Balanace : ",
      await ethers.provider.getBalance(Manager.address)
    );
    console.log(
      "Register : ",
      await ethers.provider.getBalance(registryContract.address)
    );
    console.log(
      "Fixed Song Balance : ",
      await ethers.provider.getBalance(fixedsong_1_imp.address)
    );
    console.log(
      "Attacker : ",
      await ethers.provider.getBalance(attackerContract.address)
    );
  });
});
