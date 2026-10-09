import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory,IDBObjectStore} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {createBackup,parseBackupJson,restoreBackup,checkBackupSize} from '../dist/app/data/backup.js';
import {generateBackup,validateBackup,ValidationError,ConflictError,achievementView} from '../dist/app/domain/validation.js';
import {P0_STORES,MAX_BACKUP_BYTES} from '../dist/app/domain/models.js';
import {fullCollections,legacyBackup,legacyAchievement,seedV1,request,completed,timestamp} from './fixtures.mjs';
async function setup(){
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'synthetic');
  await repo.initialize();return {factory,repo};
}
const withoutOrder=c=>Object.fromEntries(P0_STORES.map(s=>[s,[...c[s]].sort((a,b)=>a.id.localeCompare(b.id))]));
const compare=(actual,expected)=>assert.deepEqual(withoutOrder(actual),withoutOrder(expected));
test('v1→v2 migration preserves every old field, ID, timestamp, revision and archive state',async()=>{
  const factory=new IDBFactory(),old=legacyBackup();
  (await seedV1(factory,'migration',old)).close();
  const repo=new CareerDatabase(factory,'migration');await repo.initialize();
  const migrated=await repo.readSnapshot(),expected=validateBackup(old).collections;
  compare(migrated.collections,expected);
  assert.equal(migrated.generation,1);assert.equal(await repo.getMeta('lastExportAt'),timestamp);
  const raw=await request(factory.open('migration',2));
  assert.deepEqual([...raw.objectStoreNames].sort(),[...P0_STORES,'meta'].sort());
  assert.equal(raw.transaction('achievements').objectStore('achievements').indexNames.contains('byOccurredOn'),false);
  assert.ok(raw.transaction('achievements').objectStore('achievements').indexNames.contains('byOccurredStart'));
  raw.close();await repo.close();
});
test('invalid legacy data aborts schema upgrade and leaves original schema and records intact',async()=>{
  const factory=new IDBFactory(),old=legacyBackup();old.collections.achievements[0].status=['recorded'];
  (await seedV1(factory,'bad-migration',old)).close();
  const repo=new CareerDatabase(factory,'bad-migration');
  await assert.rejects(()=>repo.initialize(),/preserved/);
  const raw=await request(factory.open('bad-migration',1));
  assert.equal(raw.version,1);assert.equal(raw.objectStoreNames.length,3);
  assert.deepEqual(await request(raw.transaction('achievements').objectStore('achievements').get('achievement-1')),old.collections.achievements[0]);
  raw.close();
});
test('blocked upgrades reject with recovery instructions; abandoned requests never reset data',async()=>{
  const factory=new IDBFactory(),old=await seedV1(factory,'blocked'),repo=new CareerDatabase(factory,'blocked');
  await assert.rejects(()=>repo.initialize(),/Close other CareerProof tabs/);
  const upgraded=new Promise(resolve=>{old.onversionchange=()=>{};old.close();const r=factory.open('blocked',1);r.onsuccess=()=>{r.result.close();resolve();};r.onerror=resolve;});
  await upgraded;
  const retry=new CareerDatabase(factory,'blocked');await retry.initialize();
  compare((await retry.readSnapshot()).collections,validateBackup(legacyBackup()).collections);await retry.close();
});
test('newer physical database is rejected without downgrade or deletion',async()=>{
  const factory=new IDBFactory(),r=factory.open('future',3);r.onupgradeneeded=()=>r.result.createObjectStore('sentinel');const db=await request(r);db.close();
  const repo=new CareerDatabase(factory,'future');await assert.rejects(()=>repo.initialize(),/newer CareerProof version/);
  const untouched=await request(factory.open('future',3));assert.ok(untouched.objectStoreNames.contains('sentinel'));untouched.close();
});
test('initialization seeds exactly four categories and 32 competencies idempotently and preserves custom records',async()=>{
  const {repo,factory}=await setup(),c=fullCollections();
  await repo.replaceAllData(c,{theme:'dark'},1);
  const revision=(await repo.readSnapshot()).revision;
  await repo.initialize();await repo.initialize();compare((await repo.readSnapshot()).collections,c);
  assert.equal((await repo.readSnapshot()).revision,revision);
  // Missing seed is repaired without touching custom definitions.
  const raw=await request(factory.open('synthetic',2)),tx=raw.transaction('competencies','readwrite'),done=completed(tx);tx.objectStore('competencies').delete('CP-COMP-TEC-001');await done;raw.close();
  await repo.initialize();const out=(await repo.readSnapshot()).collections;
  assert.equal(out.competencies.length,33);assert.deepEqual(out.competencies.find(x=>x.id==='custom-competency'),c.competencies.at(-1));
  assert.equal((await repo.readSnapshot()).revision,revision+1);
  await repo.close();
});
test('format-2 export/restore round-trip preserves all P0 collections and portable preferences',async()=>{
  const {repo}=await setup(),c=fullCollections();await repo.replaceAllData(c,{theme:'dark'},1);
  const file=await createBackup(repo),prepared=await parseBackupJson(file.json,repo);
  assert.equal(prepared.legacy,false);assert.ok(new TextEncoder().encode(file.json).length<=MAX_BACKUP_BYTES);
  await repo.saveAchievement({...achievementView(c.achievements[0]),title:'Changed synthetic title'});
  await restoreBackup(prepared,repo);
  const out=await repo.readSnapshot();compare(out.collections,c);assert.deepEqual(out.preferences,{theme:'dark'});assert.equal(out.generation,3);assert.equal(await repo.getMeta('lastExportAt'),null);
  await repo.close();
});
test('legacy full replacement removes new domain records and restores old profile/achievements with taxonomy',async()=>{
  const {repo}=await setup();await repo.replaceAllData(fullCollections(),{theme:'dark'},1);
  const prepared=await parseBackupJson(JSON.stringify(legacyBackup()),repo);assert.equal(prepared.legacy,true);
  await restoreBackup(prepared,repo);
  compare((await repo.readSnapshot()).collections,validateBackup(legacyBackup()).collections);
  assert.deepEqual((await repo.readSnapshot()).preferences,{theme:'system'});await repo.close();
});
test('malformed JSON, invalid backups, duplicate IDs, orphans and unsupported imports leave data and generation unchanged',async()=>{
  const {repo}=await setup();await repo.replaceAllData(fullCollections(),{theme:'system'},1);
  const before=await repo.readSnapshot(),valid=generateBackup(before.collections);
  await assert.rejects(()=>parseBackupJson('{broken',repo),ValidationError);
  for(const mutate of [
    b=>b.manifest.formatVersion=5,b=>b.manifest.schemaVersion=1,
    b=>b.collections.roles[0].title=33,b=>b.collections.achievements[0].status=['recorded'],
    b=>b.collections.achievements.push(b.collections.achievements[0]),
    b=>b.collections.recordLinks[0].targetId='missing',
    b=>b.collections.evidenceReferences[0].referenceValue='javascript:alert(1)'
  ]){
    const b=structuredClone(valid);mutate(b);
    if(b.collections.evidenceReferences[0].referenceValue.startsWith?.('javascript'))b.collections.evidenceReferences[0].referenceType='url';
    await assert.rejects(()=>parseBackupJson(JSON.stringify(b),repo),ValidationError);
    assert.deepEqual(await repo.readSnapshot(),before);
  }
  const prepared=await parseBackupJson(JSON.stringify(valid),repo);prepared.backup.collections.achievements[0].status=['recorded'];
  await assert.rejects(()=>restoreBackup(prepared,repo),ValidationError);assert.deepEqual(await repo.readSnapshot(),before);await repo.close();
});
test('transaction execution failure after clears rolls back all records, preferences, revisions and generation',async()=>{
  const {repo}=await setup();await repo.replaceAllData(fullCollections(),{theme:'dark'},1);
  const before=await repo.readSnapshot(),prepared=await parseBackupJson(JSON.stringify(legacyBackup()),repo);
  const original=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(value,...args){
    if(this.name==='competencies')throw new DOMException('Synthetic quota failure','QuotaExceededError');
    return original.call(this,value,...args);
  };
  try{await assert.rejects(()=>restoreBackup(prepared,repo),/Synthetic quota failure/);}
  finally{IDBObjectStore.prototype.put=original;}
  assert.deepEqual(await repo.readSnapshot(),before);await repo.close();
});
test('record revision conflicts still prevent stale edits and deletions',async()=>{
  const {repo}=await setup(),saved=await repo.saveAchievement({...legacyAchievement(),revision:0});
  const updated=await repo.saveAchievement({...saved,title:'Updated'});
  await assert.rejects(()=>repo.saveAchievement({...saved,title:'Stale'}),ConflictError);
  await assert.rejects(()=>repo.removeRecord('achievements',saved.id,saved.revision),ConflictError);
  assert.equal((await repo.readSnapshot()).collections.achievements[0].revision,updated.revision);await repo.close();
});
test('an asynchronous IndexedDB constraint failure rolls back a replacement transaction',async()=>{
  const {repo}=await setup(),c=fullCollections();await repo.replaceAllData(c,{theme:'system'},1);
  const before=await repo.readSnapshot(),prepared=await parseBackupJson((await createBackup(repo)).json,repo);
  const original=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(value,...args){
    const result=original.call(this,value,...args);
    if(this.name==='recordLinks'&&value.linkType==='role-project')this.add({...value,id:'synthetic-constraint-failure'});
    return result;
  };
  try{await assert.rejects(()=>restoreBackup(prepared,repo));}
  finally{IDBObjectStore.prototype.put=original;}
  assert.deepEqual(await repo.readSnapshot(),before);await repo.close();
});
test('persistent generation blocks stale-tab writes after same-ID/same-revision restore and survives reopening',async()=>{
  const {repo,factory}=await setup();await repo.replaceAllData(fullCollections(),{theme:'system'},1);
  const stale=new CareerDatabase(factory,'synthetic');await stale.initialize();
  const before=await repo.readSnapshot(),oldAchievement=achievementView(before.collections.achievements[0]);
  const prepared=await parseBackupJson((await createBackup(repo)).json,repo),stalePreview=await parseBackupJson((await createBackup(stale)).json,stale);
  await restoreBackup(prepared,repo);
  for(const operation of [
    ()=>stale.saveAchievement({...oldAchievement,title:'Stale edit'}),
    ()=>stale.saveAchievement({...legacyAchievement('new-stale'),revision:0}),
    ()=>stale.saveProfile({...before.collections.profiles[0],displayName:'Stale profile'}),
    ()=>stale.removeRecord('achievements',oldAchievement.id,oldAchievement.revision),
    ()=>stale.setMeta('preferences',{theme:'dark'}),
    ()=>restoreBackup(stalePreview,stale)
  ])await assert.rejects(operation,ConflictError);
  await stale.close();await assert.rejects(()=>stale.saveAchievement({...oldAchievement,title:'Still stale'}),ConflictError);
  const reloaded=new CareerDatabase(factory,'synthetic');await reloaded.initialize();
  assert.equal((await reloaded.readSnapshot()).generation,before.generation+1);
  compare((await reloaded.readSnapshot()).collections,before.collections);
  await stale.close();await reloaded.close();await repo.close();
});
test('editor adapters preserve hidden P0 fields and partial dates; archive retains links and evidence',async()=>{
  const {repo}=await setup(),c=fullCollections();c.achievements[0].occurredStart={value:'2024',precision:'year'};
  await repo.replaceAllData(c,{theme:'system'},1);
  const old=achievementView(c.achievements[0]);
  const updated=await repo.saveAchievement({id:old.id,revision:old.revision,title:old.title+' edited',contribution:old.contribution,occurredOn:old.occurredOn,status:'recorded',preArchiveStatus:null,outcome:old.outcome,impactCategory:old.impactCategory});
  assert.deepEqual(updated.occurredStart,{value:'2024',precision:'year'});assert.equal(updated.actions,old.actions);assert.equal(updated.roleId,old.roleId);assert.equal(updated.confidentiality,'confidential');
  const p=c.profiles[0];await repo.saveProfile({id:p.id,revision:p.revision,displayName:'Edited synthetic name',headline:p.headline,summary:p.summary,email:p.email,location:p.location});
  assert.equal((await repo.readSnapshot()).collections.profiles[0].primaryRoleId,'role-1');
  const archived=await repo.saveAchievement({...updated,status:'archived',preArchiveStatus:'recorded'});
  const restored=await repo.saveAchievement({...archived,status:'recorded',preArchiveStatus:null});
  const out=(await repo.readSnapshot()).collections;assert.deepEqual(out.recordLinks,c.recordLinks);assert.deepEqual(out.impactMetrics,c.impactMetrics);assert.deepEqual(out.evidenceReferences,c.evidenceReferences);
  assert.equal(restored.status,'recorded');
  await assert.rejects(()=>repo.saveAchievement({...restored,occurredOn:'2025'}),/Conflicting achievement date/);
  await repo.close();
});
test('safe deletion blocks parents with dependents; permanent achievement deletion removes only its own children atomically',async()=>{
  const {repo}=await setup(),c=fullCollections();await repo.replaceAllData(c,{theme:'system'},1);
  for(const [store,id] of [['employers','employer-1'],['roles','role-1'],['projects','project-1'],['competencies','custom-competency']]){
    await assert.rejects(()=>repo.removeRecord(store,id,3),ValidationError);compare((await repo.readSnapshot()).collections,c);
  }
  await assert.rejects(()=>repo.removeRecord('competencies','CP-COMP-TEC-001',1),/cannot be deleted/);
  await repo.removeRecord('achievements','achievement-1',3);
  const out=(await repo.readSnapshot()).collections;assert.equal(out.achievements.length,0);assert.equal(out.impactMetrics.length,0);assert.equal(out.evidenceReferences.length,0);
  assert.deepEqual(out.recordLinks,c.recordLinks.filter(r=>r.linkType==='role-project'));assert.deepEqual(out.roles,c.roles);assert.deepEqual(out.projects,c.projects);await repo.close();
});
test('shared persistence contracts create/update/remove synthetic unreferenced P0 records and reject malformed writes',async()=>{
  const {repo}=await setup(),c=fullCollections();
  await repo.saveRecord('employers',{...c.employers[0],revision:0});
  const role=await repo.saveRecord('roles',{...c.roles[0],revision:0});
  await repo.saveRecord('roles',{...role,title:'Updated synthetic role'});
  await repo.removeRecord('roles',role.id,2);
  for(const store of ['education','credentials','projects']){
    const r=await repo.saveRecord(store,{...c[store][0],revision:0});
    await repo.removeRecord(store,r.id,1);
  }
  await assert.rejects(()=>repo.saveRecord('employers',{...c.employers[0],name:[],revision:1}),ValidationError);
  await repo.removeRecord('employers','employer-1',1);await repo.close();
});
test('12 MiB UTF-8 input/export limits match and oversized exports never produce an unimportable download',async()=>{
  checkBackupSize('a'.repeat(MAX_BACKUP_BYTES));
  assert.throws(()=>checkBackupSize('a'.repeat(MAX_BACKUP_BYTES+1)),ValidationError);
  assert.throws(()=>checkBackupSize('é'.repeat(MAX_BACKUP_BYTES/2+1)),ValidationError);
  const c=fullCollections();c.achievements=Array.from({length:2200},(_,i)=>({...c.achievements[0],id:'large-'+i,contribution:'x'.repeat(6000)}));
  c.impactMetrics=[];c.evidenceReferences=[];c.recordLinks=c.recordLinks.filter(r=>r.linkType==='role-project');
  const fakeRepo={readSnapshot:async()=>({collections:c,preferences:{theme:'system'}})};
  await assert.rejects(()=>createBackup(fakeRepo),/12 MiB/);
});
test('source files at the 12 MiB boundary import and oversized files fail before any data changes',async()=>{
  const {repo}=await setup(),json=(await createBackup(repo)).json,before=await repo.readSnapshot();
  const prepared=await parseBackupJson(json.padEnd(MAX_BACKUP_BYTES,' '),repo);
  await assert.rejects(()=>parseBackupJson(json.padEnd(MAX_BACKUP_BYTES+1,' '),repo),/12 MiB/);
  assert.deepEqual(await repo.readSnapshot(),before);
  await restoreBackup(prepared,repo);compare((await repo.readSnapshot()).collections,before.collections);await repo.close();
});
