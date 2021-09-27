import { address, contract } from './contract.js';
import { web3, connectMetaMask } from './connectWallet.js';

let tokenID;
let isLoading = false;
let isPaused = false;

const updateMintedCounter = async () => {
  const counter = document.querySelector('#total-minted');
  if (counter) {
    counter.textContent =
    `Total minted: ${await contract.methods.totalSupply().call()} / ${await contract.methods.MAX_SUPPLY().call()}`;
    console.log("Updated counter");
  }
}

const startMint = async () => {
  const startContainer = document.querySelector('#start-container');
  if (!startContainer) {
    await mint();
    return;
  }

  updateMintedCounter();
  setInterval(updateMintedCounter, 5000);

  document.querySelector('#loading-container').style = "display:none";
  document.querySelector('#generate-container').style = "display:none";

  document.querySelector('#submit-quantity-form').addEventListener("submit", async (e) => {
    const nTokens = document.querySelector('#quantity-select').value;
    await mint(nTokens);
  });

}

const generate = async () => {
  const generateContainer = document.querySelector('#generate-container');
  if (!generateContainer) return;

  (document.querySelector('#loading-container') ?? {}).style = "display:none";

  let accounts = await web3.eth.getAccounts();
  let wallet = ethereum.selectedAddress || accounts[0];
  const url = await contract.methods.tokenURI(tokenID).call();
  const result = await (await fetch(url)).json();

  generateContainer.style = "display:flex";
  let heading = document.querySelector('#generate-heading') ?? {};
  if (heading?.tagName !== "H2" && heading?.tagName !== "H1") {
    heading = heading.getElementsByTagName("h2")[0];
  }
  heading.textContent = result.name;
  (document.querySelector('#generate-description') ?? {}).textContent = result.description;
  let img = document.querySelector('#generate-image');
  if (img?.tagName !== "IMG") {
    img = img.getElementsByTagName("img")[0];
  }
  img.src = `https://cloudflare-ipfs.com/ipfs/${result.image.split("//")[1]}`;
  (document.querySelector('#generate-view-opensea') ?? {}).href = `https://opensea.io/assets/${address}/${tokenID}`;
}

const mint = async (nTokens, tier) => {
  (document.querySelector('#loading-container') ?? {}).style = "display:flex";
  (document.querySelector('#generate-container') ?? {}).style = "display:none";

  try {
    await connectMetaMask(false);
  } catch (error) {
    alert("Connect MetaMask wallet to continue");
  }

  if (isLoading || isPaused) {
    return false;
  }

  let accounts = await web3.eth.getAccounts();
  let wallet = ethereum.selectedAddress || accounts[0];

  let network = await ethereum.request({ method: 'net_version' })
  console.log(network);
  if (network != "1" && network != "4") {
    alert("Only Ethereum network is supported. It looks like you’re connected to a different network. Please check your settings and try again.");
    return;
  }

  isLoading = true;

  // Listener
  let transferBlockHash = "";
  let chainlinkRequestId = "";

  contract.events.allEvents({}, function(error, event) {
    let eventName = event.event;

    // Gate block hash on transfer matching sender address.
    if (eventName == "Transfer" && event.returnValues.to.toLowerCase() == wallet.toLowerCase()) {
      transferBlockHash = event.blockHash;
    }

    // Gate Chainlink id on block hash matching Transfer.
    if (eventName == "ChainlinkRequested" && transferBlockHash.length > 0 && event.blockHash == transferBlockHash) {
      chainlinkRequestId = event.returnValues.id;
    }

    // Gate Chainlink fulfill on matching Chainlink id.
     if (eventName == "ChainlinkFulfilled" && chainlinkRequestId.length > 0 && event.returnValues.id == chainlinkRequestId) {
    }

    // Gate event request id on matching Chainlink id.
    if (eventName == "RemoteMintFulfilled" && chainlinkRequestId.length > 0 && event.returnValues.requestId == chainlinkRequestId) {
      let resultId = event.returnValues.resultId;
    }
  });

  const searchParams = new URLSearchParams(window.location.search);
  const numberOfTokens = nTokens ?? searchParams.get("quantity") ?? 1;
  const mintPrice = tier ?
                    await contract.methods.getPrice(tier).call() :
                    await contract.methods.getPrice().call();
  const ref = searchParams.get("ref");

  const mintFunction = ({ numberOfTokens, ref, tier }) => {
    if (tier) {
      return contract.methods.mintTierReferral(tier, numberOfTokens, ref ?? "");
    }
    return contract.methods.mint(numberOfTokens);
  }

  const mint = await mintFunction({ numberOfTokens, ref, tier })
    .send({
      from: wallet,
      value: mintPrice * numberOfTokens,
      gasLimit: `${180000 * numberOfTokens}`
    })
    .then(async (result) => {
      await contract.methods.walletOfOwner(wallet).call((err, res) => {
        if (!err && res.length) {
          console.log(res);
          tokenID = parseInt(res.slice(-1)[0]);
        }
      })
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
  document.onload = startMint();
}

window.contract = contract;
window.web3 = web3;
window.mint = mint;
