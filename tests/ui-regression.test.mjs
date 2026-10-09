import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveActionTarget} from '../dist/app/ui/actionRouting.js';
const backdrop={dataset:{action:'backdrop'},closest:()=>backdrop};
test('modal fields and labels do not dismiss the dialog',()=>{
  for(const kind of ['input','textarea','select','label','content']) {
    const child={kind,closest:()=>backdrop};
    assert.equal(resolveActionTarget(child),null,kind);
  }
});
test('clicking the real backdrop can dismiss the dialog',()=>{
  assert.equal(resolveActionTarget(backdrop),backdrop);
});
test('nested icons still activate their own button',()=>{
  const button={dataset:{action:'save-achievement'}};
  const svg={closest:()=>button};
  assert.equal(resolveActionTarget(svg),button);
});
test('mobile nav has five equally sized columns and aligned buttons',async()=>{
  const css=await readFile('dist/styles.css','utf8');
  assert.match(css,/\.mobile-nav\{display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css,/\.mobile-create\{[^}]*place-self:center;[^}]*margin:0;/);
});
