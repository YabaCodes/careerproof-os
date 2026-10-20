import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {CareerDatabase} from '../dist/app/data/db.js';
import {createBackup,parseBackupJson,restoreBackup,inspectLocalData} from '../dist/app/data/backup.js';
import {generateBackup,validateBackup,validateCollections,ValidationError} from '../dist/app/domain/validation.js';
import {P0_STORES,FORMAT3_STORES} from '../dist/app/domain/models.js';
import {reviewCandidates,buildReview,buildCv,cvCandidates,cvDefaultSelection,defaultContactFields,documentReview,useUpdatedText,keepBlockText,editBlock,addBlock,removeBlock,moveSection,showSection,duplicateDocument,nextVersionTitle,presetPeriod,periodShort,refreshSource,documentAttention} from '../dist/app/domain/studio.js';
import {documentPdf,pdfFileName} from '../dist/app/domain/documentPdf.js';
import {buildPdf,encodeWinAnsi,wrapText,textWidth} from '../dist/app/domain/pdf.js';
import {studioCollections,fullCollections,request,completed,timestamp} from './fixtures.mjs';

const NOW='2026-10-20T10:00:00.000Z',TODAY='2026-10-20';
const period={periodStart:{value:'2026-05',precision:'month'},periodEnd:{value:'2026-10',precision:'month'}};
const reviewInput=(o={})=>({...period,roleId:null,excludeConfidential:true,title:'Performance Review · May–Oct 2026',achievementIds:['ach-a','ach-b','ach-c'],includeSkills:true,includeNext:true,...o});
const cvInput=(c,o={})=>({title:'CV — Synthetic',templateId:'cv-professional',excludeConfidential:true,roleIds:['role-1','role-2'],achievementIds:['ach-a','ach-b','ach-d'],includeSkills:true,includeTechnologies:true,includeEducation:true,includeCredentials:true,contactFields:defaultContactFields(c),today:TODAY,...o});
/** Give a built document the identity the database would, and its sources their document ID. */
function stored(built,c){
  const document={...built.document,createdAt:NOW,updatedAt:NOW,revision:1};
  const sources=built.sources.map((s,i)=>({...s,id:'src-'+document.id+'-'+i,documentId:document.id,createdAt:NOW,updatedAt:NOW,revision:1}));
  if(c){c.careerDocuments.push(document);c.documentSources.push(...sources);}
  return {document,sources};
}
const sorted=c=>Object.fromEntries(P0_STORES.map(s=>[s,[...c[s]].sort((a,b)=>a.id.localeCompare(b.id))]));
const block=(doc,key)=>doc.contentBlocks.find(b=>b.sourceKey===key);
/** Decode every hex text string drawn in a PDF built by buildPdf. */
function pdfText(bytes){
  const raw=Buffer.from(bytes).toString('latin1');
  // WinAnsi: Latin-1 except 0x80–0x9F (Node's TextDecoder may lack the windows-1252 table).
  const high='€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ';
  const ansi=b=>[...b].map(x=>x>=0x80&&x<0xa0?high[x-0x80]:String.fromCharCode(x)).join('');
  return [...raw.matchAll(/<([0-9A-F]+)> Tj/g)].map(m=>ansi(Buffer.from(m[1],'hex'))).join('\n');
}

test('STU-01 review offers only Recorded achievements in the period; Confidential ones are left out and counted',()=>{
  const c=studioCollections();
  const r=reviewCandidates(c,{...period,roleId:null,excludeConfidential:true});
  assert.deepEqual(r.groups.flatMap(g=>g.items.map(i=>i.achievement.id)),['ach-a','ach-b']);
  assert.deepEqual(r.groups.map(g=>g.label),['Line Upgrade','As Synthetic Engineer']);
  assert.equal(r.confidentialLeftOut,1);assert.equal(r.experienceCount,1);
  const all=reviewCandidates(c,{...period,roleId:null,excludeConfidential:false});
  assert.deepEqual(all.groups.flatMap(g=>g.items.map(i=>i.achievement.id)).sort(),['ach-a','ach-b','ach-c']);
  const role2=reviewCandidates(c,{periodStart:{value:'2018-01',precision:'month'},periodEnd:{value:'2026-10',precision:'month'},roleId:'role-2',excludeConfidential:true});
  assert.deepEqual(role2.groups.flatMap(g=>g.items.map(i=>i.achievement.id)),['ach-d']);
  assert.deepEqual(presetPeriod('last-6',TODAY),{start:{value:'2026-05',precision:'month'},end:{value:'2026-10',precision:'month'}});
  assert.deepEqual(presetPeriod('last-12','2026-01-31').start,{value:'2025-02',precision:'month'});
  assert.equal(presetPeriod('this-year',TODAY).start.value,'2026-01');
  assert.equal(periodShort({value:'2025-11',precision:'month'},{value:'2026-10',precision:'month'}),'Nov 2025–Oct 2026');
});
test('STU-02 a review draft copies the user\'s own words and never names confidential work',()=>{
  const c=studioCollections(),{document:doc,sources}=buildReview(c,reviewInput(),NOW,7);
  assert.equal(doc.documentType,'review');assert.equal(doc.excludeConfidential,true);assert.equal(doc.sourceDataRevision,7);
  // ach-c was asked for but is Confidential: it is silently not used.
  assert.deepEqual(doc.contentBlocks.filter(b=>b.section==='achievements').map(b=>b.sourceKey),['achievement:ach-a','achievement:ach-b']);
  assert.match(block(doc,'review-summary').text,/^Between May and October 2026, I recorded 2 achievements across Line Upgrade and my role as Synthetic Engineer\.$/);
  const a=block(doc,'achievement:ach-a');
  assert.equal(a.heading,'Cut changeover time');assert.equal(a.meta,'Sep 2026 · Line Upgrade');
  assert.equal(a.text,'Result: Changeover down from 42 to 31 minutes.\nWhat I did: Redesigned the tooling cart.\nMeasured: Changeover time: 42 to 31 min');
  assert.equal(block(doc,'review-skills').text,'Synthetic Skill — 1 achievement');
  assert.deepEqual(doc.contentBlocks.filter(b=>b.section==='next').map(b=>[b.heading,b.text]),[['Line Upgrade','Qualify two suppliers by Q1.']]);
  assert.ok(doc.contentBlocks.every(b=>!b.userEdited&&b.generated&&b.generated.text===b.text));
  const json=JSON.stringify({doc,sources});
  for(const secret of ['Hidden','Secret','ach-c','project-3'])assert.ok(!json.includes(secret),secret);
  assert.deepEqual(sources.map(s=>s.sourceType+':'+s.sourceId),['achievement:ach-a','project:project-2','role:role-1','achievement:ach-b','competency:custom-competency','project:project-2'].filter((v,i,a)=>a.indexOf(v)===i));
  const included=buildReview(c,reviewInput({excludeConfidential:false}),NOW,7).document;
  assert.ok(block(included,'achievement:ach-c'));assert.ok(included.contentBlocks.some(b=>b.heading==='Hidden Program'));
  const hidden=buildReview(c,reviewInput({includeSkills:false,includeNext:false}),NOW,7).document;
  assert.deepEqual(hidden.sections,[{key:'summary',visible:true},{key:'achievements',visible:true},{key:'skills',visible:false},{key:'next',visible:false}]);
});
test('STU-03 source changes raise alerts; nothing is rewritten until the user chooses',()=>{
  const c=studioCollections(),{document:doc,sources}=stored(buildReview(c,reviewInput(),NOW,7),c);
  assert.equal(documentAttention(c,doc),0);
  const a=c.achievements.find(x=>x.id==='ach-a');a.outcome='Changeover down from 42 to 29 minutes.';a.revision++;
  const states=documentReview(c,doc,sources),id=block(doc,'achievement:ach-a').id;
  assert.equal(states.get(id).state,'changed');assert.match(states.get(id).next.text,/42 to 29 minutes/);
  assert.match(block(doc,'achievement:ach-a').text,/42 to 31 minutes/,'document text unchanged');
  // Use updated text: the block takes the new text and is no longer flagged.
  const updated=useUpdatedText(doc,id,states.get(id).next);
  assert.match(block(updated,'achievement:ach-a').text,/29 minutes/);assert.equal(documentReview(c,updated,sources).get(id).state,'current');
  // Keep this text: the earlier text stays, marked as the user's, and the alert clears.
  const kept=keepBlockText(doc,id,states.get(id));
  assert.match(block(kept,'achievement:ach-a').text,/31 minutes/);assert.equal(block(kept,'achievement:ach-a').userEdited,true);
  assert.equal(documentReview(c,kept,sources).get(id).state,'current');
  // An edited block keeps the user's words when its source changes again.
  const edited=editBlock(updated,id,{heading:'Faster changeovers',meta:'Sep 2026',date:'',text:'My own words.'});
  assert.equal(block(edited,'achievement:ach-a').userEdited,true);
  a.contribution='Changed again.';a.revision++;
  assert.equal(documentReview(c,edited,sources).get(id).state,'changed');assert.equal(block(edited,'achievement:ach-a').text,'My own words.');
  // The summary depends on the selection, so deleting an achievement changes it and flags the item.
  c.achievements=c.achievements.filter(x=>x.id!=='ach-b');
  const after=documentReview(c,doc,sources);
  assert.equal(after.get(block(doc,'achievement:ach-b').id).state,'missing');
  assert.equal(after.get(block(doc,'review-summary').id).state,'changed');
  const detached=keepBlockText(doc,block(doc,'achievement:ach-b').id,after.get(block(doc,'achievement:ach-b').id));
  const kept2=detached.contentBlocks.find(b=>b.heading==='Onboarded two engineers');
  assert.equal(kept2.sourceKey,null);assert.equal(kept2.generated,null);assert.equal(kept2.text,block(doc,'achievement:ach-b').text);
  assert.equal(removeBlock(doc,block(doc,'achievement:ach-b').id).contentBlocks.some(b=>b.sourceKey==='achievement:ach-b'),false);
  // A record that becomes Confidential is reported, not silently dropped.
  c.achievements.find(x=>x.id==='ach-a').confidentiality='confidential';
  assert.equal(documentReview(c,doc,sources).get(id).state,'confidential');
  c.achievements.find(x=>x.id==='ach-a').status='archived';c.achievements.find(x=>x.id==='ach-a').preArchiveStatus='recorded';
  assert.equal(documentReview(c,doc,sources).get(id).state,'not-recorded');
});
test('STU-04 refreshing a reviewed source records its current revision and nothing else',()=>{
  const c=studioCollections(),{document:doc,sources}=stored(buildReview(c,reviewInput(),NOW,7),c);
  c.achievements.find(x=>x.id==='ach-a').revision=9;c.roles.find(r=>r.id==='role-1').revision=8;
  const drafts=refreshSource(c,sources,doc.id,'achievement:ach-a');
  assert.equal(drafts.find(s=>s.sourceId==='ach-a').sourceRevision,9);
  assert.equal(drafts.find(s=>s.sourceId==='role-1').sourceRevision,3,'other sources keep their recorded revision');
  assert.deepEqual(refreshSource(c,sources,doc.id,null).map(s=>s.sourceRevision),sources.map(s=>s.sourceRevision));
});
test('STU-05 CVs: two plain templates, top results per role, current credentials and phone off by default',()=>{
  const c=studioCollections(),cands=cvCandidates(c,{excludeConfidential:true});
  assert.deepEqual(cands.roles.map(r=>r.role.id),['role-1','role-2']);
  assert.deepEqual(cands.roles[0].items.map(i=>i.achievement.id).sort(),['ach-a','ach-b','achievement-1'].filter(id=>id!=='achievement-1').sort());
  assert.equal(cands.confidentialLeftOut,2);
  assert.deepEqual(cvDefaultSelection(cands).sort(),['ach-a','ach-b','ach-d']);
  assert.deepEqual(defaultContactFields(c),['email','location','website','links']);
  const pro=buildCv(c,cvInput(c),NOW,3).document;
  assert.deepEqual(pro.sections.map(s=>s.key),['contact','summary','experience','skills','technologies','education','credentials']);
  assert.equal(block(pro,'profile-contact').text,'example@example.test · Example City · example.test/me · example.test/profile');
  assert.ok(!JSON.stringify(pro).includes('555 0100'),'phone left off');
  assert.deepEqual(pro.contentBlocks.filter(b=>b.section==='experience').map(b=>b.kind+':'+(b.heading||b.text)),[
    'entry:Synthetic Engineer — Synthetic Company','bullet:Cut changeover time — Changeover down from 42 to 31 minutes.','bullet:Onboarded two engineers — Both run projects alone.',
    'entry:Junior Engineer — Example Works','bullet:Old team win — Removed manual checks.']);
  assert.equal(block(pro,'role:role-1').date,'2022 – Present');
  assert.deepEqual(pro.contentBlocks.filter(b=>b.section==='credentials').map(b=>b.heading),['Synthetic Certificate']);
  assert.equal(block(pro,'cv-technologies').text,'Example · Torque tools · PLC · Vision');
  assert.ok(!JSON.stringify(pro).includes('Secret'));
  const tech=buildCv(c,cvInput(c,{templateId:'cv-technical',contactFields:['phone','email']}),NOW,3).document;
  assert.deepEqual(tech.sections.map(s=>s.key),['contact','summary','skills','technologies','projects','experience','education','credentials']);
  assert.deepEqual(tech.contentBlocks.filter(b=>b.section==='projects').map(b=>b.kind+':'+(b.heading||b.text)),[
    'entry:Line Upgrade','bullet:Cut changeover time — Changeover down from 42 to 31 minutes.','entry:Other Work',
    'bullet:Onboarded two engineers — Both run projects alone.','bullet:Old team win — Removed manual checks.']);
  assert.ok(tech.contentBlocks.filter(b=>b.section==='experience').every(b=>b.kind==='entry'));
  assert.equal(block(tech,'profile-contact').text,'example@example.test · +1 555 0100');
  assert.equal(block(tech,'cv-skills').text,'Synthetic Custom Category: Synthetic Skill');
  // A role left out takes its achievements with it.
  const one=buildCv(c,cvInput(c,{roleIds:['role-1']}),NOW,3).document;
  assert.ok(!one.contentBlocks.some(b=>b.sourceKey==='achievement:ach-d'||b.sourceKey==='role:role-2'));
});
test('STU-06 sections reorder (contact stays first), hide, and documents copy as new versions',()=>{
  const c=studioCollections(),{document:doc,sources}=stored(buildCv(c,cvInput(c),NOW,3),c);
  const moved=moveSection(doc,'skills',-1);
  assert.deepEqual(moved.sections.map(s=>s.key).slice(0,4),['contact','summary','skills','experience']);
  assert.equal(moveSection(doc,'summary',-1),doc,'nothing moves above contact');
  assert.equal(moveSection(doc,'contact',1),doc);
  assert.equal(showSection(doc,'education',false).sections.find(s=>s.key==='education').visible,false);
  const added=addBlock(doc,'experience',{heading:'Volunteer Lead',meta:'Example Club',date:'2019',text:'- Ran events'});
  const custom=added.contentBlocks.at(-1);
  assert.equal(custom.kind,'entry');assert.equal(custom.sourceKey,null);assert.equal(custom.userEdited,true);
  assert.equal(nextVersionTitle(c,doc.title),'CV — Synthetic (2)');
  const copy=duplicateDocument(doc,sources,'CV — Synthetic (2)',NOW);
  assert.notEqual(copy.document.id,doc.id);assert.equal(copy.document.revision,0);
  assert.deepEqual(copy.document.contentBlocks,doc.contentBlocks);assert.equal(copy.sources.length,sources.length);
  c.careerDocuments.push({...copy.document,createdAt:NOW,updatedAt:NOW,revision:1});
  assert.equal(nextVersionTitle(c,'CV — Synthetic (2)'),'CV — Synthetic (3)');
});
test('STU-07 schema-4 validation rejects inconsistent documents and orphaned sources',()=>{
  const c=studioCollections();stored(buildReview(c,reviewInput(),NOW,7),c);stored(buildCv(c,cvInput(c),NOW,3),c);
  validateCollections(c);
  const mutations=[
    x=>{x.careerDocuments[0].templateId='cv-technical';},
    x=>{x.careerDocuments[0].sections.push({key:'contact',visible:true});},
    x=>{x.careerDocuments[0].contentBlocks[0].section='next';x.careerDocuments[0].sections=x.careerDocuments[0].sections.filter(s=>s.key!=='next');},
    x=>{x.careerDocuments[0].contentBlocks[1].id=x.careerDocuments[0].contentBlocks[0].id;},
    x=>{x.careerDocuments[0].contentBlocks[0].kind='table';},
    x=>{x.careerDocuments[0].contentBlocks[0].generated={text:'x'};},
    x=>{x.careerDocuments[0].contactFields=['email'];},
    x=>{x.careerDocuments[1].contactFields=['email','email'];},
    x=>{x.careerDocuments[0].title='';},
    x=>{x.careerDocuments[0].periodEnd={value:'2020-01',precision:'month'};},
    x=>{x.careerDocuments[0].extra=true;},
    x=>{x.documentSources[0].documentId='missing-document';},
    x=>{x.documentSources.push({...x.documentSources[0],id:'duplicate-source'});},
    x=>{x.documentSources[0].sourceType='employer-role';},
    x=>{x.documentSources[0].sourceRevision=0;}
  ];
  for(const [i,mutate] of mutations.entries()){const bad=structuredClone(c);mutate(bad);assert.throws(()=>validateCollections(bad),ValidationError,'mutation '+i);}
  // A source may outlive its record: the editor reports it as deleted instead.
  const orphan=structuredClone(c);orphan.achievements=orphan.achievements.filter(a=>a.id!=='ach-b');
  orphan.recordLinks=orphan.recordLinks.filter(l=>l.sourceId!=='ach-b');validateCollections(orphan);
});
test('STU-08 documents save atomically with their sources, survive record deletion and delete alone',async()=>{
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'studio');
  await repo.initialize();await repo.replaceAllData(studioCollections(),{theme:'system'},1);
  const before=await repo.readSnapshot(),built=buildReview(before.collections,reviewInput(),NOW,before.revision);
  const saved=await repo.saveCareerDocument(built.document,built.sources);
  let snap=await repo.readSnapshot();
  assert.equal(saved.revision,1);assert.equal(snap.collections.documentSources.length,built.sources.length);
  assert.ok(snap.collections.documentSources.every(s=>s.documentId===saved.id&&s.revision===1));
  assert.equal(snap.revision,before.revision+1);
  // Stale writes are refused; an edit with no source list keeps the sources untouched.
  await assert.rejects(()=>repo.saveCareerDocument(built.document,null),/changed/);
  const edited=await repo.saveCareerDocument(editBlock(saved,saved.contentBlocks[0].id,{heading:'',meta:'',date:'',text:'Own summary.'}),null);
  snap=await repo.readSnapshot();
  assert.equal(edited.revision,2);assert.equal(snap.collections.documentSources.length,built.sources.length);
  // Refreshing one source keeps every other source record exactly.
  const prior=snap.collections.documentSources;
  const refreshed=refreshSource({...snap.collections,achievements:snap.collections.achievements.map(a=>a.id==='ach-a'?{...a,revision:42}:a)},prior,saved.id,'achievement:ach-a');
  await repo.saveCareerDocument(edited,refreshed);snap=await repo.readSnapshot();
  const after=snap.collections.documentSources;
  assert.equal(after.find(s=>s.sourceId==='ach-a').sourceRevision,42);assert.equal(after.find(s=>s.sourceId==='ach-a').revision,2);
  for(const s of after.filter(x=>x.sourceId!=='ach-a'))assert.deepEqual(s,prior.find(p=>p.id===s.id));
  // Deleting a source achievement keeps the document and its text.
  const ach=snap.collections.achievements.find(a=>a.id==='ach-b');
  await repo.removeRecord('achievements','ach-b',ach.revision);snap=await repo.readSnapshot();
  const doc=snap.collections.careerDocuments[0];
  assert.ok(doc.contentBlocks.some(b=>b.sourceKey==='achievement:ach-b'));
  assert.equal(documentReview(snap.collections,doc,snap.collections.documentSources).get(doc.contentBlocks.find(b=>b.sourceKey==='achievement:ach-b').id).state,'missing');
  // Deleting the document removes only it and its own sources.
  const other=buildCv(snap.collections,cvInput(snap.collections),NOW,snap.revision);
  const cv=await repo.saveCareerDocument(other.document,other.sources);
  snap=await repo.readSnapshot();const careerBefore=sorted(snap.collections);
  await repo.removeCareerDocument(doc.id,doc.revision);
  const end=await repo.readSnapshot();
  assert.deepEqual(end.collections.careerDocuments.map(d=>d.id),[cv.id]);
  assert.ok(end.collections.documentSources.every(s=>s.documentId===cv.id));
  for(const store of P0_STORES.filter(s=>s!=='careerDocuments'&&s!=='documentSources'))assert.deepEqual(sorted(end.collections)[store],careerBefore[store],store);
  await assert.rejects(()=>repo.removeRecord('careerDocuments',cv.id,99),/changed/);
  await repo.removeRecord('careerDocuments',cv.id,cv.revision);
  assert.equal((await repo.readSnapshot()).collections.documentSources.length,0);
  await repo.close();
});
test('STU-09 schema 3→4 upgrade keeps every record, revision and setting and adds empty Studio stores',async()=>{
  const factory=new IDBFactory(),c=fullCollections();
  const open=factory.open('upgrade3',3);
  open.onupgradeneeded=()=>{for(const store of FORMAT3_STORES)open.result.createObjectStore(store,{keyPath:'id'});open.result.createObjectStore('meta',{keyPath:'key'});};
  const raw=await request(open),tx=raw.transaction([...FORMAT3_STORES,'meta'],'readwrite'),done=completed(tx);
  for(const store of FORMAT3_STORES)for(const record of c[store])tx.objectStore(store).put(record);
  for(const [key,value] of Object.entries({datasetGeneration:4,sourceDataRevision:31,preferences:{theme:'dark'},schemaVersion:3,lastExportAt:timestamp,lastChangeAt:timestamp}))
    tx.objectStore('meta').put({key,value});
  await done;raw.close();
  const repo=new CareerDatabase(factory,'upgrade3');await repo.initialize();
  const out=await repo.readSnapshot();
  assert.equal(out.generation,4);assert.equal(out.revision,31);assert.deepEqual(out.preferences,{theme:'dark'});
  assert.equal(await repo.getMeta('schemaVersion'),4);assert.equal(await repo.getMeta('lastExportAt'),timestamp);
  assert.deepEqual(sorted(out.collections),sorted(c));
  const physical=await request(factory.open('upgrade3',4));
  assert.ok(physical.objectStoreNames.contains('careerDocuments'));assert.ok(physical.objectStoreNames.contains('documentSources'));
  assert.ok(physical.transaction('documentSources').objectStore('documentSources').indexNames.contains('byDocument'));
  assert.ok(physical.transaction('careerDocuments').objectStore('careerDocuments').indexNames.contains('byType'));
  physical.close();await repo.close();
});
test('STU-10 format-3 backups import without documents; format-4 backups round-trip documents exactly',async()=>{
  const c=studioCollections();stored(buildReview(c,reviewInput(),NOW,7),c);
  const current=generateBackup(c,{theme:'light'},timestamp);
  assert.equal(current.manifest.formatVersion,4);assert.equal(current.manifest.counts.careerDocuments,1);
  const old=structuredClone(current);old.manifest.formatVersion=3;old.manifest.schemaVersion=3;
  delete old.collections.careerDocuments;delete old.collections.documentSources;delete old.manifest.counts.careerDocuments;delete old.manifest.counts.documentSources;
  const converted=validateBackup(old);
  assert.equal(converted.manifest.formatVersion,4);assert.equal(converted.collections.careerDocuments.length,0);
  assert.deepEqual(sorted({...converted.collections}).achievements,sorted(c).achievements);
  for(const mutate of [b=>{b.collections.careerDocuments=[];},b=>{b.manifest.counts.roles=99;},b=>{b.collections.extra=[];}]){
    const bad=structuredClone(old);mutate(bad);assert.throws(()=>validateBackup(bad),ValidationError);
  }
  const factory=new IDBFactory(),repo=new CareerDatabase(factory,'roundtrip');
  await repo.initialize();await repo.replaceAllData(c,{theme:'system'},1);
  const file=await createBackup(repo),parsed=JSON.parse(file.json);
  assert.equal(parsed.manifest.formatVersion,4);assert.equal(parsed.manifest.schemaVersion,4);
  assert.deepEqual(parsed.collections.careerDocuments,c.careerDocuments);
  const report=await inspectLocalData(repo);assert.equal(report.counts.documentSources,c.documentSources.length);
  const prepared=await parseBackupJson(JSON.stringify(old),repo);
  assert.equal(prepared.sourceFormat,3);
  await restoreBackup(prepared,repo);
  assert.equal((await repo.readSnapshot()).collections.careerDocuments.length,0,'older backup replaces documents only after confirmation');
  await restoreBackup(await parseBackupJson(file.json,repo),repo);
  assert.deepEqual(sorted((await repo.readSnapshot()).collections),sorted(c));
  await repo.close();
});
test('STU-11 PDF writer: valid structure, exact offsets, WinAnsi text and honest character reports',()=>{
  assert.deepEqual(encodeWinAnsi('Café – “ok” €5').bytes,[67,97,102,233,32,150,32,147,111,107,148,32,128,53]);
  assert.deepEqual(encodeWinAnsi('a → b').bytes,[97,32,45,62,32,98]);
  assert.equal(encodeWinAnsi('Kő').simplified,1);assert.deepEqual(encodeWinAnsi('Kő').bytes,[75,111]);
  assert.equal(encodeWinAnsi('数据').unsupported,2);
  assert.equal(textWidth('Hello','regular',10),22.78);
  const lines=wrapText('A long line of words that will need to wrap across several lines '+'x'.repeat(120),'regular',10,120);
  assert.ok(lines.length>3);assert.ok(lines.every(l=>textWidth(l,'regular',10)<=120.0001));
  const bytes=buildPdf([{texts:[{x:56,y:700,size:12,font:'bold',text:'Résumé (draft) \\ test',color:[0,0,0]}],rules:[]},{texts:[],rules:[{x1:0,y1:0,x2:10,y2:10,width:1,color:[0,0,0]}]}],{title:'CV — Ünïcode ✓',createdAt:new Date(NOW)});
  const raw=Buffer.from(bytes).toString('latin1');
  assert.ok(raw.startsWith('%PDF-1.4\n'));assert.ok(raw.endsWith('%%EOF\n'));
  const xref=Number(/startxref\n(\d+)/.exec(raw)[1]);assert.ok(raw.slice(xref).startsWith('xref\n0 '));
  const entries=[...raw.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map(m=>Number(m[1]));
  entries.forEach((offset,i)=>assert.ok(raw.slice(offset).startsWith(`${i+1} 0 obj\n`),'object '+(i+1)));
  assert.match(raw,/\/Count 2/);assert.match(raw,/\/BaseFont \/Helvetica-Bold \/Encoding \/WinAnsiEncoding/);
  for(const m of raw.matchAll(/\/Length (\d+) >>\nstream\n/g)){const start=m.index+m[0].length;assert.equal(raw.slice(start+Number(m[1]),start+Number(m[1])+10),'\nendstream')}
  assert.equal(pdfText(bytes),'Résumé (draft) \\ test');
});
test('STU-12 document PDFs contain the visible text only, paginate long documents and name files safely',()=>{
  const c=studioCollections(),{document:doc}=stored(buildReview(c,reviewInput(),NOW,7));
  const pdf=documentPdf(doc,{name:'Synthetic Engineer',subtitle:'Synthetic Engineer · Synthetic Company'},new Date(NOW));
  const text=pdfText(pdf.bytes);
  for(const expected of ['Synthetic Engineer','Performance Review','May – October 2026','SUMMARY','KEY ACHIEVEMENTS','Cut changeover time','Result: Changeover down from 42 to 31 minutes.','SKILLS SHOWN','NEXT PERIOD','Page 1 of 1'])
    assert.ok(text.includes(expected),expected);
  assert.match(text,/Prepared from my own CareerProof record, \d+ Oct 2026\. Self-reported\./);
  assert.equal(pdf.unsupported,0);
  const hidden=documentPdf(showSection(doc,'skills',false),{name:'S',subtitle:''},new Date(NOW));
  assert.ok(!pdfText(hidden.bytes).includes('SKILLS SHOWN'));
  let long=doc;for(let i=0;i<60;i++)long=addBlock(long,'achievements',{heading:'Extra item '+i,meta:'2026',date:'',text:'Result: a long synthetic sentence that keeps going to fill the page with wrapped lines of text.\n- a bullet line'});
  const many=documentPdf(long,{name:'S',subtitle:''},new Date(NOW));
  assert.ok(many.pages>2);const all=pdfText(many.bytes);
  assert.ok(all.includes(`Page 2 of ${many.pages}`));assert.ok(all.includes('Extra item 59'));
  const {document:cv}=stored(buildCv(c,cvInput(c),NOW,3));
  const cvPdf=documentPdf(cv,{name:'',subtitle:''},new Date(NOW)),cvText=pdfText(cvPdf.bytes);
  for(const expected of ['EXPERIENCE','Synthetic Engineer — Synthetic Company','2022 – Present','•','CREDENTIALS'])assert.ok(cvText.includes(expected),expected);
  assert.ok(!cvText.includes('Page 1'),'one-page CVs carry no page number');
  const unsupported=documentPdf(editBlock(cv,cv.contentBlocks[1].id,{heading:'',meta:'',date:'',text:'Fluent in 日本語 → and Kő'}),{name:'',subtitle:''},new Date(NOW));
  assert.equal(unsupported.unsupported,3);assert.equal(unsupported.simplified,2);
  assert.equal(pdfFileName({title:'CV — Ünïcode / Lead: 2026'},TODAY),'CareerProof_CV_Unicode_Lead_2026_2026-10-20.pdf');
  assert.equal(pdfFileName({title:'///'},TODAY),'CareerProof_Document_2026-10-20.pdf');
});
