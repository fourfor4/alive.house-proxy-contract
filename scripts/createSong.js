const abi_path = require.resolve("../artifacts/contracts/NewContracts/BandContracts/AliveBand.sol/AliveBand.json");
const { ethers }= require("ethers");
const fs = require("fs");
let json = fs.readFileSync(abi_path);
let abi = JSON.parse(json).abi;


// const abi_path2 = require.resolve("../artifacts/contracts/ALiveCore.sol/AliveCore.json");

// let json2 = fs.readFileSync(abi_path2);
// let abi2 = JSON.parse(json2).abi;


// const abi_path3 = require.resolve("../artifacts/contracts/AliveFixed.sol/AliveFixed.json");

// let json3 = fs.readFileSync(abi_path3);
// let abi3 = JSON.parse(json3).abi;


let alivecoreAddress = "0x0DDe0Dc88386D97ADeE8adcEcB72971cCa13Cb2a";
let bandId = 1;



// let bandContractAddress = "0x3a8fc3ca04B6809D0dcd1224c052E800b30FE82e";
let bandContractAddress = "0x96939e508e5723b02a148d8d094cbfEC2De2b868";

let PrivateKey = "0xe17e70beecab776bf81fd6d5df637cc816cf5306f20020faf948db92017a63b2"; // env (xxx)
let provider = "https://polygon-mumbai.g.alchemy.com/v2/kV8qIfhZYAYxIzeQrxfHrso9_R-ITP4y";

let Provider = new ethers.providers.JsonRpcProvider(provider)
let managerWallet = new ethers.Wallet(PrivateKey, Provider)
console.log('public key of manager wallet', managerWallet.address);



// let AliveCoreContract = new ethers.Contract(alivecoreAddress, abi2, managerWallet );

// async function getBandFunc() {
//     let getBand = await AliveCoreContract.returnAllBands({gasLimit: 1000000});
//     console.log("getBand", getBand[0].bandAddress, getBand[1].bandAddress);
//     bandContractAddress = getBand[0].bandAddress;
// }

// getBandFunc()
console.log('bca', bandContractAddress);

let Band = new ethers.Contract(bandContractAddress, abi, managerWallet );
console.log('1');


let _royaltyReceiverSecondary= managerWallet.address;
let _royaltyFeesInBips = 20;
let _royaltyReceiverSplit = managerWallet.address;
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

async function createSong() {
    // let estimateGas = await Band.estimateGas.createDutchSong(
    //     _royaltyReceiverSecondary,
    //     _royaltyFeesInBips,
    //     _royaltyReceiverSplit,
    //     _offchainRoyaltyPercentageInBips,
    //     _songURI,
    //     _contractURI,
    //     managerWallet.address,
    //     [_maxFixedMint, _ceilPrice, _floorPrice,68000000 ,_discountPrice]
    //   );
    //   console.log('estimateGas', estimateGas);
      
      let dutchSong = await Band.createDutchSong(
        _royaltyReceiverSecondary,
        _royaltyFeesInBips,
        _royaltyReceiverSplit,
        _offchainRoyaltyPercentageInBips,
        _songURI,
        _contractURI,
        managerWallet.address,
        [_maxFixedMint, _ceilPrice, _floorPrice, 68000000 ,_discountPrice] , {
            gasLimit: 4000000
        }
    
      );
  
      let dutchSongTxReceipt = await dutchSong.wait();
console.log('done', createSong);

// let Song = new ethers.Contract("0xA275504019eBCc2B55D5e1a574c7Fa1033041734", abi3, managerWallet);

// let unpause = await Song.unpause({gasLimit: 80000});
// await unpause.wait();
// console.log('unpaused');

// let fixMint = await Song.fixedMint(managerWallet.address, 1, {gasLimit: 1000000});
// await fixMint.wait();
// console.log('minted');
 

}
               
createSong();