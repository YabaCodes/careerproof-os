import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {createBackup} from '../dist/app/data/backup.js';
import {appendExpectedResult} from '../dist/app/domain/expectedResult.js';
import {fullCollections,base} from './fixtures.mjs';

const draftId='synthetic-planned-draft',experienceId='project-1';
function world(){
  const c=fullCollections();
  c.projects[0]={...c.projects[0],status:'active',confidentiality:'standard-private',objective:'Qualify existing supplier by Q1.\n\nKeep original paragraph and punctuation: 2026\'s'};
  c.achievements.push({...c.achievements[0],...base(draftId),title:'Supplier audit readiness',contribution:'',outcome:'',status:'draft',preArchiveStatus:null,
    occurredStart:null,occurredEnd:null,confidentiality:'standard-private'});
  c.recordLinks.push({...base('synthetic-draft-link'),linkType:'achievement-project',sourceId:draftId,targetId:experienceId,isPrimary:true,note:'Keep me'});
  return c;
}
async function setup(){
  const repo=new CareerDatabase(new IDBFactory(),'synthetic-plan-'+Math.random());
  await repo.initialize();await repo.replaceAllData(world(),{theme:'light'},1);
  const before=await repo.readSnapshot();
  const draft=before.collections.achievements.find(a=>a.id===draftId);
  const project=before.collections.projects.find(p=>p.id===experienceId);
  const move=(over={})=>repo.moveDraftToExpectedResult({draftId,draftRevision:draft.revision,
    experienceId,experienceRevision:project.revision,text:'Supplier audit readiness: both suppliers pass readiness audit.',allowCompleted:false,...over});
  return {repo,before,draft,project,move};
}
test('CP-UX3 preserves original goal text, whitespace and Unicode; prevents duplicate paragraphs',()=>{
  assert.equal(appendExpectedResult('Original\n\nMore','  検査 – quality  '),'Original\n\nMore\n\n検査 – quality');
  assert.throws(()=>appendExpectedResult('First\n\n第二段落','第二段落'),/already/);
  assert.throws(()=>appendExpectedResult('', '   '),/Describe/);
  assert.throws(()=>appendExpectedResult('x'.repeat(5990),'long '.repeat(10)),/6,000/);
});
test('CP-UX3 archive + append are atomic, preserve links and draft fields, and undo restores exact content',async()=>{
  const {repo,before,move,draft,project}=await setup();
  const receipt=await move();
  const after=await repo.readSnapshot(),archived=after.collections.achievements.find(a=>a.id===draftId);
  const revised=after.collections.projects.find(p=>p.id===experienceId);
  assert.equal(after.revision,before.revision+1);
  assert.equal(revised.objective,project.objective+'\n\nSupplier audit readiness: both suppliers pass readiness audit.');
  assert.equal(archived.status,'archived');assert.equal(archived.preArchiveStatus,'draft');
  assert.equal(archived.revision,draft.revision+1);assert.equal(revised.revision,project.revision+1);
  assert.equal(archived.title,draft.title);assert.equal(archived.contribution,draft.contribution);
  assert.deepEqual(after.collections.recordLinks,before.collections.recordLinks);
  assert.equal(JSON.parse((await createBackup(repo)).json).manifest.formatVersion,4);
  await repo.undoDraftToExpectedResult(receipt);
  const undone=await repo.readSnapshot();
  assert.equal(undone.collections.projects.find(p=>p.id===experienceId).objective,project.objective);
  const restored=undone.collections.achievements.find(a=>a.id===draftId);
  assert.equal(restored.status,'draft');assert.equal(restored.preArchiveStatus,null);
  assert.equal(undone.revision,before.revision+2);
  assert.deepEqual(undone.collections.recordLinks,before.collections.recordLinks);
  await assert.rejects(()=>repo.undoDraftToExpectedResult(receipt),/changed since the move/);
  await repo.close();
});
test('CP-UX3 rejects stale sheet, duplicate/repeated submission, too-long input, and newer-edit Undo safely',async()=>{
  const {repo,move,draft,project,before}=await setup();
  for(const over of [{text:' '},{text:'x'.repeat(6001)},{experienceRevision:project.revision+1}]){
    await assert.rejects(()=>move(over));assert.deepEqual(await repo.readSnapshot(),before);
  }
  const receipt=await move();
  const after=await repo.readSnapshot();
  await assert.rejects(()=>move(),/changed/);
  assert.deepEqual(await repo.readSnapshot(),after);
  const revised=after.collections.projects.find(p=>p.id===experienceId);
  await repo.saveRecord('projects',{...revised,objective:revised.objective+'\n\nNewer edit'});
  const changed=await repo.readSnapshot();
  await assert.rejects(()=>repo.undoDraftToExpectedResult(receipt),/changed since the move/);
  assert.deepEqual(await repo.readSnapshot(),changed);
  await repo.close();
});
test('CP-UX3 handles confidential Draft and completed Experience without silent downgrade',async()=>{
  const {repo,move}=await setup(),c=await repo.readSnapshot(),draft=c.collections.achievements.find(a=>a.id===draftId),project=c.collections.projects.find(p=>p.id===experienceId);
  await repo.saveRecord('achievements',{...draft,confidentiality:'confidential'});
  const confidential=await repo.readSnapshot(),conf=confidential.collections.achievements.find(a=>a.id===draftId);
  await assert.rejects(()=>move({draftRevision:conf.revision}),/mark the experience Confidential/);
  const unchanged=await repo.readSnapshot();assert.equal(unchanged.collections.projects.find(p=>p.id===experienceId).objective,project.objective);
  await repo.saveRecord('projects',{...project,confidentiality:'confidential',status:'completed'});
  const changed=await repo.readSnapshot(),completed=changed.collections.projects.find(p=>p.id===experienceId);
  await assert.rejects(()=>move({draftRevision:conf.revision,experienceRevision:completed.revision}),/Confirm/);
  const receipt=await move({draftRevision:conf.revision,experienceRevision:completed.revision,allowCompleted:true});
  const done=await repo.readSnapshot();
  assert.equal(done.collections.projects.find(p=>p.id===experienceId).status,'completed');
  await repo.undoDraftToExpectedResult(receipt);await repo.close();
});
test('CP-UX3 rejects duplicate goal even when a different Draft is selected; no partial archive',async()=>{
  const {repo,move}=await setup();
  await move();const after=await repo.readSnapshot();
  const original=after.collections.achievements.find(a=>a.id===draftId);
  await repo.saveRecord('achievements',{...original,status:'draft',preArchiveStatus:null});
  const reopened=await repo.readSnapshot(),draft=reopened.collections.achievements.find(a=>a.id===draftId),p=reopened.collections.projects.find(x=>x.id===experienceId);
  await assert.rejects(()=>move({draftRevision:draft.revision,experienceRevision:p.revision}),/already/);
  assert.equal((await repo.readSnapshot()).collections.achievements.find(a=>a.id===draftId).status,'draft');
  await repo.close();
});
