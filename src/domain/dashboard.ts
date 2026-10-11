/**
 * CP-012C — Home dashboard summaries (CP-01, CP-FR-014).
 *
 * Truthful, derived views of what is recorded and what is missing. Counts
 * describe documentation only: no scores, ratings, targets or streaks. Pure
 * functions; the gap wording comes from the same rules as Data Health.
 */
import type { CareerCollections, PrecisionDate } from './models.js';
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
  const active = c.achievements.filter(a => a.status !== 'archived');
  const roles = [...c.roles].sort(compareRolesByRecency).map(r => {
    const mine = active.filter(a => a.roleId === r.id);
    return {
      roleId: r.id, title: r.title, employer: c.employers.find(e => e.id === r.employerId)?.name ?? '',
      current: r.isCurrent, startDate: r.startDate, endDate: r.endDate,
      achievements: mine.length, drafts: mine.filter(a => a.status === 'draft').length,
      experiences: c.recordLinks.filter(l => l.linkType === 'role-project' && l.sourceId === r.id).length
    };
  });
  return { roles, withoutRole: active.filter(a => !a.roleId).length };
}
