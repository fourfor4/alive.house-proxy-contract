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

  let AliveBand = await ethers.getContractFactory("AliveBand");
  aliveBand = await AliveBand.deploy();
  await aliveBand.deployed;
  console.log("Initial Band Contract Implementation Addr: ", aliveBand.address);

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

  let AliveRegistry = await ethers.getContractFactory("AliveRegistry");
  let songImps = [
    aliveFixedSong.address,
    aliveBondedSong.address,
    aliveDutchSong.address,
  ];

  aliveRegistry = await upgrades.deployProxy(
    AliveRegistry,
    [
      Manager.address,
      _feePercent,
      Manager.address,
      aliveBand.address,
      songImps,
      _maxMintAmountsPerTx,
      "0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE", // goreli = 0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE
      Manager.address,
    ],
    {
      kind: "transparent",
    }
  );
  console.log("Alive Registry Contract : ", aliveRegistry.address);


  let AliveHouse = await ethers.getContractFactory("AliveHouse");
  aliveHouse = await upgrades.deployProxy(AliveHouse, [aliveRegistry.address], {
    kind: "transparent",
  });
  console.log("Alive House Contract : ", aliveHouse.address);

  let reg = AliveRegistry.attach(aliveRegistry.address);
  let addM = await reg.addMangerWallets(["0x75E027428d09d6740BedDde853a15Ae1db876F53"]);
  await addM.wait()

  console.log('done');
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
