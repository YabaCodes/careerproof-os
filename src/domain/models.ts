export const APP_VERSION = '0.1.0';
export const SCHEMA_VERSION = 1;
export const BACKUP_FORMAT_VERSION = 1;
export type AchievementStatus = 'draft' | 'recorded' | 'archived';
export type ImpactCategory = '' | 'quality' | 'cost' | 'delivery' | 'productivity' | 'reliability' | 'safety' | 'leadership' | 'technical' | 'other';
export interface BaseRecord { id: string; createdAt: string; updatedAt: string; revision: number }
export interface Profile extends BaseRecord { displayName: string; headline: string; summary: string; email: string; location: string; }
export interface Achievement extends BaseRecord {
  title: string;
  contribution: string;
  occurredOn: string;
  status: AchievementStatus;
  preArchiveStatus: 'draft' | 'recorded' | null;
  outcome: string;
  impactCategory: ImpactCategory;
}
export interface Meta { key: string; value: unknown }
export interface CareerBackup {
  manifest: { format: 'careerproof-backup'; formatVersion: number; schemaVersion: number; appVersion: string; exportedAt: string; counts: {profiles: number; achievements: number} };
  collections: { profiles: Profile[]; achievements: Achievement[] };
}
export const PROFILE_ID = 'local-profile';
export const IMPACT_CATEGORIES: Record<ImpactCategory,string> = {
  '':'Not selected', quality:'Quality',cost:'Cost',delivery:'Delivery',productivity:'Productivity',reliability:'Reliability',safety:'Safety',leadership:'Leadership',technical:'Technical',other:'Other'
};
export function nowIso() { return new Date().toISOString(); }
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
export function emptyProfile(): Profile { const now = nowIso(); return {id:PROFILE_ID,displayName:'',headline:'',summary:'',email:'',location:'',createdAt:now,updatedAt:now,revision:1}; }
