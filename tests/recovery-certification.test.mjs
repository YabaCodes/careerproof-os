import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {createBackup,parseBackupJson,restoreBackup} from '../dist/app/data/backup.js';
import {P0_STORES} from '../dist/app/domain/models.js';
import {fullCollections,legacyBackup,seedV1} from './fixtures.mjs';

// CP-012E certification uses a fresh fake IndexedDB origin for EVERY test.
// No test reads, restores, deletes or otherwise accesses a person's PWA data.
const normalized=c=>Object.fromEntries(P0_STORES.map(store=>[
  store,[...c[store]].sort((a,b)=>a.id.localeCompare(b.id))
]));
const sameData=(a,b)=>assert.deepEqual(normalized(a),normalized(b));

test('CP-012E / E219: isolated synthetic destructive restore survives a cold database reopen',async()=>{
  const factory=new IDBFactory(),name='cp012e-disposable-e219';
  const first=new CareerDatabase(factory,name);await first.initialize();
  const original=fullCollections();
  await first.replaceAllData(original,{theme:'dark'},1);
  const exported=await createBackup(first);
  const raw=JSON.parse(exported.json);
  assert.equal(raw.manifest.formatVersion,2);
  assert.equal(raw.manifest.schemaVersion,2);
  for(const store of P0_STORES)assert.equal(raw.manifest.counts[store],original[store].length,store);
  assert.equal(raw.collections.achievements[0].confidentiality,'confidential');
  assert.equal(raw.collections.recordLinks.length,3);
  const before=await first.readSnapshot();
  await first.close();

  const reopened=new CareerDatabase(factory,name);await reopened.initialize();
  sameData((await reopened.readSnapshot()).collections,original);
  const altered=fullCollections();
  altered.achievements[0].title='Disposable post-export edit';
  altered.roles[0].title='Disposable altered role';
  await reopened.replaceAllData(altered,{theme:'light'},before.generation);
  assert.equal((await reopened.readSnapshot()).collections.roles[0].title,'Disposable altered role');

  // This destructive action is ONLY on the disposable fake-indexeddb factory.
  const preview=await parseBackupJson(exported.json,reopened);
  await restoreBackup(preview,reopened);
  const restored=await reopened.readSnapshot();
  sameData(restored.collections,original);
  assert.deepEqual(restored.preferences,{theme:'dark'});
  assert.equal(restored.generation,before.generation+2);
  assert.equal(await reopened.getMeta('lastExportAt'),null);
  await reopened.close();

  const cold=new CareerDatabase(factory,name);await cold.initialize();
  const final=await cold.readSnapshot();
  sameData(final.collections,original);
  assert.deepEqual(final.preferences,{theme:'dark'});
  assert.equal(final.generation,restored.generation);
  await cold.close();
});

test('CP-012E: malformed backup and stale restore leave synthetic data and metadata unchanged',async()=>{
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'cp012e-disposable-invalid');
  await repo.initialize();await repo.replaceAllData(fullCollections(),{theme:'dark'},1);
  const backup=(await createBackup(repo)).json;
  const baseline=await repo.readSnapshot();
  for(const invalid of ['{bad json',JSON.stringify({...JSON.parse(backup),manifest:{...JSON.parse(backup).manifest,formatVersion:999}})]){
    await assert.rejects(()=>parseBackupJson(invalid,repo));
    assert.deepEqual(await repo.readSnapshot(),baseline);
  }
  const preview=await parseBackupJson(backup,repo);
  const edited=fullCollections();edited.roles[0].title='Synthetic post-preview change';
  await repo.replaceAllData(edited,{theme:'light'},baseline.generation);
  const current=await repo.readSnapshot();
  await assert.rejects(()=>restoreBackup(preview,repo),/changed since you selected|restored in another tab/i);
  assert.deepEqual(await repo.readSnapshot(),current);
  await repo.close();
});

test('CP-012E: legacy v1 upgrade plus format-2 export/restore retains migrated records after reopen',async()=>{
  const factory=new IDBFactory(),name='cp012e-disposable-legacy';
  const legacy=legacyBackup();
  (await seedV1(factory,name,legacy)).close();
  const upgraded=new CareerDatabase(factory,name);await upgraded.initialize();
  const migrated=await upgraded.readSnapshot();
  assert.equal(migrated.collections.achievements.length,3);
  assert.deepEqual(migrated.collections.achievements.map(a=>a.status).sort(),['archived','draft','recorded']);
  const backup=(await createBackup(upgraded)).json;
  assert.equal(JSON.parse(backup).manifest.formatVersion,2);
  await upgraded.close();
  const reopened=new CareerDatabase(factory,name);await reopened.initialize();
  sameData((await reopened.readSnapshot()).collections,migrated.collections);
  const preview=await parseBackupJson(backup,reopened);
  await restoreBackup(preview,reopened);
  sameData((await reopened.readSnapshot()).collections,migrated.collections);
  await reopened.close();
});
