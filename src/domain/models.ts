export const APP_VERSION = '0.1.1-alpha.1';
export const SCHEMA_VERSION = 2;
export const BACKUP_FORMAT_VERSION = 2;
export const TAXONOMY_VERSION = '1.0';
export const PROFILE_ID = 'local-profile';
export const MAX_BACKUP_BYTES = 12 * 1024 * 1024;
export const MAX_COLLECTION_RECORDS = 100_000;
export type AchievementStatus = 'draft' | 'recorded' | 'archived';
export type ImpactCategory = '' | 'quality' | 'cost' | 'delivery' | 'productivity' | 'reliability' | 'safety' | 'customer' | 'leadership' | 'technical' | 'technical-innovation' | 'other';
export type Confidentiality = 'standard-private' | 'confidential';
export interface PrecisionDate { value: string; precision: 'year' | 'month' | 'day' }
export interface BaseRecord { id: string; createdAt: string; updatedAt: string; revision: number }
export interface Profile extends BaseRecord {
  displayName: string; headline: string; summary: string; email: string; location: string;
  primaryDomain: string; primaryRoleId: string | null; careerInterests: string[]; locale: string;
  phone: string; website: string; professionalLinks: string[];
}
export interface Employer extends BaseRecord { name: string; industry: string; location: string; website: string; description: string }
export interface Role extends BaseRecord {
  employerId: string; title: string; startDate: PrecisionDate; endDate: PrecisionDate | null;
  isCurrent: boolean; employmentType: string; responsibilities: string; leadershipScope: string; technologies: string[];
}
export interface Education extends BaseRecord {
  institution: string; qualification: string; discipline: string; startDate: PrecisionDate | null;
  completionDate: PrecisionDate | null; description: string; honors: string;
}
export interface Credential extends BaseRecord {
  name: string; issuer: string; issuedDate: PrecisionDate | null; expirationDate: PrecisionDate | null;
  credentialId: string; verificationUrl: string; notes: string;
}
export interface Project extends BaseRecord {
  name: string; experienceType: 'project' | 'initiative' | 'ongoing-responsibility'; employerId: string | null;
  startDate: PrecisionDate | null; endDate: PrecisionDate | null; status: 'planned' | 'active' | 'on-hold' | 'completed';
  objective: string; scope: string; personalResponsibility: string; technologies: string[]; outcome: string; confidentiality: Confidentiality;
}
export interface Achievement extends BaseRecord {
  title: string; contribution: string; occurredStart: PrecisionDate | null; occurredEnd: PrecisionDate | null;
  status: AchievementStatus; preArchiveStatus: 'draft' | 'recorded' | null; outcome: string; impactCategory: ImpactCategory;
  roleId: string | null; situation: string; actions: string; confidentiality: Confidentiality; notes: string;
}
// Read-only projection for the existing editor. Only occurredStart is persisted.
export interface AchievementView extends Achievement { occurredOn: string }
export interface ImpactMetric extends BaseRecord {
  achievementId: string; metricName: string; unit: string; baselineValue: number | null; resultValue: number | null;
  reportedValue: number | null; direction: 'increase' | 'decrease' | 'neutral' | null; sourceNote: string;
}
export interface CompetencyCategory extends BaseRecord { name: string; isBuiltIn: boolean; sortOrder: number; description: string }
export interface Competency extends BaseRecord {
  categoryId: string; name: string; normalizedName: string; isBuiltIn: boolean; status: 'active' | 'archived';
  taxonomyKey: string | null; aliases: string[]; description: string; rubricId: string | null;
}
export interface EvidenceReference extends BaseRecord {
  achievementId: string; referenceType: 'description' | 'url' | 'document-reference'; label: string;
  referenceValue: string; userReviewedAt: string | null; notes: string;
}
export interface RecordLink extends BaseRecord {
  linkType: 'role-project' | 'achievement-project' | 'achievement-competency'; sourceId: string; targetId: string; isPrimary: boolean; note: string;
}
export interface Meta { key: string; value: unknown }
export interface P0RecordMap {
  profiles: Profile; employers: Employer; roles: Role; education: Education; credentials: Credential; projects: Project;
  achievements: Achievement; impactMetrics: ImpactMetric; competencyCategories: CompetencyCategory; competencies: Competency;
  evidenceReferences: EvidenceReference; recordLinks: RecordLink;
}
export const P0_STORES = ['profiles','employers','roles','education','credentials','projects','achievements','impactMetrics','competencyCategories','competencies','evidenceReferences','recordLinks'] as const;
export type P0Store = typeof P0_STORES[number];
export type CareerCollections = { [K in P0Store]: P0RecordMap[K][] };
export interface Preferences { theme: 'system' | 'light' | 'dark' }
export interface CareerBackup {
  manifest: { format: 'careerproof-backup'; formatVersion: 2; schemaVersion: 2; appVersion: string; exportedAt: string; taxonomyVersion: string; counts: { [K in P0Store]: number } };
  collections: CareerCollections;
  preferences: Preferences;
}
export const IMPACT_CATEGORIES: Record<ImpactCategory,string> = {
  '':'Not selected', quality:'Quality',cost:'Cost',delivery:'Delivery',productivity:'Productivity',reliability:'Reliability',safety:'Safety',customer:'Customer',leadership:'Leadership',technical:'Technical', 'technical-innovation':'Technical Innovation',other:'Other'
};
export function nowIso(): string { return new Date().toISOString(); }
export function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function emptyCollections(): CareerCollections { return Object.fromEntries(P0_STORES.map(name => [name, []])) as unknown as CareerCollections; }
export function emptyProfile(): Profile {
  const now = nowIso();
  return {id:PROFILE_ID,displayName:'',headline:'',summary:'',email:'',location:'',primaryDomain:'',primaryRoleId:null,careerInterests:[],locale:'',phone:'',website:'',professionalLinks:[],createdAt:now,updatedAt:now,revision:1};
}
