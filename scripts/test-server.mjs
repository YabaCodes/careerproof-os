import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve(process.env.CP_TEST_ROOT??'dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
createServer(async(req,res)=>{
  // A previous-worker fixture exercises activation cleanup on the same origin.
  if(req.url==='/__legacy_sw__'){
    res.setHeader('Content-Type','text/javascript');res.setHeader('Service-Worker-Allowed','/');
    res.end("self.addEventListener('install',e=>e.waitUntil(caches.open('careerproof-v0.1.1-alpha.1').then(c=>c.put('/__legacy_marker__',new Response('synthetic'))).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));");return;
  }
  if(req.url==='/__fixture__'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Synthetic fixture</title>');return;}
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  try{const body=await readFile(path);res.setHeader('Content-Type',types[extname(path)]??'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(body);}
  catch{res.writeHead(404).end();}
}).listen(Number(process.env.CP_TEST_PORT??4173),'127.0.0.1');
