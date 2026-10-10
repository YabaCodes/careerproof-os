/**
 * CP-012B — controlled unlink, reassignment and deletion.
 *
 * Pure planning: given the current collections, describe what removing one
 * record would affect (removalImpact) and the exact writes needed
 * (planRemoval). The data layer applies a plan inside one IndexedDB
 * transaction after re-checking the record revision.
 *
 * Invariants:
 *  - Achievements and their metrics/evidence are never deleted here.
 *  - Only the chosen record is deleted; dependents are re-pointed ("move") or
 *    lose the link ("unlink"), each change bumping revision and updatedAt.
 *  - The full dataset is re-validated before anything is written.
 */
import type { BaseRecord, CareerCollections, P0Store, RecordLink } from './models.js';
import { validateCollections, ValidationError } from './validation.js';

export type RemovableKind = 'employers' | 'roles' | 'education' | 'credentials' | 'projects' | 'competencies';
export type RemovalMode = 'delete' | 'unlink' | 'move';
export interface RemovalRef { id: string; label: string; primary?: boolean }
export interface RemovalImpact {
  kind: RemovableKind; id: string; label: string; noun: string;
  achievements: RemovalRef[]; roles: RemovalRef[]; projects: RemovalRef[];
  primaryRole: boolean; hasDependents: boolean;
  canUnlink: boolean; unlinkBlockedReason: string | null;
  targets: RemovalRef[]; moveBlockedReason: string | null;
}
export interface RemovalPlan {
  puts: { store: P0Store; record: BaseRecord }[];
  deletes: { store: P0Store; id: string }[];
  collections: CareerCollections;
  summary: string;
}

const NOUN: Record<RemovableKind, string> = { employers: 'employer', roles: 'role', education: 'education entry', credentials: 'credential', projects: 'experience', competencies: 'skill' };
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const byLabel = (a: RemovalRef, b: RemovalRef) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id);

function labelOf(c: CareerCollections, kind: RemovableKind, id: string): string | null {
  switch (kind) {
    case 'employers': return c.employers.find(r => r.id === id)?.name ?? null;
    case 'roles': { const r = c.roles.find(x => x.id === id); if (!r) return null; const e = c.employers.find(x => x.id === r.employerId); return e ? `${r.title} · ${e.name}` : r.title; }
    case 'education': return c.education.find(r => r.id === id)?.qualification ?? null;
    case 'credentials': return c.credentials.find(r => r.id === id)?.name ?? null;
    case 'projects': return c.projects.find(r => r.id === id)?.name ?? null;
    case 'competencies': return c.competencies.find(r => r.id === id)?.name ?? null;
  }
}
function achievementRefs(c: CareerCollections, ids: Iterable<string>, primary = new Set<string>()): RemovalRef[] {
  const wanted = new Set(ids);
  return c.achievements.filter(a => wanted.has(a.id)).map(a => ({ id: a.id, label: a.title, primary: primary.has(a.id) })).sort(byLabel);
}

export function removalImpact(c: CareerCollections, kind: RemovableKind, id: string): RemovalImpact {
  const label = labelOf(c, kind, id);
  if (label === null) throw new ValidationError('This record no longer exists. Reload and try again.');
  const base: RemovalImpact = { kind, id, label, noun: NOUN[kind], achievements: [], roles: [], projects: [], primaryRole: false,
    hasDependents: false, canUnlink: true, unlinkBlockedReason: null, targets: [], moveBlockedReason: null };
  const links = c.recordLinks;
  switch (kind) {
    case 'employers': {
      base.roles = c.roles.filter(r => r.employerId === id).map(r => ({ id: r.id, label: r.title })).sort(byLabel);
      base.projects = c.projects.filter(p => p.employerId === id).map(p => ({ id: p.id, label: p.name })).sort(byLabel);
      base.targets = c.employers.filter(e => e.id !== id).map(e => ({ id: e.id, label: e.name })).sort(byLabel);
      if (base.roles.length) { base.canUnlink = false; base.unlinkBlockedReason = 'Roles cannot exist without an employer, so they must move to another employer.'; }
      if (!base.targets.length) base.moveBlockedReason = 'There is no other employer to move these records to. Add one first, or delete its roles one by one.';
      break;
    }
    case 'roles': {
      base.achievements = achievementRefs(c, c.achievements.filter(a => a.roleId === id).map(a => a.id));
      const projectIds = links.filter(l => l.linkType === 'role-project' && l.sourceId === id).map(l => l.targetId);
      base.projects = c.projects.filter(p => projectIds.includes(p.id)).map(p => ({ id: p.id, label: p.name })).sort(byLabel);
      base.primaryRole = c.profiles[0]?.primaryRoleId === id;
      const linkedProjects = c.projects.filter(p => projectIds.includes(p.id));
      base.targets = c.roles.filter(r => r.id !== id && linkedProjects.every(p => p.employerId === null || p.employerId === r.employerId))
        .map(r => ({ id: r.id, label: labelOf(c, 'roles', r.id)! })).sort(byLabel);
      if (!base.targets.length) base.moveBlockedReason = c.roles.length > 1 ? 'No other role belongs to a compatible employer for the linked experiences.' : 'There is no other role to move these records to.';
      break;
    }
    case 'projects': {
      const achievementLinks = links.filter(l => l.linkType === 'achievement-project' && l.targetId === id);
      base.achievements = achievementRefs(c, achievementLinks.map(l => l.sourceId), new Set(achievementLinks.filter(l => l.isPrimary).map(l => l.sourceId)));
      const roleIds = links.filter(l => l.linkType === 'role-project' && l.targetId === id).map(l => l.sourceId);
      const linkedRoles = c.roles.filter(r => roleIds.includes(r.id));
      base.roles = linkedRoles.map(r => ({ id: r.id, label: labelOf(c, 'roles', r.id)! })).sort(byLabel);
      base.targets = c.projects.filter(p => p.id !== id && linkedRoles.every(r => p.employerId === null || p.employerId === r.employerId))
        .map(p => ({ id: p.id, label: p.name })).sort(byLabel);
      if (!base.targets.length) base.moveBlockedReason = c.projects.length > 1 ? 'No other experience is compatible with the employers of the linked roles.' : 'There is no other experience to move these links to.';
      break;
    }
    case 'competencies': {
      const skill = c.competencies.find(s => s.id === id)!;
      if (skill.isBuiltIn) throw new ValidationError('Built-in skills cannot be deleted.');
      base.achievements = achievementRefs(c, links.filter(l => l.linkType === 'achievement-competency' && l.targetId === id).map(l => l.sourceId));
      base.targets = c.competencies.filter(s => s.id !== id && s.status === 'active').map(s => ({ id: s.id, label: s.name })).sort(byLabel);
      if (!base.targets.length) base.moveBlockedReason = 'There is no other active skill to move these links to.';
      break;
    }
    default: break; // education and credentials have no dependents
  }
  base.hasDependents = Boolean(base.achievements.length || base.roles.length || base.projects.length || base.primaryRole);
  return base;
}

export function planRemoval(source: CareerCollections, kind: RemovableKind, id: string, mode: RemovalMode, targetId: string | null, now: string): RemovalPlan {
  const impact = removalImpact(source, kind, id);
  if (mode === 'delete' && impact.hasDependents) throw new ValidationError('Choose whether to move or unlink the linked records first.');
  if (mode === 'unlink' && !impact.canUnlink) throw new ValidationError(impact.unlinkBlockedReason ?? 'Unlinking is not available.');
  if (mode === 'move' && !impact.targets.some(t => t.id === targetId)) throw new ValidationError('Choose a compatible record to move the links to.');
  const target = mode === 'move' ? targetId! : null;
  const c = structuredClone(source);
  const puts = new Map<string, { store: P0Store; record: BaseRecord }>();
  const deletes: { store: P0Store; id: string }[] = [];
  const counts = { achievements: 0, roles: 0, projects: 0, links: 0 };

  const bump = <T extends BaseRecord>(store: P0Store, record: T, changes: Partial<T>): T => {
    if (record.revision === Number.MAX_SAFE_INTEGER) throw new ValidationError('Record revision limit reached.');
    const next = { ...record, ...changes, updatedAt: now, revision: record.revision + 1 } as T;
    const list = c[store] as unknown as T[];
    list[list.findIndex(r => r.id === record.id)] = next;
    puts.set(store + ':' + record.id, { store, record: next });
    return next;
  };
  const drop = (store: P0Store, recordId: string) => {
    (c[store] as unknown as BaseRecord[]) = (c[store] as unknown as BaseRecord[]).filter(r => r.id !== recordId);
    puts.delete(store + ':' + recordId);
    deletes.push({ store, id: recordId });
  };
  const sameLink = (l: RecordLink, sourceId: string, targetIdValue: string) =>
    c.recordLinks.find(x => x.id !== l.id && x.linkType === l.linkType && x.sourceId === sourceId && x.targetId === targetIdValue);
  /** Re-point one end of a link, merging into an existing identical link (keeping a primary flag). */
  const moveLink = (l: RecordLink, end: 'sourceId' | 'targetId') => {
    const sourceId = end === 'sourceId' ? target! : l.sourceId, targetIdValue = end === 'targetId' ? target! : l.targetId;
    const existing = sameLink(l, sourceId, targetIdValue);
    if (existing) {
      if (l.isPrimary && !existing.isPrimary) bump('recordLinks', existing, { isPrimary: true });
      drop('recordLinks', l.id);
    } else bump('recordLinks', l, { [end]: target! } as Partial<RecordLink>);
    counts.links++;
  };
  const relink = (l: RecordLink, end: 'sourceId' | 'targetId') => { if (target) moveLink(l, end); else { drop('recordLinks', l.id); counts.links++; } };

  switch (kind) {
    case 'employers':
      for (const r of c.roles.filter(r => r.employerId === id)) { bump('roles', r, { employerId: target! }); counts.roles++; }
      for (const p of c.projects.filter(p => p.employerId === id)) { bump('projects', p, { employerId: target }); counts.projects++; }
      break;
    case 'roles': {
      for (const a of c.achievements.filter(a => a.roleId === id)) { bump('achievements', a, { roleId: target }); counts.achievements++; }
      for (const l of c.recordLinks.filter(l => l.linkType === 'role-project' && l.sourceId === id)) relink(l, 'sourceId');
      const profile = c.profiles[0]!;
      if (profile.primaryRoleId === id) bump('profiles', profile, { primaryRoleId: target });
      break;
    }
    case 'projects':
      for (const l of c.recordLinks.filter(l => l.targetId === id && (l.linkType === 'achievement-project' || l.linkType === 'role-project'))) {
        if (l.linkType === 'achievement-project') counts.achievements++; else counts.roles++;
        relink(l, 'targetId');
      }
      break;
    case 'competencies':
      for (const l of c.recordLinks.filter(l => l.linkType === 'achievement-competency' && l.targetId === id)) { counts.achievements++; relink(l, 'targetId'); }
      break;
    default: break;
  }
  drop(kind, id);
  validateCollections(c);

  const targetLabel = target ? impact.targets.find(t => t.id === target)!.label : '';
  const parts: string[] = [];
  if (counts.achievements) parts.push(plural(counts.achievements, 'achievement'));
  if (counts.roles) parts.push(plural(counts.roles, 'role'));
  if (counts.projects) parts.push(plural(counts.projects, 'experience'));
  const noun = NOUN[kind].charAt(0).toUpperCase() + NOUN[kind].slice(1);
  const summary = !parts.length ? `${noun} deleted.`
    : target ? `${noun} deleted. ${parts.join(', ')} moved to “${targetLabel}”.`
    : `${noun} deleted. ${parts.join(', ')} kept without this ${NOUN[kind]}.`;
  return { puts: [...puts.values()], deletes, collections: c, summary };
}
