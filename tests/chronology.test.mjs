import test from 'node:test';
import assert from 'node:assert/strict';
import {compareRolesByRecency,employersByRecency,roleRecency} from '../dist/app/domain/chronology.js';
import {careerSections} from '../dist/app/ui/careerHistory.js';
import {fullCollections,base} from './fixtures.mjs';

// CP-012.3: employment history lists the most recent employer first, independent
// of the order records were entered and of employer names. Synthetic data only.
const d=(value)=>({value,precision:value.length===4?'year':value.length===7?'month':'day'});
const employer=(id,name,createdAt='2025-01-01T00:00:00.000Z')=>({...base(id),createdAt,updatedAt:createdAt,name,industry:'',location:'',website:'',description:''});
const role=(id,employerId,title,start,end=null,isCurrent=false)=>({...base(id),employerId,title,startDate:d(start),endDate:end?d(end):null,isCurrent,employmentType:'',responsibilities:'',leadershipScope:'',technologies:[]});
const names=list=>list.map(e=>e.name);

test('CP-012.3 the current employer leads even when it was entered first and sorts last by name',()=>{
  // Entry order: the recent employer first, then the older one (the reported case).
  const employers=[employer('e-recent','Zephyr Recent Labs','2026-10-01T00:00:00.000Z'),employer('e-old','Alder Older Works','2026-10-02T00:00:00.000Z')];
  const roles=[role('r-recent','e-recent','Lead Engineer','2022-03',null,true),role('r-old','e-old','Engineer','2016','2021-12')];
  assert.deepEqual(names(employersByRecency(employers,roles)),['Zephyr Recent Labs','Alder Older Works']);
  // Same answer for the opposite entry order: order depends only on dates.
  assert.deepEqual(names(employersByRecency([...employers].reverse(),[...roles].reverse())),['Zephyr Recent Labs','Alder Older Works']);
});

test('CP-012.3 ended employers order by their latest end date; current beats ended; undated employers follow',()=>{
  const employers=[employer('a','Alpha'),employer('b','Bravo'),employer('c','Charlie'),employer('n1','No Roles One','2026-01-01T00:00:00.000Z'),employer('n2','No Roles Two','2026-02-01T00:00:00.000Z')];
  const roles=[
    role('a1','a','Analyst','2012','2015'),
    role('b1','b','Engineer','2015-02','2019-08'),role('b2','b','Senior Engineer','2019-09','2023-05'), // promotion
    role('c1','c','Lead','2023-06',null,true)
  ];
  assert.deepEqual(names(employersByRecency(employers,roles)),['Charlie','Bravo','Alpha','No Roles Two','No Roles One']);
});

test('CP-012.3 roles: current first, then latest end; ties by later start; precision-aware',()=>{
  const roles=[
    role('old','e','Engineer','2015','2018'),
    role('mid','e','Senior Engineer','2018-01','2022-06'),
    role('cur','e','Principal Engineer','2022-07',null,true),
    role('side','e','Advisor','2020-01',null,true), // overlapping current role started earlier
    role('year','e','Year-only','2021','2022') // "2022" can mean as late as 31 Dec 2022, after "2022-06"
  ];
  assert.deepEqual([...roles].sort(compareRolesByRecency).map(r=>r.id),['cur','side','year','mid','old']);
  assert.equal(roleRecency(roles[2]),'9999-12-31');
  assert.equal(roleRecency(role('noend','e','Contract','2020-02')),'2020-02-29'); // ended, end unknown: start bounds it
});

test('CP-012.3 ordering never mutates its inputs',()=>{
  const employers=Object.freeze([employer('x','Xray'),employer('y','Yankee')]);
  const roles=Object.freeze([role('y1','y','Lead','2024',null,true),role('x1','x','Engineer','2010','2012')]);
  assert.deepEqual(names(employersByRecency(employers,roles)),['Yankee','Xray']);
  assert.deepEqual(names(employers),['Xray','Yankee']);
});

test('CP-012.3 Employment History renders the most recent employer first with Title Case headings',()=>{
  const c=fullCollections();
  c.employers.push(employer('employer-older','Aardvark Synthetic Older'));
  c.roles.push(role('role-older','employer-older','Synthetic Analyst','2015','2019'));
  const html=careerSections(c.profiles[0],c);
  assert.ok(html.indexOf('Synthetic Company')<html.indexOf('Aardvark Synthetic Older'),'current employer must precede the older one');
  for(const heading of ['Employment History','Education','Certifications &amp; Credentials'])assert.ok(html.includes('<h2>'+heading+'</h2>'),heading);
});
