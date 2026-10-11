/**
 * CP-012.3 — display order for the employment timeline.
 *
 * Most recent first, independent of the order records were entered or of
 * employer names. Pure and side-effect free; it only orders copies.
 *
 *  - A current role counts as open-ended, so it always ranks above ended roles.
 *  - Otherwise a role is as recent as the latest day its end date can mean
 *    (its start date when no end is recorded), so a year-only "2022" ranks
 *    after "2022-06" only when it really could be later.
 *  - An employer is as recent as its most recent role. Employers without any
 *    role have no dates to place them, so they follow the dated timeline.
 */
import type { Employer, Role } from './models.js';
import { dateBounds } from './dates.js';

const OPEN_END = '9999-12-31';

/** Latest day the role can have been held; current roles are open-ended. */
export function roleRecency(role: Role): string {
  if (role.isCurrent) return OPEN_END;
  return dateBounds(role.endDate ?? role.startDate).latest;
}

/** Sort comparator: most recent role first; ties by later start, then title. */
export function compareRolesByRecency(a: Role, b: Role): number {
  return roleRecency(b).localeCompare(roleRecency(a))
    || dateBounds(b.startDate).latest.localeCompare(dateBounds(a.startDate).latest)
    || a.title.localeCompare(b.title)
    || a.id.localeCompare(b.id);
}

/** Employers ordered by their most recent role (copy; input is not modified). */
export function employersByRecency(employers: readonly Employer[], roles: readonly Role[]): Employer[] {
  const latest = new Map<string, { end: string; start: string }>();
  for (const role of roles) {
    const end = roleRecency(role), start = dateBounds(role.startDate).latest;
    const seen = latest.get(role.employerId);
    if (!seen) latest.set(role.employerId, { end, start });
    else { if (end > seen.end) seen.end = end; if (start > seen.start) seen.start = start; }
  }
  return [...employers].sort((a, b) => {
    const ka = latest.get(a.id), kb = latest.get(b.id);
    if (ka && !kb) return -1;
    if (!ka && kb) return 1;
    const byDate = ka && kb ? kb.end.localeCompare(ka.end) || kb.start.localeCompare(ka.start)
      : b.createdAt.localeCompare(a.createdAt);
    return byDate || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
