// import LitJsSdk from 'lit-js-sdk'
const LitJsSdk = require("lit-js-sdk");
// import { fromString as uint8arrayFromString } from "uint8arrays/from-string";
// import ethers from "ethers";
const ethers = require("ethers");
// import siwe from "siwe";
const siwe = require("siwe");

require('dotenv').config();


const client = new LitJsSdk.LitNodeClient()
const chain = 'polygon'
const standardContractType = 'ERC721'


class Lit {
    litNodeClient
  
    async connect() {
      await client.connect()
      this.litNodeClient = client
    }
  }
  
// export default new Lit()


async function encrypt() {
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
    "this is a secret message"
  );


  const accessControlConditions = [
    {
      contractAddress: '0xA275504019eBCc2B55D5e1a574c7Fa1033041734',
      standardContractType: 'ERC721',
      chain: 'mumbai',
      method: 'balanceOf',
      parameters: [
        ':userAddress'
      ],
      returnValueTest: {
        comparator: '>',
        value: '0'
      }
    }
  ]


// const privKey = process.env.PRIVATE_KEY_1;
// const privKeyBuffer = uint8arrayFromString(privKey, "base16");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_1);

const domain = "localhost";
const origin = "https://localhost/login";
const statement =
  "This is a test statement.  You can put anything you want here.";

const siweMessage = new siwe.SiweMessage({
  domain,
  address: wallet.address,
  statement,
  uri: origin,
  version: "1",
  chainId: 80001,
});

const messageToSign = siweMessage.prepareMessage();

const signature = await wallet.signMessage(messageToSign);

console.log("signature", signature);

const recoveredAddress = ethers.utils.verifyMessage(messageToSign, signature);

const authSig = {
  sig: signature,
  derivedVia: "web3.eth.personal.sign",
  signedMessage: messageToSign,
  address: recoveredAddress,
};

console.log("authSig", authSig);

// localhost:3000 wants you to sign in with your Ethereum account:
// 0x15127d203c489062fdb62d3fca3e72172ba80a81


// URI: http://localhost:3000
// Version: 1
// Chain ID: 80001
// Nonce: tIlgkzMlHJSvT063F
// Issued At: 2022-06-23T07:37:15.339Z

await client.connect()
const encryptedSymmetricKey = await client.saveEncryptionKey({
  accessControlConditions,
  symmetricKey,
  authSig,
  chain,
});

// const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });


return {
  encryptedString,
  encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
}


}

encrypt()

