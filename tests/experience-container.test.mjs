import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory,IDBObjectStore} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {inspectLocalData} from '../dist/app/data/backup.js';
import {inlineExperience,legacyExperienceNotes,matchingExperience,experienceRollup} from '../dist/app/domain/experience.js';
import {ValidationError} from '../dist/app/domain/validation.js';
import {fullCollections,base} from './fixtures.mjs';

// CP-012.4 (DEC-034): Experience is a container for achievements. Synthetic data only.
const role=()=>fullCollections().roles[0];
const draft=(over={})=>({id:'new-exp-1',name:'  Synthetic Line Upgrade ',experienceType:'project',...over});
const achievement=(id,over={})=>({...base(id),title:'Synthetic '+id,contribution:'Synthetic contribution',occurredStart:{value:'2025-03',precision:'month'},occurredEnd:null,
  status:'recorded',preArchiveStatus:null,outcome:'',impactCategory:'quality',roleId:null,situation:'',actions:'',confidentiality:'confidential',notes:'',...over});
const link=(id,sourceId,targetId)=>({...base(id),linkType:'achievement-project',sourceId,targetId,isPrimary:false,note:''});

test('CP-012.4 an inline experience is a light container that takes its employer from the role',()=>{
  const withRole=inlineExperience(draft(),role());
  assert.deepEqual(withRole,{id:'new-exp-1',name:'Synthetic Line Upgrade',experienceType:'project',status:'active',employerId:'employer-1',
    startDate:null,endDate:null,objective:'',scope:'',personalResponsibility:'',technologies:[],outcome:'',confidentiality:'confidential'});
  assert.equal(inlineExperience(draft({experienceType:'ongoing-responsibility'}),null).employerId,null);
  assert.throws(()=>inlineExperience(draft({name:'   '}),null),ValidationError);
  assert.throws(()=>inlineExperience(draft({name:'x'.repeat(161)}),null),ValidationError);
  assert.throws(()=>inlineExperience(draft({experienceType:'job'}),null),ValidationError);
});

test('CP-012.4 earlier narrative fields are listed only when they hold text; names match ignoring case and spacing',()=>{
  const p=fullCollections().projects[0];
  assert.deepEqual(legacyExperienceNotes(p).map(n=>n.key),['objective','personalResponsibility','outcome']);
  assert.deepEqual(legacyExperienceNotes({...p,objective:'  ',outcome:''}).map(n=>[n.label,n.value]),[['My Responsibilities','Example']]);
  const projects=fullCollections().projects;
  assert.equal(matchingExperience(projects,'  synthetic   INITIATIVE ')?.id,'project-1');
  assert.equal(matchingExperience(projects,'Synthetic Initiative 2'),null);
  assert.equal(matchingExperience(projects,'   '),null);
});

test('CP-012.4 the card roll-up lists linked achievements newest first, archived last, with stated outcomes',()=>{
  const c=fullCollections();
  c.achievements.push(
    achievement('a-new',{occurredStart:{value:'2026-02',precision:'month'},outcome:'Synthetic newer result'}),
    achievement('a-year',{occurredStart:{value:'2025',precision:'year'},status:'draft'}), // "2025" can mean as late as December
    achievement('a-archived',{occurredStart:{value:'2026-09',precision:'month'},status:'archived',preArchiveStatus:'recorded',outcome:'Archived result'}),
    achievement('a-elsewhere',{outcome:'Belongs to another experience'}));
  c.recordLinks.push(link('l-new','a-new','project-1'),link('l-year','a-year','project-1'),link('l-arch','a-archived','project-1'));
  const roll=experienceRollup(c,'project-1');
  assert.deepEqual(roll.items.map(i=>i.id),['a-new','a-year','achievement-1','a-archived']);
  assert.equal(roll.withOutcome,3,'a-new, achievement-1 and the archived one state outcomes; the draft does not');
  assert.deepEqual(roll.items.find(i=>i.id==='achievement-1'),{id:'achievement-1',title:c.achievements[0].title,status:'recorded',outcome:c.achievements[0].outcome.trim(),metrics:1});
  assert.equal(experienceRollup(c,'no-such-project').items.length,0);
});

async function setup(name){
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,name);
  await repo.initialize();await repo.replaceAllData(fullCollections(),{theme:'light'},await repo.getGeneration());
  return repo;
}
const newAchievement=(over={})=>({id:'achievement-new',revision:0,title:'Synthetic inline result',contribution:'Synthetic contribution',occurredOn:'2025-05-14',
  status:'recorded',preArchiveStatus:null,outcome:'Synthetic outcome',impactCategory:'quality',roleId:'role-1',situation:'',actions:'',notes:'',confidentiality:'confidential',...over});

test('CP-012.4 saving an achievement creates its new experience and links in one transaction',async()=>{
  const repo=await setup('experience-inline-role');
  const before=await repo.readSnapshot();
  await repo.saveAchievementBundle(newAchievement(),['new-exp-1','project-1'],'new-exp-1',[],[],[],[draft()]);
  const after=await repo.readSnapshot();
  assert.equal(after.revision,before.revision+1,'one write');
  const project=after.collections.projects.find(p=>p.id==='new-exp-1');
  assert.deepEqual({name:project.name,employerId:project.employerId,status:project.status,revision:project.revision,confidentiality:project.confidentiality},
    {name:'Synthetic Line Upgrade',employerId:'employer-1',status:'active',revision:1,confidentiality:'confidential'});
  const links=after.collections.recordLinks.filter(l=>l.targetId==='new-exp-1');
  assert.deepEqual(links.map(l=>[l.linkType,l.sourceId,l.isPrimary]).sort(),[['achievement-project','achievement-new',true],['role-project','role-1',false]]);
  assert.equal(after.collections.projects.length,before.collections.projects.length+1);
  await inspectLocalData(repo); // the backup format still validates
  await repo.close();
});

test('CP-012.4 without a role the new experience is independent; the existing call shape still works',async()=>{
  const repo=await setup('experience-inline-norole');
  await repo.saveAchievementBundle(newAchievement({roleId:null}),['new-exp-1'],null,[],[],[],[draft({experienceType:'initiative'})]);
  const c=(await repo.readSnapshot()).collections;
  const project=c.projects.find(p=>p.id==='new-exp-1');
  assert.equal(project.employerId,null);assert.equal(project.experienceType,'initiative');
  assert.equal(c.recordLinks.filter(l=>l.linkType==='role-project'&&l.targetId==='new-exp-1').length,0);
  await repo.saveAchievementBundle(newAchievement({id:'achievement-plain'}),['project-1'],null,[],[],[]);
  assert.equal((await repo.readSnapshot()).collections.projects.length,c.projects.length,'no experience created without drafts');
  await repo.close();
});

test('CP-012.4 nothing is written when the new experience or the achievement is invalid, or storage fails',async()=>{
  const repo=await setup('experience-inline-refusals');
  const before=await repo.readSnapshot();
  const cases=[
    [[draft({name:' '})],['new-exp-1'],/name is required/],
    [[draft()],['project-1'],/must be linked/],                       // not selected: never create an orphan
    [[draft({id:'project-1'})],['project-1'],/already exists/],          // id collision with a saved experience
    [[draft(),draft()],['new-exp-1'],/Duplicate new experience/]
  ];
  for(const [drafts,projectIds,message] of cases){
    await assert.rejects(repo.saveAchievementBundle(newAchievement(),projectIds,null,[],[],[],drafts),message);
    assert.deepEqual(await repo.readSnapshot(),before,String(message));
  }
  await assert.rejects(repo.saveAchievementBundle(newAchievement({title:''}),['new-exp-1'],null,[],[],[],[draft()]),ValidationError);
  assert.deepEqual(await repo.readSnapshot(),before,'invalid achievement leaves no experience behind');
  const original=IDBObjectStore.prototype.put;let calls=0;
  IDBObjectStore.prototype.put=function(...args){if(++calls===3)throw new Error('Synthetic storage failure');return original.apply(this,args);};
  try{await assert.rejects(repo.saveAchievementBundle(newAchievement(),['new-exp-1'],null,[],[],[],[draft()]),/Synthetic storage failure/);}
  finally{IDBObjectStore.prototype.put=original;}
  assert.ok(calls>=3);
  assert.deepEqual(await repo.readSnapshot(),before,'no partial write survives');
  await repo.close();
});
