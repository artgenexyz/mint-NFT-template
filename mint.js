import { address, contract } from './contract.js';
import { web3, connectMetaMask } from './connectWallet.js';

var tokenID;
var isLoading = false;
var isPaused = false;

async function generate() {
  document.querySelector('#loading-container').style = "display:none";

  let accounts = await web3.eth.getAccounts();
  let wallet = ethereum.selectedAddress || accounts[0];
  const url = await contract.methods.tokenURI(tokenID).call();
  const result = await (await fetch(url)).json();

  document.querySelector('#generate-container').style = "display:flex";
  let heading = document.querySelector('#generate-heading');
  if (heading.tagName !== "H2" && heading.tagName !== "H1") {
    heading = heading.getElementsByTagName("h2")[0];
  }
  heading.textContent = result.name;
  document.querySelector('#generate-description').textContent = result.description;
  let img = document.querySelector('#generate-image');
  if (img.tagName !== "IMG") {
    img = img.getElementsByTagName("img")[0];
  }
  img.src = `https://cloudflare-ipfs.com/ipfs/${result.image.split("//")[1]}`;
  document.querySelector('#generate-view-opensea').href = `https://opensea.io/assets/${address}/${tokenID}`;

  // document.querySelector('#generate-in-progress').style = "display:none";
  // document.querySelector('#generate-done').style = "display:block";
}

async function claim() {
  document.querySelector('#generate-container').style = "display:none";

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

  // Listener
  var transferBlockHash = "";
  var chainlinkRequestId = "";

  contract.events.allEvents({}, function(error, event) {
    let eventName = event.event;

    // Gate block hash on transfer matching sender address.
    if (eventName == "Transfer" && event.returnValues.to.toLowerCase() == wallet.toLowerCase()) {
      transferBlockHash = event.blockHash;
      // document.querySelector('#loading-text').innerHTML = `GENERATING WORD #${tokenID}...`;
    }

    // Gate Chainlink id on block hash matching Transfer.
    if (eventName == "ChainlinkRequested" && transferBlockHash.length > 0 && event.blockHash == transferBlockHash) {
      chainlinkRequestId = event.returnValues.id;
      // document.querySelector('#loading-text').innerHTML = `CONNECTING WORD #${tokenID} TO ORACLE...`;
    }

    // Gate Chainlink fulfill on matching Chainlink id.
     if (eventName == "ChainlinkFulfilled" && chainlinkRequestId.length > 0 && event.returnValues.id == chainlinkRequestId) {
      // document.querySelector('#loading-text').innerHTML = `UPDATING WORD #${tokenID} FROM ORACLE...`;
    }

    // Gate event request id on matching Chainlink id.
    if (eventName == "RemoteMintFulfilled" && chainlinkRequestId.length > 0 && event.returnValues.requestId == chainlinkRequestId) {
      let resultId = event.returnValues.resultId;
      // window.location.href = `word?token=${tokenID}`;
    }
  });

  const searchParams = new URLSearchParams(window.location.search);
  const numberOfTokens = searchParams.get("quantity") ?? 1;
  // Minting
  let mint = await contract.methods.mint(numberOfTokens)
    .send({ from: wallet, value: 0.03 * numberOfTokens * 1e18 })
    .then(async (result) => {
      await contract.methods.walletOfOwner(wallet).call((err, res) => {
        if (!err && res.length) {
          console.log(res);
          tokenID = parseInt(res.slice(-1)[0]);
        }
      })
      // document.querySelector('#loading-text').innerHTML = `GENERATING WORD #${tokenID}...`;
      await generate();
    })
    .catch(error => {
      alert("NFT minting error. Please try refreshing page, check your MetaMask connection or contact our support to resolve");
      console.log(error);
    });
}

const shouldLaunchMint = () => {
  const isWPEditorActive = document.body.classList.contains("elementor-editor-active");
  const isURL = document.location.href.includes("/generate");
  return isURL && !isWPEditorActive;
}

if (shouldLaunchMint()) {
  document.onload = claim();
}

window.contract = contract;
window.web3 = web3;
