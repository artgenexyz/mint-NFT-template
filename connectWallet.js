import { abi, address } from './contract.js';

export let web3 = new Web3(ethereum);
export let contract = new web3.eth.Contract(abi, address);

const isMetaMaskConnected = async () => {
    let accounts = await web3.eth.getAccounts();
    return accounts.length > 0;
}

export async function updateMetaMaskStatus() {
  isMetaMaskConnected().then((connected) => {
    let button = document.querySelector('#connect-text');
    if (connected) {
        button.innerHTML = "METAMASK CONNECTED";
    }
  });
}

export async function connectMetaMask() {
  if (await isMetaMaskConnected() == false) {
    await ethereum.enable();
    await updateMetaMaskStatus();
    location.reload();
  }
}

document.onload = updateMetaMaskStatus();
document.querySelector('#connect').addEventListener('click', connectMetaMask);
