import test from 'node:test';
import assert from 'node:assert/strict';
import {recordByMonth} from '../dist/app/domain/dashboard.js';
import {savedMessage} from '../dist/app/ui/achievementStory.js';
import {recordTimelineSection,monthListTitle} from '../dist/app/ui/homeDashboard.js';
import {fullCollections,base} from './fixtures.mjs';

// CP-UX-Fluid (DEC-038): the Home record timeline and the recorded moment. Synthetic data only.
const at=(id,value,over={})=>({...base(id),status:'recorded',occurredStart:value?{value,precision:value.length===4?'year':value.length===7?'month':'day'}:null,...over});

test('CP-UX-Fluid record by month: the 12 months up to today, across a year boundary',()=>{
  const r=recordByMonth([],'2026-02-14');
  assert.deepEqual(r.months.map(m=>m.key),['2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02']);
  assert.deepEqual(r.years,['2025','2026']);
  assert.equal(r.total,0);
  assert.equal(recordByMonth([],'2026-12-31').months[0].key,'2026-01');
  assert.equal(recordByMonth([],'2026-01-01').months.at(-1).key,'2026-01');
});

test('CP-UX-Fluid record by month counts recorded achievements by the month they happened, nothing else',()=>{
  const r=recordByMonth([
    at('a-day','2026-09-28'),
    at('a-month','2026-09'),
    at('a-later-day','2026-09-30',{updatedAt:'2026-01-01T00:00:00.000Z'}),
    at('a-oct','2026-10-02'),
    at('a-first','2025-11'),
    at('a-before','2025-10-31'),          // the month before the window
    at('a-future','2026-11'),             // after today's month
    at('a-draft','2026-09',{status:'draft'}),
    at('a-archived','2026-09',{status:'archived'}),
    at('a-undated',''),
    at('a-year-in','2026'),
    at('a-year-start','2025'),
    at('a-year-out','2024'),
  ],'2026-10-16');
  const month=key=>r.months.find(m=>m.key===key);
  assert.deepEqual(month('2026-09'),{key:'2026-09',count:3,ids:['a-later-day','a-day','a-month']},'latest date first; a month-only date sorts after its days');
  assert.equal(month('2026-10').count,1);
  assert.equal(month('2025-11').count,1);
  assert.equal(r.total,5);
  assert.equal(r.months.reduce((s,m)=>s+m.count,0),r.total);
  assert.equal(r.yearOnly,2,'year-only dates the window touches are counted apart, never spread over months');
  assert.ok(r.months.every(m=>Number.isInteger(m.count)&&m.count>=0));
  assert.deepEqual(Object.keys(r).sort(),['months','total','yearOnly','years'],'counts only: no score, streak, target or average');
});

test('CP-UX-Fluid timeline markup: one labelled button per month, hidden when nothing can be shown',()=>{
  assert.equal(recordTimelineSection(recordByMonth([],'2026-10-16'),null),'');
  assert.equal(recordTimelineSection(recordByMonth([at('y','2026')],'2026-10-16'),null),'','a year-only record alone draws no empty chart');
  const r=recordByMonth([at('a','2026-09-28'),at('b','2026-09'),at('c','2026-03'),at('y','2026')],'2026-10-16');
  const html=recordTimelineSection(r,'2026-03');
  assert.equal((html.match(/data-action="home-month"/g)||[]).length,12);
  assert.match(html,/aria-label="September 2026: 2 achievements"/);
  assert.match(html,/aria-label="August 2026: 0 achievements"/);
  assert.match(html,/data-month="2026-03" aria-pressed="true"/);
  assert.match(html,/data-bar="month:2026-09" style="height:100%"/);
  assert.match(html,/data-bar="month:2026-03" style="height:50%"/);
  assert.match(html,/1 achievement from 2025–2026 has only a year/);
  assert.doesNotMatch(html.toLowerCase(),/streak|target|goal|score|average/);
  const title=monthListTitle(r,r.months.at(-1));
  assert.match(title,/October 2026/);
  assert.match(title,/aria-label="Next month"[^>]*disabled/,'no step past the current month');
  assert.match(title,/data-month="2026-09" aria-label="Previous month: September 2026"/);
});

test('CP-UX-Fluid recorded moment names the experience and skills from the saved links; drafts say what is missing',()=>{
  const c=fullCollections();
  const a={...c.achievements[0],occurredStart:{value:'2026-09',precision:'month'}};
  assert.deepEqual(savedMessage(c,a,null),{title:'Achievement recorded',detail:'In Synthetic Initiative · Adds an example to Synthetic Skill'});
  assert.deepEqual(savedMessage(c,a,'draft'),{title:'Achievement recorded',detail:'In Synthetic Initiative · Adds an example to Synthetic Skill'},'a draft becoming recorded is a recorded moment');
  assert.deepEqual(savedMessage(c,a,'recorded'),{title:'Achievement updated',detail:''});
  // No experience: the role it sits under; several skills are shortened.
  const skills=c.competencies.filter(s=>s.isBuiltIn).slice(0,3);
  const roleOnly={...c,recordLinks:skills.map((s,i)=>({...base('l'+i),linkType:'achievement-competency',sourceId:a.id,targetId:s.id,isPrimary:false,note:''}))};
  assert.deepEqual(savedMessage(roleOnly,a,null),{title:'Achievement recorded',detail:`As Synthetic Engineer · Adds an example to ${skills[0].name}, ${skills[1].name} and 1 more`});
  assert.deepEqual(savedMessage({...c,recordLinks:[]},{...a,roleId:null},null),{title:'Achievement recorded',detail:''});
  assert.deepEqual(savedMessage(c,{...a,status:'draft',contribution:'',occurredStart:null},null),{title:'Draft saved',detail:'Add what you did and a date to record it.'});
  assert.deepEqual(savedMessage(c,{...a,status:'draft',occurredStart:null},'draft'),{title:'Draft updated',detail:'Add a date to record it.'});
  assert.deepEqual(savedMessage(c,{...a,status:'draft'},null),{title:'Draft saved',detail:'Record it when it is ready.'});
});
