import { type Achievement, type AchievementView, type CareerBackup, type CareerCollections, type Profile, type P0RecordMap, type P0Store, type Preferences, type PrecisionDate, APP_VERSION, SCHEMA_VERSION, BACKUP_FORMAT_VERSION, TAXONOMY_VERSION, MAX_COLLECTION_RECORDS, IMPACT_CATEGORIES, PROFILE_ID, P0_STORES, emptyCollections } from './models.js';
import { isValidLocalDate, isPrecisionDate, datesInOrder, precisionDateFromInput } from './dates.js';
import { builtInTaxonomy, normalizeName } from './taxonomy.js';
export { isValidLocalDate } from './dates.js';
export class ValidationError extends Error { override name = 'ValidationError'; }
export class ConflictError extends Error { override name = 'ConflictError'; }
export const str = (value: unknown): value is string => typeof value === 'string';
export const obj = (value: unknown): value is Record<string,unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
type Check = (value: unknown) => boolean;
const text = (max: number, required=false): Check => v => str(v) && v.length<=max && (!required || v.trim().length>0);
const enumeration = (...values: string[]): Check => v => str(v) && values.includes(v);
const nullable = (check: Check): Check => v => v===null || check(v);
const strings: Check = v => Array.isArray(v) && v.length<=100 && v.every(text(200,true));
const id = text(200,true);
const bool: Check = v => typeof v==='boolean';
const integer: Check = v => Number.isSafeInteger(v) && (v as number)>=0;
const finite: Check = v => typeof v==='number' && Number.isFinite(v);
export const validTime: Check = v => str(v) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString()===v;
const url: Check = v => {
  if (!str(v) || v.length>2000) return false;
  if (!v) return true;
  try { const u = new URL(v); return ['https:','http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
};
const date = nullable(isPrecisionDate);
const privacy = enumeration('standard-private','confidential');
const base: Record<string,Check> = {id,createdAt:validTime,updatedAt:validTime,revision:v=>Number.isSafeInteger(v)&&(v as number)>0};
const profileFields: Record<string,Check> = {displayName:text(120),headline:text(200),summary:text(10000),email:v=>str(v)&&v.length<=254&&(!v.trim()||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())),location:text(150)};
const legacyAchievementFields: Record<string,Check> = {title:text(160,true),contribution:text(6000),occurredOn:v=>str(v)&&(!v||isValidLocalDate(v)),status:enumeration('draft','recorded','archived'),preArchiveStatus:nullable(enumeration('draft','recorded')),outcome:text(6000),impactCategory:enumeration(...Object.keys(IMPACT_CATEGORIES))};
const fields: {[K in P0Store]: Record<string,Check>} = {
  profiles: {...profileFields,primaryDomain:text(200),primaryRoleId:nullable(id),careerInterests:strings,locale:text(80),phone:text(80),website:url,professionalLinks:v=>Array.isArray(v)&&v.length<=100&&v.every(x=>str(x)&&x.length>0&&url(x))},
  employers: {name:text(160,true),industry:text(200),location:text(150),website:url,description:text(10000)},
  roles: {employerId:id,title:text(200,true),startDate:isPrecisionDate,endDate:date,isCurrent:bool,employmentType:text(100),responsibilities:text(10000),leadershipScope:text(6000),technologies:strings},
  education: {institution:text(200,true),qualification:text(200,true),discipline:text(200),startDate:date,completionDate:date,description:text(10000),honors:text(2000)},
  credentials: {name:text(200,true),issuer:text(200,true),issuedDate:date,expirationDate:date,credentialId:text(200),verificationUrl:url,notes:text(6000)},
  projects: {name:text(160,true),experienceType:enumeration('project','initiative','ongoing-responsibility'),employerId:nullable(id),startDate:date,endDate:date,status:enumeration('planned','active','on-hold','completed'),objective:text(6000),scope:text(6000),personalResponsibility:text(6000),technologies:strings,outcome:text(6000),confidentiality:privacy},
  achievements: {title:text(160,true),contribution:text(6000),occurredStart:date,occurredEnd:date,status:enumeration('draft','recorded','archived'),preArchiveStatus:nullable(enumeration('draft','recorded')),outcome:text(6000),impactCategory:enumeration(...Object.keys(IMPACT_CATEGORIES)),roleId:nullable(id),situation:text(6000),actions:text(6000),confidentiality:privacy,notes:text(6000)},
  impactMetrics: {achievementId:id,metricName:text(200,true),unit:text(80),baselineValue:nullable(finite),resultValue:nullable(finite),reportedValue:nullable(finite),direction:nullable(enumeration('increase','decrease','neutral')),sourceNote:text(6000)},
  competencyCategories: {name:text(160,true),isBuiltIn:bool,sortOrder:integer,description:text(6000)},
  competencies: {categoryId:id,name:text(160,true),normalizedName:text(200,true),isBuiltIn:bool,status:enumeration('active','archived'),taxonomyKey:nullable(id),aliases:strings,description:text(6000),rubricId:nullable(id)},
  evidenceReferences: {achievementId:id,referenceType:enumeration('description','url','document-reference'),label:text(200,true),referenceValue:text(6000,true),userReviewedAt:nullable(validTime),notes:text(6000)},
  recordLinks: {linkType:enumeration('role-project','achievement-project','achievement-competency'),sourceId:id,targetId:id,isPrimary:bool,note:text(6000)}
};
function shape(value: unknown, rules: Record<string,Check>): value is Record<string,unknown> {
  return obj(value) && Object.keys(value).length===Object.keys(rules).length && Object.entries(rules).every(([key,check])=>Object.hasOwn(value,key)&&check(value[key]));
}
function achievementState(v: Record<string,unknown>, occurred: unknown): boolean {
  if (v.status==='archived' ? v.preArchiveStatus===null : v.preArchiveStatus!==null) return false;
  const status = v.status==='archived'?v.preArchiveStatus:v.status;
  return status!=='recorded' || (str(v.contribution)&&!!v.contribution.trim()&&occurred!==null&&occurred!=='');
}
// Shape checks establish these types before any range comparison.
const ordered=(start:unknown,end:unknown)=>datesInOrder(start as PrecisionDate|null,end as PrecisionDate|null);
export function isRecord<K extends P0Store>(store: K, value: unknown): value is P0RecordMap[K] {
  if (!shape(value,{...base,...fields[store]})) return false;
  const v = value;
  if (v.updatedAt as string < (v.createdAt as string)) return false;
  switch (store) {
    case 'profiles': return v.id===PROFILE_ID;
    case 'roles': return (!v.isCurrent || v.endDate===null) && ordered(v.startDate,v.endDate);
    case 'education': return ordered(v.startDate,v.completionDate);
    case 'credentials': return ordered(v.issuedDate,v.expirationDate);
    case 'projects': return ordered(v.startDate,v.endDate);
    case 'achievements': return achievementState(v,v.occurredStart) && (!v.occurredEnd||!!v.occurredStart) && ordered(v.occurredStart,v.occurredEnd);
    case 'impactMetrics': return [v.baselineValue,v.resultValue,v.reportedValue].some(x=>x!==null);
    case 'competencies': return v.normalizedName===normalizeName(v.name as string);
    case 'evidenceReferences': return v.referenceType!=='url'||(!!v.referenceValue&&url(v.referenceValue));
    case 'recordLinks': return !v.isPrimary || v.linkType==='achievement-project';
    default: return true;
  }
}
export const isProfile = (v: unknown): v is Profile => isRecord('profiles',v);
export const isAchievement = (v: unknown): v is Achievement => isRecord('achievements',v);
export function migrateLegacyProfile(value: unknown): Profile {
  if (!shape(value,{...base,...profileFields}) || value.id!==PROFILE_ID) throw new ValidationError('Invalid legacy profile record.');
  const result = {...value,primaryDomain:'',primaryRoleId:null,careerInterests:[],locale:'',phone:'',website:'',professionalLinks:[]} as unknown as Profile;
  if (!isProfile(result)) throw new ValidationError('Invalid legacy profile record.');
  return result;
}
export function migrateLegacyAchievement(value: unknown): Achievement {
  if (!shape(value,{...base,...legacyAchievementFields}) || !achievementState(value,value.occurredOn)) throw new ValidationError('Invalid legacy achievement record.');
  const {occurredOn,...record} = value;
  const result = {...record,occurredStart:precisionDateFromInput(occurredOn as string),occurredEnd:null,roleId:null,situation:'',actions:'',confidentiality:'confidential',notes:''} as unknown as Achievement;
  if (!isAchievement(result)) throw new ValidationError('Invalid legacy achievement record.');
  return result;
}
export function achievementView(record: Achievement): AchievementView { return {...record,occurredOn:record.occurredStart?.value??''}; }
export function validateAchievementInput(input:{title:string;contribution:string;occurredOn:string;status:'draft'|'recorded';outcome:string;impactCategory:string}): string[] {
  const errors:string[] = [];
  if (!text(160,true)(input.title)) errors.push('Add a title of 160 characters or fewer.');
  if (!text(6000)(input.contribution)) errors.push('The contribution must be 6,000 characters or fewer.');
  if (!text(6000)(input.outcome)) errors.push('The outcome must be 6,000 characters or fewer.');
  if (!enumeration('draft','recorded')(input.status)) errors.push('Choose a valid status.');
  if (input.status==='recorded' && !input.contribution.trim()) errors.push('Describe your contribution or save this as a draft.');
  try { if (!precisionDateFromInput(input.occurredOn) && input.status==='recorded') errors.push('Choose a valid occurrence date.'); } catch { errors.push('Choose a valid occurrence date.'); }
  if (!enumeration(...Object.keys(IMPACT_CATEGORIES))(input.impactCategory)) errors.push('Choose a valid impact category.');
  return errors;
}
export function validateProfileInput(input:Pick<Profile,'displayName'|'headline'|'summary'|'email'|'location'>):string[] {
  return Object.entries(profileFields).flatMap(([key,check])=>check(input[key as keyof typeof input])?[]:[key==='email'?'Enter a valid email address or leave it blank.':`Check ${key}: it exceeds the supported length or has an incorrect type.`]);
}
export function validateCollections(raw: unknown): CareerCollections {
  if (!obj(raw) || Object.keys(raw).length!==P0_STORES.length) throw new ValidationError('The backup collections are incomplete or unsupported.');
  const allIds = new Set<string>();
  for (const store of P0_STORES) {
    const records = raw[store];
    if (!Array.isArray(records) || records.length>MAX_COLLECTION_RECORDS) throw new ValidationError(`Invalid or oversized ${store} collection.`);
    for (const record of records) {
      if (!isRecord(store,record)) throw new ValidationError(`Invalid ${store} record.`);
      if (allIds.has(record.id)) throw new ValidationError('Duplicate record identifier.');
      allIds.add(record.id);
    }
  }
  const c = raw as unknown as CareerCollections;
  if (c.profiles.length!==1) throw new ValidationError('Exactly one local profile is required.');
  const ids = Object.fromEntries(P0_STORES.map(s=>[s,new Set(c[s].map(r=>r.id))])) as {[K in P0Store]:Set<string>};
  const ref = (store: P0Store, id: string|null) => { if (id!==null&&!ids[store].has(id)) throw new ValidationError(`Broken reference to ${store}.`); };
  ref('roles',c.profiles[0]!.primaryRoleId);
  c.roles.forEach(r=>ref('employers',r.employerId));
  c.projects.forEach(r=>ref('employers',r.employerId));
  c.achievements.forEach(r=>ref('roles',r.roleId));
  c.impactMetrics.forEach(r=>ref('achievements',r.achievementId));
  c.evidenceReferences.forEach(r=>ref('achievements',r.achievementId));
  const names = new Set<string>();
  c.competencyCategories.forEach(r=>{
    const key=normalizeName(r.name); if(names.has(key))throw new ValidationError('Duplicate competency category name.');names.add(key);
  });
  names.clear();
  c.competencies.forEach(r=>{
    ref('competencyCategories',r.categoryId);
    const key=JSON.stringify([r.categoryId,r.normalizedName]);if(names.has(key))throw new ValidationError('Duplicate competency name in category.');names.add(key);
  });
  const taxonomy = builtInTaxonomy();
  for (const store of ['competencyCategories','competencies'] as const) {
    const expected = new Map(taxonomy[store].map(r=>[r.id,r]));
    for (const r of c[store]) {
      const builtIn = expected.get(r.id);
      if (r.isBuiltIn!==!!builtIn || (r.id.startsWith('CP-')&&!builtIn)) throw new ValidationError('Invalid reserved taxonomy identifier.');
      if (builtIn && (r.name!==builtIn.name || ('categoryId' in r && 'categoryId' in builtIn && (r.categoryId!==builtIn.categoryId || r.taxonomyKey!==r.id)))) throw new ValidationError('Built-in taxonomy identity changed.');
    }
    if (taxonomy[store].some(r=>!ids[store].has(r.id))) throw new ValidationError('The built-in taxonomy is incomplete.');
  }
  const links = new Set<string>(), primary = new Set<string>();
  const roles = new Map(c.roles.map(r=>[r.id,r])), projects = new Map(c.projects.map(r=>[r.id,r]));
  c.recordLinks.forEach(r=>{
    ref(r.linkType==='role-project'?'roles':'achievements',r.sourceId);
    ref(r.linkType==='achievement-competency'?'competencies':'projects',r.targetId);
    const key=JSON.stringify([r.linkType,r.sourceId,r.targetId]);
    if(links.has(key))throw new ValidationError('Duplicate typed relationship.');links.add(key);
    if(r.isPrimary){if(primary.has(r.sourceId))throw new ValidationError('An achievement has multiple primary projects.');primary.add(r.sourceId);}
    if(r.linkType==='role-project'){
      const employer=projects.get(r.targetId)!.employerId;
      if(employer!==null&&employer!==roles.get(r.sourceId)!.employerId)throw new ValidationError('Role and project employer contexts conflict.');
    }
  });
  return c;
}
export function isPreferences(value: unknown): value is Preferences { return shape(value,{theme:enumeration('system','light','dark')}); }
export function generateBackup(collections: CareerCollections, preferences: Preferences={theme:'system'}, date:string=new Date().toISOString()):CareerBackup {
  const backup: CareerBackup = {manifest:{format:'careerproof-backup',formatVersion:BACKUP_FORMAT_VERSION,schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION,exportedAt:date,taxonomyVersion:TAXONOMY_VERSION,counts:Object.fromEntries(P0_STORES.map(s=>[s,collections[s].length])) as CareerBackup['manifest']['counts']},collections,preferences};
  return validateBackup(backup);
}
export function validateBackup(raw: unknown): CareerBackup {
  if (!obj(raw)||!obj(raw.manifest)||!obj(raw.collections)) throw new ValidationError('This is not a CareerProof backup.');
  const m=raw.manifest,c=raw.collections;
  if(m.format!=='careerproof-backup'||!validTime(m.exportedAt)||!text(80,true)(m.appVersion)||!obj(m.counts))throw new ValidationError('Invalid backup manifest.');
  if(m.formatVersion===1 && m.schemaVersion===1){
    if(Object.keys(raw).length!==2||Object.keys(m).length!==6||Object.keys(c).length!==2||!Array.isArray(c.profiles)||c.profiles.length!==1||!Array.isArray(c.achievements)||c.achievements.length>MAX_COLLECTION_RECORDS||Object.keys(m.counts).length!==2||m.counts.profiles!==c.profiles.length||m.counts.achievements!==c.achievements.length)throw new ValidationError('Invalid legacy backup collections or counts.');
    const result=emptyCollections();
    result.profiles=c.profiles.map(migrateLegacyProfile);result.achievements=c.achievements.map(migrateLegacyAchievement);
    Object.assign(result,builtInTaxonomy());
    return generateBackup(result,{theme:'system'},m.exportedAt as string);
  }
  if(m.formatVersion!==2||m.schemaVersion!==2)throw new ValidationError('The backup format or schema is unsupported.');
  if(Object.keys(raw).length!==3||Object.keys(m).length!==7||m.taxonomyVersion!==TAXONOMY_VERSION||!isPreferences(raw.preferences))throw new ValidationError('Unsupported taxonomy or invalid backup preferences.');
  validateCollections(c);
  const counts=m.counts;
  if(Object.keys(counts).length!==P0_STORES.length||P0_STORES.some(s=>counts[s]!== (c[s] as unknown[]).length))throw new ValidationError('The backup record counts do not match.');
  return raw as unknown as CareerBackup;
}
export function summarizeAchievements(items:Achievement[]) {
  return {total:items.filter(a=>a.status!=='archived').length,recorded:items.filter(a=>a.status==='recorded').length,drafts:items.filter(a=>a.status==='draft').length,archived:items.filter(a=>a.status==='archived').length};
}
