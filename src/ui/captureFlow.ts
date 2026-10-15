/**
 * CP-UX2 (DEC-037) — capturing an achievement in three short steps:
 * Where did this happen? → What happened? → When did it happen?
 *
 * A new achievement walks through the steps; editing shows the same three
 * sections on one page. Every control maps onto the existing achievement
 * record and its links, so nothing about the stored data changes:
 *  - the experience chosen under Where becomes the primary experience, and the
 *    role comes from that experience (by date when it spans several roles);
 *  - "Other experiences" keeps any further experience links;
 *  - the impact category is no longer asked for; an existing value is carried
 *    through unchanged.
 */
import type { AchievementView, CareerCollections, Project, Role } from '../domain/models.js';
import { localDate } from '../domain/models.js';
import { experiencesByRecency, experienceSkills, rolesOfExperience } from '../domain/timeline.js';
import { EXPERIENCE_NAME_MAX, matchingExperience } from '../domain/experience.js';
import { normalizeName } from '../domain/taxonomy.js';
import { metricRow, evidenceRow, ROLE_ONLY, INLINE_TYPES } from './achievementIntelligence.js';
import { escapeHtml as esc } from './html.js';
import { icon } from './icons.js';

export type CaptureStep = 1 | 2 | 3;
export type CaptureMode = 'steps' | 'all';
export type Precision = 'year' | 'month' | 'day';
/** Experiences shown before "Show all". */
export const RECENT_COUNT = 5;
export const TITLE_MAX = 160;
export const STEP_TITLES: Record<CaptureStep, string> = { 1: 'Where Did This Happen?', 2: 'What Happened?', 3: 'When Did It Happen?' };
const STATUS: Record<Project['status'], string> = { planned: 'Planned', active: 'Active', 'on-hold': 'On hold', completed: 'Completed' };

/* ---------- date control (CP-UX1) ---------- */
const PRECISIONS: [Precision, string][] = [['month', 'Month'], ['year', 'Year'], ['day', 'Exact day']];
/** Browsers without a month picker show a text box, so the month field carries a YYYY-MM placeholder. */
function dateInputAttrs(p: Precision): string {
  return p === 'year' ? 'type="text" inputmode="numeric" maxlength="4" placeholder="YYYY" pattern="[0-9]{4}"' : p === 'month' ? 'type="month" placeholder="YYYY-MM"' : 'type="date"';
}
export function occurrenceDateField(precision: Precision, value: string): string {
  return `<fieldset class="field date-field"><legend class="field-legend sr-only">When did it happen?</legend><div class="precision-switch">`
    + PRECISIONS.map(([v, l]) => `<label class="precision-option"><input type="radio" name="occurredPrecision" id="occurredPrecision-${v}" value="${v}" ${precision === v ? 'checked' : ''}/><span>${l}</span></label>`).join('')
    + `</div><label class="sr-only" for="occurredOn">Occurrence date</label><input id="occurredOn" name="occurredOn" ${dateInputAttrs(precision)} value="${esc(value)}"/>`
    + `<p class="field-hint">Use the month or year when you don't know the exact day.</p></fieldset>`;
}
/** Switching precision keeps what still fits (a day's month, a month's year) and never invents the rest. */
export function switchOccurrencePrecision(p: Precision): void {
  const input = document.getElementById('occurredOn') as HTMLInputElement | null; if (!input) return;
  const v = input.value.trim();
  const next = p === 'year' ? v.slice(0, 4) : p === 'month' ? (v.length >= 7 ? v.slice(0, 7) : '') : (v.length === 10 ? v : '');
  input.removeAttribute('pattern'); input.removeAttribute('placeholder'); input.removeAttribute('inputmode'); input.removeAttribute('maxlength');
  if (p === 'year') { input.type = 'text'; input.inputMode = 'numeric'; input.maxLength = 4; input.placeholder = 'YYYY'; input.pattern = '[0-9]{4}'; }
  else { input.type = p === 'month' ? 'month' : 'date'; if (p === 'month') input.placeholder = 'YYYY-MM'; }
  input.value = /^\d{4}$/.test(next) || p !== 'year' ? next : '';
}

/* ---------- the form ---------- */
export interface CaptureOptions {
  existing?: AchievementView;
  c: CareerCollections;
  /** An experience the capture was started from (its page or its goal). */
  projectContext: string | null;
  mode: CaptureMode;
  step: CaptureStep;
  /** Role offered when nothing else decides it (the primary or current role). */
  defaultRoleId: string | null;
}

/** The Where choice a form opens with: the experience it was started from, the primary experience, or the role. */
export function initialWhere(o: Pick<CaptureOptions, 'existing' | 'c' | 'projectContext'>): string {
  const { existing, c, projectContext } = o;
  if (projectContext && c.projects.some(p => p.id === projectContext)) return projectContext;
  if (!existing) return '';
  const links = c.recordLinks.filter(l => l.linkType === 'achievement-project' && l.sourceId === existing.id && c.projects.some(p => p.id === l.targetId));
  const primary = links.find(l => l.isPrimary)?.targetId;
  if (primary) return primary;
  if (links.length === 1) return links[0]!.targetId;
  return links.length ? '' : existing.roleId ? ROLE_ONLY : '';
}
/** Whether a new capture needs the Where step at all. */
export const hasWhereChoices = (c: CareerCollections) => c.projects.length > 0 || c.roles.length > 0;

const roleLabel = (c: CareerCollections, r: Role) => r.title + (c.employers.find(e => e.id === r.employerId) ? ' — ' + c.employers.find(e => e.id === r.employerId)!.name : '');
const roleOptions = (c: CareerCollections, selected: string | null, none: string) =>
  `<option value="">${esc(none)}</option>` + c.roles.map(r => `<option value="${esc(r.id)}" ${selected === r.id ? 'selected' : ''}>${esc(roleLabel(c, r))}</option>`).join('');

function whereOption(c: CareerCollections, p: Project, checked: boolean, recent: boolean): string {
  const meta = [rolesOfExperience(c, p.id)[0]?.title, STATUS[p.status]].filter(Boolean).join(' · ');
  return `<label class="where-option" data-name="${esc(normalizeName(p.name))}"${recent ? ' data-recent="true"' : ''}${recent || checked ? '' : ' hidden'}>`
    + `<input type="radio" name="where" value="${esc(p.id)}" ${checked ? 'checked' : ''}/>`
    + `<span class="where-option-text"><strong>${esc(p.name)}</strong>${meta ? `<small>${esc(meta)}</small>` : ''}</span></label>`;
}

function stepSection(step: CaptureStep, o: CaptureOptions, lead: string, body: string): string {
  const hidden = o.mode === 'steps' && o.step !== step ? ' hidden' : '';
  const back = o.mode === 'steps' && step > 1 ? `<button type="button" class="back-link capture-back" data-action="capture-back">${icon('back', 18)}Back</button>` : '';
  return `<section class="capture-step" data-step="${step}" aria-labelledby="capture-title-${step}"${hidden}>${back}`
    + `<h3 class="capture-title" id="capture-title-${step}" tabindex="-1">${STEP_TITLES[step]}</h3>${lead ? `<p class="capture-lead">${lead}</p>` : ''}${body}</section>`;
}

function whereStep(o: CaptureOptions, where: string): string {
  const { c, existing } = o;
  const all = experiencesByRecency(c);
  const options = all.map((p, i) => whereOption(c, p, where === p.id, i < RECENT_COUNT)).join('');
  const more = all.length > RECENT_COUNT;
  const roleOnly = `<label class="where-option where-role-only"><input type="radio" name="where" value="${ROLE_ONLY}" ${where === ROLE_ONLY ? 'checked' : ''}/>`
    + `<span class="where-option-text"><strong>Not part of an experience</strong><small>Just the role, or no role at all</small></span></label>`;
  return stepSection(1, o, 'Pick the experience. Your role comes with it.',
    (more ? `<label class="search-field where-search">${icon('search', 18)}<input id="where-search" type="search" placeholder="Search your experiences" aria-label="Search your experiences" autocomplete="off" enterkeyhint="search"/></label>` : '')
    + `<fieldset class="where-list"><legend class="field-legend capture-kicker" id="where-kicker">${all.length ? (more ? 'Recent' : 'Your experiences') : 'Experience'}</legend>`
    + `<div class="where-options">${options || '<p class="career-empty where-empty">No experiences yet. Add one below, or choose “Not part of an experience”.</p>'}</div>`
    + `<p class="where-no-match career-empty" hidden>No experiences match your search.</p>${roleOnly}</fieldset>`
    + `<div class="field where-role"${where === ROLE_ONLY ? '' : ' hidden'}><label for="capture-roleId">Role</label><select id="capture-roleId" name="roleId">${roleOptions(c, existing ? existing.roleId : o.defaultRoleId, 'No role')}</select></div>`
    + (more ? `<button type="button" class="text-action where-more" data-action="where-show-all" aria-expanded="false">Show all ${all.length} experiences ${icon('chevron', 15)}</button>` : '')
    + `<div class="inline-experience"><button type="button" class="text-action" data-action="toggle-inline-experience" aria-expanded="false" aria-controls="inline-experience-panel">${icon('plus', 16)} New experience</button>`
    + `<div id="inline-experience-panel" class="inline-experience-panel" hidden>`
    + `<div class="field"><label for="inline-experience-name">Experience name</label><input id="inline-experience-name" type="text" maxlength="${EXPERIENCE_NAME_MAX}" autocomplete="off" enterkeyhint="done" placeholder="e.g., Line upgrade project"/></div>`
    + `<div class="field"><label for="inline-experience-type">Type</label><select id="inline-experience-type">${INLINE_TYPES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`
    + `<div class="field"><label for="inline-experience-role">Role</label><select id="inline-experience-role">${roleOptions(c, o.defaultRoleId, 'No role')}</select></div>`
    + `<p id="inline-experience-error" class="form-error" role="alert" hidden></p>`
    + `<p class="field-hint">Saved with this achievement and linked to the role you choose here.</p>`
    + `<button type="button" class="button button-outline" data-action="add-inline-experience">Add experience</button></div>`
    + `<p id="inline-experience-status" class="field-hint inline-experience-status" role="status" aria-live="polite"></p></div>`);
}

/** The line at the top of "What happened?": the experience (or role) this is about. */
export function whereContext(c: CareerCollections, form: HTMLFormElement): string {
  const chosen = form.querySelector<HTMLInputElement>('input[name="where"]:checked');
  if (!chosen) return 'No experience chosen';
  if (chosen.value === ROLE_ONLY) {
    const role = c.roles.find(r => r.id === (form.querySelector<HTMLSelectElement>('#capture-roleId')?.value ?? ''));
    return role ? role.title : 'Not part of an experience';
  }
  if (chosen.dataset.newName) return chosen.dataset.newName;
  return c.projects.find(p => p.id === chosen.value)?.name ?? 'No experience chosen';
}

function whatStep(o: CaptureOptions, where: string): string {
  const a = o.existing, situation = a?.situation ?? '';
  const context = o.mode === 'steps'
    ? `<p class="capture-context"${where ? '' : ' hidden'}>${icon('layers', 15)}<span id="capture-context-text">${esc(where === ROLE_ONLY ? 'Not part of an experience' : o.c.projects.find(p => p.id === where)?.name ?? '')}</span></p>` : '';
  const title = a?.title ?? '';
  return stepSection(2, o, '', context
    + `<div class="field"><label for="title">Title <span class="required">*</span></label><input id="title" name="title" maxlength="${TITLE_MAX}" placeholder="e.g., Cut changeover time from 45 to 18 minutes" value="${esc(title)}" required/>`
    + `<p class="field-hint field-hint-split"><span>What you did + what changed</span><span id="title-count" aria-hidden="true">${title.length} / ${TITLE_MAX}</span></p></div>`
    + `<div class="field"><label for="contribution">What did you do? <span class="required">*</span></label><textarea id="contribution" name="contribution" rows="4" maxlength="6000" placeholder="Your part: the decisions you made and the actions you took.">${esc(a?.contribution ?? '')}</textarea><p class="field-hint">Needed to record it. A draft can wait.</p></div>`
    + `<div class="field"><label for="outcome">Result <span class="optional">optional</span></label><textarea id="outcome" name="outcome" rows="3" maxlength="6000" placeholder="What changed because of it? Numbers if you know them.">${esc(a?.outcome ?? '')}</textarea><p class="field-hint">Not sure yet? Leave it empty and add it later.</p></div>`
    + `<div class="capture-extra"><button type="button" class="text-action" data-action="toggle-capture-extra" aria-expanded="${situation ? 'true' : 'false'}" aria-controls="capture-situation"${situation ? ' hidden' : ''}>${icon('plus', 16)} Add context (why it was needed)</button>`
    + `<div class="field" id="capture-situation"${situation ? '' : ' hidden'}><label for="rich-situation">Context <span class="optional">why it was needed</span></label><textarea id="rich-situation" name="situation" rows="3" maxlength="6000">${esc(situation)}</textarea></div></div>`
    + `<div class="form-guidance">${icon('info', 18)} <p>Capture the facts as you know them. Don't invent metrics or outcomes; you can complete your record later.</p></div>`);
}

/** Skill ids suggested for an experience: the skills its recorded achievements already show. */
export function suggestedSkills(c: CareerCollections, projectId: string): Set<string> {
  return new Set(projectId && projectId !== ROLE_ONLY ? experienceSkills(c, projectId).map(s => s.id) : []);
}

function whenStep(o: CaptureOptions, where: string): string {
  const { c, existing: a } = o;
  const precision: Precision = a ? (a.occurredStart?.precision ?? 'month') : 'month';
  const dateValue = a ? a.occurredOn : localDate().slice(0, 7);
  const linked = (type: string) => new Set(c.recordLinks.filter(l => l.sourceId === a?.id && l.linkType === type).map(l => l.targetId));
  const skillsLinked = linked('achievement-competency');
  const suggested = suggestedSkills(c, where);
  const skills = c.competencies.filter(s => s.status === 'active' || skillsLinked.has(s.id)).sort((x, y) => x.name.localeCompare(y.name));
  const chips = skills.map(s => {
    const on = skillsLinked.has(s.id), show = on || suggested.has(s.id);
    return `<label class="skill-chip" data-name="${esc(normalizeName(s.name))}"${show ? '' : ' hidden'}><input type="checkbox" name="competencyId" value="${esc(s.id)}" ${on ? 'checked' : ''}/>`
      + `<span>${icon('check', 14)}${esc(s.name)}${s.status === 'archived' ? ' (archived historical link)' : ''}</span></label>`;
  }).join('');
  const chronological = <T extends { createdAt: string; id: string }>(rows: T[]): T[] => rows.sort((x, y) => x.createdAt.localeCompare(y.createdAt) || x.id.localeCompare(y.id));
  const metrics = chronological(c.impactMetrics.filter(m => m.achievementId === a?.id));
  const references = chronological(c.evidenceReferences.filter(e => e.achievementId === a?.id));
  const projectsLinked = linked('achievement-project');
  const others = experiencesByRecency(c).map(p => `<label class="rich-check"${p.id === where ? ' hidden' : ''}><input type="checkbox" name="projectId" value="${esc(p.id)}" ${projectsLinked.has(p.id) && p.id !== where ? 'checked' : ''}/><span>${esc(p.name)}</span></label>`).join('');
  const reveal = (id: string, label: string, open: boolean) =>
    `<button type="button" class="capture-add-row" data-action="toggle-capture-extra" aria-expanded="${open}" aria-controls="${id}"><span>${label}</span>${icon('chevron', 17)}</button>`;
  const confidential = (a?.confidentiality ?? 'confidential') === 'confidential';
  const moreOpen = Boolean(a && (a.actions.trim() || a.notes.trim()));
  return stepSection(3, o, '', occurrenceDateField(precision, dateValue)
    + `<section class="capture-skills" aria-labelledby="capture-skills-title"><div class="capture-skills-head"><h4 id="capture-skills-title">Skills Shown</h4><span class="optional">optional</span></div>`
    + `<p class="field-hint" id="skill-suggest-note">${suggested.size ? 'Suggested from this experience' : 'Linked examples, not proficiency scores.'}</p>`
    + `<div class="skill-chips" role="group" aria-labelledby="capture-skills-title">${chips}</div>`
    + `<p class="skill-no-match career-empty" hidden>No skills match your search.</p>`
    + `<button type="button" class="text-action" data-action="find-skill" aria-expanded="false" aria-controls="skill-search-field">${icon('plus', 16)} Find another skill</button>`
    + `<label class="search-field skill-search" id="skill-search-field" hidden>${icon('search', 18)}<input id="skill-search" type="search" placeholder="Search skills" aria-label="Search skills" autocomplete="off"/></label></section>`
    + `<div class="capture-adds">`
    + reveal('capture-metrics', 'Add a measured number', metrics.length > 0)
    + `<section id="capture-metrics" class="capture-extra-panel" aria-label="Impact metrics"${metrics.length ? '' : ' hidden'}><div id="rich-metrics">${metrics.map(m => metricRow(m)).join('')}</div>`
    + `<button type="button" class="text-action" data-action="add-rich-metric">${icon('plus', 16)} Add another number</button><p class="field-hint">Use measured values and say where they come from. Never estimate results as facts.</p></section>`
    + reveal('capture-evidence', 'Add evidence (where the proof lives)', references.length > 0)
    + `<section id="capture-evidence" class="capture-extra-panel" aria-label="Evidence references"${references.length ? '' : ' hidden'}><div id="rich-evidence">${references.map(e => evidenceRow(e)).join('')}</div>`
    + `<button type="button" class="text-action" data-action="add-rich-evidence">${icon('plus', 16)} Add another reference</button></section>`
    + `<label class="capture-switch"><span class="capture-switch-text"><span>Confidential</span><small>Kept out of anything you share later</small></span><input type="checkbox" role="switch" id="rich-confidential" ${confidential ? 'checked' : ''}/></label></div>`
    + `<details class="capture-more"${moreOpen ? ' open' : ''}><summary>More details</summary>`
    + `<div class="field"><label for="rich-actions">Detailed actions</label><textarea id="rich-actions" name="actions" rows="3" maxlength="6000">${esc(a?.actions ?? '')}</textarea></div>`
    + `<div class="field"><label for="rich-notes">Notes</label><textarea id="rich-notes" name="notes" rows="3" maxlength="6000">${esc(a?.notes ?? '')}</textarea></div>`
    + (c.projects.length > 1
      ? `<fieldset class="rich-link-fieldset"><legend>Other Experiences</legend><p class="field-hint">Also part of these experiences.</p><div class="rich-choice-list rich-experience-list">${others}</div></fieldset>` : '')
    + `</details>`);
}

/** The capture form (the dialog body). */
export function captureForm(o: CaptureOptions): string {
  const where = initialWhere(o);
  return `<form id="achievement-form" class="modal-body form-grid capture-form" data-mode="${o.mode}" data-step="${o.step}" data-initial-where="${esc(where)}"${o.existing ? ' data-reached-when="true"' : ''} novalidate>`
    + `<div id="form-error" class="form-error" role="alert" hidden></div>`
    + (o.mode === 'steps' ? '<div class="capture-progress" aria-hidden="true"><span></span></div>' : '')
    + whereStep(o, where) + whatStep(o, where) + whenStep(o, where)
    + `<input type="hidden" name="impactCategory" value="${esc(o.existing?.impactCategory ?? '')}"/></form>`;
}
/** Footer buttons; in steps mode Next moves on and the final step saves. */
export function captureFooter(o: Pick<CaptureOptions, 'mode' | 'step' | 'existing'>): string {
  if (o.mode === 'all') return `<div class="modal-footer"><button class="button button-outline" data-action="save-achievement" data-status="draft">Save draft</button><button class="button button-primary" data-action="save-achievement" data-status="recorded">${icon('check', 17)} Save changes</button></div>`;
  return `<div class="modal-footer capture-footer"><button class="button button-outline" data-action="save-achievement" data-status="draft"${o.step === 1 ? ' hidden' : ''}>Save draft</button>`
    + `<button class="button button-primary" data-action="capture-next"${o.step === 3 ? ' hidden' : ''}>Next ${icon('arrow', 17)}</button>`
    + `<button class="button button-primary" data-action="save-achievement" data-status="recorded"${o.step === 3 ? '' : ' hidden'}>${icon('check', 17)} Save achievement</button></div>`;
}

/* ---------- behaviour (DOM) ---------- */
/** Show one step; returns the heading to focus. */
export function showCaptureStep(form: HTMLFormElement, step: CaptureStep): HTMLElement | null {
  form.dataset.step = String(step);
  if (step === 3) form.dataset.reachedWhen = 'true';
  for (const s of form.querySelectorAll<HTMLElement>('.capture-step')) s.hidden = s.dataset.step !== String(step);
  const footer = form.closest('.modal')?.querySelector('.capture-footer');
  if (footer) {
    footer.querySelector<HTMLElement>('[data-status="draft"]')!.hidden = step === 1;
    footer.querySelector<HTMLElement>('[data-action="capture-next"]')!.hidden = step === 3;
    footer.querySelector<HTMLElement>('[data-status="recorded"]')!.hidden = step !== 3;
  }
  const error = form.querySelector<HTMLElement>('#form-error'); if (error) { error.hidden = true; error.textContent = ''; }
  form.scrollTop = 0;
  return form.querySelector<HTMLElement>(`#capture-title-${step}`);
}

/** Reflect the Where choice: the role field, the hidden duplicate in Other experiences, the context line and suggested skills. */
export function syncWhere(form: HTMLFormElement, c: CareerCollections): void {
  const chosen = form.querySelector<HTMLInputElement>('input[name="where"]:checked')?.value ?? '';
  const roleField = form.querySelector<HTMLElement>('.where-role'); if (roleField) roleField.hidden = chosen !== ROLE_ONLY;
  for (const box of form.querySelectorAll<HTMLInputElement>('.rich-experience-list input[name="projectId"]')) {
    const label = box.closest<HTMLElement>('label')!;
    label.hidden = box.value === chosen;
    if (box.value === chosen) box.checked = false;
  }
  const context = form.querySelector('#capture-context-text'); if (context) { context.textContent = whereContext(c, form); context.parentElement!.hidden = !chosen; }
  const suggested = suggestedSkills(c, chosen);
  form.dataset.suggested = [...suggested].join(' ');
  filterSkills(form);
  const note = form.querySelector('#skill-suggest-note'); if (note) note.textContent = suggested.size ? 'Suggested from this experience' : 'Linked examples, not proficiency scores.';
}

/** Search narrows the experiences; without a search, recent ones (or all, once asked for) and the chosen one show. */
export function filterWhere(form: HTMLFormElement): void {
  const q = normalizeName(form.querySelector<HTMLInputElement>('#where-search')?.value ?? '');
  const all = form.dataset.whereAll === 'true';
  let shown = 0;
  for (const option of form.querySelectorAll<HTMLElement>('.where-options .where-option')) {
    const input = option.querySelector<HTMLInputElement>('input')!;
    const visible = q ? (option.dataset.name ?? '').includes(q) : all || option.dataset.recent === 'true' || input.checked || Boolean(input.dataset.newName);
    option.hidden = !visible; if (visible) shown++;
  }
  const none = form.querySelector<HTMLElement>('.where-no-match'); if (none) none.hidden = !q || shown > 0;
  const kicker = form.querySelector('#where-kicker'); if (kicker) kicker.textContent = q ? 'Matches' : all ? 'All experiences' : 'Recent';
  const more = form.querySelector<HTMLElement>('[data-action="where-show-all"]'); if (more) more.hidden = Boolean(q) || all;
}

/** Chips show when ticked, suggested or matching the skill search. */
export function filterSkills(form: HTMLFormElement): void {
  const q = normalizeName(form.querySelector<HTMLInputElement>('#skill-search')?.value ?? '');
  const searching = !(form.querySelector<HTMLElement>('#skill-search-field')?.hidden ?? true);
  const suggested = new Set((form.dataset.suggested ?? '').split(' ').filter(Boolean));
  let matches = 0;
  for (const chip of form.querySelectorAll<HTMLElement>('.skill-chip')) {
    const input = chip.querySelector<HTMLInputElement>('input')!;
    const match = searching && (!q || (chip.dataset.name ?? '').includes(q));
    chip.hidden = !(input.checked || suggested.has(input.value) || match);
    if (match) matches++;
  }
  const none = form.querySelector<HTMLElement>('.skill-no-match'); if (none) none.hidden = !searching || !q || matches > 0;
}

/**
 * Adds a chosen "New" experience to the Where list, or chooses an existing one
 * with the same name instead of creating a duplicate. Returns true when the form changed.
 */
export function addInlineExperience(form: HTMLFormElement, projects: readonly Project[]): boolean {
  const nameInput = form.querySelector<HTMLInputElement>('#inline-experience-name');
  const typeSelect = form.querySelector<HTMLSelectElement>('#inline-experience-type');
  const roleSelect = form.querySelector<HTMLSelectElement>('#inline-experience-role');
  const list = form.querySelector<HTMLElement>('.where-options');
  const error = form.querySelector<HTMLElement>('#inline-experience-error');
  const status = form.querySelector<HTMLElement>('#inline-experience-status');
  if (!nameInput || !typeSelect || !roleSelect || !list || !error || !status) return false;
  const name = nameInput.value.trim().replace(/\s+/g, ' ');
  const fail = (message: string) => { error.textContent = message; error.hidden = false; nameInput.focus(); return false; };
  if (!name) return fail('Enter a name for the experience.');
  if (name.length > EXPERIENCE_NAME_MAX) return fail('Use ' + EXPERIENCE_NAME_MAX + ' characters or fewer.');
  const type = INLINE_TYPES.find(([v]) => v === typeSelect.value)?.[0];
  if (!type) return fail('Choose a valid experience type.');
  error.hidden = true; error.textContent = '';
  const radios = [...list.querySelectorAll<HTMLInputElement>('input[name="where"]')];
  const existing = matchingExperience(projects, name);
  const same = existing ? radios.find(r => r.value === existing.id) : radios.find(r => r.dataset.newName && normalizeName(r.dataset.newName) === normalizeName(name));
  if (same) {
    same.checked = true; same.closest<HTMLElement>('label')!.hidden = false;
    status.textContent = '“' + (existing?.name ?? same.dataset.newName ?? name) + '” already exists, so it is chosen instead of creating a duplicate.';
  } else {
    list.querySelector('.where-empty')?.remove();
    const role = roleSelect.value;
    list.insertAdjacentHTML('afterbegin', `<label class="where-option is-new" data-name="${esc(normalizeName(name))}"><input type="radio" name="where" value="${esc(crypto.randomUUID())}" data-new-name="${esc(name)}" data-new-type="${type}" data-new-role="${esc(role)}" checked/>`
      + `<span class="where-option-text"><strong>${esc(name)}</strong><small>New · saved with this achievement</small></span><span class="rich-new-tag">New</span></label>`);
    status.textContent = 'Added “' + name + '”. It is saved when you save this achievement.';
  }
  nameInput.value = '';
  return true;
}
