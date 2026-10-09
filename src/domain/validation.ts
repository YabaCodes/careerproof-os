import { type Achievement, type CareerBackup, type Profile, APP_VERSION, SCHEMA_VERSION, BACKUP_FORMAT_VERSION, IMPACT_CATEGORIES, PROFILE_ID } from './models.js';
export class ValidationError extends Error { override name = 'ValidationError'; }
export class ConflictError extends Error { override name = 'ConflictError'; }
export const str = (value: unknown): value is string => typeof value === 'string';
const obj = (value: unknown): value is Record<string,unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const validTime = (value: unknown) => str(value) && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
export function isValidLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined || y < 1900 || y > 2200) return false;
  const t = new Date(Date.UTC(y,m-1,d));
  return t.getUTCFullYear()===y && t.getUTCMonth()===m-1 && t.getUTCDate()===d;
}
export function validateAchievementInput(input:{title:string;contribution:string;occurredOn:string;status:'draft'|'recorded';outcome:string;impactCategory:string}): string[] {
  const errors:string[] = [];
  if (!input.title.trim()) errors.push('Add a title for this achievement.');
  if (input.title.trim().length > 160) errors.push('The title must be 160 characters or fewer.');
  if (input.contribution.length > 6000) errors.push('The contribution must be 6,000 characters or fewer.');
  if (input.outcome.length > 6000) errors.push('The outcome must be 6,000 characters or fewer.');
  if (input.status === 'recorded' && !input.contribution.trim()) errors.push('Describe your contribution or save this as a draft.');
  if (input.status === 'recorded' && !isValidLocalDate(input.occurredOn)) errors.push('Choose a valid occurrence date.');
  if (input.status === 'draft' && input.occurredOn && !isValidLocalDate(input.occurredOn)) errors.push('Choose a valid occurrence date.');
  if (!Object.prototype.hasOwnProperty.call(IMPACT_CATEGORIES,input.impactCategory)) errors.push('Choose a valid impact category.');
  return errors;
}
export function validateProfileInput(input:{displayName:string;headline:string;summary:string;email:string;location:string}):string[] {
  const errors:string[]=[];
  if(input.displayName.length>120) errors.push('Name must be 120 characters or fewer.');
  if(input.headline.length>200) errors.push('Headline must be 200 characters or fewer.');
  if(input.summary.length>10000) errors.push('Summary must be 10,000 characters or fewer.');
  if(input.location.length>150) errors.push('Location must be 150 characters or fewer.');
  if(input.email.length>254 || (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))) errors.push('Enter a valid email address or leave it blank.');
  return errors;
}
function baseRecordValid(v:Record<string,unknown>):boolean {return str(v.id)&&v.id.length>0&&validTime(v.createdAt)&&validTime(v.updatedAt)&&Number.isSafeInteger(v.revision)&&(v.revision as number)>0;}
export function isProfile(value:unknown):value is Profile {
  if(!obj(value)||!baseRecordValid(value)||value.id!==PROFILE_ID) return false;
  return ['displayName','headline','summary','email','location'].every(key=>str(value[key])) && validateProfileInput(value as unknown as Profile).length===0;
}
export function isAchievement(value:unknown):value is Achievement {
  if(!obj(value)||!baseRecordValid(value)|| !str(value.title)||!str(value.contribution)||!str(value.occurredOn)||!str(value.outcome)||!str(value.impactCategory))return false;
  if(!['draft','recorded','archived'].includes(String(value.status)))return false;
  if(value.preArchiveStatus !== null && !['draft','recorded'].includes(String(value.preArchiveStatus)))return false;
  if(value.status==='archived' && value.preArchiveStatus===null) return false;
  const checkStatus=value.status==='archived' ? value.preArchiveStatus as 'draft'|'recorded' : value.status as 'draft'|'recorded';
  return validateAchievementInput({title:value.title,contribution:value.contribution,occurredOn:value.occurredOn,status:checkStatus,outcome:value.outcome,impactCategory:value.impactCategory}).length===0;
}
export function validateBackup(raw:unknown):CareerBackup {
  if(!obj(raw)||!obj(raw.manifest)||!obj(raw.collections)) throw new ValidationError('This is not a CareerProof backup.');
  const m=raw.manifest,c=raw.collections;
  if(m.format!=='careerproof-backup'||m.formatVersion!==BACKUP_FORMAT_VERSION||m.schemaVersion!==SCHEMA_VERSION|| !validTime(m.exportedAt))throw new ValidationError('The backup format or schema is unsupported.');
  if(!str(m.appVersion)||!Array.isArray(c.profiles)||!Array.isArray(c.achievements)||!obj(m.counts))throw new ValidationError('The backup manifest or collections are incomplete.');
  if(c.profiles.length!==1||!isProfile(c.profiles[0]))throw new ValidationError('The backup must contain exactly one valid profile.');
  if(c.achievements.length>100000||!c.achievements.every(isAchievement))throw new ValidationError('The backup contains invalid achievement records.');
  if(m.counts.profiles!==c.profiles.length||m.counts.achievements!==c.achievements.length)throw new ValidationError('The backup record counts do not match.');
  const ids=new Set<string>();
  for(const item of c.achievements as Achievement[]){if(ids.has(item.id)||item.id===PROFILE_ID)throw new ValidationError('Duplicate or reserved achievement ID detected.');ids.add(item.id);}
  return raw as unknown as CareerBackup;
}
export function generateBackup(profiles:Profile[], achievements:Achievement[], date:string=new Date().toISOString()):CareerBackup {
  return {manifest:{format:'careerproof-backup',formatVersion:BACKUP_FORMAT_VERSION,schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION,exportedAt:date,counts:{profiles:profiles.length,achievements:achievements.length}},collections:{profiles,achievements}};
}
export function summarizeAchievements(items:Achievement[]) {
  return {total: items.filter(a=>a.status!=='archived').length, recorded:items.filter(a=>a.status==='recorded').length,drafts:items.filter(a=>a.status==='draft').length,archived:items.filter(a=>a.status==='archived').length};
}
