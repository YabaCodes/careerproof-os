import { generateBackup, validateBackup, ValidationError, obj } from '../domain/validation.js';
import { database, type CareerDatabase } from './db.js';
import { type CareerBackup, MAX_BACKUP_BYTES } from '../domain/models.js';
export interface PreparedBackup { backup: CareerBackup; legacy: boolean; expectedGeneration: number }
export function checkBackupSize(json:string):void {
  if(new TextEncoder().encode(json).byteLength>MAX_BACKUP_BYTES)throw new ValidationError('Backup exceeds the supported 12 MiB limit. No export or restore was performed.');
}
export async function createBackup(repo:CareerDatabase=database):Promise<{name:string;json:string;count:number;exportedAt:string}> {
  const data=await repo.readSnapshot();
  const backup=generateBackup(data.collections,data.preferences),json=JSON.stringify(backup,null,2);
  checkBackupSize(json);
  return {name:`CareerProof_Backup_${backup.manifest.exportedAt.slice(0,10)}.json`,json,count:data.collections.achievements.length,exportedAt:backup.manifest.exportedAt};
}
export function downloadBackup(name:string,json:string):void {
  checkBackupSize(json);
  const blob=new Blob([json],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
export async function parseBackupJson(json:string,repo:CareerDatabase=database):Promise<PreparedBackup>{
  checkBackupSize(json);
  let raw:unknown;
  try{raw=JSON.parse(json);}catch{throw new ValidationError('The file is not valid JSON.');}
  const backup=validateBackup(raw);
  const legacy=obj(raw)&&obj(raw.manifest)&&raw.manifest.formatVersion===1;
  return {backup,legacy,expectedGeneration:await repo.getGeneration()};
}
export async function parseBackupFile(file:File):Promise<PreparedBackup>{
  if(file.size>MAX_BACKUP_BYTES)throw new ValidationError('Backup exceeds the supported 12 MiB import limit.');
  return parseBackupJson(await file.text());
}
export async function restoreBackup(prepared:PreparedBackup,repo:CareerDatabase=database):Promise<void>{
  // Revalidate at confirmation; no destructive transaction opens on invalid input.
  const checked=validateBackup(prepared.backup);
  // File size was checked at selection, before parsing. Re-encoding here could
  // incorrectly reject a valid compact or legacy source file after expansion.
  await repo.replaceAllData(checked.collections,checked.preferences,prepared.expectedGeneration);
}
