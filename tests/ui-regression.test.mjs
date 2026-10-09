import test from 'node:test';
import assert from 'node:assert/strict';
import {icon} from '../dist/app/ui/icons.js';
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
test('navigation icons share a coordinate system and decorative accessibility contract',()=>{
  for(const name of ['home','vault','plus','user','settings']){
    const svg=icon(name,24);
    assert.match(svg,/viewBox="0 0 24 24"/);
    assert.match(svg,/stroke-width="2"/);
    assert.match(svg,/aria-hidden="true" focusable="false"/);
  }
  assert.notEqual(icon('settings'),icon('sun'),'Settings must be a distinct gear');
});
