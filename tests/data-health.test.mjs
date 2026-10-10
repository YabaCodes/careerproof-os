import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {inspectDataHealth} from '../dist/app/data/backup.js';
import {assessDataHealth,EXPORT_STALE_DAYS} from '../dist/app/domain/dataHealth.js';
import {MAX_BACKUP_BYTES} from '../dist/app/domain/models.js';
import {fullCollections,base,request,completed} from './fixtures.mjs';

// CP-012A Data Health: deterministic, read-only, documentation-not-ability wording.
const NOW='2026-10-10T08:00:00.000Z';
const ctx=(over={})=>({now:NOW,lastExportAt:'2026-10-09T08:00:00.000Z',lastChangeAt:'2026-10-08T08:00:00.000Z',backupBytes:50_000,storagePersisted:true,...over});
const codes=issues=>issues.map(i=>i.code);
const freeze=o=>{Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);return o;};
const achievement=(id,over={})=>({...base(id),title:'Synthetic '+id,contribution:'Synthetic contribution',occurredStart:{value:'2025-03',precision:'month'},occurredEnd:null,status:'recorded',preArchiveStatus:null,outcome:'',impactCategory:'quality',roleId:null,situation:'',actions:'',confidentiality:'confidential',notes:'',...over});

test('CP-012A a complete, recently exported record has no issues',()=>{
  assert.deepEqual(assessDataHealth(fullCollections(),ctx()),[]);
});

test('CP-012A backup advisories: never exported, stale, changed since export, persistence and size',()=>{
  const c=fullCollections();
  assert.deepEqual(codes(assessDataHealth(c,ctx({lastExportAt:null}))),['export-never']);
  const stale=assessDataHealth(c,ctx({lastExportAt:'2026-09-01T08:00:00.000Z'}));
  assert.deepEqual(codes(stale),['export-stale']);
  assert.match(stale[0].title,/39 days ago/);
  assert.ok(39>EXPORT_STALE_DAYS);
  assert.deepEqual(codes(assessDataHealth(c,ctx({lastChangeAt:'2026-10-10T07:00:00.000Z'}))),['changes-since-export']);
  // Exactly 14 days is not stale; a stale export that also has later changes says so once.
  assert.deepEqual(codes(assessDataHealth(c,ctx({lastExportAt:'2026-09-26T08:00:00.000Z',lastChangeAt:null}))),[]);
  assert.match(assessDataHealth(c,ctx({lastExportAt:'2026-09-01T08:00:00.000Z',lastChangeAt:'2026-10-01T00:00:00.000Z'}))[0].detail,/out of date/);
  assert.deepEqual(codes(assessDataHealth(c,ctx({storagePersisted:false}))),['storage-not-persistent']);
  assert.deepEqual(codes(assessDataHealth(c,ctx({storagePersisted:null}))),[]);
  assert.deepEqual(codes(assessDataHealth(c,ctx({backupBytes:Math.ceil(MAX_BACKUP_BYTES*0.81)}))),['backup-size']);
  assert.deepEqual(codes(assessDataHealth(c,ctx({backupBytes:Math.floor(MAX_BACKUP_BYTES*0.8)}))),[]);
});

test('CP-012A recorded-achievement gaps list each record; drafts are counted; archived records are excluded',()=>{
  const c=fullCollections();
  c.achievements.push(achievement('bare'));
  c.achievements.push(achievement('archived-bare',{status:'archived',preArchiveStatus:'recorded'}));
  c.achievements.push(achievement('draft-1',{status:'draft',contribution:'',occurredStart:null}));
  const issues=assessDataHealth(c,ctx());
  assert.deepEqual(codes(issues),['achievement-no-outcome','achievement-no-support','achievement-no-skill','achievement-no-context','drafts']);
  for(const i of issues.slice(0,4)){
    assert.equal(i.severity,'advisory');assert.equal(i.count,1);
    assert.deepEqual(i.items,[{label:'Synthetic bare',kind:'achievement',id:'bare'}]);
  }
  assert.equal(issues[0].title,'1 recorded achievement has no stated outcome');
  assert.deepEqual(issues[4].items.map(x=>x.id),['draft-1']);
  // Wording never claims a lack of ability or a verified state.
  for(const i of issues)assert.doesNotMatch(i.title+' '+i.detail,/\b(lack|weak|poor|unqualified|verified skill|score)\b/i);
  assert.match(issues[0].detail,/not your ability/);
});

test('CP-012A links count: a role or an experience gives context; metric or evidence gives support',()=>{
  const c=fullCollections();
  c.achievements.push(achievement('with-role',{roleId:'role-1',outcome:'Stated'}));
  c.impactMetrics.push({...c.impactMetrics[0],id:'metric-2',achievementId:'with-role'});
  c.recordLinks.push({...base('link-9'),linkType:'achievement-competency',sourceId:'with-role',targetId:'custom-competency',isPrimary:false,note:''});
  assert.deepEqual(assessDataHealth(c,ctx()),[]);
});

test('CP-012A experiences without achievements, incomplete profile and expired credentials (precision aware)',()=>{
  const c=fullCollections();
  c.projects.push({...c.projects[0],id:'idle-project',name:'Idle synthetic project'});
  c.profiles[0]={...c.profiles[0],headline:'',summary:''};
  c.credentials.push({...c.credentials[0],id:'cred-expired-month',name:'Expired monthly',expirationDate:{value:'2026-09',precision:'month'}});
  c.credentials.push({...c.credentials[0],id:'cred-this-year',name:'Expires this year',expirationDate:{value:'2026',precision:'year'}});
  c.credentials.push({...c.credentials[0],id:'cred-today',name:'Expires today',expirationDate:{value:'2026-10-10',precision:'day'}});
  const issues=assessDataHealth(c,ctx());
  assert.deepEqual(codes(issues),['experience-no-achievements','profile-incomplete','credential-expired']);
  assert.deepEqual(issues[0].items,[{label:'Idle synthetic project',kind:'project',id:'idle-project'}]);
  assert.equal(issues[1].title,'Profile has no headline or summary');
  assert.deepEqual(issues[2].items.map(x=>x.id),['cred-expired-month']);
});

test('CP-012A assessment is pure and deterministic',()=>{
  const c=fullCollections();c.achievements.push(achievement('b-two'),achievement('a-one'));
  const frozen=freeze(structuredClone(c));
  const first=assessDataHealth(frozen,ctx({lastExportAt:null}));
  assert.deepEqual(assessDataHealth(frozen,ctx({lastExportAt:null})),first);
  assert.deepEqual(frozen,c);
  assert.deepEqual(first.find(i=>i.code==='achievement-no-outcome').items.map(x=>x.id),['a-one','b-two']);
});

test('CP-012A measured: 5,000 achievements with links assess well inside interactive time',()=>{
  const c=fullCollections();
  for(let i=0;i<5000;i++){
    const id='perf-'+i;c.achievements.push(achievement(id,{outcome:i%3?'Stated':'',roleId:i%2?'role-1':null}));
    if(i%4===0)c.recordLinks.push({...base('perf-link-'+i),linkType:'achievement-competency',sourceId:id,targetId:'custom-competency',isPrimary:false,note:''});
  }
  const start=performance.now();const issues=assessDataHealth(c,ctx());const ms=performance.now()-start;
  console.log(`# data health: 5,000 achievements assessed in ${ms.toFixed(1)} ms`);
  assert.ok(ms<1000,`took ${ms} ms`);
  assert.equal(issues.find(i=>i.code==='achievement-no-support').count,5000);
});

async function setup(name){
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,name);
  await repo.initialize();await repo.replaceAllData(fullCollections(),{theme:'light'},await repo.getGeneration());
  return {factory,repo};
}
test('CP-012A inspectDataHealth reads only: snapshot, revision, generation and export time are unchanged',async()=>{
  const {repo}=await setup('health-readonly');
  await repo.setMeta('lastExportAt','2026-10-09T08:00:00.000Z');
  const before=await repo.readSnapshot(),exportBefore=await repo.getMeta('lastExportAt'),changeBefore=await repo.getMeta('lastChangeAt');
  const report=await inspectDataHealth(repo,async()=>false);
  assert.ok(report.integrity);
  assert.equal(report.storagePersisted,false);
  assert.ok(codes(report.issues).includes('storage-not-persistent'));
  assert.ok(report.issues.every(i=>i.severity==='advisory'));
  assert.deepEqual(await repo.readSnapshot(),before);
  assert.equal(await repo.getMeta('lastExportAt'),exportBefore);
  assert.equal(await repo.getMeta('lastChangeAt'),changeBefore);
  await repo.close();
});
test('CP-012A a corrupted store is reported as one critical issue, not thrown, and nothing is repaired',async()=>{
  const {factory,repo}=await setup('health-corrupt');await repo.close();
  const raw=await request(factory.open('health-corrupt',2)),tx=raw.transaction('impactMetrics','readwrite'),done=completed(tx);
  tx.objectStore('impactMetrics').put({...base('orphan-metric'),achievementId:'missing-achievement',metricName:'Synthetic',unit:'',baselineValue:1,resultValue:null,reportedValue:null,direction:null,sourceNote:''});
  await done;raw.close();
  const broken=new CareerDatabase(factory,'health-corrupt');
  const report=await inspectDataHealth(broken,async()=>null);
  assert.equal(report.integrity,null);
  assert.deepEqual(report.issues.map(i=>[i.code,i.severity]),[['integrity-failed','critical']]);
  assert.match(report.issues[0].detail,/Nothing was changed/);
  await broken.close();
  const check=await request(factory.open('health-corrupt',2)),read=check.transaction('impactMetrics','readonly');
  assert.ok(await request(read.objectStore('impactMetrics').get('orphan-metric')),'the invalid record is left for the user, not auto-deleted');
  check.close();
});
