import test from 'node:test';
import assert from 'node:assert/strict';
import {homeGaps,roleCoverage,HOME_GAP_CODES} from '../dist/app/domain/dashboard.js';
import {assessDataHealth,completenessIssues} from '../dist/app/domain/dataHealth.js';
import {fullCollections,base} from './fixtures.mjs';

// CP-012C Home dashboard: derived counts only, same wording as Data Health. Synthetic data only.
const NOW='2026-10-11T02:00:00.000Z';
const achievement=(c,id,over={})=>({...c.achievements[0],...base(id),title:'Synthetic '+id,outcome:'',roleId:null,status:'recorded',preArchiveStatus:null,...over});
function world(){
  const c=fullCollections();
  c.roles.push({...c.roles[0],id:'role-old',title:'Synthetic Process Engineer',isCurrent:false,startDate:{value:'2018',precision:'year'},endDate:{value:'2021-12',precision:'month'}});
  c.roles.push({...c.roles[0],id:'role-empty',title:'Synthetic Intern',isCurrent:false,startDate:{value:'2015',precision:'year'},endDate:{value:'2016',precision:'year'}});
  c.achievements.push(
    achievement(c,'a-old',{roleId:'role-old',outcome:'Synthetic result'}),
    achievement(c,'a-gap',{roleId:'role-1'}),
    achievement(c,'a-draft',{roleId:'role-1',status:'draft',contribution:''}),
    achievement(c,'a-archived',{roleId:'role-old',status:'archived',preArchiveStatus:'recorded'}),
    achievement(c,'a-loose',{outcome:'Synthetic loose result'}));
  c.profiles[0]={...c.profiles[0],summary:''};
  return c;
}

test('CP-012C Home gaps are the Data Health completeness issues minus drafts, profile and backup items',()=>{
  const c=world();
  const gaps=homeGaps(c,NOW.slice(0,10));
  assert.deepEqual(gaps.map(g=>g.code),['achievement-no-outcome','achievement-no-support','achievement-no-skill','achievement-no-context']);
  assert.ok(gaps.every(g=>HOME_GAP_CODES.includes(g.code)));
  // Same wording and records as the Data Health report, so the two never disagree.
  const report=assessDataHealth(c,{now:NOW,lastExportAt:null,lastChangeAt:null,backupBytes:null,storagePersisted:null});
  for(const g of gaps)assert.deepEqual(report.find(r=>r.code===g.code),g);
  assert.ok(report.some(r=>r.code==='drafts')&&report.some(r=>r.code==='profile-incomplete')&&report.some(r=>r.code==='export-never'),'still in Data Health');
  assert.deepEqual(completenessIssues(c,NOW.slice(0,10)),report.filter(r=>!['export-never','export-stale','changes-since-export','storage-not-persistent','backup-size'].includes(r.code)));
  assert.equal(gaps.find(g=>g.code==='achievement-no-outcome').title,'1 recorded achievement has no stated outcome');
  assert.deepEqual(homeGaps(fullCollections(),'2026-10-11'),[],'a complete fixture has no gaps');
});

test('CP-012C achievements by role: most recent role first, active achievements only, drafts and experiences counted',()=>{
  const {roles,withoutRole}=roleCoverage(world());
  assert.deepEqual(roles.map(r=>[r.title,r.achievements,r.drafts,r.experiences,r.current]),[
    ['Synthetic Engineer',3,1,1,true],          // achievement-1, a-gap, a-draft; role-project link-1
    ['Synthetic Process Engineer',1,0,0,false],  // a-old; the archived one is not counted
    ['Synthetic Intern',0,0,0,false]
  ]);
  assert.equal(roles[0].employer,'Synthetic Company');
  assert.equal(withoutRole,1);
  assert.deepEqual(roleCoverage({...fullCollections(),roles:[]}).roles,[]);
});
