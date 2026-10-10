import { type Achievement, type AchievementView, type ImpactMetric, type EvidenceReference, type RecordLink, type Profile, type CareerCollections, type P0RecordMap, type P0Store, type Preferences, type Meta, P0_STORES, SCHEMA_VERSION, TAXONOMY_VERSION, PROFILE_ID, emptyProfile, emptyCollections, nowIso } from '../domain/models.js';
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
  /** Update role and profile.primaryRoleId in one validated IndexedDB transaction. */
  async saveCareerRole(input:Omit<P0RecordMap['roles'],'createdAt'|'updatedAt'>,makePrimary:boolean):Promise<P0RecordMap['roles']> {
    return this.write((tx,data)=>{
      const record=this.upsert(tx,data,'roles',input as P0RecordMap['roles'],input.revision);
      const profile=data.collections.profiles[0]!;
      const nextPrimary=makePrimary?record.id:profile.primaryRoleId===record.id?null:profile.primaryRoleId;
      if(nextPrimary!==profile.primaryRoleId)this.upsert(tx,data,'profiles',{...profile,primaryRoleId:nextPrimary},profile.revision);
      return record;
    });
  }
  /**
   * Save project details and its role associations in one transaction.
   * Existing link identities/notes survive edits; unrelated links are untouched.
   * A failed employer/role relationship validation aborts the entire write.
   */
  async savePortfolioProject(input:Omit<P0RecordMap['projects'],'createdAt'|'updatedAt'>,roleIds:string[]):Promise<P0RecordMap['projects']> {
    return this.write((tx,data)=>{
      const selected=[...new Set(roleIds)];
      if(selected.length!==roleIds.length)throw new ValidationError('Duplicate role selection.');
      const current=data.collections.projects.find(r=>r.id===input.id);
      if(current?current.revision!==input.revision:input.revision!==0)throw new ConflictError('This project changed. Reload before saving.');
      if(current?.revision===Number.MAX_SAFE_INTEGER)throw new ValidationError('Record revision limit reached.');
      const now=nowIso();
      const project={...input,createdAt:current?.createdAt??now,updatedAt:now,revision:(current?.revision??0)+1};
      const position=data.collections.projects.findIndex(r=>r.id===input.id);
      if(position>=0)data.collections.projects[position]=project;
      else data.collections.projects.push(project);
      const prior=data.collections.recordLinks.filter(r=>r.linkType==='role-project'&&r.targetId===input.id);
      const priorMap=new Map(prior.map(r=>[r.sourceId,r]));
      const kept=prior.filter(r=>selected.includes(r.sourceId));
      const added=selected.filter(id=>!priorMap.has(id)).map(id=>({
        id:crypto.randomUUID(),sourceId:id,targetId:input.id,linkType:'role-project' as const,
        isPrimary:false,note:'',createdAt:now,updatedAt:now,revision:1
      }));
      const removed=prior.filter(r=>!selected.includes(r.sourceId));
      data.collections.recordLinks=data.collections.recordLinks.filter(r=>!prior.includes(r)).concat(kept,added);
      validateCollections(data.collections);
      tx.objectStore('projects').put(project);
      for(const r of removed)tx.objectStore('recordLinks').delete(r.id);
      for(const r of added)tx.objectStore('recordLinks').put(r);
      return project;
    });
  }
  async saveAchievement(input:AchievementWrite,projectId?:string):Promise<AchievementView> {
    return this.write((tx,data)=>{
      const current=data.collections.achievements.find(r=>r.id===input.id);
      const {occurredOn,...canonical}=input;
      if(occurredOn!==undefined&&canonical.occurredStart!==undefined&&occurredOn!==(canonical.occurredStart?.value??''))throw new ValidationError('Conflicting achievement date representations.');
      const record={occurredStart:null,occurredEnd:null,roleId:null,situation:'',actions:'',confidentiality:'confidential' as const,notes:'',...current,...canonical};
      if(occurredOn!==undefined)record.occurredStart=precisionDateFromInput(occurredOn);
      if(projectId&&!data.collections.projects.some(p=>p.id===projectId))throw new ValidationError('The selected project no longer exists.');
      const achievement=this.upsert(tx,data,'achievements',record as Achievement,input.revision);
      if(projectId&&!data.collections.recordLinks.some(r=>r.linkType==='achievement-project'&&r.sourceId===achievement.id&&r.targetId===projectId)){
        const now=nowIso();
        const link={id:crypto.randomUUID(),createdAt:now,updatedAt:now,revision:1,
          linkType:'achievement-project' as const,sourceId:achievement.id,targetId:projectId,isPrimary:false,note:''};
        this.upsert(tx,data,'recordLinks',link,0);
      }
      return achievementView(achievement);
    });
  }
  /** All achievement source fields, relationships, metrics and references change atomically. */
  async saveAchievementBundle(input:AchievementWrite,projectIds:string[],primaryProjectId:string|null,competencyIds:string[],
    metricDrafts:Omit<ImpactMetric,'achievementId'|'createdAt'|'updatedAt'>[],
    evidenceDrafts:Omit<EvidenceReference,'achievementId'|'createdAt'|'updatedAt'>[]):Promise<AchievementView>{
    return this.write((tx,data)=>{
      const current=data.collections.achievements.find(r=>r.id===input.id);
      if(current?current.revision!==input.revision:input.revision!==0)throw new ConflictError('This achievement changed. Reload before saving.');
      const unique=(ids:string[],label:string)=>{
        if(new Set(ids).size!==ids.length)throw new ValidationError('Duplicate '+label+' selection.');
      };
      unique(projectIds,'project');unique(competencyIds,'competency');
      if(primaryProjectId&&!projectIds.includes(primaryProjectId))throw new ValidationError('Primary project must be selected.');
      if(projectIds.some(id=>!data.collections.projects.some(p=>p.id===id)))throw new ValidationError('A selected project does not exist.');
      if(competencyIds.some(id=>{
        const skill=data.collections.competencies.find(c=>c.id===id);
        return !skill||(skill.status!=='active'&&!data.collections.recordLinks.some(l=>
          l.linkType==='achievement-competency'&&l.sourceId===input.id&&l.targetId===id));
      }))throw new ValidationError('A selected competency is unavailable.');
      if(new Set(metricDrafts.map(r=>r.id)).size!==metricDrafts.length||new Set(evidenceDrafts.map(r=>r.id)).size!==evidenceDrafts.length)
        throw new ValidationError('Duplicate metric or reference identifiers.');
      const {occurredOn,...canonical}=input;
      if(occurredOn!==undefined&&canonical.occurredStart!==undefined&&occurredOn!==(canonical.occurredStart?.value??''))throw new ValidationError('Conflicting achievement dates.');
      if(current?.revision===Number.MAX_SAFE_INTEGER)throw new ValidationError('Record revision limit reached.');
      const now=nowIso();
      const achievement={occurredStart:null,occurredEnd:null,roleId:null,situation:'',actions:'',confidentiality:'confidential' as const,notes:'',
        ...current,...canonical,createdAt:current?.createdAt??now,updatedAt:now,revision:(current?.revision??0)+1} as Achievement;
      if(occurredOn!==undefined)achievement.occurredStart=precisionDateFromInput(occurredOn);
      const existingLinks=data.collections.recordLinks.filter(r=>r.sourceId===achievement.id&&
        (r.linkType==='achievement-project'||r.linkType==='achievement-competency'));
      const keptLinks:RecordLink[]=[],addedLinks:RecordLink[]=[];
      for(const [type,ids] of [['achievement-project',projectIds],['achievement-competency',competencyIds]] as const){
        for(const id of ids){
          const old=existingLinks.find(r=>r.linkType===type&&r.targetId===id);
          const primary=type==='achievement-project'&&id===primaryProjectId;
          if(old){
            keptLinks.push(old.isPrimary===primary?old:{...old,isPrimary:primary,updatedAt:now,revision:old.revision+1});
          }else{
            addedLinks.push({id:crypto.randomUUID(),createdAt:now,updatedAt:now,revision:1,
              linkType:type,sourceId:achievement.id,targetId:id,isPrimary:primary,note:''});
          }
        }
      }
      const changedLinks=keptLinks.filter(r=>{
        const old=existingLinks.find(x=>x.id===r.id);return old?.revision!==r.revision;
      });
      const removedLinks=existingLinks.filter(r=>!keptLinks.some(k=>k.id===r.id));
      const assemble=<T extends ImpactMetric|EvidenceReference>(kind:'impactMetrics'|'evidenceReferences',
        drafts:Omit<T,'achievementId'|'createdAt'|'updatedAt'>[]):{records:T[];removed:T[]}=>{
        const prior=data.collections[kind].filter(r=>r.achievementId===achievement.id) as T[];
        const result=drafts.map(draft=>{
          const old=prior.find(x=>x.id===draft.id);
          if(old?old.revision!==draft.revision:draft.revision!==0)throw new ConflictError('A metric or evidence reference changed. Reload before saving.');
          if(old?.revision===Number.MAX_SAFE_INTEGER)throw new ValidationError('Record revision limit reached.');
          return {...draft,achievementId:achievement.id,createdAt:old?.createdAt??now,
            updatedAt:now,revision:(old?.revision??0)+1} as T;
        });
        return {records:result,removed:prior.filter(r=>!result.some(x=>x.id===r.id))};
      };
      const metrics=assemble<ImpactMetric>('impactMetrics',metricDrafts);
      const references=assemble<EvidenceReference>('evidenceReferences',evidenceDrafts);
      data.collections.achievements=data.collections.achievements.filter(r=>r.id!==achievement.id).concat(achievement);
      data.collections.recordLinks=data.collections.recordLinks.filter(r=>!existingLinks.includes(r)).concat(keptLinks,addedLinks);
      data.collections.impactMetrics=data.collections.impactMetrics.filter(r=>r.achievementId!==achievement.id).concat(metrics.records);
      data.collections.evidenceReferences=data.collections.evidenceReferences.filter(r=>r.achievementId!==achievement.id).concat(references.records);
      validateCollections(data.collections);
      tx.objectStore('achievements').put(achievement);
      for(const link of [...addedLinks,...changedLinks])tx.objectStore('recordLinks').put(link);
      for(const link of removedLinks)tx.objectStore('recordLinks').delete(link.id);
      for(const r of metrics.records)tx.objectStore('impactMetrics').put(r);
      for(const r of metrics.removed)tx.objectStore('impactMetrics').delete(r.id);
      for(const r of references.records)tx.objectStore('evidenceReferences').put(r);
      for(const r of references.removed)tx.objectStore('evidenceReferences').delete(r.id);
      return achievementView(achievement);
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
export const saveAchievement=(input:AchievementWrite,projectId?:string)=>database.saveAchievement(input,projectId);
export const removeAchievement=(id:string,revision:number)=>database.removeRecord('achievements',id,revision);
export const getMeta=(key:string)=>database.getMeta(key);
export const setMeta=(key:string,value:unknown)=>database.setMeta(key,value);
export const readAllData=async()=> (await database.readSnapshot()).collections;
