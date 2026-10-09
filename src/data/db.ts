import { type Achievement, type AchievementView, type Profile, type CareerCollections, type P0RecordMap, type P0Store, type Preferences, type Meta, P0_STORES, SCHEMA_VERSION, TAXONOMY_VERSION, PROFILE_ID, emptyProfile, emptyCollections, nowIso } from '../domain/models.js';
import { achievementView, migrateLegacyAchievement, migrateLegacyProfile, validateCollections, isPreferences, validTime, ConflictError, ValidationError } from '../domain/validation.js';
import { precisionDateFromInput } from '../domain/dates.js';
import { builtInTaxonomy } from '../domain/taxonomy.js';
const DB_NAME = 'careerproof-local';
const GENERATION = 'datasetGeneration', REVISION = 'sourceDataRevision';
function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error??new Error('Database request failed.'));});
}
function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('Database transaction was aborted; stored data is unchanged.'));tx.onerror=()=>{/* onabort reports the transaction outcome. */};});
}
const metaValue = (tx: IDBTransaction,key: string,value: unknown) => tx.objectStore('meta').put({key,value} satisfies Meta);
function ensureTaxonomy(c: CareerCollections): void {
  const seeds=builtInTaxonomy();
  for(const store of ['competencyCategories','competencies'] as const){
    const present=new Set(c[store].map(r=>r.id));
    for(const r of seeds[store])if(!present.has(r.id))(c[store] as (typeof r)[]).push(r);
  }
}
function configureSchema(db: IDBDatabase, tx: IDBTransaction): void {
  for(const store of P0_STORES)if(!db.objectStoreNames.contains(store))db.createObjectStore(store,{keyPath:'id'});
  if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});
  const index=(store: P0Store,name: string,path: string|string[],unique=false)=>{
    const s=tx.objectStore(store);if(!s.indexNames.contains(name))s.createIndex(name,path,{unique});
  };
  const achievements=tx.objectStore('achievements');
  if(achievements.indexNames.contains('byOccurredOn'))achievements.deleteIndex('byOccurredOn');
  index('achievements','byStatus','status');index('achievements','byOccurredStart','occurredStart.value');index('achievements','byUpdatedAt','updatedAt');index('achievements','byRole','roleId');
  index('employers','byName','name');index('roles','byEmployer','employerId');index('roles','byStart','startDate.value');
  index('projects','byEmployer','employerId');index('projects','byStatus','status');index('projects','byStart','startDate.value');
  index('impactMetrics','byAchievement','achievementId');index('evidenceReferences','byAchievement','achievementId');
  index('competencies','byCategory','categoryId');index('competencies','byCategoryName',['categoryId','normalizedName'],true);
  index('recordLinks','byTypeEndpoints',['linkType','sourceId','targetId'],true);index('recordLinks','bySource','sourceId');index('recordLinks','byTarget','targetId');
}
function upgrade(db: IDBDatabase, tx: IDBTransaction, oldVersion: number): void {
  configureSchema(db,tx);
  // All callbacks remain inside the versionchange transaction. No unrelated await.
  const c=emptyCollections();let remaining=P0_STORES.length;
  for(const store of P0_STORES){
    const request=tx.objectStore(store).getAll();
    request.onsuccess=()=>{
      try {
        (c[store] as unknown[])=request.result;
        if(--remaining!==0)return;
        if(oldVersion===1){
          c.profiles=c.profiles.map(migrateLegacyProfile);c.achievements=c.achievements.map(migrateLegacyAchievement);
        }
        if(c.profiles.length===0)c.profiles=[emptyProfile()];
        ensureTaxonomy(c);validateCollections(c);
        for(const name of P0_STORES)for(const record of c[name])tx.objectStore(name).put(record);
        metaValue(tx,GENERATION,1);metaValue(tx,REVISION,1);metaValue(tx,'schemaVersion',SCHEMA_VERSION);metaValue(tx,'taxonomyVersion',TAXONOMY_VERSION);metaValue(tx,'preferences',{theme:'system'});
      } catch { tx.abort(); }
    };
  }
}
export interface DatasetSnapshot { collections: CareerCollections; generation: number; revision: number; preferences: Preferences }
async function snapshot(tx: IDBTransaction): Promise<DatasetSnapshot> {
  const reads=P0_STORES.map(s=>req(tx.objectStore(s).getAll()));
  const metadata=req(tx.objectStore('meta').getAll() as IDBRequest<Meta[]>);
  const [records,meta]=await Promise.all([Promise.all(reads),metadata]);
  const values=new Map(meta.map(m=>[m.key,m.value]));
  const generation=values.get(GENERATION),revision=values.get(REVISION),preferences=values.get('preferences');
  if(!Number.isSafeInteger(generation)||(generation as number)<1||!Number.isSafeInteger(revision)||(revision as number)<1||!isPreferences(preferences))throw new ValidationError('Invalid database recovery metadata. Export data and seek recovery support.');
  return {collections:Object.fromEntries(P0_STORES.map((s,i)=>[s,records[i]])) as CareerCollections,generation:generation as number,revision:revision as number,preferences};
}
type AchievementWrite = Pick<Achievement,'id'|'title'|'contribution'|'status'|'preArchiveStatus'|'outcome'|'impactCategory'> & Partial<Achievement> & {revision:number;occurredOn?:string};
type ProfileWrite = Pick<Profile,'id'|'displayName'|'headline'|'summary'|'email'|'location'|'revision'> & Partial<Profile>;

/** One instance per browsing context; generation is captured once, never adopted on an ordinary read. */
export class CareerDatabase {
  private connection: Promise<IDBDatabase> | null=null;
  private generation: number | undefined;
  constructor(private factory?: IDBFactory, private name=DB_NAME) {}
  private open(): Promise<IDBDatabase> {
    if(this.connection)return this.connection;
    const factory=this.factory??globalThis.indexedDB;
    if(!factory)return Promise.reject(new Error('IndexedDB is unavailable in this browser.'));
    this.connection=new Promise((resolve,reject)=>{
      let abandoned=false;
      const request=factory.open(this.name,SCHEMA_VERSION);
      request.onupgradeneeded=event=>{
        if(abandoned){request.transaction!.abort();return;}
        try{upgrade(request.result,request.transaction!,event.oldVersion);}catch{request.transaction!.abort();}
      };
      request.onblocked=()=>{abandoned=true;if(this.connection===opening)this.connection=null;reject(new Error('Database upgrade is blocked. Close other CareerProof tabs or installed windows, then reload. No records have been replaced.'));};
      request.onerror=()=>{if(this.connection===opening)this.connection=null;reject(new Error(request.error?.name==='VersionError'?'This database belongs to a newer CareerProof version. Reopen the newer app; it cannot be downgraded.':'Database upgrade/open failed. Existing stored data is preserved.'));};
      request.onsuccess=()=>{
        const db=request.result;
        if(abandoned){db.close();return;}
        db.onversionchange=()=>{db.close();if(this.connection===opening)this.connection=null;};
        db.onclose=()=>{if(this.connection===opening)this.connection=null;};
        resolve(db);
      };
    });
    const opening=this.connection;
    return this.connection;
  }
  async close(): Promise<void> { const connection=this.connection;this.connection=null;if(connection)(await connection).close(); }
  private checkGeneration(generation: number,expected=this.generation): void {
    if(expected!==undefined&&generation!==expected)throw new ConflictError('Career data was restored in another tab. Reload this tab before making changes.');
  }
  async initialize(): Promise<void> {
    const db=await this.open(),tx=db.transaction([...P0_STORES,'meta'],'readwrite'),completion=done(tx);
    try{
      const data=await snapshot(tx);this.checkGeneration(data.generation);
      ensureTaxonomy(data.collections);validateCollections(data.collections);
      // Idempotent: existing built-ins and custom records are never overwritten.
      const existing=await Promise.all(['competencyCategories','competencies'].map(s=>req(tx.objectStore(s).getAllKeys())));
      let seeded=false;
      for(const [i,s] of (['competencyCategories','competencies'] as const).entries()){
        const present=new Set(existing[i]);for(const r of data.collections[s])if(!present.has(r.id)){tx.objectStore(s).put(r);seeded=true;}
      }
      if(seeded){
        if(data.revision===Number.MAX_SAFE_INTEGER)throw new ValidationError('Dataset revision limit reached.');
        metaValue(tx,REVISION,data.revision+1);metaValue(tx,'lastChangeAt',nowIso());
      }
      await completion;if(this.generation===undefined)this.generation=data.generation;
    }catch(error){try{tx.abort();}catch{/* already finished */}await completion.catch(()=>{});throw error;}
  }
  async readSnapshot(): Promise<DatasetSnapshot> {
    if(this.generation===undefined)await this.initialize();
    const db=await this.open(),tx=db.transaction([...P0_STORES,'meta'],'readonly'),completion=done(tx);
    try{const data=await snapshot(tx);this.checkGeneration(data.generation);validateCollections(data.collections);await completion;return data;}
    catch(error){await completion.catch(()=>{});throw error;}
  }
  async getGeneration(): Promise<number> { if(this.generation===undefined)await this.initialize();return this.generation!; }
  private async write<T>(operation:(tx:IDBTransaction,data:DatasetSnapshot)=>T|Promise<T>,content=true,expected?:number):Promise<T> {
    if(this.generation===undefined)await this.initialize();
    const db=await this.open(),tx=db.transaction([...P0_STORES,'meta'],'readwrite'),completion=done(tx);
    try{
      const data=await snapshot(tx);this.checkGeneration(data.generation);this.checkGeneration(data.generation,expected);
      if(content&&data.revision===Number.MAX_SAFE_INTEGER)throw new ValidationError('Dataset revision limit reached.');
      const result=await operation(tx,data);
      if(content){metaValue(tx,REVISION,data.revision+1);metaValue(tx,'lastChangeAt',nowIso());}
      await completion;return result;
    }catch(error){try{tx.abort();}catch{/* already finished */}await completion.catch(()=>{});throw error;}
  }
  private upsert<K extends P0Store>(tx:IDBTransaction,data:DatasetSnapshot,store:K,input:P0RecordMap[K],expected:number):P0RecordMap[K] {
    const list=data.collections[store],current=list.find(r=>r.id===input.id);
    if(current ? current.revision!==expected : expected!==0)throw new ConflictError('This record changed. Reload before saving.');
    if(current?.revision===Number.MAX_SAFE_INTEGER)throw new ValidationError('Record revision limit reached.');
    const record={...input,createdAt:current?.createdAt??nowIso(),updatedAt:nowIso(),revision:(current?.revision??0)+1};
    const index=list.findIndex(r=>r.id===record.id);
    if(index<0)list.push(record);else list[index]=record;
    validateCollections(data.collections);tx.objectStore(store).put(record);return record;
  }
  async saveRecord<K extends P0Store>(store:K,input:Omit<P0RecordMap[K],'createdAt'|'updatedAt'>):Promise<P0RecordMap[K]> {
    return this.write((tx,data)=>this.upsert(tx,data,store,input as P0RecordMap[K],input.revision));
  }
  async saveProfile(input:ProfileWrite):Promise<Profile> {
    return this.write((tx,data)=>this.upsert(tx,data,'profiles',{...data.collections.profiles[0]!,...input},input.revision));
  }
  async saveAchievement(input:AchievementWrite):Promise<AchievementView> {
    return this.write((tx,data)=>{
      const current=data.collections.achievements.find(r=>r.id===input.id);
      const {occurredOn,...canonical}=input;
      if(occurredOn!==undefined&&canonical.occurredStart!==undefined&&occurredOn!==(canonical.occurredStart?.value??''))throw new ValidationError('Conflicting achievement date representations.');
      const record={occurredStart:null,occurredEnd:null,roleId:null,situation:'',actions:'',confidentiality:'confidential' as const,notes:'',...current,...canonical};
      if(occurredOn!==undefined)record.occurredStart=precisionDateFromInput(occurredOn);
      return achievementView(this.upsert(tx,data,'achievements',record as Achievement,input.revision));
    });
  }
  async removeRecord(store:P0Store,id:string,revision:number):Promise<void> {
    if(store==='profiles')throw new ValidationError('The local profile cannot be deleted.');
    return this.write((tx,data)=>{
      const current=data.collections[store].find(r=>r.id===id);
      if(!current||current.revision!==revision)throw new ConflictError('This record changed. Reload before deleting.');
      if('isBuiltIn' in current&&current.isBuiltIn)throw new ValidationError('Built-in taxonomy records cannot be deleted.');
      (data.collections[store] as unknown[])=data.collections[store].filter(r=>r.id!==id);
      const dependentStores = store==='achievements'?['impactMetrics','evidenceReferences','recordLinks'] as const:[];
      for(const s of dependentStores){
        const remove=data.collections[s].filter(r=>('achievementId' in r?r.achievementId:r.sourceId)===id);
        for(const r of remove)tx.objectStore(s).delete(r.id);
        (data.collections[s] as unknown[])=data.collections[s].filter(r=>!remove.includes(r as never));
      }
      // Other deletions block on dependents until a deliberate unlink/reassignment workflow exists.
      validateCollections(data.collections);tx.objectStore(store).delete(id);
    });
  }
  async replaceAllData(collections:CareerCollections,preferences:Preferences,expected:number):Promise<void> {
    const checked=structuredClone(validateCollections(collections));
    if(!isPreferences(preferences))throw new ValidationError('Invalid backup preferences.');
    const checkedPreferences=structuredClone(preferences);
    const newGeneration=await this.write(async(tx,data)=>{
      if(data.generation===Number.MAX_SAFE_INTEGER)throw new ValidationError('Dataset generation limit reached.');
      for(const store of P0_STORES){const s=tx.objectStore(store);s.clear();for(const record of checked[store])s.put(record);}
      metaValue(tx,GENERATION,data.generation+1);metaValue(tx,'preferences',checkedPreferences);metaValue(tx,'lastExportAt',null);
      const readback=await snapshot(tx);validateCollections(readback.collections);
      for(const store of P0_STORES){
        const sorted=(rows:CareerCollections[P0Store])=>JSON.stringify([...rows].sort((a,b)=>a.id.localeCompare(b.id)));
        if(sorted(checked[store])!==sorted(readback.collections[store]))throw new ValidationError('Restore verification failed; stored data is unchanged.');
      }
      return data.generation+1;
    },true,expected);
    this.generation=newGeneration;
  }
  async getMeta(key:string):Promise<unknown>{
    const data=await this.readSnapshot();
    if(key===GENERATION)return data.generation;if(key===REVISION)return data.revision;if(key==='preferences')return data.preferences;
    const db=await this.open();return (await req(db.transaction('meta','readonly').objectStore('meta').get(key) as IDBRequest<Meta|undefined>))?.value;
  }
  async setMeta(key:string,value:unknown):Promise<void>{
    if(!['lastExportAt','preferences'].includes(key))throw new ValidationError('Protected database metadata.');
    if(key==='lastExportAt'&&value!==null&&!validTime(value))throw new ValidationError('Invalid backup timestamp.');
    if(key==='preferences'&&!isPreferences(value))throw new ValidationError('Invalid preferences.');
    return this.write(tx=>{metaValue(tx,key,value);},false);
  }
}
export const database=new CareerDatabase();
export const initialize=()=>database.initialize();
export const getProfile=async()=> (await database.readSnapshot()).collections.profiles[0]!;
export const listAchievements=async()=> (await database.readSnapshot()).collections.achievements.map(achievementView).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
export const getAchievement=async(id:string)=> (await listAchievements()).find(a=>a.id===id);
export const saveProfile=(input:ProfileWrite)=>database.saveProfile(input);
export const saveAchievement=(input:AchievementWrite)=>database.saveAchievement(input);
export const removeAchievement=(id:string,revision:number)=>database.removeRecord('achievements',id,revision);
export const getMeta=(key:string)=>database.getMeta(key);
export const setMeta=(key:string,value:unknown)=>database.setMeta(key,value);
export const readAllData=async()=> (await database.readSnapshot()).collections;
