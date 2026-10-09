import {emptyProfile,emptyCollections} from '../dist/app/domain/models.js';
import {migrateLegacyAchievement,migrateLegacyProfile} from '../dist/app/domain/validation.js';
import {builtInTaxonomy,normalizeName} from '../dist/app/domain/taxonomy.js';
export const timestamp='2025-04-03T12:34:56.000Z';
export const base=id=>({id,createdAt:timestamp,updatedAt:timestamp,revision:3});
export const legacyProfile=()=>({...base('local-profile'),displayName:'Synthetic Engineer',headline:'Example professional',summary:'Synthetic test only',email:'example@example.test',location:'Example City'});
export const legacyAchievement=(id='achievement-1',status='recorded')=>({...base(id),title:'Resolved synthetic issue',contribution:status==='draft'?'':'Coordinated a synthetic recovery',occurredOn:status==='draft'?'':'2024-02-29',status,preArchiveStatus:status==='archived'?'recorded':null,outcome:'Synthetic outcome',impactCategory:'delivery'});
export const legacyBackup=()=>({manifest:{format:'careerproof-backup',formatVersion:1,schemaVersion:1,appVersion:'0.1.0',exportedAt:timestamp,counts:{profiles:1,achievements:3}},collections:{profiles:[legacyProfile()],achievements:[legacyAchievement(),legacyAchievement('draft-1','draft'),legacyAchievement('archived-1','archived')]}});
export function collections(){
  const c=emptyCollections();c.profiles=[emptyProfile()];Object.assign(c,builtInTaxonomy());return c;
}
export function fullCollections(){
  const c=collections();c.profiles=[{...migrateLegacyProfile(legacyProfile()),primaryRoleId:'role-1',professionalLinks:['https://example.test/profile']}];
  c.employers=[{...base('employer-1'),name:'Synthetic Company',industry:'Synthetic Industry',location:'Example',website:'https://example.test',description:'Fixture only'}];
  c.roles=[{...base('role-1'),employerId:'employer-1',title:'Synthetic Engineer',startDate:{value:'2022',precision:'year'},endDate:null,isCurrent:true,employmentType:'Full time',responsibilities:'Synthetic work',leadershipScope:'',technologies:['Example']}];
  c.education=[{...base('education-1'),institution:'Synthetic School',qualification:'Example Degree',discipline:'Engineering',startDate:{value:'2018-09',precision:'month'},completionDate:{value:'2021',precision:'year'},description:'',honors:''}];
  c.credentials=[{...base('credential-1'),name:'Synthetic Certificate',issuer:'Example Body',issuedDate:{value:'2023',precision:'year'},expirationDate:null,credentialId:'example',verificationUrl:'https://example.test/credential',notes:''}];
  c.projects=[{...base('project-1'),name:'Synthetic Initiative',experienceType:'initiative',employerId:'employer-1',startDate:{value:'2024',precision:'year'},endDate:{value:'2024-06',precision:'month'},status:'completed',objective:'Example',scope:'Example',personalResponsibility:'Example',technologies:[],outcome:'Example',confidentiality:'confidential'}];
  c.achievements=[{...migrateLegacyAchievement(legacyAchievement()),roleId:'role-1',situation:'Synthetic situation',actions:'Synthetic actions',notes:'Keep these fields through UI edits'}];
  c.impactMetrics=[{...base('metric-1'),achievementId:'achievement-1',metricName:'Synthetic reduction',unit:'hours',baselineValue:12,resultValue:6,reportedValue:null,direction:'decrease',sourceNote:'Synthetic only'}];
  c.evidenceReferences=[{...base('evidence-1'),achievementId:'achievement-1',referenceType:'document-reference',label:'Example memo',referenceValue:'SYNTHETIC-001',userReviewedAt:null,notes:''}];
  c.competencyCategories.push({...base('custom-category'),name:'Synthetic Custom Category',isBuiltIn:false,sortOrder:4,description:''});
  c.competencies.push({...base('custom-competency'),categoryId:'custom-category',name:'Synthetic Skill',normalizedName:normalizeName('Synthetic Skill'),isBuiltIn:false,status:'active',taxonomyKey:null,aliases:['Example skill'],description:'Fixture',rubricId:null});
  c.recordLinks=[
    {...base('link-1'),linkType:'role-project',sourceId:'role-1',targetId:'project-1',isPrimary:false,note:''},
    {...base('link-2'),linkType:'achievement-project',sourceId:'achievement-1',targetId:'project-1',isPrimary:true,note:''},
    {...base('link-3'),linkType:'achievement-competency',sourceId:'achievement-1',targetId:'custom-competency',isPrimary:false,note:'Synthetic example'}
  ];
  return c;
}
export function request(r){return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export function completed(tx){return new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error??new Error('aborted'));});}
export async function seedV1(factory,name,backup=legacyBackup()){
  const r=factory.open(name,1);
  r.onupgradeneeded=()=>{
    const db=r.result;db.createObjectStore('profiles',{keyPath:'id'});db.createObjectStore('meta',{keyPath:'key'});
    const a=db.createObjectStore('achievements',{keyPath:'id'});a.createIndex('byStatus','status');a.createIndex('byOccurredOn','occurredOn');a.createIndex('byUpdatedAt','updatedAt');
  };
  const db=await request(r),tx=db.transaction(['profiles','achievements','meta'],'readwrite'),done=completed(tx);
  backup.collections.profiles.forEach(p=>tx.objectStore('profiles').put(p));backup.collections.achievements.forEach(a=>tx.objectStore('achievements').put(a));
  tx.objectStore('meta').put({key:'lastExportAt',value:timestamp});
  await done;return db;
}
