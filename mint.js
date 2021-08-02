import { abi, address } from './contract.js';
import { web3, connectMetaMask } from './connectWallet.js';

export let contract = new web3.eth.Contract(abi, address);

var tokenID;
var isLoading = false;
var isPaused = false;

function randomInt() {
  let min = 1;
  let max = 5;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generate() {
  document.querySelector('#loading-container').style = "display:none";

  let accounts = await web3.eth.getAccounts();
  let wallet = ethereum.selectedAddress || accounts[0];
  let url = `https://tigerfightclub.vercel.app/api/token/${tokenID}`
  let result = await (await fetch(url)).json();

  document.querySelector('#generate-container').style = "display:block";
  document.querySelector('#generate-heading').innerHTML = result.name;
  document.querySelector('#generate-description').innerHTML = result.description;
  document.querySelector('#generate-image').src = `https://cloudflare-ipfs.com/ipfs/${result.image.split("//")[1]}`;
  document.querySelector('#generate-view-opensea').href = `https://testnets.opensea.io/assets/${address}/${tokenID}`;

  // document.querySelector('#generate-in-progress').style = "display:none";
  // document.querySelector('#generate-done').style = "display:block";
}

async function claim() {
  try {
    await connectMetaMask();
  } catch (error) {
    alert("Connect MetaMask wallet to continue");
  }

  // Loading
  if (isLoading) {
    return false;
  }

  // Paused
  if (isPaused) {
    return false;
  }

  // Wallet
  let accounts = await web3.eth.getAccounts();
  let wallet = ethereum.selectedAddress || accounts[0];

  // Network
  let network = await ethereum.request({ method: 'net_version' })
  console.log(network);
  if (network != "1" && network != "4") {
    alert("Hey! CryptoWords are only supported on the Ethereum network. It looks like you’re connected to a different network. Please check your settings and try again.");
    return;
  }

  isLoading = true;
  tokenID = randomInt();

  // Listener
  var transferBlockHash = "";
  var chainlinkRequestId = "";

  contract.events.allEvents({}, function(error, event) {
    let eventName = event.event;

    // Gate block hash on transfer matching sender address.
    if (eventName == "Transfer" && event.returnValues.to.toLowerCase() == wallet.toLowerCase()) {
      transferBlockHash = event.blockHash;
      document.querySelector('#loading-text').innerHTML = `GENERATING WORD #${tokenID}...`;
    }

    // Gate Chainlink id on block hash matching Transfer.
    if (eventName == "ChainlinkRequested" && transferBlockHash.length > 0 && event.blockHash == transferBlockHash) {
      chainlinkRequestId = event.returnValues.id;
      document.querySelector('#loading-text').innerHTML = `CONNECTING WORD #${tokenID} TO ORACLE...`;
    }

    // Gate Chainlink fulfill on matching Chainlink id.
     if (eventName == "ChainlinkFulfilled" && chainlinkRequestId.length > 0 && event.returnValues.id == chainlinkRequestId) {
      document.querySelector('#loading-text').innerHTML = `UPDATING WORD #${tokenID} FROM ORACLE...`;
    }

    // Gate event request id on matching Chainlink id.
    if (eventName == "RemoteMintFulfilled" && chainlinkRequestId.length > 0 && event.returnValues.requestId == chainlinkRequestId) {
      let resultId = event.returnValues.resultId;
      window.location.href = `word?token=${tokenID}`;
    }
  });

  // Minting
  let mint = await contract.methods.mint(1)
    .send({ from: wallet, value: 0.08 * 1e18 })
    .then(function(result) {
      document.querySelector('#loading-text').innerHTML = `GENERATING WORD #${tokenID}...`;
      await generate();
    })
    .catch(error => {
      document.querySelector('#loading-modal').style = "display:none";
      isLoading = false;
    });
}

if (document.location.href.includes("/generate")) {
  document.onload = claim();
}
