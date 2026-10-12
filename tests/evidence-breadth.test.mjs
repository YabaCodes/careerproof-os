import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceBreadthByCompetency} from '../dist/app/domain/evidenceBreadth.js';
import {fullCollections} from './fixtures.mjs';

function fixture(){
  const c=fullCollections();
  const skillId=c.recordLinks.find(l=>l.linkType==='achievement-competency').targetId;
  const original=c.achievements[0];
  // Preserve a single synthetic linked example and its primary work context.
  return {c,skillId,original};
}
function add(c,source,id,{status='recorded',outcome='Synthetic outcome',context=null,roleId=null,confidentiality='standard-private'}={}){
  c.achievements.push({...source,id,title:'Synthetic evidence '+id,status,outcome,roleId,confidentiality});
  const skillLink=c.recordLinks.find(l=>l.linkType==='achievement-competency');
  c.recordLinks.push({...skillLink,id:'link-'+id,sourceId:id});
  if(context!==null){
    const projectLink=c.recordLinks.find(l=>l.linkType==='achievement-project');
    c.recordLinks.push({...projectLink,id:'context-'+id,sourceId:id,targetId:context,isPrimary:true});
  }
}
function report(c,skillId){return evidenceBreadthByCompetency(c).get(skillId);}
test('CIF-02 zero linked recorded achievements means Not documented; never assign a proficiency',()=>{
  const {c,skillId}=fixture();
  c.recordLinks=c.recordLinks.filter(l=>!(l.linkType==='achievement-competency'&&l.targetId===skillId));
  assert.deepEqual(report(c,skillId),{label:'Not documented',eligibleCount:0,contextCount:0,statedOutcomeCount:0,eligibleAchievementIds:[]});
});
test('CIF-03 one eligible recorded achievement is Emerging; drafts and archives never count',()=>{
  const {c,skillId,original}=fixture();
  const before=report(c,skillId);
  assert.equal(before.label,'Emerging');
  assert.equal(before.eligibleCount,1);
  add(c,original,'draft-example',{status:'draft'});
  add(c,original,'archived-example',{status:'archived'});
  assert.deepEqual(report(c,skillId),before);
});
test('CIF-04 Moderate requires 2 eligible achievements and at least one stated outcome',()=>{
  const {c,skillId,original}=fixture();
  original.outcome='';
  add(c,original,'second',{outcome:''});
  assert.equal(report(c,skillId).label,'Emerging');
  c.achievements.at(-1).outcome='Supported synthetic statement';
  assert.equal(report(c,skillId).label,'Moderate');
});
test('CIF-05 Broad requires 3 recorded, 2 distinct primary contexts, and 2 outcomes',()=>{
  const {c,skillId,original}=fixture();
  const existingPrimary=c.recordLinks.find(l=>l.sourceId===original.id&&l.linkType==='achievement-project'&&l.isPrimary);
  const firstContext=existingPrimary?.targetId??'synthetic-project-1';
  if(!existingPrimary)c.recordLinks.push({id:'first-context',revision:1,createdAt:original.createdAt,updatedAt:original.updatedAt,linkType:'achievement-project',sourceId:original.id,targetId:firstContext,isPrimary:true,note:''});
  add(c,original,'second',{context:firstContext,outcome:'Result'});
  add(c,original,'third',{context:firstContext,outcome:'Result'});
  assert.equal(report(c,skillId).label,'Moderate','three achievements in one context must not be Broad');
  const moved=c.recordLinks.find(l=>l.id==='context-third');
  moved.targetId='synthetic-project-2';
  const result=report(c,skillId);
  assert.equal(result.label,'Broad');
  assert.equal(result.eligibleCount,3);
  assert.equal(result.contextCount,2);
  assert.ok(result.statedOutcomeCount>=2);
});
test('CIF-06 role fallback and a shared unspecified context do not fabricate diversity',()=>{
  const {c,skillId,original}=fixture();
  c.recordLinks=c.recordLinks.filter(l=>l.linkType!=='achievement-project');
  original.roleId=null;original.outcome='Stated synthetic outcome';
  add(c,original,'second',{roleId:null});
  add(c,original,'third',{roleId:null});
  assert.equal(report(c,skillId).contextCount,1);
  assert.equal(report(c,skillId).label,'Moderate');
  c.achievements.find(a=>a.id==='third').roleId='other-role';
  assert.equal(report(c,skillId).label,'Broad');
});
test('CIF-07 confidential examples count privately; repeated relationships do not count twice',()=>{
  const {c,skillId,original}=fixture();
  original.confidentiality='confidential';
  const link=c.recordLinks.find(l=>l.linkType==='achievement-competency'&&l.targetId===skillId);
  c.recordLinks.push({...link,id:'duplicated-link'});
  assert.equal(report(c,skillId).eligibleCount,1);
  assert.deepEqual(report(c,skillId).eligibleAchievementIds,[original.id]);
});
