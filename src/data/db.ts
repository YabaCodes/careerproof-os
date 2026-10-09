import { type Achievement, type Profile, type Meta, emptyProfile, PROFILE_ID, SCHEMA_VERSION } from '../domain/models.js';
import { ConflictError } from '../domain/validation.js';
const DATABASE_NAME='careerproof-local';
let connectionPromise:Promise<IDBDatabase>|null=null;
const req=<T>(r: IDBRequest<T>):Promise<T>=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error??new Error('Database operation failed'));});
const done=(tx:IDBTransaction):Promise<void>=>new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('Transaction failed'));tx.onabort=()=>reject(tx.error??new Error('Transaction aborted'));});
export function openDatabase():Promise<IDBDatabase> {
  if(connectionPromise) return connectionPromise;
  connectionPromise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DATABASE_NAME,SCHEMA_VERSION);
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles',{keyPath:'id'});
      if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta',{keyPath:'key'});
      if(!db.objectStoreNames.contains('achievements')){
        const s=db.createObjectStore('achievements',{keyPath:'id'});
        s.createIndex('byStatus','status',{unique:false});
        s.createIndex('byOccurredOn','occurredOn',{unique:false});
        s.createIndex('byUpdatedAt','updatedAt',{unique:false});
      }
    };
    r.onerror=()=>{connectionPromise=null;reject(r.error??new Error('Database unavailable'));};
    r.onblocked=()=>{connectionPromise=null;reject(new Error('Close other CareerProof tabs before upgrading the database.'));};
    r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();connectionPromise=null;};resolve(db);};
  });
  return connectionPromise;
}
export async function initialize():Promise<void> {
  const db=await openDatabase(); const tx=db.transaction('profiles','readwrite');const completion=done(tx);const s=tx.objectStore('profiles');const existing=await req(s.get(PROFILE_ID) as IDBRequest<Profile|undefined>);if(!existing) s.put(emptyProfile());await completion;
}
export async function getProfile():Promise<Profile> {
  const db=await openDatabase();const tx=db.transaction('profiles','readonly');const result=await req(tx.objectStore('profiles').get(PROFILE_ID) as IDBRequest<Profile>);return result??emptyProfile();
}
export async function saveProfile(input:Omit<Profile,'createdAt'|'updatedAt'|'revision'> & {revision:number}):Promise<Profile>{
  const db=await openDatabase();const tx=db.transaction(['profiles','meta'],'readwrite');const completion=done(tx);const store=tx.objectStore('profiles');const current=await req(store.get(PROFILE_ID) as IDBRequest<Profile|undefined>);
  if(current && current.revision!==input.revision){tx.abort();throw new ConflictError('Your profile changed in another tab. Reload before saving.');}
  const now=new Date().toISOString();const next:Profile={...input,id:PROFILE_ID,createdAt:current?.createdAt??now,updatedAt:now,revision:(current?.revision??0)+1};store.put(next);tx.objectStore('meta').put({key:'lastChangeAt',value:now} satisfies Meta);await completion;return next;
}
export async function listAchievements():Promise<Achievement[]> {
  const db=await openDatabase();return await req(db.transaction('achievements','readonly').objectStore('achievements').getAll() as IDBRequest<Achievement[]>);
}
export async function getAchievement(id:string):Promise<Achievement|undefined> {
  const db=await openDatabase();return await req(db.transaction('achievements','readonly').objectStore('achievements').get(id) as IDBRequest<Achievement|undefined>);
}
export async function saveAchievement(input:Omit<Achievement,'createdAt'|'updatedAt'|'revision'> & {revision:number}):Promise<Achievement> {
  const db=await openDatabase();const tx=db.transaction(['achievements','meta'],'readwrite');const completion=done(tx);const store=tx.objectStore('achievements');const current=await req(store.get(input.id) as IDBRequest<Achievement|undefined>);
  if((current && current.revision!==input.revision) || (!current&&input.revision!==0)){tx.abort();throw new ConflictError('This achievement was changed in another tab. Reload before saving.');}
  const now=new Date().toISOString();const next:Achievement={...input,createdAt:current?.createdAt??now,updatedAt:now,revision:(current?.revision??0)+1};store.put(next);tx.objectStore('meta').put({key:'lastChangeAt',value:now} satisfies Meta);await completion;return next;
}
export async function removeAchievement(id:string,expectedRevision:number):Promise<void>{
  const db=await openDatabase();const tx=db.transaction(['achievements','meta'],'readwrite');const completion=done(tx);const store=tx.objectStore('achievements');const current=await req(store.get(id) as IDBRequest<Achievement|undefined>);
  if(!current||current.revision!==expectedRevision){tx.abort();throw new ConflictError('This achievement changed. Reload before deleting.');}
  store.delete(id);tx.objectStore('meta').put({key:'lastChangeAt',value:new Date().toISOString()} satisfies Meta);await completion;
}
export async function getMeta(key:string):Promise<unknown> {
  const db=await openDatabase();const value=await req(db.transaction('meta','readonly').objectStore('meta').get(key) as IDBRequest<Meta|undefined>);return value?.value;
}
export async function setMeta(key:string,value:unknown):Promise<void>{
  const db=await openDatabase();const tx=db.transaction('meta','readwrite');const completion=done(tx);tx.objectStore('meta').put({key,value} satisfies Meta);await completion;
}
export async function readAllData():Promise<{profiles:Profile[];achievements:Achievement[]}>{
  const db=await openDatabase();const tx=db.transaction(['profiles','achievements'],'readonly');const completion=done(tx);const profiles=req(tx.objectStore('profiles').getAll() as IDBRequest<Profile[]>);const achievements=req(tx.objectStore('achievements').getAll() as IDBRequest<Achievement[]>);const result=await Promise.all([profiles,achievements]);await completion;return {profiles:result[0],achievements:result[1]};
}
export async function replaceAllData(profiles:Profile[],achievements:Achievement[]):Promise<void>{
  const db=await openDatabase();const tx=db.transaction(['profiles','achievements','meta'],'readwrite');const completion=done(tx);const p=tx.objectStore('profiles'),a=tx.objectStore('achievements');p.clear();a.clear();for(const item of profiles)p.put(item);for(const item of achievements)a.put(item);tx.objectStore('meta').put({key:'lastChangeAt',value:new Date().toISOString()} satisfies Meta);await completion;
}
