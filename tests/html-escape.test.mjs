import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {escapeHtml} from '../dist/app/ui/html.js';
// CP-012.0 regression: an unterminated numeric reference (`&#39`) followed by
// digits is decoded by browsers as a different character and corrupted saved
// Experience text after an unchanged edit.
test('escapeHtml terminates every character reference',()=>{
  const samples=["Line '24 upgrade","FY'25 '12 baseline","<b>&\"'</b>","'1'2'3",'',null,undefined,42];
  for(const s of samples){
    const out=escapeHtml(s);
    assert.doesNotMatch(out,/&#?\w+(?![\w;])/,`unterminated reference in ${JSON.stringify(out)}`);
    assert.doesNotMatch(out,/[<>"']/);
  }
  assert.equal(escapeHtml("Line '24"),'Line &#39;24');
  assert.equal(escapeHtml('<a href="x">&</a>'),'&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  assert.equal(escapeHtml(null),'');
});
test('UI modules share one escaping implementation',async()=>{
  const files=[];
  for(const dir of ['src/app','src/ui','src/data','src/domain'])for(const f of await readdir(dir))if(f.endsWith('.ts'))files.push(join(dir,f));
  const local=[];
  for(const f of files){
    if(f==='src/ui/html.ts')continue;
    const text=await readFile(f,'utf8');
    if(/replace\(\/\[&<>/.test(text)||/&#39/.test(text))local.push(f);
  }
  assert.deepEqual(local,[],'Define HTML escaping only in src/ui/html.ts');
});
