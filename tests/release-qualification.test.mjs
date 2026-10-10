import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {inspectLocalData,createBackup,parseBackupJson,restoreBackup} from '../dist/app/data/backup.js';
import {generateBackup,validateBackup,ValidationError} from '../dist/app/domain/validation.js';
import {P0_STORES} from '../dist/app/domain/models.js';
import {fullCollections,legacyBackup} from './fixtures.mjs';

const sorted=c=>Object.fromEntries(P0_STORES.map(s=>[s,[...c[s]].sort((a,b)=>a.id.localeCompare(b.id))]));
async function setup(name){
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,name),records=fullCollections();
  await repo.initialize();
  await repo.replaceAllData(records,{theme:'dark'},await repo.getGeneration());
  return {factory,repo,records};
}
test('CP-E101 read-only integrity check validates all stores, relationships and schema-2 backup with no metadata write',async()=>{
  const {repo,records}=await setup('CP-E101');
  const before=await repo.readSnapshot();
  const report=await inspectLocalData(repo);
  const after=await repo.readSnapshot();
  assert.equal(report.schemaVersion,2);
  assert.equal(report.formatVersion,2);
  assert.equal(report.generation,before.generation);
  assert.equal(report.revision,before.revision);
  assert.equal(report.counts.profiles,1);
  assert.equal(report.counts.competencies,records.competencies.length);
  assert.equal(report.counts.recordLinks,3);
  assert.equal(report.counts.impactMetrics,1);
  assert.equal(report.counts.evidenceReferences,1);
  assert.ok(report.jsonBytes>0);
  assert.deepEqual(after,before);
  await inspectLocalData(repo);
  assert.deepEqual(await repo.readSnapshot(),before);
  await repo.close();
});
test('CP-E102 complete cross-module bundle, dates, privacy, primary experience and archived skill survive export/restore exactly',async()=>{
  const {repo,records}=await setup('CP-E102');
  const project={...records.projects[0],id:'synthetic-project-2',revision:0,name:'Second synthetic project',
    employerId:null,startDate:{value:'2023-09',precision:'month'},endDate:null,confidentiality:'standard-private'};
  const savedProject=await repo.savePortfolioProject(project,[]);
  const archived=await repo.saveRecord('competencies',{...records.competencies.at(-1),status:'archived'});
  assert.equal(archived.status,'archived');
  const source=(await repo.readSnapshot()).collections.achievements[0];
  const metricDraft=[{...records.impactMetrics[0],revision:3}].map(({achievementId,createdAt,updatedAt,...m})=>m);
  const evidenceDraft=[{...records.evidenceReferences[0],revision:3,
    referenceType:'url',referenceValue:'https://example.test/synthetic-evidence',userReviewedAt:'2025-04-03T12:34:56.000Z'}]
    .map(({achievementId,createdAt,updatedAt,...e})=>e);
  const edited=await repo.saveAchievementBundle({
    ...source,title:'Synthetic linked milestone with full evidence',occurredOn:source.occurredStart.value,
    confidentiality:'confidential',roleId:'role-1',situation:'Synthetic context',actions:'Synthetic action'
  },[savedProject.id,records.projects[0].id],savedProject.id,['custom-competency'],metricDraft,evidenceDraft);
  assert.equal(edited.title,'Synthetic linked milestone with full evidence');
  const before=await repo.readSnapshot();
  const links=before.collections.recordLinks.filter(r=>r.linkType==='achievement-project');
  assert.equal(links.length,2);
  assert.equal(links.filter(r=>r.isPrimary).length,1);
  assert.equal(links.find(r=>r.isPrimary).targetId,savedProject.id);
  assert.equal(before.collections.competencies.at(-1).status,'archived');
  const backup=await createBackup(repo);
  assert.equal(backup.count,1);
  const prepared=await parseBackupJson(backup.json,repo);
  assert.equal(prepared.legacy,false);
  assert.deepEqual(prepared.backup.manifest.counts,Object.fromEntries(P0_STORES.map(s=>[s,before.collections[s].length])));
  await repo.saveProfile({...before.collections.profiles[0],headline:'Synthetic profile mutation'});
  await assert.rejects(()=>restoreBackup(prepared,repo),/changed since you selected/i);
  const confirmed=await parseBackupJson(backup.json,repo);
  await restoreBackup(confirmed,repo);
  const after=await repo.readSnapshot();
  assert.deepEqual(sorted(after.collections),sorted(before.collections));
  assert.deepEqual(after.preferences,before.preferences);
  assert.equal(after.generation,before.generation+1);
  assert.deepEqual((await inspectLocalData(repo)).counts,prepared.backup.manifest.counts);
  await repo.close();
});
test('CP-E103 valid-looking corrupted full backups are rejected before any replacement, including conflicting links and privacy',async()=>{
  const {repo}=await setup('CP-E103');
  const before=await repo.readSnapshot();
  const valid=generateBackup(before.collections,before.preferences);
  const changes=[
    b=>{b.collections.recordLinks[0].targetId='missing-project';},
    b=>{b.collections.recordLinks[1].isPrimary=true;b.collections.recordLinks.push({...b.collections.recordLinks[1],id:'second-primary'});},
    b=>{b.collections.achievements[0].confidentiality='public';},
    b=>{b.collections.projects[0].startDate={value:'2024-02-30',precision:'day'};},
    b=>{b.collections.impactMetrics[0].resultValue='not-a-number';},
    b=>{b.collections.evidenceReferences[0].referenceType='url';b.collections.evidenceReferences[0].referenceValue='javascript:alert(1)';},
    b=>{b.collections.competencies[0].name='Corrupted built-in skill';},
    b=>{b.collections.roles[0].employerId='missing';},
    b=>{b.collections.achievements[0].roleId='missing-role';},
    b=>{b.collections.projects[0].employerId='missing';},
    b=>{b.collections.evidenceReferences[0].achievementId='missing-achievement';},
    b=>{b.manifest.counts.recordLinks=999;},
    b=>{b.manifest.schemaVersion=3;},
    b=>{b.preferences.theme='unsafe';},
    b=>{b.collections.achievements[0].occurredOn='2024-02-29';}
  ];
  for(const mutate of changes){
    const damaged=structuredClone(valid);mutate(damaged);
    await assert.rejects(()=>parseBackupJson(JSON.stringify(damaged),repo),ValidationError);
    assert.deepEqual(await repo.readSnapshot(),before);
  }
  const staged=await parseBackupJson(JSON.stringify(valid),repo);
  staged.backup.collections.recordLinks[0].sourceId='missing';
  await assert.rejects(()=>restoreBackup(staged,repo),ValidationError);
  assert.deepEqual(await repo.readSnapshot(),before);
  await repo.close();
});
test('CP-E104 restore preview generation rejects stale confirmation after another tab writes',async()=>{
  const {repo,factory}=await setup('CP-E104');
  const other=new CareerDatabase(factory,'CP-E104');await other.initialize();
  const current=await repo.readSnapshot();
  const pending=await parseBackupJson((await createBackup(repo)).json,repo);
  const a=current.collections.achievements[0];
  await other.saveAchievement({...a,title:'Synthetic concurrent change'});
  const updated=await repo.readSnapshot();
  assert.equal(updated.generation,pending.expectedGeneration);
  assert.ok(updated.revision>current.revision);
  await assert.rejects(()=>restoreBackup(pending,repo),/changed since you selected/i);
  assert.deepEqual(await repo.readSnapshot(),updated);
  await other.close();await repo.close();
});
test('CP-E105 legacy import explicitly replaces newer collections while recreating the four protected taxonomy categories and 32 skills',async()=>{
  const {repo}=await setup('CP-E105');
  const before=await repo.readSnapshot();
  const legacy=await parseBackupJson(JSON.stringify(legacyBackup()),repo);
  assert.equal(legacy.legacy,true);
  const expected=validateBackup(legacyBackup());
  assert.equal(expected.manifest.formatVersion,2);
  assert.equal(expected.collections.competencies.length,32);
  await restoreBackup(legacy,repo);
  const after=await repo.readSnapshot();
  assert.deepEqual(sorted(after.collections),sorted(expected.collections));
  assert.deepEqual(after.preferences,{theme:'system'});
  assert.equal(after.collections.projects.length,0);
  assert.equal(after.collections.roles.length,0);
  assert.equal(after.collections.recordLinks.length,0);
  assert.equal(after.collections.impactMetrics.length,0);
  assert.equal(after.collections.evidenceReferences.length,0);
  assert.notDeepEqual(after.collections,before.collections);
  await repo.close();
});
