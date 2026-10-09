import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
const root=resolve('dist');
test('platform PNG dimensions, manifest purposes and Apple touch references are correct',async()=>{
  const expected={'icon-192.png':192,'icon-512.png':512,'icon-maskable-512.png':512,'apple-touch-icon.png':180,'favicon-32.png':32,'favicon-16.png':16};
  for(const [name,size] of Object.entries(expected)){
    const png=await readFile(join(root,name));
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name);
    assert.equal(png.readUInt32BE(16),size,name+' width');
    assert.equal(png.readUInt32BE(20),size,name+' height');
  }
  const manifest=JSON.parse(await readFile(join(root,'manifest.webmanifest'),'utf8'));
  assert.deepEqual(manifest.icons.map(i=>[i.src,i.sizes,i.purpose]),[['./icon-192.png','192x192','any'],['./icon-512.png','512x512','any'],['./icon-maskable-512.png','512x512','maskable']]);
  const html=await readFile(join(root,'index.html'),'utf8');
  assert.match(html,/rel="apple-touch-icon" href="\.\/apple-touch-icon.png" sizes="180x180"/);
});
test('production HTML references existing JavaScript, CSS, manifest and icon assets',async()=>{
  const html=await readFile(join(root,'index.html'),'utf8');
  for(const ref of ['./app/app/main.js','./styles.css','./manifest.webmanifest','./icon.svg']) {
    assert.ok(html.includes(ref),`index.html should reference ${ref}`);
    assert.ok((await stat(join(root,ref))).isFile(),`asset ${ref} exists`);
  }
});
test('compiled JavaScript module imports resolve to existing files',async()=>{
  const walk=async dir=>{
    const {readdir}=await import('node:fs/promises');
    for(const entry of await readdir(dir,{withFileTypes:true})) {
      const path=join(dir,entry.name);
      if(entry.isDirectory())await walk(path);
      else if(path.endsWith('.js')){
        const content=await readFile(path,'utf8');
        for(const [,source] of content.matchAll(/\bfrom\s+['"](\.\.?\/[^'"]+)['"]/g)) {
          const dest=resolve(dirname(path),source);assert.ok((await stat(dest)).isFile(),`${path} imports ${source}`);
        }
      }
    }
  };
  await walk(join(root,'app'));
});
test('service worker offline asset shell refers to existing assets',async()=>{
  const sw=await readFile(join(root,'sw.js'),'utf8');
  const list=sw.match(/APP_SHELL=\[(.*?)\]/s)?.[1];assert.ok(list);
  for(const [,asset] of list.matchAll(/['"](\.\/[^'"]+)['"]/g)) assert.ok((await stat(join(root,asset))).isFile(),asset);
});
test('service worker offline shell lists every compiled module',async()=>{
  const {readdir}=await import('node:fs/promises');
  const sw=await readFile(join(root,'sw.js'),'utf8');
  const listed=new Set([...sw.match(/APP_SHELL=\[(.*?)\]/s)[1].matchAll(/['"]\.\/([^'"]+)['"]/g)].map(m=>m[1]));
  const walk=async dir=>(await Promise.all((await readdir(join(root,dir),{withFileTypes:true})).map(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]))).flat();
  for(const file of (await walk('app')).filter(f=>f.endsWith('.js'))) assert.ok(listed.has(file),`sw.js APP_SHELL is missing ./${file}; the app would not open offline`);
});
