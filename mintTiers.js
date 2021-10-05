import { mint } from './mint.js';

document.querySelectorAll('[tier]').forEach((element) => {
  element.setAttribute('href', '#');
  element.onclick = () => {
    mint(1, Number(element.getAttribute("tier")));
  }
})
