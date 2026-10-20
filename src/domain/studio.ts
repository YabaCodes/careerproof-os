/**
 * CP-STU (DEC-040) — Performance & Promotion Studio and CV Builder.
 *
 * Pure functions that turn career records into an editable document snapshot
 * and later compare that snapshot with the records again. Rules:
 *  - Only Recorded achievements are offered; Drafts and Archived never appear.
 *  - Confidential achievements and experiences are left out unless the user
 *    includes them for this one document. A left-out experience's name and
 *    goal are not used anywhere, not even as context.
 *  - Text is copied from the user's own words. Nothing is invented, scored or
 *    rated; skills are listed with the achievements that show them.
 *  - A source change never rewrites a block. `documentReview` reports what
 *    differs, and the user chooses: use the updated text or keep their own.
 */
import type {
  Achievement, BlockContent, BlockKind, CareerCollections, CareerDocument, ContactField, ContentBlock, DocumentSection,
  DocumentSectionSetting, DocumentSource, DocumentSourceDraft, DocumentSourceType, DocumentTemplate, DocumentType,
  Education, Credential, PrecisionDate, Project, Role
} from './models.js';
import { dateBounds } from './dates.js';
import { compareRolesByRecency } from './chronology.js';
import { compareExperiencesByRecency } from './timeline.js';

export const TEMPLATE_LABELS: Record<DocumentTemplate, string> = {
  'review-standard': 'Performance Review', 'cv-professional': 'Professional Standard', 'cv-technical': 'Technical Specialist'
};
export const CONTACT_LABELS: Record<ContactField, string> = { email: 'Email', phone: 'Phone', location: 'Location', website: 'Website', links: 'Professional links' };
const DEFAULT_ORDER: Record<DocumentTemplate, DocumentSection[]> = {
  'review-standard': ['summary', 'achievements', 'skills', 'next'],
  'cv-professional': ['contact', 'summary', 'experience', 'skills', 'technologies', 'education', 'credentials'],
  'cv-technical': ['contact', 'summary', 'skills', 'technologies', 'projects', 'experience', 'education', 'credentials']
};
export function defaultSections(template: DocumentTemplate): DocumentSectionSetting[] {
  return DEFAULT_ORDER[template].map(key => ({ key, visible: true }));
}
export function sectionLabel(doc: Pick<CareerDocument, 'documentType' | 'templateId'>, key: DocumentSection): string {
  const technical = doc.templateId === 'cv-technical';
  switch (key) {
    case 'contact': return 'Contact';
    case 'summary': return 'Summary';
    case 'achievements': return 'Key Achievements';
    case 'experience': return technical ? 'Employment' : 'Experience';
    case 'projects': return 'Selected Projects';
    case 'skills': return doc.documentType === 'review' ? 'Skills Shown' : technical ? 'Core Skills' : 'Skills';
    case 'technologies': return 'Technologies';
    case 'education': return 'Education';
    case 'credentials': return 'Credentials';
    case 'next': return 'Next Period';
  }
}

// ---------------------------------------------------------------- dates
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "2024", "Sep 2026" — fixed English, so a document reads the same on every device. */
export function monthLabel(d: PrecisionDate | null): string {
  if (!d) return '';
  if (d.precision === 'year') return d.value;
  return `${SHORT[Number(d.value.slice(5, 7)) - 1]} ${d.value.slice(0, 4)}`;
}
const year = (d: PrecisionDate | null) => (d ? d.value.slice(0, 4) : '');
const month = (value: string) => ({ value: value.slice(0, 7), precision: 'month' as const });
/** The calendar month `offset` months from YYYY-MM-DD `today`. */
export function shiftMonth(today: string, offset: number): string {
  const y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7)) - 1 + offset;
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
export type PeriodPreset = 'last-6' | 'last-12' | 'this-year';
export function presetPeriod(preset: PeriodPreset, today: string): { start: PrecisionDate; end: PrecisionDate } {
  const end = month(today);
  const start = preset === 'this-year' ? month(today.slice(0, 4) + '-01') : month(shiftMonth(today, preset === 'last-6' ? -5 : -11));
  return { start, end };
}
/** "Apr–Sep 2026", "Nov 2025–Oct 2026", "Sep 2026". */
export function periodShort(start: PrecisionDate | null, end: PrecisionDate | null): string {
  if (!start || !end) return monthLabel(start ?? end);
  if (start.value === end.value) return monthLabel(start);
  const sy = start.value.slice(0, 4), ey = end.value.slice(0, 4);
  const sm = SHORT[Number(start.value.slice(5, 7)) - 1], em = SHORT[Number(end.value.slice(5, 7)) - 1];
  return sy === ey ? `${sm}–${em} ${ey}` : `${sm} ${sy}–${em} ${ey}`;
}
/** "April – September 2026". */
export function periodLong(start: PrecisionDate | null, end: PrecisionDate | null): string {
  if (!start || !end) return '';
  const sm = LONG[Number(start.value.slice(5, 7)) - 1], em = LONG[Number(end.value.slice(5, 7)) - 1];
  const sy = start.value.slice(0, 4), ey = end.value.slice(0, 4);
  if (start.value === end.value) return `${sm} ${sy}`;
  return sy === ey ? `${sm} – ${em} ${ey}` : `${sm} ${sy} – ${em} ${ey}`;
}
function inPeriod(a: Achievement, start: PrecisionDate, end: PrecisionDate): boolean {
  if (!a.occurredStart) return false;
  const when = dateBounds(a.occurredStart);
  return when.latest >= dateBounds(start).earliest && when.earliest <= dateBounds(end).latest;
}
const dateKey = (a: Achievement) => (a.occurredStart ? dateBounds(a.occurredStart).latest : '');
const newestFirst = (a: Achievement, b: Achievement) => dateKey(b).localeCompare(dateKey(a)) || b.updatedAt.localeCompare(a.updatedAt);

// ---------------------------------------------------------------- record helpers
interface Privacy { excludeConfidential: boolean }
const shareable = (p: Privacy, r: { confidentiality: 'standard-private' | 'confidential' }) => !p.excludeConfidential || r.confidentiality !== 'confidential';
const clean = (v: string) => v.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
const oneLine = (v: string) => v.replace(/\s+/g, ' ').trim();
/** The experience an achievement belongs to (primary first), if it may be named in this document. */
function experienceOf(c: CareerCollections, p: Privacy, achievementId: string): Project | null {
  const links = c.recordLinks.filter(l => l.linkType === 'achievement-project' && l.sourceId === achievementId)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  for (const l of links) {
    const project = c.projects.find(x => x.id === l.targetId);
    if (project && shareable(p, project)) return project;
  }
  return null;
}
function employerName(c: CareerCollections, id: string | null): string { return id ? c.employers.find(e => e.id === id)?.name ?? '' : ''; }
function contextOf(c: CareerCollections, p: Privacy, a: Achievement): string {
  const project = experienceOf(c, p, a.id);
  if (project) return project.name;
  const role = a.roleId ? c.roles.find(r => r.id === a.roleId) : undefined;
  return role ? role.title : '';
}
function metricText(c: CareerCollections, a: Achievement): string {
  return c.impactMetrics.filter(m => m.achievementId === a.id).map(m => {
    const values = m.baselineValue !== null && m.resultValue !== null ? `${m.baselineValue} to ${m.resultValue}`
      : m.resultValue !== null ? String(m.resultValue) : m.reportedValue !== null ? String(m.reportedValue) : m.baselineValue !== null ? `from ${m.baselineValue}` : '';
    return `${m.metricName}: ${[values, m.unit].filter(Boolean).join(' ')}`;
  }).join('; ');
}
function roleDates(r: Role): string {
  const start = year(r.startDate);
  return `${start} – ${r.isCurrent ? 'Present' : year(r.endDate) || 'End not recorded'}`;
}
function projectDates(p: Project): string {
  const start = year(p.startDate), end = year(p.endDate);
  if (!start && !end) return '';
  if (start && end) return start === end ? start : `${start} – ${end}`;
  return start ? (p.status === 'completed' ? start : `${start} – Present`) : end;
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const listJoin = (items: string[]) => items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
const displayUrl = (v: string) => v.replace(/^https?:\/\//i, '').replace(/\/$/, '');
/** Recorded, active achievements: the only ones a document may offer. */
const recorded = (c: CareerCollections) => c.achievements.filter(a => a.status === 'recorded');

// ---------------------------------------------------------------- candidates (what the journeys offer)
export interface Candidate { achievement: Achievement; detail: string; hasResult: boolean }
export interface CandidateGroup { key: string; label: string; items: Candidate[] }
function candidate(c: CareerCollections, a: Achievement): Candidate {
  const result = oneLine(a.outcome);
  return { achievement: a, hasResult: Boolean(result), detail: [monthLabel(a.occurredStart), result || 'No result stated'].filter(Boolean).join(' · ') };
}
export interface ReviewScope { periodStart: PrecisionDate; periodEnd: PrecisionDate; roleId: string | null; excludeConfidential: boolean }
export interface ReviewCandidates { groups: CandidateGroup[]; total: number; confidentialLeftOut: number; experienceCount: number }
/** Recorded achievements in the period (and role), grouped by experience, then by role. */
export function reviewCandidates(c: CareerCollections, scope: ReviewScope): ReviewCandidates {
  const pool = recorded(c).filter(a => inPeriod(a, scope.periodStart, scope.periodEnd) && (!scope.roleId || a.roleId === scope.roleId));
  const visible = pool.filter(a => shareable(scope, a)).sort(newestFirst);
  const groups = new Map<string, CandidateGroup>();
  for (const a of visible) {
    const project = experienceOf(c, scope, a.id);
    const role = a.roleId ? c.roles.find(r => r.id === a.roleId) : undefined;
    const key = project ? 'project:' + project.id : role ? 'role:' + role.id : 'other';
    const label = project ? project.name : role ? `As ${role.title}` : 'Not linked to a role';
    if (!groups.has(key)) groups.set(key, { key, label, items: [] });
    groups.get(key)!.items.push(candidate(c, a));
  }
  const list = [...groups.values()];
  return { groups: list, total: visible.length, confidentialLeftOut: pool.length - visible.length, experienceCount: list.filter(g => g.key.startsWith('project:')).length };
}
export interface CvRoleCandidates { role: Role; label: string; dates: string; items: Candidate[] }
export interface CvCandidates { roles: CvRoleCandidates[]; other: Candidate[]; confidentialLeftOut: number }
/** Each role (most recent first) with its recorded achievements, those with a stated result first. */
export function cvCandidates(c: CareerCollections, p: Privacy): CvCandidates {
  const pool = recorded(c), visible = pool.filter(a => shareable(p, a));
  const order = (a: Candidate, b: Candidate) => Number(b.hasResult) - Number(a.hasResult) || newestFirst(a.achievement, b.achievement);
  const roles = [...c.roles].sort(compareRolesByRecency).map(role => ({
    role, label: [role.title, employerName(c, role.employerId)].filter(Boolean).join(' · '), dates: roleDates(role),
    items: visible.filter(a => a.roleId === role.id).map(a => candidate(c, a)).sort(order)
  }));
  const known = new Set(c.roles.map(r => r.id));
  const other = visible.filter(a => !a.roleId || !known.has(a.roleId)).map(a => candidate(c, a)).sort(order);
  return { roles, other, confidentialLeftOut: pool.length - visible.length };
}
/** Up to five per role read best on a CV: preselect those, results first. */
export function cvDefaultSelection(cands: CvCandidates): string[] {
  return cands.roles.flatMap(r => r.items.slice(0, 5).map(i => i.achievement.id));
}
export function currentCredentials(c: CareerCollections, today: string): Credential[] {
  return c.credentials.filter(x => !x.expirationDate || dateBounds(x.expirationDate).latest >= today)
    .sort((a, b) => (b.issuedDate?.value ?? '').localeCompare(a.issuedDate?.value ?? '') || a.name.localeCompare(b.name));
}
export function educationByRecency(c: CareerCollections): Education[] {
  const key = (e: Education) => (e.completionDate ?? e.startDate)?.value ?? '';
  return [...c.education].sort((a, b) => key(b).localeCompare(key(a)) || a.institution.localeCompare(b.institution));
}
/** Contact details the profile holds; phone is offered but left off unless chosen. */
export function availableContact(c: CareerCollections): { field: ContactField; value: string }[] {
  const p = c.profiles[0]!;
  const out: { field: ContactField; value: string }[] = [];
  if (p.email.trim()) out.push({ field: 'email', value: p.email.trim() });
  if (p.phone.trim()) out.push({ field: 'phone', value: p.phone.trim() });
  if (p.location.trim()) out.push({ field: 'location', value: p.location.trim() });
  if (p.website.trim()) out.push({ field: 'website', value: displayUrl(p.website.trim()) });
  if (p.professionalLinks.length) out.push({ field: 'links', value: p.professionalLinks.map(displayUrl).join(' · ') });
  return out;
}
export const defaultContactFields = (c: CareerCollections): ContactField[] => availableContact(c).map(x => x.field).filter(f => f !== 'phone');

// ---------------------------------------------------------------- generation (one function per source key)
interface Scope extends Privacy {
  documentType: DocumentType; templateId: DocumentTemplate; contactFields: ContactField[];
  periodStart: PrecisionDate | null; periodEnd: PrecisionDate | null;
  achievementIds: string[]; roleIds: string[];
}
function scopeOf(doc: Pick<CareerDocument, 'documentType' | 'templateId' | 'excludeConfidential' | 'contactFields' | 'periodStart' | 'periodEnd'>, sources: readonly Pick<DocumentSource, 'sourceType' | 'sourceId' | 'order'>[]): Scope {
  const of = (t: DocumentSourceType) => [...sources].filter(s => s.sourceType === t).sort((a, b) => a.order - b.order).map(s => s.sourceId);
  return { documentType: doc.documentType, templateId: doc.templateId, excludeConfidential: doc.excludeConfidential, contactFields: doc.contactFields,
    periodStart: doc.periodStart, periodEnd: doc.periodEnd, achievementIds: of('achievement'), roleIds: of('role') };
}
export type Generated = { state: 'ok'; content: BlockContent } | { state: 'missing' | 'confidential' | 'not-recorded' };
const content = (heading: string, meta: string, date: string, text: string): Generated => ({ state: 'ok', content: { heading, meta, date, text } });
/** The selected achievements that can still be used: existing, Recorded and shareable. */
function usable(c: CareerCollections, s: Scope): Achievement[] {
  return s.achievementIds.map(id => c.achievements.find(a => a.id === id)).filter((a): a is Achievement => Boolean(a && a.status === 'recorded' && shareable(s, a)));
}
function summaryText(c: CareerCollections, s: Scope): string {
  const items = usable(c, s);
  if (!items.length) return 'No recorded achievements are selected for this period.';
  const labels: string[] = [];
  for (const a of items) {
    const project = experienceOf(c, s, a.id), role = a.roleId ? c.roles.find(r => r.id === a.roleId) : undefined;
    const label = project ? project.name : role ? `my role as ${role.title}` : '';
    if (label && !labels.includes(label)) labels.push(label);
  }
  const named = labels.length > 3 ? [...labels.slice(0, 3), 'other work'] : labels;
  const lead = s.periodStart && s.periodEnd ? (s.periodStart.value === s.periodEnd.value ? `In ${periodLong(s.periodStart, s.periodEnd)}, ` : `Between ${periodLong(s.periodStart, s.periodEnd).replace(' – ', ' and ')}, `) : '';
  return `${lead}I recorded ${plural(items.length, 'achievement')}${named.length ? ' across ' + listJoin(named) : ''}.`;
}
function skillCounts(c: CareerCollections, s: Scope): { id: string; name: string; categoryId: string; count: number }[] {
  const ids = new Set(usable(c, s).map(a => a.id)), counts = new Map<string, number>();
  for (const l of c.recordLinks) if (l.linkType === 'achievement-competency' && ids.has(l.sourceId)) counts.set(l.targetId, (counts.get(l.targetId) ?? 0) + 1);
  return c.competencies.filter(x => counts.has(x.id)).map(x => ({ id: x.id, name: x.name, categoryId: x.categoryId, count: counts.get(x.id)! }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
function technologies(c: CareerCollections, s: Scope): string[] {
  const seen = new Map<string, string>();
  const add = (list: string[]) => { for (const t of list) { const key = t.trim().toLocaleLowerCase(); if (key && !seen.has(key)) seen.set(key, t.trim()); } };
  for (const id of s.roleIds) add(c.roles.find(r => r.id === id)?.technologies ?? []);
  for (const a of usable(c, s)) { const p = experienceOf(c, s, a.id); if (p) add(p.technologies); }
  return [...seen.values()];
}
function achievementGenerated(c: CareerCollections, s: Scope, id: string): Generated {
  const a = c.achievements.find(x => x.id === id);
  if (!a) return { state: 'missing' };
  if (a.status !== 'recorded') return { state: 'not-recorded' };
  if (!shareable(s, a)) return { state: 'confidential' };
  if (s.documentType === 'review') {
    const lines = [a.outcome.trim() ? 'Result: ' + clean(a.outcome) : '', a.contribution.trim() ? 'What I did: ' + clean(a.contribution) : ''];
    const metrics = metricText(c, a);
    if (metrics) lines.push('Measured: ' + metrics);
    return content(a.title, [monthLabel(a.occurredStart), contextOf(c, s, a)].filter(Boolean).join(' · '), '', lines.filter(Boolean).join('\n'));
  }
  const detail = oneLine(a.outcome) || oneLine(a.contribution);
  return content('', '', '', detail ? `${a.title} — ${detail}` : a.title);
}
/** Generate the current content for one source key, or say why it cannot be generated any more. */
export function generateBlock(c: CareerCollections, s: Scope, key: string): Generated {
  const [kind, ...rest] = key.split(':'), id = rest.join(':');
  const profile = c.profiles[0]!;
  switch (kind) {
    case 'review-summary': return content('', '', '', summaryText(c, s));
    case 'review-skills': return content('', '', '', skillCounts(c, s).map(x => `${x.name} — ${plural(x.count, 'achievement')}`).join('\n'));
    case 'achievement': return achievementGenerated(c, s, id);
    case 'project-objective': {
      const p = c.projects.find(x => x.id === id);
      if (!p) return { state: 'missing' };
      if (!shareable(s, p)) return { state: 'confidential' };
      return content(p.name, '', '', clean(p.objective));
    }
    case 'profile-contact': {
      const values = new Map(availableContact(c).map(x => [x.field, x.value]));
      return content(profile.displayName.trim(), profile.headline.trim(), '', s.contactFields.map(f => values.get(f)).filter(Boolean).join(' · '));
    }
    case 'profile-summary': return content('', '', '', clean(profile.summary));
    case 'role': {
      const r = c.roles.find(x => x.id === id);
      if (!r) return { state: 'missing' };
      return content([r.title, employerName(c, r.employerId)].filter(Boolean).join(' — '), '', roleDates(r), '');
    }
    case 'project': {
      const p = c.projects.find(x => x.id === id);
      if (!p) return { state: 'missing' };
      if (!shareable(s, p)) return { state: 'confidential' };
      return content(p.name, employerName(c, p.employerId), projectDates(p), '');
    }
    case 'cv-other': return content(s.templateId === 'cv-technical' ? 'Other Work' : 'Other Achievements', '', '', '');
    case 'cv-skills': {
      const skills = skillCounts(c, s);
      if (s.templateId !== 'cv-technical') return content('', '', '', skills.map(x => x.name).join(' · '));
      const categories = [...c.competencyCategories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      return content('', '', '', categories.map(cat => {
        const names = skills.filter(x => x.categoryId === cat.id).map(x => x.name);
        return names.length ? `${cat.name}: ${names.join(' · ')}` : '';
      }).filter(Boolean).join('\n'));
    }
    case 'cv-technologies': return content('', '', '', technologies(c, s).join(' · '));
    case 'education': {
      const e = c.education.find(x => x.id === id);
      if (!e) return { state: 'missing' };
      const when = e.completionDate ? year(e.completionDate) : e.startDate ? `From ${year(e.startDate)}` : '';
      return content([e.qualification, e.discipline].filter(x => x.trim()).join(', '), e.institution, when, clean(e.honors));
    }
    case 'credential': {
      const x = c.credentials.find(r => r.id === id);
      if (!x) return { state: 'missing' };
      return content(x.name, x.issuer, year(x.issuedDate), '');
    }
    default: return { state: 'missing' };
  }
}

// ---------------------------------------------------------------- building a document
export interface BuiltDocument { document: Omit<CareerDocument, 'createdAt' | 'updatedAt'>; sources: DocumentSourceDraft[] }
class Builder {
  blocks: ContentBlock[] = [];
  sources: DocumentSourceDraft[] = [];
  constructor(private c: CareerCollections, private scope: Scope) {}
  add(section: DocumentSection, kind: BlockKind, key: string): void {
    const g = generateBlock(this.c, this.scope, key);
    if (g.state !== 'ok') return;
    this.blocks.push({ id: crypto.randomUUID(), section, kind, order: this.blocks.length, userEdited: false, sourceKey: key, ...g.content, generated: { ...g.content } });
  }
  source(type: DocumentSourceType, record: { id: string; revision: number } | undefined, label: string): void {
    if (!record || this.sources.some(s => s.sourceType === type && s.sourceId === record.id)) return;
    this.sources.push({ sourceType: type, sourceId: record.id, sourceRevision: record.revision, order: this.sources.length, sourceLabelSnapshot: label.slice(0, 300) });
  }
}
export interface ReviewInput extends ReviewScope { title: string; achievementIds: string[]; includeSkills: boolean; includeNext: boolean }
/** Experiences with an Expected Result for the Next Period section: ongoing, shareable and in scope. */
export function nextPeriodExperiences(c: CareerCollections, input: Pick<ReviewInput, 'roleId' | 'excludeConfidential' | 'achievementIds'>): Project[] {
  const inRole = new Set(c.recordLinks.filter(l => l.linkType === 'role-project' && l.sourceId === input.roleId).map(l => l.targetId));
  for (const id of input.achievementIds) { const p = experienceOf(c, input, id); if (p) inRole.add(p.id); }
  return c.projects.filter(p => p.status !== 'completed' && p.objective.trim() && shareable(input, p) && (!input.roleId || inRole.has(p.id)))
    .sort(compareExperiencesByRecency);
}
export function buildReview(c: CareerCollections, input: ReviewInput, now: string, sourceDataRevision: number): BuiltDocument {
  const allowed = new Set(reviewCandidates(c, input).groups.flatMap(g => g.items.map(i => i.achievement.id)));
  const chosen = input.achievementIds.filter(id => allowed.has(id));
  const scope: Scope = { documentType: 'review', templateId: 'review-standard', excludeConfidential: input.excludeConfidential, contactFields: [],
    periodStart: input.periodStart, periodEnd: input.periodEnd, achievementIds: chosen, roleIds: input.roleId ? [input.roleId] : [] };
  const b = new Builder(c, scope);
  for (const id of chosen) {
    const a = c.achievements.find(x => x.id === id)!;
    b.source('achievement', a, a.title);
    const p = experienceOf(c, scope, a.id); if (p) b.source('project', p, p.name);
    const r = a.roleId ? c.roles.find(x => x.id === a.roleId) : undefined; if (r) b.source('role', r, r.title);
  }
  b.add('summary', 'paragraph', 'review-summary');
  for (const id of chosen) b.add('achievements', 'item', 'achievement:' + id);
  b.add('skills', 'paragraph', 'review-skills');
  for (const x of skillCounts(c, scope)) b.source('competency', c.competencies.find(k => k.id === x.id), x.name);
  for (const p of nextPeriodExperiences(c, { ...input, achievementIds: chosen })) { b.source('project', p, p.name); b.add('next', 'item', 'project-objective:' + p.id); }
  const sections = defaultSections('review-standard').map(s => ({ ...s, visible: s.key === 'skills' ? input.includeSkills : s.key === 'next' ? input.includeNext : true }));
  return { document: { id: crypto.randomUUID(), revision: 0, documentType: 'review', title: input.title.trim(), templateId: 'review-standard', status: 'draft',
    excludeConfidential: input.excludeConfidential, periodStart: input.periodStart, periodEnd: input.periodEnd, roleId: input.roleId, sections, contentBlocks: b.blocks,
    contactFields: [], sourceDataRevision, generatedAt: now }, sources: b.sources };
}
export interface CvInput {
  title: string; templateId: 'cv-professional' | 'cv-technical'; excludeConfidential: boolean; roleIds: string[]; achievementIds: string[];
  includeSkills: boolean; includeTechnologies: boolean; includeEducation: boolean; includeCredentials: boolean; contactFields: ContactField[]; today: string;
}
export function buildCv(c: CareerCollections, input: CvInput, now: string, sourceDataRevision: number): BuiltDocument {
  const cands = cvCandidates(c, input);
  const roleIds = cands.roles.map(r => r.role.id).filter(id => input.roleIds.includes(id));
  // An achievement shows only with its role chosen (or, without a known role, under Other).
  const offered = [...cands.roles.filter(r => roleIds.includes(r.role.id)).flatMap(r => r.items), ...cands.other];
  const chosen = offered.map(i => i.achievement.id).filter(id => input.achievementIds.includes(id));
  const available = new Set(availableContact(c).map(x => x.field));
  const contactFields = (['email', 'phone', 'location', 'website', 'links'] as ContactField[]).filter(f => input.contactFields.includes(f) && available.has(f));
  const scope: Scope = { documentType: 'cv', templateId: input.templateId, excludeConfidential: input.excludeConfidential, contactFields,
    periodStart: null, periodEnd: null, achievementIds: chosen, roleIds };
  const b = new Builder(c, scope), technical = input.templateId === 'cv-technical', profile = c.profiles[0]!;
  b.source('profile', profile, profile.displayName || 'Profile');
  b.add('contact', 'entry', 'profile-contact');
  b.add('summary', 'paragraph', 'profile-summary');
  const byRole = new Map<string, string[]>(), other: string[] = [];
  for (const id of chosen) {
    const a = c.achievements.find(x => x.id === id)!;
    b.source('achievement', a, a.title);
    if (a.roleId && roleIds.includes(a.roleId)) byRole.set(a.roleId, [...(byRole.get(a.roleId) ?? []), id]); else other.push(id);
  }
  for (const id of roleIds) {
    const r = c.roles.find(x => x.id === id)!;
    b.source('role', r, r.title);
    const e = c.employers.find(x => x.id === r.employerId); if (e) b.source('employer', e, e.name);
    b.add('experience', 'entry', 'role:' + id);
    if (!technical) for (const a of byRole.get(id) ?? []) b.add('experience', 'bullet', 'achievement:' + a);
  }
  if (!technical && other.length) { b.add('experience', 'entry', 'cv-other'); for (const a of other) b.add('experience', 'bullet', 'achievement:' + a); }
  if (technical) {
    const byProject = new Map<string, string[]>(), loose: string[] = [];
    for (const id of chosen) { const p = experienceOf(c, scope, id); if (p) byProject.set(p.id, [...(byProject.get(p.id) ?? []), id]); else loose.push(id); }
    for (const [pid, ids] of byProject) {
      const p = c.projects.find(x => x.id === pid)!;
      b.source('project', p, p.name); b.add('projects', 'entry', 'project:' + pid);
      for (const a of ids) b.add('projects', 'bullet', 'achievement:' + a);
    }
    if (loose.length) { b.add('projects', 'entry', 'cv-other'); for (const a of loose) b.add('projects', 'bullet', 'achievement:' + a); }
  }
  b.add('skills', 'paragraph', 'cv-skills');
  for (const x of skillCounts(c, scope)) b.source('competency', c.competencies.find(k => k.id === x.id), x.name);
  b.add('technologies', 'paragraph', 'cv-technologies');
  for (const e of educationByRecency(c)) { b.source('education', e, e.qualification); b.add('education', 'entry', 'education:' + e.id); }
  for (const x of currentCredentials(c, input.today)) { b.source('credential', x, x.name); b.add('credentials', 'entry', 'credential:' + x.id); }
  const show: Partial<Record<DocumentSection, boolean>> = { skills: input.includeSkills, technologies: input.includeTechnologies, education: input.includeEducation, credentials: input.includeCredentials };
  const sections = defaultSections(input.templateId).map(s => ({ ...s, visible: show[s.key] ?? true }));
  return { document: { id: crypto.randomUUID(), revision: 0, documentType: 'cv', title: input.title.trim(), templateId: input.templateId, status: 'draft',
    excludeConfidential: input.excludeConfidential, periodStart: null, periodEnd: null, roleId: null, sections, contentBlocks: b.blocks, contactFields,
    sourceDataRevision, generatedAt: now }, sources: b.sources };
}

// ---------------------------------------------------------------- comparing a saved document with the records
export type BlockState = { state: 'current' } | { state: 'changed'; next: BlockContent } | { state: 'missing' | 'confidential' | 'not-recorded' };
export const sameContent = (a: BlockContent, b: BlockContent) => a.heading === b.heading && a.meta === b.meta && a.date === b.date && a.text === b.text;
/** For each source-linked block: still current, changed (with the new text), or its source is gone/confidential/no longer recorded. */
export function documentReview(c: CareerCollections, doc: CareerDocument, sources: readonly DocumentSource[]): Map<string, BlockState> {
  const scope = scopeOf(doc, sources.filter(s => s.documentId === doc.id)), out = new Map<string, BlockState>();
  for (const block of doc.contentBlocks) {
    if (!block.sourceKey) continue;
    const g = generateBlock(c, scope, block.sourceKey);
    if (g.state !== 'ok') { out.set(block.id, { state: g.state }); continue; }
    out.set(block.id, block.generated && sameContent(block.generated, g.content) ? { state: 'current' } : { state: 'changed', next: g.content });
  }
  return out;
}
export const needsReview = (states: Map<string, BlockState>) => [...states.values()].filter(s => s.state !== 'current').length;
/** Count shown on a document row: how many parts of it differ from the records now. */
export function documentAttention(c: CareerCollections, doc: CareerDocument): number { return needsReview(documentReview(c, doc, c.documentSources)); }

type DocBlocks = Pick<CareerDocument, 'contentBlocks'>;
function mapBlock<T extends DocBlocks>(doc: T, id: string, f: (b: ContentBlock) => ContentBlock | null): T {
  return { ...doc, contentBlocks: doc.contentBlocks.flatMap(b => { if (b.id !== id) return [b]; const n = f(b); return n ? [n] : []; }) };
}
/** "Use updated text": the block takes its source's current text. */
export function useUpdatedText<T extends DocBlocks>(doc: T, id: string, next: BlockContent): T {
  return mapBlock(doc, id, b => ({ ...b, ...next, generated: { ...next }, userEdited: false }));
}
/**
 * "Keep this text": the user's text stays. For a changed source the new
 * version is acknowledged (so the alert clears until the source changes
 * again); for a deleted or now-excluded source the block becomes the user's own.
 */
export function keepBlockText<T extends DocBlocks>(doc: T, id: string, state: BlockState): T {
  return mapBlock(doc, id, b => state.state === 'changed'
    ? { ...b, generated: { ...state.next }, userEdited: !sameContent(b, state.next) }
    : { ...b, sourceKey: null, generated: null, userEdited: true });
}
export function removeBlock<T extends DocBlocks>(doc: T, id: string): T { return mapBlock(doc, id, () => null); }
/** Save an edit. A block is "edited by you" while its text differs from what its source last produced. */
export function editBlock<T extends DocBlocks>(doc: T, id: string, next: BlockContent): T {
  return mapBlock(doc, id, b => ({ ...b, ...next, userEdited: b.generated ? !sameContent(next, b.generated) : true }));
}
export function restoreGenerated<T extends DocBlocks>(doc: T, id: string): T {
  return mapBlock(doc, id, b => (b.generated ? { ...b, ...b.generated, userEdited: false } : b));
}
const ADD_KIND: Record<DocumentSection, BlockKind> = { contact: 'entry', summary: 'paragraph', achievements: 'item', experience: 'entry', projects: 'entry', skills: 'paragraph', technologies: 'paragraph', education: 'entry', credentials: 'entry', next: 'item' };
export const kindForSection = (section: DocumentSection): BlockKind => ADD_KIND[section];
/** Text the user adds themselves; it has no source and never shows an outdated alert. */
export function addBlock<T extends DocBlocks>(doc: T, section: DocumentSection, next: BlockContent): T {
  const order = doc.contentBlocks.reduce((m, b) => Math.max(m, b.order), -1) + 1;
  return { ...doc, contentBlocks: [...doc.contentBlocks, { id: crypto.randomUUID(), section, kind: ADD_KIND[section], order, userEdited: true, sourceKey: null, ...next, generated: null }] };
}
export function moveSection<T extends Pick<CareerDocument, 'sections'>>(doc: T, key: DocumentSection, delta: -1 | 1): T {
  const list = [...doc.sections], from = list.findIndex(s => s.key === key), to = from + delta;
  // Contact details always head a CV.
  if (from < 0 || to < 0 || to >= list.length || list[to]!.key === 'contact' || key === 'contact') return doc;
  [list[from], list[to]] = [list[to]!, list[from]!];
  return { ...doc, sections: list };
}
export function showSection<T extends Pick<CareerDocument, 'sections'>>(doc: T, key: DocumentSection, visible: boolean): T {
  return { ...doc, sections: doc.sections.map(s => (s.key === key ? { ...s, visible } : s)) };
}
export function blocksOf(doc: Pick<CareerDocument, 'contentBlocks'>, section: DocumentSection): ContentBlock[] {
  return doc.contentBlocks.filter(b => b.section === section).sort((a, b) => a.order - b.order);
}
/**
 * The source record a single-record block came from, refreshed to its current
 * revision once the user has reviewed it. Aggregate blocks (summary, skills)
 * keep their sources' recorded revisions.
 */
export function refreshSource(c: CareerCollections, sources: readonly DocumentSource[], documentId: string, key: string | null): DocumentSourceDraft[] {
  const own = sources.filter(s => s.documentId === documentId).sort((a, b) => a.order - b.order);
  const [kind, ...rest] = (key ?? '').split(':'), id = rest.join(':');
  const type: DocumentSourceType | null = kind === 'achievement' ? 'achievement' : kind === 'project' || kind === 'project-objective' ? 'project' : kind === 'role' ? 'role'
    : kind === 'education' ? 'education' : kind === 'credential' ? 'credential' : kind === 'profile-contact' || kind === 'profile-summary' ? 'profile' : null;
  const records: Record<DocumentSourceType, { id: string; revision: number }[]> = {
    profile: c.profiles, employer: c.employers, role: c.roles, project: c.projects, achievement: c.achievements, competency: c.competencies, education: c.education, credential: c.credentials
  };
  return own.map(s => {
    const current = type && s.sourceType === type && (type === 'profile' || s.sourceId === id) ? records[type].find(r => r.id === s.sourceId) : undefined;
    return { sourceType: s.sourceType, sourceId: s.sourceId, sourceRevision: current?.revision ?? s.sourceRevision, order: s.order, sourceLabelSnapshot: s.sourceLabelSnapshot };
  });
}
/** A new version: same choices and text, new identity. Sources are copied; nothing is regenerated. */
export function duplicateDocument(doc: CareerDocument, sources: readonly DocumentSource[], title: string, now: string): BuiltDocument {
  const { createdAt: _c, updatedAt: _u, ...rest } = doc;
  return { document: { ...structuredClone(rest), id: crypto.randomUUID(), revision: 0, title: title.trim().slice(0, 160), status: 'draft', generatedAt: now },
    sources: sources.filter(s => s.documentId === doc.id).sort((a, b) => a.order - b.order)
      .map(s => ({ sourceType: s.sourceType, sourceId: s.sourceId, sourceRevision: s.sourceRevision, order: s.order, sourceLabelSnapshot: s.sourceLabelSnapshot })) };
}
/** "CV — General (2)": the next free version name. */
export function nextVersionTitle(c: CareerCollections, title: string): string {
  const root = title.replace(/ \(\d+\)$/, '');
  const taken = new Set(c.careerDocuments.map(d => d.title));
  for (let n = 2; n < 1000; n++) { const t = `${root} (${n})`.slice(0, 160); if (!taken.has(t)) return t; }
  return root.slice(0, 160);
}
/** Where a source chip says a block came from. */
export function sourceLabel(c: CareerCollections, key: string | null): string {
  if (!key) return '';
  const [kind, ...rest] = key.split(':'), id = rest.join(':');
  switch (kind) {
    case 'achievement': { const a = c.achievements.find(x => x.id === id); return a ? `achievement · ${a.title}` : 'achievement (deleted)'; }
    case 'project-objective': return 'Expected Result of an experience';
    case 'project': return 'experience';
    case 'role': return 'role';
    case 'education': return 'education';
    case 'credential': return 'credential';
    case 'profile-contact': return 'profile contact details';
    case 'profile-summary': return 'profile summary';
    case 'review-summary': return 'the achievements you chose';
    case 'review-skills': case 'cv-skills': return 'skills linked to the achievements you chose';
    case 'cv-technologies': return 'technologies of your roles and experiences';
    default: return '';
  }
}
export function documentHeader(c: CareerCollections, doc: CareerDocument): { name: string; subtitle: string } {
  const profile = c.profiles[0]!;
  const role = c.roles.find(r => r.id === (doc.roleId ?? profile.primaryRoleId)) ?? [...c.roles].sort(compareRolesByRecency)[0];
  const subtitle = role ? [role.title, employerName(c, role.employerId)].filter(Boolean).join(' · ') : profile.headline;
  return { name: profile.displayName.trim(), subtitle };
}
