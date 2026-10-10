/**
 * CP-012A Data Health 2.0 — deterministic, read-only assessment of the local
 * career record. Pure functions: no storage access, no DOM, no mutation.
 *
 * Critical  = the record or its recovery path is at risk (reported by the data
 *             layer when validation or the backup round-trip fails).
 * Advisory  = valid data that is worth completing or protecting.
 *
 * Wording rule: advisories describe *documentation*, never ability. A missing
 * outcome or skill link means "not recorded", not "lacking".
 */
import type { CareerCollections, Achievement } from './models.js';
import { MAX_BACKUP_BYTES } from './models.js';
import { dateBounds } from './dates.js';

export type HealthSeverity = 'critical' | 'advisory';
export type HealthTargetKind = 'achievement' | 'project' | 'profile' | 'credential' | 'settings';
export interface HealthItem { label: string; kind: HealthTargetKind; id: string | null }
export interface HealthIssue {
  code: string;
  severity: HealthSeverity;
  title: string;
  detail: string;
  count: number;
  items: HealthItem[];
}
export interface HealthContext {
  /** ISO timestamp used for all date comparisons (injected for determinism). */
  now: string;
  lastExportAt: string | null;
  lastChangeAt: string | null;
  /** UTF-8 size of a full backup, when known. */
  backupBytes: number | null;
  /** navigator.storage.persisted(); null when the browser cannot say. */
  storagePersisted: boolean | null;
}

export const EXPORT_STALE_DAYS = 14;
export const BACKUP_SIZE_ADVISORY_RATIO = 0.8;
const DAY_MS = 86_400_000;

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const verb = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function criticalIssue(message: string): HealthIssue {
  return {
    code: 'integrity-failed', severity: 'critical', count: 1, items: [],
    title: 'Records or backup format failed validation',
    detail: `${message} Nothing was changed. Export a backup if Settings still allows it, and do not restore or reinstall until this is resolved.`,
  };
}

function issue(code: string, title: string, detail: string, items: HealthItem[] = [], count = Math.max(1, items.length)): HealthIssue {
  return { code, severity: 'advisory', title, detail, count, items };
}

function recoveryIssues(ctx: HealthContext): HealthIssue[] {
  const out: HealthIssue[] = [];
  const now = Date.parse(ctx.now);
  const settings: HealthItem[] = [{ label: 'Open Settings → Export', kind: 'settings', id: null }];
  if (!ctx.lastExportAt) {
    out.push(issue('export-never', 'No backup exported from this device',
      'Your records exist only in this browser. Export a backup and keep the file somewhere safe, such as Files or iCloud Drive.', settings, 1));
  } else {
    const days = Math.max(0, Math.floor((now - Date.parse(ctx.lastExportAt)) / DAY_MS));
    const changed = Boolean(ctx.lastChangeAt && ctx.lastChangeAt > ctx.lastExportAt);
    if (days > EXPORT_STALE_DAYS) {
      out.push(issue('export-stale', `Last export was ${plural(days, 'day')} ago`,
        (changed ? 'Records have changed since then, so that file is out of date. ' : '') + 'Export a fresh backup.', settings, 1));
    } else if (changed) {
      out.push(issue('changes-since-export', 'Records changed since the last export',
        'The last exported file does not include your newest changes. Export again when you finish editing.', settings, 1));
    }
  }
  if (ctx.storagePersisted === false) {
    out.push(issue('storage-not-persistent', 'Browser storage is not marked persistent',
      'The browser may clear site data under storage pressure. Regular exports are your protection.', [], 1));
  }
  if (ctx.backupBytes !== null && ctx.backupBytes > MAX_BACKUP_BYTES * BACKUP_SIZE_ADVISORY_RATIO) {
    const pct = Math.round(ctx.backupBytes / MAX_BACKUP_BYTES * 100);
    out.push(issue('backup-size', `Backup is at ${pct}% of the 12 MiB limit`,
      'Exports above the limit fail rather than drop records. Consider archiving or trimming very long text.', [], 1));
  }
  return out;
}

export function assessDataHealth(c: CareerCollections, ctx: HealthContext): HealthIssue[] {
  const issues = recoveryIssues(ctx);
  const today = ctx.now.slice(0, 10);

  const projectLinks = new Map<string, number>(), achievementProjects = new Set<string>(), achievementSkills = new Set<string>();
  for (const l of c.recordLinks) {
    if (l.linkType === 'achievement-project') { achievementProjects.add(l.sourceId); projectLinks.set(l.targetId, (projectLinks.get(l.targetId) ?? 0) + 1); }
    if (l.linkType === 'achievement-competency') achievementSkills.add(l.sourceId);
  }
  const supported = new Set<string>([...c.impactMetrics.map(m => m.achievementId), ...c.evidenceReferences.map(e => e.achievementId)]);
  const byTitle = (a: Achievement, b: Achievement) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  const recorded = c.achievements.filter(a => a.status === 'recorded').sort(byTitle);
  const items = (list: Achievement[]): HealthItem[] => list.map(a => ({ label: a.title, kind: 'achievement', id: a.id }));
  const recordedGap = (code: string, list: Achievement[], what: string, detail: string) => {
    if (list.length) issues.push(issue(code, `${plural(list.length, 'recorded achievement')} ${what}`, detail, items(list)));
  };

  const noOutcome = recorded.filter(a => !a.outcome.trim());
  recordedGap('achievement-no-outcome', noOutcome, verb(noOutcome.length, 'has no stated outcome', 'have no stated outcome'),
    'Adding what changed as a result makes the record easier to use in reviews and CVs. This is about documentation, not your ability.');
  const unsupported = recorded.filter(a => !supported.has(a.id));
  recordedGap('achievement-no-support', unsupported, verb(unsupported.length, 'has no metric or evidence reference', 'have no metric or evidence reference'),
    'A number with its context, or a reference to where the proof lives, helps you substantiate the claim later. Only add what you actually know.');
  const unskilled = recorded.filter(a => !achievementSkills.has(a.id));
  recordedGap('achievement-no-skill', unskilled, verb(unskilled.length, 'is not linked to a skill', 'are not linked to a skill'),
    'Linking skills shows where you recorded using them. It is not a proficiency rating.');
  const noContext = recorded.filter(a => !a.roleId && !achievementProjects.has(a.id));
  recordedGap('achievement-no-context', noContext, verb(noContext.length, 'has no role or experience', 'have no role or experience'),
    'Linking a role or experience records where the work happened.');

  const idle = [...c.projects].filter(p => !projectLinks.has(p.id)).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  if (idle.length) issues.push(issue('experience-no-achievements', `${plural(idle.length, 'experience')} ${verb(idle.length, 'has', 'have')} no linked achievements`,
    'Capture an achievement from the experience card to connect the two.', idle.map(p => ({ label: p.name, kind: 'project', id: p.id }))));

  const profile = c.profiles[0];
  if (profile) {
    const missing = [!profile.headline.trim() && 'headline', !profile.summary.trim() && 'summary'].filter(Boolean) as string[];
    if (missing.length) issues.push(issue('profile-incomplete', `Profile has no ${missing.join(' or ')}`,
      'A short headline and summary give every other record context.', [{ label: 'Edit profile', kind: 'profile', id: null }], 1));
  }

  const drafts = c.achievements.filter(a => a.status === 'draft').sort(byTitle);
  if (drafts.length) issues.push(issue('drafts', `${plural(drafts.length, 'draft')} not recorded yet`,
    'Drafts are kept but not counted as recorded until they have a contribution and a date.', items(drafts)));

  const expired = c.credentials.filter(x => x.expirationDate && dateBounds(x.expirationDate).latest < today)
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  if (expired.length) issues.push(issue('credential-expired', `${plural(expired.length, 'credential')} past the recorded expiry date`,
    'If it was renewed, update the expiry date. The app does not verify credentials.', expired.map(x => ({ label: x.name, kind: 'credential', id: x.id }))));

  return issues;
}
