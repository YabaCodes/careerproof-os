import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory,IDBObjectStore} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {inspectLocalData,createBackup} from '../dist/app/data/backup.js';
import {removalImpact,planRemoval} from '../dist/app/domain/removal.js';
import {validateBackup,ConflictError,ValidationError} from '../dist/app/domain/validation.js';
import {fullCollections,base} from './fixtures.mjs';

// CP-012B controlled unlink / reassignment / deletion. Synthetic data only.
const NOW='2026-10-10T12:00:00.000Z';
const freeze=o=>{Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);return o;};
const link=(id,linkType,sourceId,targetId,isPrimary=false)=>({...base(id),linkType,sourceId,targetId,isPrimary,note:''});
const ids=list=>list.map(r=>r.id).sort();
function world(){
  const c=fullCollections();
  c.employers.push({...c.employers[0],id:'employer-2',name:'Second Synthetic Co'});
  c.roles.push({...c.roles[0],id:'role-2',title:'Second Synthetic Role',isCurrent:false,endDate:{value:'2023',precision:'year'},startDate:{value:'2021',precision:'year'}});
  c.roles.push({...c.roles[0],id:'role-other',employerId:'employer-2',title:'Other Employer Role',isCurrent:false,endDate:{value:'2020',precision:'year'},startDate:{value:'2019',precision:'year'}});
  c.projects.push({...c.projects[0],id:'project-2',name:'Second Synthetic Experience'});
  c.projects.push({...c.projects[0],id:'project-free',name:'Independent Experience',employerId:null});
  c.projects.push({...c.projects[0],id:'project-other',name:'Other Employer Experience',employerId:'employer-2'});
  c.competencies.push({...c.competencies.find(s=>s.id==='custom-competency'),id:'custom-2',name:'Second Synthetic Skill',normalizedName:'second synthetic skill'});
  return c;
}
const owned=c=>({achievements:structuredClone(c.achievements.map(a=>a.id)),metrics:structuredClone(c.impactMetrics),evidence:structuredClone(c.evidenceReferences)});
function assertNothingLost(before,plan){
  // Achievements, metrics and evidence are never deleted by a removal plan.
  assert.deepEqual(ids(plan.collections.achievements),[...before.achievements].sort());
  assert.deepEqual(plan.collections.impactMetrics,before.metrics);
  assert.deepEqual(plan.collections.evidenceReferences,before.evidence);
  for(const d of plan.deletes)assert.ok(['recordLinks','employers','roles','projects','competencies','education','credentials'].includes(d.store),d.store);
  for(const p of plan.puts){assert.equal(p.record.updatedAt,NOW);}
}

test('CP-012B impact lists dependents and only compatible move targets',()=>{
  const c=world();
  const employer=removalImpact(c,'employers','employer-1');
  assert.deepEqual(employer.roles.map(r=>r.label),['Second Synthetic Role','Synthetic Engineer'],'sorted by label');
  assert.deepEqual(employer.projects.map(r=>r.label),['Second Synthetic Experience','Synthetic Initiative']);
  assert.equal(employer.canUnlink,false);assert.match(employer.unlinkBlockedReason,/Roles cannot exist without an employer/);
  assert.deepEqual(employer.targets.map(t=>t.id),['employer-2']);
  const role=removalImpact(c,'roles','role-1');
  assert.deepEqual(role.achievements.map(a=>a.id),['achievement-1']);
  assert.deepEqual(role.projects.map(p=>p.id),['project-1']);
  assert.equal(role.primaryRole,true);
  assert.deepEqual(role.targets.map(t=>t.id),['role-2'],'role at another employer is incompatible with project-1');
  const project=removalImpact(c,'projects','project-1');
  assert.deepEqual(project.achievements,[{id:'achievement-1',label:'Resolved synthetic issue',primary:true}]);
  assert.deepEqual(project.roles.map(r=>r.id),['role-1']);
  assert.deepEqual(project.targets.map(t=>t.id).sort(),['project-2','project-free'],'experience at another employer is incompatible with role-1');
  const skill=removalImpact(c,'competencies','custom-competency');
  assert.deepEqual(skill.achievements.map(a=>a.id),['achievement-1']);
  assert.ok(skill.targets.some(t=>t.id==='custom-2')&&skill.targets.every(t=>t.id!=='custom-competency'));
  assert.throws(()=>removalImpact(c,'competencies','CP-COMP-TEC-001'),ValidationError);
  assert.throws(()=>removalImpact(c,'projects','missing'),/no longer exists/);
  const edu=removalImpact(c,'education','education-1');
  assert.equal(edu.hasDependents,false);
});

test('CP-012B employer: move roles and experiences together; unlink only without roles',()=>{
  const c=world(),before=owned(c);
  const plan=planRemoval(freeze(structuredClone(c)),'employers','employer-1','move','employer-2',NOW);
  assertNothingLost(before,plan);
  assert.ok(!plan.collections.employers.some(e=>e.id==='employer-1'));
  for(const id of ['role-1','role-2'])assert.equal(plan.collections.roles.find(r=>r.id===id).employerId,'employer-2');
  for(const id of ['project-1','project-2'])assert.equal(plan.collections.projects.find(p=>p.id===id).employerId,'employer-2');
  assert.equal(plan.collections.roles.find(r=>r.id==='role-1').revision,4);
  assert.match(plan.summary,/2 roles, 2 experiences moved to “Second Synthetic Co”/);
  assert.throws(()=>planRemoval(c,'employers','employer-1','unlink',null,NOW),/Roles cannot exist without an employer/);
  assert.throws(()=>planRemoval(c,'employers','employer-1','delete',null,NOW),/move or unlink/);
  // An employer with only experiences can be unlinked: the experiences become independent.
  const lone=world();lone.employers.push({...lone.employers[0],id:'employer-3',name:'Third'});lone.projects.push({...lone.projects[0],id:'project-3',name:'Third exp',employerId:'employer-3'});
  const unlink=planRemoval(lone,'employers','employer-3','unlink',null,NOW);
  assert.equal(unlink.collections.projects.find(p=>p.id==='project-3').employerId,null);
  assert.match(unlink.summary,/1 experience kept without this employer/);
});

test('CP-012B role: unlink clears achievement role, project links and the primary role; move re-points and merges',()=>{
  const c=world(),before=owned(c);
  const unlink=planRemoval(c,'roles','role-1','unlink',null,NOW);
  assertNothingLost(before,unlink);
  assert.equal(unlink.collections.achievements.find(a=>a.id==='achievement-1').roleId,null);
  assert.equal(unlink.collections.profiles[0].primaryRoleId,null);
  assert.ok(!unlink.collections.recordLinks.some(l=>l.sourceId==='role-1'));
  const c2=world();c2.recordLinks.push(link('link-r2p1','role-project','role-2','project-1'));
  const move=planRemoval(c2,'roles','role-1','move','role-2',NOW);
  assertNothingLost(owned(c2),move);
  assert.equal(move.collections.achievements.find(a=>a.id==='achievement-1').roleId,'role-2');
  assert.equal(move.collections.profiles[0].primaryRoleId,'role-2');
  assert.deepEqual(move.collections.recordLinks.filter(l=>l.linkType==='role-project').map(l=>[l.sourceId,l.targetId]),[['role-2','project-1']],'duplicate link merged, not duplicated');
  assert.throws(()=>planRemoval(c,'roles','role-1','move','role-other',NOW),/compatible/);
});

test('CP-012B experience: move keeps exactly one primary per achievement; unlink keeps achievements',()=>{
  const c=world();c.recordLinks.push(link('link-a1p2','achievement-project','achievement-1','project-2',false));
  const before=owned(c);
  const move=planRemoval(c,'projects','project-1','move','project-2',NOW);
  assertNothingLost(before,move);
  const projectLinks=move.collections.recordLinks.filter(l=>l.linkType==='achievement-project');
  assert.deepEqual(projectLinks.map(l=>[l.id,l.targetId,l.isPrimary]),[['link-a1p2','project-2',true]]);
  assert.equal(projectLinks[0].revision,4);
  assert.deepEqual(move.collections.recordLinks.filter(l=>l.linkType==='role-project').map(l=>[l.sourceId,l.targetId]),[['role-1','project-2']]);
  const unlink=planRemoval(world(),'projects','project-1','unlink',null,NOW);
  assert.ok(!unlink.collections.recordLinks.some(l=>l.targetId==='project-1'));
  assert.equal(unlink.collections.achievements.length,1);
  assert.match(unlink.summary,/1 achievement, 1 role kept without this experience/);
  // An independent experience accepts links from any employer's roles.
  const free=planRemoval(world(),'projects','project-1','move','project-free',NOW);
  assert.ok(free.collections.recordLinks.some(l=>l.linkType==='role-project'&&l.targetId==='project-free'));
});

test('CP-012B custom skill: move merges examples; unlink removes links; built-ins and invalid targets are refused',()=>{
  const c=world();c.recordLinks.push(link('link-a1s2','achievement-competency','achievement-1','custom-2'));
  const move=planRemoval(c,'competencies','custom-competency','move','custom-2',NOW);
  assert.deepEqual(move.collections.recordLinks.filter(l=>l.linkType==='achievement-competency').map(l=>l.targetId),['custom-2']);
  const unlink=planRemoval(world(),'competencies','custom-competency','unlink',null,NOW);
  assert.ok(!unlink.collections.recordLinks.some(l=>l.linkType==='achievement-competency'));
  assert.ok(!unlink.collections.competencies.some(s=>s.id==='custom-competency'));
  assert.throws(()=>planRemoval(c,'competencies','custom-competency','move','custom-competency',NOW),/compatible/);
  assert.throws(()=>planRemoval(c,'competencies','CP-COMP-TEC-001','unlink',null,NOW),/Built-in/);
});

test('CP-012B planning is pure and records without dependents delete directly',()=>{
  const c=freeze(world()),copy=structuredClone(c);
  planRemoval(c,'roles','role-1','unlink',null,NOW);planRemoval(c,'projects','project-1','move','project-2',NOW);
  assert.deepEqual(c,copy);
  const edu=planRemoval(c,'education','education-1','delete',null,NOW);
  assert.deepEqual(edu.deletes,[{store:'education',id:'education-1'}]);assert.deepEqual(edu.puts,[]);
  assert.equal(edu.summary,'Education entry deleted.');
});

async function setup(name){
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,name);
  await repo.initialize();await repo.replaceAllData(world(),{theme:'light'},await repo.getGeneration());
  return repo;
}
test('CP-012B database applies a plan atomically and keeps the backup format valid',async()=>{
  const repo=await setup('removal-apply');
  const before=await repo.readSnapshot();const role=before.collections.roles.find(r=>r.id==='role-1');
  const plan=await repo.removeWithPlan('roles','role-1',role.revision,'move','role-2');
  const after=await repo.readSnapshot();
  assert.deepEqual(after.collections,plan.collections);
  assert.equal(after.revision,before.revision+1);
  assert.equal(after.collections.achievements.find(a=>a.id==='achievement-1').roleId,'role-2');
  await inspectLocalData(repo);
  validateBackup(JSON.parse((await createBackup(repo)).json));
  await repo.close();
});
test('CP-012B stale revisions are refused and a failure mid-transaction rolls everything back',async()=>{
  const repo=await setup('removal-rollback');
  const before=await repo.readSnapshot();const project=before.collections.projects.find(p=>p.id==='project-1');
  await assert.rejects(repo.removeWithPlan('projects','project-1',project.revision-1,'unlink',null),ConflictError);
  assert.deepEqual(await repo.readSnapshot(),before);
  const original=IDBObjectStore.prototype.delete;let calls=0;
  IDBObjectStore.prototype.delete=function(...args){if(++calls===2)throw new Error('Synthetic storage failure');return original.apply(this,args);};
  try{await assert.rejects(repo.removeWithPlan('projects','project-1',project.revision,'unlink',null),/Synthetic storage failure/);}
  finally{IDBObjectStore.prototype.delete=original;}
  assert.ok(calls>=2);
  assert.deepEqual(await repo.readSnapshot(),before,'no partial delete survives');
  await repo.close();
});
