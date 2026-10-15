import test from 'node:test';
import assert from 'node:assert/strict';
import {experienceTimeline,experienceRoles,experienceSkills,achievementContexts,achievementYear,compareExperiencesByRecency,isOngoing,experiencesByRecency,rolesOfExperience,roleForExperience} from '../dist/app/domain/timeline.js';
import {fullCollections,base} from './fixtures.mjs';

// CP-UX1 (DEC-036) reading and scanning: pure derivations only, nothing written. Synthetic data only.
const project=(c,id,over={})=>({...c.projects[0],...base(id),name:'Synthetic '+id,status:'completed',startDate:null,endDate:null,...over});
const achievement=(c,id,over={})=>({...c.achievements[0],...base(id),title:'Synthetic '+id,roleId:null,status:'recorded',preArchiveStatus:null,...over});
const link=(id,linkType,sourceId,targetId,isPrimary=false)=>({...base(id),linkType,sourceId,targetId,isPrimary,note:''});
const y=value=>({value,precision:value.length===4?'year':value.length===7?'month':'day'});

/** Two employers, three roles (one current); experiences spread across them. */
function world(){
  const c=fullCollections(); // role-1 (current, 2022–), project-1 (completed, 2024 – Jun 2024) with achievement-1
  c.employers.push({...c.employers[0],...base('employer-2'),name:'Synthetic Earlier Works'});
  c.roles.push({...c.roles[0],...base('role-old'),employerId:'employer-1',title:'Synthetic Junior Engineer',isCurrent:false,startDate:y('2019'),endDate:y('2021-12')});
  c.roles.push({...c.roles[0],...base('role-first'),employerId:'employer-2',title:'Synthetic Graduate',isCurrent:false,startDate:y('2016'),endDate:y('2018')});
  c.projects.push(
    project(c,'p-span',{status:'completed',startDate:y('2021-03'),endDate:y('2023-02')}),     // linked to role-old and role-1
    project(c,'p-live-new',{status:'active',startDate:y('2025-09')}),
    project(c,'p-live-old',{status:'on-hold',startDate:y('2023-01')}),
    project(c,'p-undated',{status:'completed'}),
    project(c,'p-earlier-only',{employerId:'employer-2',status:'completed',startDate:y('2017'),endDate:y('2018')}),
    project(c,'p-no-role',{employerId:'employer-2'}),
    project(c,'p-independent',{employerId:null}));
  c.recordLinks.push(
    link('l-span-old','role-project','role-old','p-span'),link('l-span-new','role-project','role-1','p-span'),
    link('l-live-new','role-project','role-1','p-live-new'),link('l-live-old','role-project','role-1','p-live-old'),
    link('l-undated','role-project','role-1','p-undated'),link('l-earlier','role-project','role-first','p-earlier-only'));
  c.achievements.push(
    achievement(c,'a-span',{roleId:'role-old',occurredStart:y('2022-05')}),
    achievement(c,'a-span-draft',{roleId:'role-1',status:'draft',occurredStart:null}),
    achievement(c,'a-span-archived',{roleId:'role-1',status:'archived',preArchiveStatus:'recorded'}),
    achievement(c,'a-draft-only',{roleId:'role-1',status:'draft',occurredStart:null}),
    achievement(c,'a-loose',{roleId:'role-old'}),
    achievement(c,'a-loose-draft',{roleId:'role-old',status:'draft'}),
    achievement(c,'a-loose-archived',{roleId:'role-old',status:'archived',preArchiveStatus:'recorded'}),
    achievement(c,'a-no-role',{roleId:null}));
  c.recordLinks.push(
    link('l-a-span','achievement-project','a-span','p-span',true),
    link('l-a-span-draft','achievement-project','a-span-draft','p-span',true),
    link('l-a-span-archived','achievement-project','a-span-archived','p-span',true),
    link('l-a-draft-only','achievement-project','a-draft-only','p-live-new',true),
    link('l-a-span-skill','achievement-competency','a-span','custom-competency'),
    link('l-a-draft-skill','achievement-competency','a-span-draft','custom-competency'));
  return c;
}

test('CP-UX1 every role is a group, most recent first, followed by experiences without a role grouped by employer',()=>{
  const groups=experienceTimeline(world());
  assert.deepEqual(groups.map(g=>g.title),['Synthetic Engineer','Synthetic Junior Engineer','Synthetic Graduate','Other Experiences at Synthetic Earlier Works','Independent Experiences']);
  assert.deepEqual(groups.map(g=>g.key),['role:role-1','role:role-old','role:role-first','employer:employer-2','employer:none']);
  const [current,old]=groups;
  assert.equal(current.current,true);assert.equal(current.employer,'Synthetic Company');
  assert.equal(old.current,false);assert.deepEqual(old.endDate,y('2021-12'));
  assert.deepEqual(groups[3].experiences.map(x=>x.project.id),['p-no-role']);
  assert.deepEqual(groups[4].experiences.map(x=>x.project.id),['p-independent']);
});

test('CP-UX1 an experience linked to several roles is listed once, under its most recent role, naming the others',()=>{
  const groups=experienceTimeline(world());
  const all=groups.flatMap(g=>g.experiences.map(x=>[g.key,x.project.id]));
  assert.equal(all.filter(([,id])=>id==='p-span').length,1);
  const span=groups[0].experiences.find(x=>x.project.id==='p-span');
  assert.deepEqual(span.alsoRoles,['Synthetic Junior Engineer']);
  assert.deepEqual(groups[1].experiences,[]); // nothing else belongs to the earlier role
  assert.deepEqual(experienceRoles(world(),'p-span').map(r=>r.title),['Synthetic Junior Engineer','Synthetic Engineer']); // oldest first, for "A → B"
});

test('CP-UX1 ongoing experiences come first by latest start, then completed by latest end, undated last',()=>{
  const ids=experienceTimeline(world())[0].experiences.map(x=>x.project.id);
  assert.deepEqual(ids,['p-live-new','p-live-old','project-1','p-span','p-undated']);
  const live=experienceTimeline(world())[0].experiences.filter(x=>x.ongoing).map(x=>x.project.id);
  assert.deepEqual(live,['p-live-new','p-live-old']); // anything not completed is ongoing, whatever its dates say
  const c=world(),a=c.projects.find(p=>p.id==='p-live-new'),b=c.projects.find(p=>p.id==='p-undated');
  assert.ok(compareExperiencesByRecency(a,b)<0);assert.equal(isOngoing(b),false);
});

test('CP-UX1 achievement counts are recorded only; drafts are counted apart and archived records are left out',()=>{
  const xs=new Map(experienceTimeline(world())[0].experiences.map(x=>[x.project.id,x]));
  assert.deepEqual([xs.get('p-span').achievements,xs.get('p-span').drafts],[1,1]);
  assert.deepEqual([xs.get('p-live-new').achievements,xs.get('p-live-new').drafts],[0,1]);
  assert.deepEqual([xs.get('project-1').achievements,xs.get('project-1').drafts],[1,0]);
  assert.deepEqual([xs.get('p-undated').achievements,xs.get('p-undated').drafts],[0,0]);
});

test('CP-UX1 active achievements on a role but in no experience are counted on that role',()=>{
  const groups=new Map(experienceTimeline(world()).map(g=>[g.key,g]));
  assert.equal(groups.get('role:role-old').looseAchievements,2); // recorded + draft, not the archived one
  assert.equal(groups.get('role:role-1').looseAchievements,0);
  assert.equal(groups.get('employer:employer-2').looseAchievements,0);
});

test('CP-UX1 skills shown by an experience count its recorded achievements only',()=>{
  assert.deepEqual(experienceSkills(world(),'p-span').map(s=>[s.name,s.count]),[['Synthetic Skill',1]]);
  assert.deepEqual(experienceSkills(world(),'p-live-new'),[]);
});

test('CP-UX1 the context under an achievement is its primary experience, then any experience, then its role',()=>{
  const c=world();
  c.recordLinks.push(link('l-a-loose-secondary','achievement-project','a-loose','p-undated',false));
  c.recordLinks.push(link('l-a-span-secondary','achievement-project','a-span','project-1',false));
  const ctx=achievementContexts(c);
  assert.equal(ctx.get('a-span'),'Synthetic p-span');        // primary wins over the other link
  assert.equal(ctx.get('a-loose'),'Synthetic p-undated');    // the only experience, though not primary
  assert.equal(ctx.get('a-loose-draft'),'Synthetic Junior Engineer'); // no experience: the role
  assert.equal(ctx.has('a-no-role'),false);                  // nothing to show
});

test('CP-UX1 Vault year headings come from the occurrence date, whatever its precision',()=>{
  assert.equal(achievementYear(y('2024')),'2024');
  assert.equal(achievementYear(y('2024-06')),'2024');
  assert.equal(achievementYear(y('2024-02-29')),'2024');
  assert.equal(achievementYear(null),'No Date');
});

test('CP-UX1 the derivations never change the records they read',()=>{
  const c=world(),before=structuredClone(c);
  experienceTimeline(c);experienceRoles(c,'p-span');experienceSkills(c,'p-span');achievementContexts(c);
  assert.deepEqual(c,before);
});

// CP-UX2 (DEC-037) capture: the Where list and the role an achievement takes from its experience.
test('CP-UX2 the Where list offers every experience, ongoing first, then by latest end',()=>{
  const ids=experiencesByRecency(world()).map(p=>p.id);
  assert.deepEqual(ids.slice(0,2),['p-live-new','p-live-old']);
  assert.equal(ids.length,world().projects.length);
  assert.equal(ids.at(-1).startsWith('p-'),true);
});

test('CP-UX2 an achievement takes the role its experience was in at that date, else the most recent role',()=>{
  const c=world(); // p-span: role-old (2019 – Dec 2021) and role-1 (2022 – current)
  assert.deepEqual(rolesOfExperience(c,'p-span').map(r=>r.id),['role-1','role-old']);
  assert.equal(roleForExperience(c,'p-span',y('2021-06')).id,'role-old');
  assert.equal(roleForExperience(c,'p-span',y('2021-12-31')).id,'role-old');
  assert.equal(roleForExperience(c,'p-span',y('2022-01')).id,'role-1');
  assert.equal(roleForExperience(c,'p-span',y('2023')).id,'role-1');
  // A year that overlaps both roles goes to the more recent one.
  c.roles.find(r=>r.id==='role-1').startDate=y('2021-10');
  assert.equal(roleForExperience(c,'p-span',y('2021')).id,'role-1');
  // No date, or a date outside every linked role: the most recent linked role.
  assert.equal(roleForExperience(c,'p-span',null).id,'role-1');
  assert.equal(roleForExperience(c,'p-span',y('2010')).id,'role-1');
  // An experience linked to no role gives none.
  assert.equal(roleForExperience(c,'p-no-role',y('2017')),null);
});
