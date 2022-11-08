const { ethers }= require("ethers");
const fs = require("fs");
// const abi_path3 = require.resolve("../artifacts/contracts/AliveFixed.sol/AliveFixed.json");

// let json3 = fs.readFileSync(abi_path3);
// let abi3 = JSON.parse(json3).abi;


let PrivateKey = "0x8807d6143b293d9d33bf424bee4bbadb3106a40df70ad60e4696c89a2bc82f92"; // env (xxx)
let provider = "https://polygon-rpc.com";
// let provider = "https://polygon-mumbai.g.alchemy.com/v2/kV8qIfhZYAYxIzeQrxfHrso9_R-ITP4y";

let Provider = new ethers.providers.JsonRpcProvider(provider)
let managerWallet = new ethers.Wallet(PrivateKey, Provider)
console.log('public key of manager wallet', managerWallet.address);
async function createSong() {
    // let createSong = await contract.createSongFixed(_royaltyReceiverSecondary, _royaltyReceiverSplit, 600, _uri, _contractURI, _royaltyFeesInBips, _maxFixedMint, _fixedMintPrice, managerWallet.address, {gasLimit: 10000000});
    // await createSong.wait();
    // console.log('done', createSong);
    
let abi = ["function createToken(address, string, string) external"]
    
    let Song = new ethers.Contract("0x50020f71cafbe11fbe1062dbcd082dca55114447", abi, managerWallet);
    
    let createToken = await Song.createToken("0xC9bf66BC2EbB391CaaE7a6E7048d644aD8Af4F50", string, "https://cdn.discordapp.com/attachments/929020749228937338/981536258838892606/all_access_pass.png", {gasLimit: 6025601, gasPrice:35000000000})

    await createToken.wait();
    // let unpause = await Song.unpause({gasLimit: 80000});
    // await unpause.wait();
    // console.log('tokenuri', await Song.tokenURI(0, {gasLimit: 100000}));
    // let price = await Song.fixedMintPrice({gasLimit: 100000});
    // console.log(price, ethers.utils.formatEther(price));
    // let fixMint = await Song.fixedMint("0x8637621581B308FCe86d871E50c7ED0b3a5547A3", 1, {gasLimit: 1000000});
    // await fixMint.wait();
    // console.log('minted');
     
    
    }
                   
    createSong();