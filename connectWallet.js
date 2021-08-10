export let web3 = new Web3(ethereum);

const isMetaMaskConnected = async () => {
    let accounts = await web3.eth.getAccounts();
    return accounts.length > 0;
}

export async function updateMetaMaskStatus() {
  isMetaMaskConnected().then((connected) => {
    let button = document.querySelector('#connect');
    if (connected) {
        button.textContent = "MetaMask connected";
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
