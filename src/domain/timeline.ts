/**
 * CP-UX1 (DEC-036) — reading and scanning.
 *
 * Pure derivations for the Experience timeline, an experience's page and the
 * Vault rows: experiences grouped under the role they were most recently part
 * of, ordered by recency, plus the context label shown under each achievement.
 * Nothing here writes data or changes what is stored.
 */
import type { CareerCollections, PrecisionDate, Project, Role } from './models.js';
import { compareRolesByRecency } from './chronology.js';
import { dateBounds } from './dates.js';

export interface TimelineExperience {
  project: Project;
  /** Recorded linked achievements. Drafts are counted separately and never inflate this. */
  achievements: number;
  drafts: number;
  /** Earlier roles the experience is also linked to, most recent first. */
  alsoRoles: string[];
  ongoing: boolean;
}
export interface TimelineGroup {
  key: string;
  role: Role | null;
  title: string;
  employer: string;
  current: boolean;
  startDate: PrecisionDate | null;
  endDate: PrecisionDate | null;
  experiences: TimelineExperience[];
  /** Active achievements linked to this role but to no experience. */
  looseAchievements: number;
}

const latest = (d: PrecisionDate | null) => (d ? dateBounds(d).latest : '');
/** Not completed means still running, whatever its dates say. */
export const isOngoing = (p: Project) => p.status !== 'completed';

/** Ongoing first (newest start first), then by latest end, undated last. */
export function compareExperiencesByRecency(a: Project, b: Project): number {
  const oa = isOngoing(a), ob = isOngoing(b);
  if (oa !== ob) return oa ? -1 : 1;
  const ka = oa ? latest(a.startDate) : latest(a.endDate) || latest(a.startDate);
  const kb = ob ? latest(b.startDate) : latest(b.endDate) || latest(b.startDate);
  return kb.localeCompare(ka) || latest(b.startDate).localeCompare(latest(a.startDate))
    || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

/**
 * Every role (most recent first) with the experiences whose most recent linked
 * role it is. Experiences linked to no role follow, grouped by employer.
 */
export function experienceTimeline(c: CareerCollections): TimelineGroup[] {
  const roles = [...c.roles].sort(compareRolesByRecency);
  const rank = new Map(roles.map((r, i) => [r.id, i]));
  const employerName = new Map(c.employers.map(e => [e.id, e.name]));
  const rolesOf = new Map<string, Role[]>();
  for (const l of c.recordLinks) {
    if (l.linkType !== 'role-project') continue;
    const role = roles[rank.get(l.sourceId) ?? -1];
    if (!role) continue;
    const list = rolesOf.get(l.targetId) ?? [];
    list.push(role);
    rolesOf.set(l.targetId, list);
  }
  const counts = new Map<string, { achievements: number; drafts: number }>();
  const inExperience = new Set<string>();
  const active = new Map(c.achievements.filter(a => a.status !== 'archived').map(a => [a.id, a]));
  for (const l of c.recordLinks) {
    if (l.linkType !== 'achievement-project') continue;
    const a = active.get(l.sourceId);
    if (!a) continue;
    inExperience.add(a.id);
    const n = counts.get(l.targetId) ?? { achievements: 0, drafts: 0 };
    if (a.status === 'draft') n.drafts++; else n.achievements++;
    counts.set(l.targetId, n);
  }
  const loose = new Map<string, number>();
  for (const a of active.values()) if (a.roleId && !inExperience.has(a.id)) loose.set(a.roleId, (loose.get(a.roleId) ?? 0) + 1);

  const byGroup = new Map<string, TimelineExperience[]>();
  for (const p of c.projects) {
    const linked = (rolesOf.get(p.id) ?? []).sort((x, y) => (rank.get(x.id) ?? 0) - (rank.get(y.id) ?? 0));
    const key = linked[0] ? 'role:' + linked[0].id : 'employer:' + (p.employerId ?? 'none');
    const n = counts.get(p.id) ?? { achievements: 0, drafts: 0 };
    const list = byGroup.get(key) ?? [];
    list.push({ project: p, achievements: n.achievements, drafts: n.drafts, alsoRoles: linked.slice(1).map(r => r.title), ongoing: isOngoing(p) });
    byGroup.set(key, list);
  }
  const sorted = (list: TimelineExperience[] = []) => list.sort((x, y) => compareExperiencesByRecency(x.project, y.project));
  const groups: TimelineGroup[] = roles.map(r => ({
    key: 'role:' + r.id, role: r, title: r.title, employer: employerName.get(r.employerId) ?? '', current: r.isCurrent,
    startDate: r.startDate, endDate: r.endDate, experiences: sorted(byGroup.get('role:' + r.id)), looseAchievements: loose.get(r.id) ?? 0
  }));
  // Named employers alphabetically; experiences with no known employer last.
  const unlinked = [...byGroup.keys()].filter(k => k.startsWith('employer:')).sort((a, b) => {
    const na = employerName.get(a.slice(9)), nb = employerName.get(b.slice(9));
    if (!na || !nb) return Number(!na) - Number(!nb);
    return na.localeCompare(nb);
  });
  for (const key of unlinked) {
    const name = employerName.get(key.slice(9)) ?? '';
    groups.push({ key, role: null, title: name ? 'Other Experiences at ' + name : 'Independent Experiences', employer: '', current: false,
      startDate: null, endDate: null, experiences: sorted(byGroup.get(key)), looseAchievements: 0 });
  }
  return groups;
}

/** Roles an experience belongs to, oldest first, for its page subtitle. */
export function experienceRoles(c: CareerCollections, projectId: string): Role[] {
  const ids = new Set(c.recordLinks.filter(l => l.linkType === 'role-project' && l.targetId === projectId).map(l => l.sourceId));
  return c.roles.filter(r => ids.has(r.id)).sort(compareRolesByRecency).reverse();
}

/** Skills shown by an experience's recorded achievements, most used first. */
export function experienceSkills(c: CareerCollections, projectId: string): { id: string; name: string; count: number }[] {
  const recorded = new Set(c.achievements.filter(a => a.status === 'recorded').map(a => a.id));
  const mine = new Set(c.recordLinks.filter(l => l.linkType === 'achievement-project' && l.targetId === projectId && recorded.has(l.sourceId)).map(l => l.sourceId));
  const counts = new Map<string, number>();
  for (const l of c.recordLinks) if (l.linkType === 'achievement-competency' && mine.has(l.sourceId)) counts.set(l.targetId, (counts.get(l.targetId) ?? 0) + 1);
  return c.competencies.filter(s => counts.has(s.id)).map(s => ({ id: s.id, name: s.name, count: counts.get(s.id)! }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * The one line of context shown under an achievement in lists: its primary
 * experience, otherwise its first experience, otherwise its role.
 */
export function achievementContexts(c: CareerCollections): Map<string, string> {
  const projectName = new Map(c.projects.map(p => [p.id, p.name]));
  const roleTitle = new Map(c.roles.map(r => [r.id, r.title]));
  const out = new Map<string, string>();
  const primaryFirst = [...c.recordLinks].filter(l => l.linkType === 'achievement-project')
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  for (const l of primaryFirst) if (!out.has(l.sourceId) && projectName.has(l.targetId)) out.set(l.sourceId, projectName.get(l.targetId)!);
  for (const a of c.achievements) if (!out.has(a.id) && a.roleId && roleTitle.has(a.roleId)) out.set(a.id, roleTitle.get(a.roleId)!);
  return out;
}

/** The year heading an achievement is listed under in the Vault. */
export const achievementYear = (occurredStart: PrecisionDate | null): string => occurredStart ? occurredStart.value.slice(0, 4) : 'No Date';
