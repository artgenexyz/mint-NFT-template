import { tigerAddress, tigerAbi } from './contracts/tiger-fight-club.js';
import { wordsAddress, wordsAbi } from './contracts/cryptowords.js';
import { apesAddress, apesAbi } from './contracts/textapes.js';
import { moonAddress, moonAbi } from './contracts/moon.js';
import { web3 } from './connectWallet.js';

export let address;
export let abi;
export let mintPrice;

if (window?.WEBSITE_URL?.includes(window.location.hostname)) {
  address = window.CONTRACT_ADDRESS;
  abi = typeof window.CONTRACT_ABI === 'string'
      ? JSON.parse(window.CONTRACT_ABI) : window.CONTRACT_ABI;
} else if (window.location.hostname.includes('cryptowords')) {
  address = wordsAddress;
  abi = wordsAbi;
} else if (window.location.hostname.includes('tigersfightclub.art')) {
  address = tigerAddress;
  abi = tigerAbi;
} else if (window.location.hostname.includes('textapes.art')) {
  address = apesAddress;
  abi = apesAbi;
}

export let contract = new web3.eth.Contract(abi, address);
