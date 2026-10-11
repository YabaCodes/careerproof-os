/**
 * CP-012.4 (DEC-034) — an Experience is a light container for achievements.
 *
 * An experience records *where* results happened: a project, initiative or
 * ongoing responsibility with its employer, roles, dates and a short context.
 * The results themselves live in linked achievements, so the experience card
 * rolls up their outcomes instead of asking for a separate outcome.
 *
 * Nothing in the data format changes. The narrative fields that achievements
 * now cover (objective, personal responsibility, outcome) stay in every
 * record, are shown wherever they hold text, and are never cleared
 * automatically. Pure functions only.
 */
import type { CareerCollections, Project, Role } from './models.js';
import { dateBounds } from './dates.js';
import { normalizeName } from './taxonomy.js';
import { ValidationError } from './validation.js';

export const EXPERIENCE_NAME_MAX = 160;
const TYPES: readonly Project['experienceType'][] = ['project', 'initiative', 'ongoing-responsibility'];

/** A new experience typed into the achievement form; saved with that achievement. */
export interface InlineExperienceDraft { id: string; name: string; experienceType: Project['experienceType'] }

export type LegacyExperienceField = 'objective' | 'personalResponsibility' | 'outcome';
export const LEGACY_EXPERIENCE_FIELDS: readonly { key: LegacyExperienceField; label: string }[] = [
  { key: 'objective', label: 'Objective' },
  { key: 'personalResponsibility', label: 'My Responsibilities' },
  { key: 'outcome', label: 'Outcome' }
];
/** Earlier narrative text on this experience, in display order; empty fields are omitted. */
export function legacyExperienceNotes(p: Project): { key: LegacyExperienceField; label: string; value: string }[] {
  return LEGACY_EXPERIENCE_FIELDS.filter(f => p[f.key].trim()).map(f => ({ ...f, value: p[f.key] }));
}

/**
 * The record for an experience created inline. Its employer comes from the
 * achievement's role (if any) so the role link the data layer adds is valid.
 */
export function inlineExperience(draft: InlineExperienceDraft, role: Role | null): Omit<Project, 'createdAt' | 'updatedAt' | 'revision'> {
  const name = draft.name.trim();
  if (!name) throw new ValidationError('Experience name is required.');
  if (name.length > EXPERIENCE_NAME_MAX) throw new ValidationError(`Experience name must be ${EXPERIENCE_NAME_MAX} characters or fewer.`);
  if (!TYPES.includes(draft.experienceType)) throw new ValidationError('Choose a valid experience type.');
  return {
    id: draft.id, name, experienceType: draft.experienceType, status: 'active', employerId: role?.employerId ?? null,
    startDate: null, endDate: null, objective: '', scope: '', personalResponsibility: '', technologies: [], outcome: '',
    confidentiality: 'confidential'
  };
}

/** An existing experience with the same name (ignoring case and spacing), if any. */
export function matchingExperience(projects: readonly Project[], name: string): Project | null {
  const wanted = normalizeName(name);
  return wanted ? projects.find(p => normalizeName(p.name) === wanted) ?? null : null;
}

export interface RollupItem { id: string; title: string; status: 'draft' | 'recorded' | 'archived'; outcome: string; metrics: number }
export interface ExperienceRollup { items: RollupItem[]; withOutcome: number }
/**
 * Linked achievements with their stated outcomes, most recent first and
 * archived last. Counts describe what is documented, not its quality.
 */
export function experienceRollup(c: CareerCollections, projectId: string): ExperienceRollup {
  const ids = new Set(c.recordLinks.filter(l => l.linkType === 'achievement-project' && l.targetId === projectId).map(l => l.sourceId));
  const latest = (d: { value: string; precision: 'year' | 'month' | 'day' } | null) => d ? dateBounds(d).latest : '';
  const linked = c.achievements.filter(a => ids.has(a.id)).sort((a, b) =>
    Number(a.status === 'archived') - Number(b.status === 'archived')
    || latest(b.occurredStart).localeCompare(latest(a.occurredStart))
    || b.updatedAt.localeCompare(a.updatedAt)
    || a.id.localeCompare(b.id));
  const items = linked.map(a => ({ id: a.id, title: a.title, status: a.status, outcome: a.outcome.trim(),
    metrics: c.impactMetrics.filter(m => m.achievementId === a.id).length }));
  return { items, withOutcome: items.filter(i => i.outcome).length };
}
