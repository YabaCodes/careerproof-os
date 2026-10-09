import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';

const concepts=[
 ['A','Ascend CP','ascend-cp','A clear, open CP monogram. The taller P subtly suggests the next stage of a career.','Recommended'],
 ['B','Architectural CP','architectural-cp','Structured letterforms built on a shared grid. A composed identity for capability, progression and professional foundations.',''],
 ['C','Connected CP','connected-cp','Interlocking letterforms connect the career journey with personal potential. Softer, compact and continuous.',''],
];
const cards=await Promise.all(concepts.map(async([letter,name,file,description,recommendation])=>{
 const svg=await readFile(`docs/branding/${file}.svg`,'utf8');
 return `<article><div class="large">${svg}</div><section><header><span>${letter}</span><h2>${name}</h2></header>${recommendation?`<b>${recommendation}</b>`:''}<p>${description}</p><div class="previews"><div class="small">${svg}<small>32 px</small></div><div class="circle">${svg}<small>Circle crop</small></div><div class="wordmark">${svg}<span>CareerProof<small>OS</small></span></div></div></section></article>`;
}));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CareerProof CP monogram concepts</title><style>
*{box-sizing:border-box}body{margin:0;padding:48px;background:#f6f8fa;color:#142c40;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.eyebrow{font-size:14px;font-weight:700;letter-spacing:2px;color:#176b73;margin:0 0 10px}h1{font-size:38px;letter-spacing:-1px;margin:0 0 12px}.intro{font-size:18px;color:#5b6c7c;margin:0 0 28px}main{display:grid;gap:22px}article{display:grid;grid-template-columns:232px minmax(0,1fr);gap:32px;padding:30px;background:white;border:1px solid #dce3ea;border-radius:20px}.large{display:grid;place-items:center}.large svg{width:216px;height:216px}section{min-width:0}header{display:flex;align-items:center;gap:12px}header>span{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:#e7f4f2;color:#176b73;font-weight:700}h2{font-size:26px;margin:0;letter-spacing:-.5px}b{display:inline-block;font-size:12px;color:#176b73;margin-top:8px}p{color:#5b6c7c;font-size:17px;line-height:1.55;margin:12px 0 20px}.previews{display:flex;gap:24px;align-items:center}.previews>div{display:flex;align-items:center;gap:8px}.previews .small,.previews .circle{flex-direction:column}.previews svg{width:32px;height:32px}.circle svg{border-radius:50%}.previews small{font-size:11px;color:#5b6c7c}.wordmark{margin-left:auto}.wordmark svg{width:40px;height:40px}.wordmark>span{font-weight:650;font-size:20px;letter-spacing:-.6px}.wordmark small{display:block;letter-spacing:2px;font-weight:500;margin-top:2px}footer{margin-top:24px;font-size:14px;color:#5b6c7c}@media(max-width:600px){body{padding:20px}h1{font-size:28px}article{grid-template-columns:1fr;gap:24px;padding:24px}.large svg{width:180px;height:180px}.wordmark{margin-left:0}.previews{gap:16px}.wordmark>span{font-size:16px}}</style><div class="eyebrow">CAREERPROOF OS · MONOGRAM EXPLORATION</div><h1>A career identity, in two letters.</h1><p class="intro">Original CP letterforms. Restrained navy and teal. No additional symbols.</p><main>${cards.join('')}</main><footer>Review concepts only · Editable SVG sources · Production branding awaits your selection</footer></html>`;
await writeFile('docs/branding/monogram-concepts.html',html);
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:960,height:1200},deviceScaleFactor:1});
await page.setContent(html);
await page.screenshot({path:'docs/branding/monogram-concepts.png',fullPage:true});
await browser.close();
console.log('Three revised CP concepts rendered.');
