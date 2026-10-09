import { generateBackup, validateBackup, ValidationError } from '../domain/validation.js';
import {readAllData,replaceAllData,setMeta} from './db.js';
import type {CareerBackup} from '../domain/models.js';
export async function createBackup():Promise<{name:string;json:string;count:number;exportedAt:string}> {
  const data=await readAllData(); const backup=generateBackup(data.profiles,data.achievements);
  const date=backup.manifest.exportedAt.slice(0,10);
  return {name:`CareerProof_Backup_${date}.json`,json:JSON.stringify(backup,null,2),count:data.achievements.length,exportedAt:backup.manifest.exportedAt};
}
export function downloadBackup(name:string,json:string):void {
  const blob=new Blob([json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
export async function parseBackupFile(file:File):Promise<CareerBackup>{
  if(file.size>12*1024*1024)throw new ValidationError('Backup exceeds the 12 MB import limit.');
  let raw:unknown;
  try {raw=JSON.parse(await file.text());} catch {throw new ValidationError('The file is not valid JSON.');}
  return validateBackup(raw);
}
export async function restoreBackup(backup:CareerBackup):Promise<void> {
  const checked=validateBackup(backup);await replaceAllData(checked.collections.profiles,checked.collections.achievements);
  try {await setMeta('lastExportAt',null);} catch { /* Restored records remain authoritative. */ }
}
