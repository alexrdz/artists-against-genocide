// import '@shoelace-style/shoelace/dist/components/include/include.js';
import { createSignal, createHandler } from '../scripts/vivo.js'

const [text, setText] = createSignal('text', 'justify:center align:center gap:md')
const clusterEl = document.querySelector('.cluster-demo');
const splitEl = document.querySelector('.split-demo');
const switcherEl = document.querySelector('.switcher-demo');
const coverEl = document.querySelector('.cover-demo');
const centerEl = document.querySelector('.center-demo');

const spanEl = document.querySelector('.demospan');
createHandler('updateText', e => {
  setText(e.target.value.trim());
  clusterEl && clusterEl.setAttribute('data-cluster', text());
  splitEl && splitEl.setAttribute('data-split', text());
  switcherEl && switcherEl.setAttribute('data-switcher', text());
  coverEl && coverEl.setAttribute('data-cover', text());
  centerEl && centerEl.setAttribute('data-center', text());
  spanEl.textContent = text();
})
