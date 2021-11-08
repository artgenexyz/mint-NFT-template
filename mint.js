import { address, contract } from './contract.js';
import { web3, connectMetaMask } from './connectWallet.js';

let tokenID;
let isLoading = false;

const updateMintedCounter = async () => {
  const counter = document.querySelector('#total-minted');
  if (counter) {
    counter.textContent =
    `Total minted: ${await contract.methods.totalSupply().call()} / ${await contract.methods.MAX_SUPPLY().call()}`;
    console.log("Updated counter");
  }
}

const startMint = async () => {
  if (isLoading) {
    return false;
  }
  isLoading = true;

  (document.querySelector('#generate-container') ?? {}).style = "display:none";
  const startContainer = document.querySelector('#start-container');
  if (!startContainer) {
    return await mint().then(() => {
      isLoading = false;
    }).catch((e) =>  {
      isLoading = false;
    });
  }

  updateMintedCounter();
  setInterval(updateMintedCounter, 5000);

  document.querySelector('#loading-container').style = "display:none";
  document.querySelector('#submit-quantity-form').addEventListener("submit", async (e) => {
    const nTokens = document.querySelector('#quantity-select').value;
    await mint(nTokens).then(() => {
      isLoading = false;
    }).catch((e) =>  {
      isLoading = false;
    })
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

export const mint = async (nTokens, tier) => {
  (document.querySelector('#loading-container') ?? {}).style = "display:flex";

  try {
    await connectMetaMask(false);
  } catch (error) {
    alert("Connect MetaMask wallet to continue");
  }

  const accounts = await web3.eth.getAccounts();
  const wallet = ethereum.selectedAddress || accounts[0];
  const network = await ethereum.request({ method: 'net_version' })
  if (network != "1" && network != "4") {
    alert("Only Ethereum network is supported. It looks like you’re connected to a different network. Please check your settings and try again.");
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const inputQuantity = document.querySelector('#quantity-select')?.value;
  const numberOfTokens = nTokens ?? inputQuantity ?? 1;
  const mintPrice = tier ?
                    await contract.methods.getPrice(tier).call() :
                    await contract.methods.getPrice().call();
  const ref = searchParams.get("ref");

  const mintFunction = ({ numberOfTokens, ref, tier }) => {
    if (tier !== undefined) {
      return contract.methods.mint(tier, numberOfTokens, ref ?? wallet);
    }
    return contract.methods.mint(numberOfTokens);
  }

  const txParams = {
    from: wallet,
    value: mintPrice * numberOfTokens,
  }
  const estimatedGas = await mintFunction({ numberOfTokens, ref, tier })
      .estimateGas(txParams).catch((e) => {
        const code = e.code ?? JSON.parse(`{${e.message.split("{")[1]}`).code;
        if (code === -32000) {
          return 300000;
        }
        const message = e.message.split("{")[0].trim();
        alert(`Error ${message}. Please try refreshing page, check your MetaMask connection or contact us to resolve`);
        console.log(e);
      })

  return await mintFunction({ numberOfTokens, ref, tier })
    .send({...txParams, gasLimit: estimatedGas + 5000 })
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
      // User didn't reject the transaction
      if (error.code !== 4001) {
        alert("NFT minting error. Please try refreshing page, check your MetaMask connection or contact our support to resolve");
        console.log(error);
      }
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
(document.querySelector('#mint-button') ?? {}).onclick = () => mint();

window.contract = contract;
window.web3 = web3;
window.mint = mint;
