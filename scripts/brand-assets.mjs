/** Render the selected editable SVG into platform-specific assets. */
import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const svg=await readFile('public/icon.svg','utf8');
const square=svg.replace('rx="112"','rx="0"');
const maskable=square.replace('<g id="monogram">','<g id="monogram" transform="translate(25.6 25.6) scale(.9)">');
await writeFile('public/icon-maskable.svg',maskable);
const browser=await chromium.launch();
try {
  for(const [name,size,source] of [
    ['icon-192.png',192,svg],['icon-512.png',512,svg],
    ['icon-maskable-512.png',512,maskable],['apple-touch-icon.png',180,square],
    ['favicon-32.png',32,svg],['favicon-16.png',16,svg],
  ]){
    const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    await page.setContent('<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>'+source);
    await page.screenshot({path:'public/'+name,omitBackground:true});
    await page.close();
  }
} finally { await browser.close(); }
console.log('Selected CP monogram assets generated from public/icon.svg.');
