import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {generateBackup,validateBackup,ValidationError,validateCollections} from '../dist/app/domain/validation.js';
import {createBackup,parseBackupJson,restoreBackup} from '../dist/app/data/backup.js';
import {assessmentHistory,currentAssessment,proficiencyLabel,RUBRIC_VERSION} from '../dist/app/domain/proficiency.js';
import {P0_STORES} from '../dist/app/domain/models.js';
import {fullCollections,base,request,completed,timestamp} from './fixtures.mjs';

const entry=(competencyId,level=3,id='rating-1',date='2026-10-12')=>({...base(id),competencyId,
  selfAssessedLevel:level,assessmentDate:{value:date,precision:'day'},rubricVersion:'1.0',
  rationale:'Self-reported only',assessmentContext:'Synthetic work',developmentNote:''});
const draft=(competencyId,level=3,date='2026-10-12')=>({
  competencyId,selfAssessedLevel:level,assessmentDate:{value:date,precision:'day'},
  rubricVersion:RUBRIC_VERSION,rationale:'',assessmentContext:'',developmentNote:''
});
const backup2=c=>{
  const b=structuredClone(generateBackup(c,{theme:'dark'},timestamp));
  b.manifest.formatVersion=2;b.manifest.schemaVersion=2;b.manifest.appVersion='0.1.2';
  delete b.collections.proficiencyAssessments;delete b.manifest.counts.proficiencyAssessments;
  return b;
};
const sorted=c=>Object.fromEntries(P0_STORES.map(s=>[s,[...c[s]].sort((a,b)=>a.id.localeCompare(b.id))]));

test('CP-013B profile assessment schema validates level, dates, rubric, references and duplicates',()=>{
  const c=fullCollections(),skill='custom-competency';
  c.proficiencyAssessments.push(entry(skill));
  assert.deepEqual(validateCollections(c),c);
  for(const bad of [0,5,'3',null,2.5]){
    const invalid=structuredClone(c);invalid.proficiencyAssessments[0].selfAssessedLevel=bad;
    assert.throws(()=>validateCollections(invalid),ValidationError);
  }
  for(const mutate of [
    x=>x.competencyId='missing',
    x=>x.assessmentDate={value:'2026-02-30',precision:'day'},
    x=>x.rubricVersion='',
    x=>x.rationale='a'.repeat(6001),
    x=>x.revision=0
  ]){const bad=structuredClone(c);mutate(bad.proficiencyAssessments[0]);assert.throws(()=>validateCollections(bad),ValidationError);}
  const duplicate=structuredClone(c);duplicate.proficiencyAssessments.push({...duplicate.proficiencyAssessments[0]});
  assert.throws(()=>validateCollections(duplicate),ValidationError);
});
test('CP-013B append-only history chooses latest assessment DATE, not latest write or evidence breadth',async()=>{
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'assess-history');
  await repo.initialize();await repo.replaceAllData(fullCollections(),{theme:'light'},1);
  await repo.saveProficiencyAssessment(draft('custom-competency',4,'2026-09-10'));
  await repo.saveProficiencyAssessment(draft('custom-competency',2,'2026-01-01'));
  const snapshot=await repo.readSnapshot();
  assert.equal(snapshot.collections.proficiencyAssessments.length,2);
  assert.equal(currentAssessment(snapshot.collections,'custom-competency').selfAssessedLevel,4);
  assert.deepEqual(assessmentHistory(snapshot.collections,'custom-competency').map(a=>a.selfAssessedLevel),[4,2]);
  assert.equal(proficiencyLabel(4),'L4 — Advanced');
  await repo.saveProficiencyAssessment(draft('custom-competency',3,'2026-10-12'));
  const after=await repo.readSnapshot();
  assert.equal(currentAssessment(after.collections,'custom-competency').selfAssessedLevel,3);
  assert.deepEqual(assessmentHistory(after.collections,'custom-competency').map(a=>a.selfAssessedLevel),[3,4,2]);
  assert.equal(after.collections.proficiencyAssessments.length,3);
  const versioned=await createBackup(repo);
  assert.equal(JSON.parse(versioned.json).manifest.formatVersion,3);
  assert.equal(JSON.parse(versioned.json).collections.proficiencyAssessments.length,3);
  await repo.close();
});
test('CP-013B invalid save and unavailable skill abort without changing any collection or revision',async()=>{
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'assess-reject');
  await repo.initialize();await repo.replaceAllData(fullCollections(),{theme:'dark'},1);
  const before=await repo.readSnapshot();
  await assert.rejects(()=>repo.saveProficiencyAssessment(draft('nonexistent',3)),ValidationError);
  await assert.rejects(()=>repo.saveProficiencyAssessment(draft('custom-competency',5)),ValidationError);
  assert.deepEqual(await repo.readSnapshot(),before);
  const custom=before.collections.competencies.find(c=>c.id==='custom-competency');
  await repo.saveRecord('competencies',{...custom,status:'archived'});
  const archivedBefore=await repo.readSnapshot();
  await assert.rejects(()=>repo.saveProficiencyAssessment(draft('custom-competency',3)),ValidationError);
  assert.deepEqual(await repo.readSnapshot(),archivedBefore);
  await repo.close();
});
test('CP-013B skills with historical ratings cannot be deleted silently; archiving preserves ratings',async()=>{
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'assess-remove');
  await repo.initialize();await repo.replaceAllData(fullCollections(),{theme:'dark'},1);
  await repo.saveProficiencyAssessment(draft('custom-competency',3));
  const current=await repo.readSnapshot();
  const custom=current.collections.competencies.find(c=>c.id==='custom-competency');
  await assert.rejects(()=>repo.removeWithPlan('competencies','custom-competency',custom.revision,'unlink',null),/historical self-assessments/);
  assert.deepEqual(await repo.readSnapshot(),current);
  await repo.saveRecord('competencies',{...custom,status:'archived'});
  assert.equal((await repo.readSnapshot()).collections.proficiencyAssessments.length,1);
  await repo.close();
});
test('CP-013B schema 2→3 upgrade retains every legacy record, metadata value, preference and revision',async()=>{
  const factory=new IDBFactory(),c=fullCollections(),oldStores=P0_STORES.filter(s=>s!=='proficiencyAssessments');
  const open=factory.open('upgrade2',2);
  open.onupgradeneeded=()=>{for(const store of oldStores)open.result.createObjectStore(store,{keyPath:'id'});open.result.createObjectStore('meta',{keyPath:'key'});};
  const raw=await request(open),tx=raw.transaction([...oldStores,'meta'],'readwrite'),done=completed(tx);
  for(const store of oldStores)for(const record of c[store])tx.objectStore(store).put(record);
  for(const [key,value] of Object.entries({datasetGeneration:7,sourceDataRevision:23,preferences:{theme:'dark'},schemaVersion:2,lastExportAt:timestamp,lastChangeAt:timestamp}))
    tx.objectStore('meta').put({key,value});
  await done;raw.close();
  const repo=new CareerDatabase(factory,'upgrade2');await repo.initialize();
  const out=await repo.readSnapshot();
  assert.equal(out.generation,7);assert.equal(out.revision,23);assert.deepEqual(out.preferences,{theme:'dark'});
  assert.equal(await repo.getMeta('lastExportAt'),timestamp);assert.equal(await repo.getMeta('lastChangeAt'),timestamp);
  assert.equal(await repo.getMeta('schemaVersion'),3);
  assert.deepEqual(sorted(out.collections),sorted({...c,proficiencyAssessments:[]}));
  const physical=await request(factory.open('upgrade2',3));
  assert.ok(physical.objectStoreNames.contains('proficiencyAssessments'));
  assert.ok(physical.transaction('proficiencyAssessments').objectStore('proficiencyAssessments').indexNames.contains('byCompetencyDate'));
  physical.close();await repo.close();
});
test('CP-013B format-2 backup imports losslessly to format-3 with no fabricated proficiency history',()=>{
  const c=fullCollections(),old=backup2(c),converted=validateBackup(old);
  assert.equal(converted.manifest.formatVersion,3);assert.equal(converted.manifest.schemaVersion,3);
  assert.equal(converted.manifest.exportedAt,timestamp);
  assert.deepEqual(converted.preferences,{theme:'dark'});
  assert.deepEqual(sorted(converted.collections),sorted(c));
  assert.equal(converted.collections.proficiencyAssessments.length,0);
  for(const mutate of [b=>{b.manifest.counts.roles=999;},b=>{b.collections.extra=[];},b=>{b.collections.proficiencyAssessments=[];},b=>{b.collections.achievements[0].status=['recorded'];}]){
    const bad=structuredClone(old);mutate(bad);assert.throws(()=>validateBackup(bad),ValidationError);
  }
});
test('CP-013B format-3 backup restores assessment history; older format-2 replacement clears it ONLY after confirmation',async()=>{
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'restore-3');
  await repo.initialize();await repo.replaceAllData(fullCollections(),{theme:'system'},1);
  await repo.saveProficiencyAssessment(draft('custom-competency',4));
  const existing=await repo.readSnapshot(),backup=await createBackup(repo);
  const prepared=await parseBackupJson(backup.json,repo);assert.equal(prepared.sourceFormat,3);
  await repo.saveProficiencyAssessment(draft('custom-competency',2));
  await assert.rejects(()=>restoreBackup(prepared,repo),/changed since you selected/);
  const restored=await parseBackupJson(backup.json,repo);
  await restoreBackup(restored,repo);
  assert.deepEqual(sorted((await repo.readSnapshot()).collections),sorted(existing.collections));
  const old=await parseBackupJson(JSON.stringify(backup2(fullCollections())),repo);
  assert.equal(old.sourceFormat,2);assert.equal(old.backup.collections.proficiencyAssessments.length,0);
  assert.equal((await repo.readSnapshot()).collections.proficiencyAssessments.length,1);
  await restoreBackup(old,repo); // explicit synthetic confirmation only
  assert.equal((await repo.readSnapshot()).collections.proficiencyAssessments.length,0);
  assert.equal((await repo.readSnapshot()).collections.achievements.length,fullCollections().achievements.length);
  await repo.close();
});
