import { tigerAddress, tigerAbi } from './contracts/tiger-fight-club.js';
import { wordsAddress, wordsAbi } from './contracts/cryptowords.js';
import { apesAddress, apesAbi } from './contracts/textapes.js';
import { web3 } from './connectWallet.js';

export let address;
export let abi;
export let mintPrice;

if (window.location.hostname.includes('cryptowords')) {
  address = wordsAddress;
  abi = wordsAbi;
  mintPrice = 0.01;
} else if (window.location.hostname.includes('tigersfightclub.com')) {
  address = tigerAddress;
  abi = tigerAbi;
  mintPrice = 0.03;
} else if (window.location.hostname.includes('textapes.art')) {
  address = apesAddress;
  abi = apesAbi;
  mintPrice = 0.05;
}

export let contract = new web3.eth.Contract(abi, address);
