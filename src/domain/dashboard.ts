/**
 * CP-012C — Home dashboard summaries (CP-01, CP-FR-014).
 *
 * Truthful, derived views of what is recorded and what is missing. Counts
 * describe documentation only: no scores, ratings, targets or streaks. Pure
 * functions; the gap wording comes from the same rules as Data Health.
 */
import type { Achievement, CareerCollections, PrecisionDate } from './models.js';
import { compareRolesByRecency } from './chronology.js';
import { completenessIssues, type HealthIssue } from './dataHealth.js';

/**
 * Gaps shown on Home: content missing from recorded achievements, experiences
 * and credentials. Drafts and the profile headline are already the Home next
 * action, and backup status has its own card, so they stay in Data Health only.
 */
export const HOME_GAP_CODES = ['achievement-no-outcome', 'achievement-no-support', 'achievement-no-skill',
  'achievement-no-context', 'experience-no-achievements', 'credential-expired'] as const;
export function homeGaps(c: CareerCollections, today: string): HealthIssue[] {
  const wanted = new Set<string>(HOME_GAP_CODES);
  return completenessIssues(c, today).filter(i => wanted.has(i.code));
}

export interface RoleCoverage {
  roleId: string; title: string; employer: string; current: boolean;
  startDate: PrecisionDate; endDate: PrecisionDate | null;
  /** Active (recorded + draft) achievements, the same set the Vault shows for this role. */
  achievements: number; drafts: number; experiences: number;
}
/**
 * Where achievements are recorded, role by role, most recent role first.
 * Archived achievements are left out, matching the Vault's default view.
 */
export function roleCoverage(c: CareerCollections): { roles: RoleCoverage[]; withoutRole: number } {
  // CP-012D: aggregate once, rather than re-filter every achievement/link for
  // each role. Large histories should not make Home cost O(roles * records).
  const achievementCounts = new Map<string, {achievements: number; drafts: number}>();
  let withoutRole = 0;
  for (const a of c.achievements) {
    if (a.status === 'archived') continue;
    if (!a.roleId) { withoutRole++; continue; }
    const count = achievementCounts.get(a.roleId) ?? {achievements: 0, drafts: 0};
    count.achievements++;
    if (a.status === 'draft') count.drafts++;
    achievementCounts.set(a.roleId, count);
  }
  const experienceCounts = new Map<string, number>();
  for (const link of c.recordLinks) {
    if (link.linkType !== 'role-project') continue;
    experienceCounts.set(link.sourceId, (experienceCounts.get(link.sourceId) ?? 0) + 1);
  }
  const employerNames = new Map(c.employers.map(e => [e.id, e.name]));
  const roles = [...c.roles].sort(compareRolesByRecency).map(r => ({
    roleId: r.id, title: r.title, employer: employerNames.get(r.employerId) ?? '',
    current: r.isCurrent, startDate: r.startDate, endDate: r.endDate,
    achievements: achievementCounts.get(r.id)?.achievements ?? 0,
    drafts: achievementCounts.get(r.id)?.drafts ?? 0,
    experiences: experienceCounts.get(r.id) ?? 0
  }));
  return { roles, withoutRole };
}

/** CP-UX-Fluid (DEC-038): one month of the Home record timeline. */
export interface RecordMonth {
  /** YYYY-MM */
  key: string;
  count: number;
  /** The month's recorded achievements, latest date first. */
  ids: string[];
}
export interface MonthlyRecord {
  months: RecordMonth[];
  total: number;
  /** Recorded achievements dated only by a year that the window touches; they cannot be placed in a month. */
  yearOnly: number;
  /** The calendar years the window touches, e.g. ['2025','2026']. */
  years: string[];
}
const monthKey = (year: number, monthIndex: number) => {
  const d = new Date(Date.UTC(year, monthIndex, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
/**
 * Recorded achievements counted by the month they happened, for the `span`
 * months ending with the month of `today` (YYYY-MM-DD). Drafts, archived
 * entries and undated records are left out; a month- or day-precision date
 * places an achievement in its month, a year-only date cannot and is counted
 * separately. Counts only: no targets, streaks, averages or scores (DEC-038).
 */
export function recordByMonth(achievements: readonly Pick<Achievement, 'id' | 'status' | 'occurredStart' | 'updatedAt'>[], today: string, span = 12): MonthlyRecord {
  const [year, month] = today.split('-').map(Number);
  const keys = Array.from({ length: span }, (_, i) => monthKey(year!, month! - 1 - (span - 1 - i)));
  const byMonth = new Map(keys.map(k => [k, [] as Pick<Achievement, 'id' | 'occurredStart' | 'updatedAt'>[]]));
  const years = [...new Set(keys.map(k => k.slice(0, 4)))];
  let yearOnly = 0;
  for (const a of achievements) {
    if (a.status !== 'recorded' || !a.occurredStart) continue;
    if (a.occurredStart.precision === 'year') { if (years.includes(a.occurredStart.value)) yearOnly++; continue; }
    byMonth.get(a.occurredStart.value.slice(0, 7))?.push(a);
  }
  const months = keys.map(key => {
    const list = byMonth.get(key)!.sort((a, b) => b.occurredStart!.value.localeCompare(a.occurredStart!.value) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
    return { key, count: list.length, ids: list.map(a => a.id) };
  });
  return { months, total: months.reduce((sum, m) => sum + m.count, 0), yearOnly, years };
}
