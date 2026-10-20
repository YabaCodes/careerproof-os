import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {normalizeWebUrl,parseProfessionalLinks,validateProfileContact,validateCollections,ValidationError} from '../dist/app/domain/validation.js';
import {PROFILE_ID} from '../dist/app/domain/models.js';
import {availableContact,defaultContactFields} from '../dist/app/domain/studio.js';
import {fullCollections} from './fixtures.mjs';

test('CP-PC web addresses: https:// added when missing; only plain http(s) addresses pass',()=>{
  assert.equal(normalizeWebUrl('  example.test/me '),'https://example.test/me');
  assert.equal(normalizeWebUrl('http://example.test'),'http://example.test');
  assert.equal(normalizeWebUrl(''),'');
  assert.deepEqual(parseProfessionalLinks('linkedin.example/in/me\n\n  https://git.example/me \nLINKEDIN.example/in/me\r\n'),['https://linkedin.example/in/me','https://git.example/me']);
  assert.deepEqual(validateProfileContact({phone:'+1 555 0100',website:'https://example.test/me',professionalLinks:['https://git.example/me']}),[]);
  assert.deepEqual(validateProfileContact({phone:'',website:'',professionalLinks:[]}),[]);
  for(const bad of [
    {phone:'call me',website:'',professionalLinks:[]},
    {phone:'1'.repeat(81),website:'',professionalLinks:[]},
    {phone:'',website:normalizeWebUrl('javascript:alert(1)'),professionalLinks:[]},
    {phone:'',website:'https://user:pass@example.test',professionalLinks:[]},
    {phone:'',website:normalizeWebUrl('notaurl'),professionalLinks:[]},
    {phone:'',website:'',professionalLinks:[normalizeWebUrl('ftp://example.test/file')]},
    {phone:'',website:'',professionalLinks:Array.from({length:101},(_,i)=>`https://e${i}.example`)}
  ])assert.equal(validateProfileContact(bad).length,1,JSON.stringify(bad).slice(0,80));
});
test('CP-PC saved contact details round-trip and feed the CV contact choices (phone off by default)',async()=>{
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'contact');
  await repo.initialize();await repo.replaceAllData(fullCollections(),{theme:'system'},1);
  const before=(await repo.readSnapshot()).collections.profiles[0];
  const saved=await repo.saveProfile({id:PROFILE_ID,revision:before.revision,displayName:before.displayName,headline:before.headline,summary:before.summary,email:before.email,location:before.location,
    phone:'+1 555 0100',website:'https://example.test/me',professionalLinks:['https://git.example/me','https://linkedin.example/in/me']});
  assert.equal(saved.revision,before.revision+1);
  const after=(await repo.readSnapshot()).collections;
  validateCollections(after);
  assert.deepEqual(after.profiles[0].professionalLinks,['https://git.example/me','https://linkedin.example/in/me']);
  assert.deepEqual(availableContact(after).map(x=>x.field+'='+x.value),['email=example@example.test','phone=+1 555 0100','location=Example City','website=example.test/me','links=git.example/me · linkedin.example/in/me']);
  assert.deepEqual(defaultContactFields(after),['email','location','website','links']);
  // The stored record still refuses an unsafe address written around the form.
  await assert.rejects(()=>repo.saveProfile({...saved,website:'javascript:alert(1)'}),ValidationError);
  await repo.close();
});
