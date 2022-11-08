const hre = require("hardhat");
const { ethers, upgrades } = hre;

async function main() {
  let Manager;
  let Artist;
  let RoyaltyReceiver;

  let aliveBand;
  let aliveFixedSong;
  let aliveBondedSong;
  let aliveDutchSong;

  let aliveRegistry;
  let aliveHouse;

  let _feePercent = 20;
  let _maxMintAmountsPerTx = [10, 10, 10];

  [Manager, Artist, RoyaltyReceiver] = await ethers.getSigners();
  // console.log("Manager : ", Manager.address);
  // console.log("Artist : ", Artist.address);
  // console.log("RoyaltyReceiver : ", RoyaltyReceiver.address);

  let AliveNewSong = await ethers.getContractFactory("AliveNewSong");
  aliveNewSong = await AliveNewSong.deploy();
  await aliveNewSong.deployed();
  console.log("alive new song : ", aliveNewSong.address);

  let AliveBandV2 = await ethers.getContractFactory("AliveBandV2");
  aliveBandV2 = await AliveBandV2.deploy();
  await aliveBandV2.deployed();

  console.log("AliveBandV2 : ", aliveBandV2.address);

  let AliveRegistryV2 = await ethers.getContractFactory("AliveRegistryV2");
  let aliveRegistryV2 = await AliveRegistryV2.deploy();
  await aliveRegistryV2.deployed();
  console.log("alive Registry V2: ", aliveRegistryV2.address);

  let AliveHouseV2 = await ethers.getContractFactory("AliveHouseV2");
  let aliveHouseV2 = await AliveHouseV2.deploy();
  await aliveHouseV2.deployed();
  console.log("alive house v2: ", aliveHouseV2.address);

  let AliveBondedSongV2 = await ethers.getContractFactory("AliveBondedSongV2");
  let aliveBondedSongV2 = await AliveBondedSongV2.deploy();
  await aliveBondedSongV2.deployed();
  console.log("alive bonded song v2: ", aliveBondedSongV2.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
