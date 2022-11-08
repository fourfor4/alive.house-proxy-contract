const abi_path = require.resolve("../artifacts/contracts/ALiveCore.sol/AliveCore.json");
const { ethers }= require("ethers");
// const abi = abi_path.abi;
const fs = require("fs");
let json = fs.readFileSync(abi_path);
let abi = JSON.parse(json).abi;

// const abi2_path = require.resolve("../artifacts/contracts/V2AliveERC1155.sol/V2AliveERC1155.json");

// let json2 = fs.readFileSync(abi2_path);
// let abi2 = JSON.parse(json2).abi;


let alivecoreAddress = "0xcAecf2258Ce720E14bc29ee7c2f3be19771De6CB";

let PrivateKey = "0xe17e70beecab776bf81fd6d5df637cc816cf5306f20020faf948db92017a63b2"; // env (xxx)
let provider = "https://polygon-mumbai.g.alchemy.com/v2/kV8qIfhZYAYxIzeQrxfHrso9_R-ITP4y";

let Provider = new ethers.providers.JsonRpcProvider(provider)
let managerWallet = new ethers.Wallet(PrivateKey, Provider)
console.log('public key of manager wallet', managerWallet.address);


let contract = new ethers.Contract(alivecoreAddress, abi, managerWallet );

async function createBand() {

let createBandProxy = await contract.createBandProxy(managerWallet.address, "Band Name Goes here", {gasLimit: 3000000})
let txn = await createBandProxy.wait();
console.log('done createBandProxy', createBandProxy, "txn", txn);

const checkEvents = async() => {
    contract.on("BandCreated", (bandAddress, bandAdmin , bandID, bandName) => {
        console.log("events", bandAddress, "", bandAdmin, "", Number(bandID), "", bandName);
    })
}
checkEvents();



// let Song = new ethers.Contract("0xCb3Cfa40B4deC8de9Dfea412669768e88c2D2A74", abi2, managerWallet);


// // let unpause = await Song.unpause({gasLimit: 80000});
// // await unpause.wait();
// // console.log('unpaused');

// let fixMint = await Song.fixedMint(managerWallet.address, 1, {gasLimit: 1000000});
// await fixMint.wait();

// console.log('curi', await Song.contractURI({gasLimit: 80000}));
}

createBand();





