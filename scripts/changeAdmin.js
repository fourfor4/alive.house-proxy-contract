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

  let aliveRegistry = "0x0788cbb0eDC91F9f1572bE52686F27FF358617FC";
  let aliveHouse = "0x779757fc834d7D1e9bA65b69Ca24A96E8f169e48";

  let _feePercent = 20;
  let _maxMintAmountsPerTx = [10, 10, 10];
  let adminAddress = "0xC311E43DB7F934315f249ba5d3CF346f8513ec6e"; //

  [Manager, Artist, RoyaltyReceiver] = await ethers.getSigners();

  const proxyAdmin = await ethers.getContractFactory("ProxyAdmin");
  const admin = proxyAdmin.attach(adminAddress);

  console.log("attached");

  let txn = await admin.changeProxyAdmin(aliveRegistry, aliveRegistry);

  await txn.wait();

  console.log("attached");

  let txn2 = await admin.changeProxyAdmin(aliveHouse, aliveRegistry);

  await txn2.wait();
  console.log("attached");

  let AliveRegistry = await ethers.getContractFactory("AliveRegistry");

  let registry = AliveRegistry.attach(aliveRegistry);

  let adminOfRegeistryImpl = await registry.getProxyAdmin(aliveRegistry);
  //   await adminOfRegeistryImpl.wait();
  console.log("admin:", adminOfRegeistryImpl);

  let adminOfAliveHouseImpl = await registry.getProxyAdmin(aliveHouse);
  //   await adminOfAliveHouseImpl.wait();
  console.log("admin:", adminOfAliveHouseImpl);
  // To upgrade alive Registry to v2
  //   let AliveRegistryV2 = await ethers.getContractFactory("AliveRegistryV2");
  //   let aliveRegistryV2 = await AliveRegistryV2.deploy();
  //   await aliveRegistryV2.deployed();
  //   console.log("alive Registry V2: ", aliveRegistryV2.address);

  //   let upgrade = await  registry.upgrade(aliveRegistry, aliveRegistryV2.address );
  //   await upgrade.wait();
  //   console.log('done');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
