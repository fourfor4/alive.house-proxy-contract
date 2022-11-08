const hre = require("hardhat");
const {ethers}= require("hardhat");
const { map } = require("lodash");
var _ = require('lodash');


// const abi = require("artifacts/contracts/NewBandContract.sol/N456Factory.json")
// const fetch = require("node-fetch");
// const https = require('https');

async function main() {
  const [manager, artist, buyer] = await ethers.getSigners();
  console.log(manager.address)
  console.log(artist.address)
  // here we have just aggregated what all we need 

  let band = await hre.ethers.getContractFactory("BandContract");
  let Band = band.attach("0x6066f23D01fFe4db626489E25867BEffA56f47cF");

  // console.log(await Band.bandId());

let royaltyPercentageArtist = 55;
let aliveRoyality = 5;
// now we will have to calculate the percentage distribution between alive na dthe artist for the secondary sale royalties.
let total = royaltyPercentageArtist + aliveRoyality;
let artistP = (royaltyPercentageArtist/total).toFixed(2);
console.log('artistP', Number(artistP));
let artistPinBips = (Number(artistP)*100*10000).toFixed(0);

let alivePinBips = 1000000 - Number(artistPinBips);
console.log('artistPinBips', Number(artistPinBips));
console.log('alivePinBips', alivePinBips);


let arrayAllocation = [Number(artistPinBips), alivePinBips];
let arrayAddress = [artist.address, await Band.aliveHouse()]
// console.log('array of allocation', arrayAllocation);
// console.log('array of address', arrayAddress);
// code to sort address and allocation 


let allocation2 = [200000, 400000, 300000, 100000 ];
let add = [	"0x1A50bDa9A9cE038a405bD0997a134e422c7Ba474",
  "0x0dd68c06Af920CA069CDc27d05AA9EB65F85990A",
  "0xdbFdC17E0EbDcE877DF950f9a45AC0EF7368A3F6", "0x15127d203C489062fDB62D3FCa3E72172ba80A81"];


let mappingOfAddToAllocation = new Map();
console.log(ethers.utils.parseEther("0.1"));

for (let i = 0; i < add.length; i++) {
  
  mappingOfAddToAllocation.set(add[i], allocation2[i]);
  
}



let newarr = _.sortBy(add);
let newAllocation = [];

console.log(mappingOfAddToAllocation.get(add[0]));

for (let i = 0; i < newarr.length; i++) {
  newAllocation.push(mappingOfAddToAllocation.get(newarr[i]));  
  // console.log('new allocation', newAllocation);
  
}

console.log(newarr);
console.log(newAllocation);
 


try {
  let secondarySplit = await Band.createSplitWallet(newarr, newAllocation, {gasLimit: 2000000});
let txReceipt =  await secondarySplit.wait();
console.log('split1', secondarySplit);
  let Address = txReceipt.events.filter(event => event.event == 'splitWalletCreated')[0].args[0]; //
console.log('Address', Address);


  let Address2 = txReceipt.events.filter(event => event.event == 'splitExist')[0].args[0]; //
console.log('Address2', Address2);

if(Address == 0) {
  console.log("split exists already at", Address2 );
}
else {
  console.log('split created at', Address);
  
}

} catch (error) {
  console.log(error)
}


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });