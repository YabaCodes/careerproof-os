import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAchievementInput,validateProfileInput,validateBackup,generateBackup,validateCollections,ValidationError,isValidLocalDate,summarizeAchievements,migrateLegacyAchievement,achievementView} from '../dist/app/domain/validation.js';
import {P0_STORES} from '../dist/app/domain/models.js';
import {isPrecisionDate,datesInOrder,dateBounds} from '../dist/app/domain/dates.js';
import {legacyBackup,legacyAchievement,collections,fullCollections,timestamp,base} from './fixtures.mjs';
const input=legacyAchievement();
test('recorded needs contribution and date; blank draft date stays unspecified',()=>{
  assert.deepEqual(validateAchievementInput(input),[]);
  assert.ok(validateAchievementInput({...input,contribution:''}).some(x=>x.includes('contribution')));
  const draft={...input,contribution:'',occurredOn:'',status:'draft'};
  assert.deepEqual(validateAchievementInput(draft),[]);
  assert.equal(migrateLegacyAchievement({...draft,preArchiveStatus:null}).occurredStart,null);
});
test('precision dates validate actual calendar dates and preserve uncertain chronology',()=>{
  for(const value of ['2026-02-30','2026-00-12','1899-12-31','2201-01-01'])assert.equal(isValidLocalDate(value),false);
  assert.equal(isValidLocalDate('2024-02-29'),true);
  for(const [value,precision] of [['2024','year'],['2024-02','month'],['2024-02-29','day']])assert.ok(isPrecisionDate({value,precision}));
  for(const v of [{value:'2024-02-29',precision:'year'},{value:'2026-13',precision:'month'},{value:2024,precision:'year'},{value:'2024',precision:['year']},{value:'2024',precision:'year',extra:true}])assert.equal(isPrecisionDate(v),false);
  assert.deepEqual(dateBounds({value:'2024-02',precision:'month'}),{earliest:'2024-02-01',latest:'2024-02-29'});
  assert.ok(datesInOrder({value:'2024-06',precision:'month'},{value:'2024',precision:'year'}));
  assert.equal(datesInOrder({value:'2025',precision:'year'},{value:'2024-12-31',precision:'day'}),false);
});
test('profile validates email and types without coercion',()=>{
  const p={displayName:'',headline:'',summary:'',email:'',location:''};
  assert.deepEqual(validateProfileInput(p),[]);
  assert.ok(validateProfileInput({...p,email:'not-an-email'}).length);
  assert.ok(validateProfileInput({...p,displayName:[]}).length);
});
test('format-1 conversion is lossless with conservative privacy and no duplicate date field',()=>{
  const legacy=legacyBackup(),b=validateBackup(legacy);
  assert.equal(b.manifest.formatVersion,2);assert.equal(b.collections.competencies.length,32);
  for(const old of legacy.collections.achievements){
    const migrated=b.collections.achievements.find(a=>a.id===old.id),view=achievementView(migrated);
    for(const key of Object.keys(old))assert.deepEqual(view[key],old[key],key);
    assert.equal(migrated.confidentiality,'confidential');assert.equal(Object.hasOwn(migrated,'occurredOn'),false);
  }
});
test('format-2 round-trip includes every P0 store and portable preferences',()=>{
  const c=fullCollections(),b=generateBackup(c,{theme:'dark'},timestamp);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(b))),b);
  assert.deepEqual(Object.keys(b.collections),[...P0_STORES]);
});
test('reject coerced legacy enums and malformed records before conversion',()=>{
  for(const changes of [{status:['recorded']},{status:12},{preArchiveStatus:['recorded'],status:'archived'},{status:'other'},{revision:'3'},{title:[]},{occurredOn:'2026-02-31'},{createdAt:'2025-02-30T12:34:56.000Z'},{status:'recorded',preArchiveStatus:'draft'}]){
    const b=legacyBackup();Object.assign(b.collections.achievements[0],changes);assert.throws(()=>validateBackup(b),ValidationError);
  }
});
test('reject invalid format/schema versions, counts, collection types, and duplicate IDs',()=>{
  const b=generateBackup(fullCollections());
  for(const mutation of [
    x=>x.manifest.schemaVersion=55,x=>x.manifest.formatVersion='2',x=>x.manifest.formatVersion=3,
    x=>x.manifest.counts.profiles=2,x=>x.collections.employers={},x=>delete x.collections.roles,
    x=>x.collections.achievements.push(x.collections.achievements[0]),
    x=>x.collections.employers[0].id=x.collections.projects[0].id,
    x=>x.preferences.theme=['dark'],x=>x.collections.achievements[0].occurredOn='2024-02-29',
    x=>x.collections.achievements[0].confidentiality='public',
    x=>x.collections.competencies[0].isBuiltIn=false,
    x=>x.collections.competencies.pop()
  ]){const corrupt=structuredClone(b);mutation(corrupt);assert.throws(()=>validateBackup(corrupt),ValidationError);}
  const legacy=legacyBackup();legacy.collections.achievements[1].id=legacy.collections.achievements[0].id;assert.throws(()=>validateBackup(legacy),ValidationError);
});
test('every P0 validator rejects wrong field types and incorrect enums',()=>{
  const c=fullCollections();
  const bad={profiles:['phone',[]],employers:['website','javascript:alert(1)'],roles:['isCurrent','true'],education:['institution',3],credentials:['expirationDate','2025'],projects:['experienceType',['project']],achievements:['status',['recorded']],impactMetrics:['unit',3],competencyCategories:['sortOrder',1.5],competencies:['status','deleted'],evidenceReferences:['referenceType','attachment'],recordLinks:['isPrimary',1]};
  for(const [store,[key,value]] of Object.entries(bad)){const copy=structuredClone(c);copy[store][0][key]=value;assert.throws(()=>validateCollections(copy),ValidationError,store);}
  for(const n of [NaN,Infinity,'12']){const copy=structuredClone(c);copy.impactMetrics[0].baselineValue=n;assert.throws(()=>validateCollections(copy),ValidationError);}
});
test('integrity checks cover all references, typed uniqueness, primary projects, and taxonomy names',()=>{
  for(const mutation of [
    c=>c.profiles[0].primaryRoleId='missing',c=>c.roles[0].employerId='missing',c=>c.projects[0].employerId='missing',
    c=>c.achievements[0].roleId='missing',c=>c.impactMetrics[0].achievementId='missing',c=>c.evidenceReferences[0].achievementId='missing',
    c=>c.competencies[0].categoryId='missing',c=>c.recordLinks[0].sourceId='missing',c=>c.recordLinks[0].targetId='missing',
    c=>c.recordLinks.push({...c.recordLinks[0],id:'duplicate-link'}),
    c=>{c.projects.push({...c.projects[0],id:'project-2'});c.recordLinks.push({...c.recordLinks[1],id:'second-primary',targetId:'project-2'});},
    c=>c.competencies.push({...c.competencies.at(-1),id:'duplicate-name'}),
    c=>c.competencies[0].normalizedName='wrong',c=>c.roles[0].endDate={value:'2021',precision:'year'},
    c=>c.evidenceReferences[0].referenceType='url'
  ]){const c=fullCollections();mutation(c);assert.throws(()=>validateCollections(c),ValidationError);}
});
test('overlapping roles, multiple projects, partial achievement dates and zero metric values are valid',()=>{
  const c=fullCollections();c.roles.push({...c.roles[0],id:'role-2'});
  c.projects.push({...c.projects[0],id:'project-2'});
  c.recordLinks.push({...c.recordLinks[1],id:'secondary-project',targetId:'project-2',isPrimary:false});
  c.achievements[0].occurredStart={value:'2024',precision:'year'};
  c.impactMetrics[0].baselineValue=0;c.impactMetrics[0].resultValue=null;
  assert.equal(validateCollections(c),c);
});
test('summaries retain archived/draft semantics',()=>{
  const c=validateBackup(legacyBackup()).collections;
  assert.deepEqual(summarizeAchievements(c.achievements),{total:2,recorded:1,drafts:1,archived:1});
  assert.ok(generateBackup(collections()).manifest.counts.competencies===32);
});
