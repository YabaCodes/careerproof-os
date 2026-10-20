/**
 * CP-STU (DEC-040) — Studio screens: the document list, the review and CV
 * journeys, the document editor, the text editor sheet and the preview.
 * Markup only; every write goes through the database in main.ts.
 */
import type { BlockContent, CareerCollections, CareerDocument, ContactField, ContentBlock, DocumentSection, PrecisionDate } from '../domain/models.js';
import {
  CONTACT_LABELS, TEMPLATE_LABELS, availableContact, blocksOf, currentCredentials, cvCandidates, educationByRecency, kindForSection,
  nextPeriodExperiences, periodLong, periodShort, presetPeriod, reviewCandidates, sameContent, sectionLabel, sourceLabel,
  type BlockState, type Candidate, type PeriodPreset, documentAttention
} from '../domain/studio.js';
import { compareRolesByRecency } from '../domain/chronology.js';
import { icon } from './icons.js';
import { escapeHtml as esc } from './html.js';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const attr = (v: unknown) => esc(String(v));
export function editedLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso), minutes = Math.round((now.getTime() - then.getTime()) / 60000);
  if (minutes < 2) return 'just now';
  const day = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (day(now) === day(then)) return 'today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (day(y) === day(then)) return 'yesterday';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', ...(then.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}) }).format(then);
}
function documentMeta(c: CareerCollections, d: CareerDocument): string {
  const achievements = c.documentSources.filter(s => s.documentId === d.id && s.sourceType === 'achievement').length;
  return d.documentType === 'review'
    ? ['Review', periodShort(d.periodStart, d.periodEnd), plural(achievements, 'achievement')].filter(Boolean).join(' · ')
    : ['CV', TEMPLATE_LABELS[d.templateId]].join(' · ');
}

// ---------------------------------------------------------------- Studio tab
export function studioPage(c: CareerCollections): string {
  const docs = [...c.careerDocuments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const start = (type: 'review' | 'cv', glyph: string, title: string, text: string) =>
    `<button type="button" class="studio-card" data-action="studio-new" data-type="${type}"><span class="studio-card-icon">${icon(glyph, 21)}</span><strong>${title}</strong><span>${text}</span></button>`;
  const rows = docs.map(d => {
    const n = documentAttention(c, d);
    return `<button type="button" class="studio-doc" data-action="open-document" data-id="${attr(d.id)}"><span class="studio-doc-text"><strong>${esc(d.title)}</strong>`
      + `<span class="studio-doc-meta">${esc(documentMeta(c, d))} · edited ${esc(editedLabel(d.updatedAt))}</span>`
      + (n ? `<span class="studio-attention">${plural(n, 'part')} to review</span>` : '')
      + `</span><span class="row-arrow">${icon('chevron', 17)}</span></button>`;
  }).join('');
  return `<div class="studio-start">${start('review', 'calendar', 'Performance review', 'Pick a period; your recorded results fill a draft you edit.')}${start('cv', 'document', 'CV', 'Choose a template and which work to show; keep versions.')}</div>
  <div class="section-title"><h2 id="studio-docs-title">Your Documents</h2>${docs.length ? `<span class="section-count">${docs.length}</span>` : ''}</div>
  ${docs.length ? `<section class="panel list-card studio-docs" aria-labelledby="studio-docs-title">${rows}</section>`
    : `<section class="panel studio-empty"><p>No documents yet. Start a performance review or a CV above; you can keep as many versions as you like.</p></section>`}
  <p class="footer-note">${icon('info', 14)} Documents are copies you edit. Changing an achievement never rewrites them — you see what changed and choose. Confidential records stay out unless you include them.</p>`;
}

// ---------------------------------------------------------------- shared wizard parts
export interface WizardView { title: string; subtitle: string; body: string; footer: string }
const progress = (step: number, of: number) => `<div class="capture-progress studio-progress" aria-hidden="true"><span style="width:${Math.round(step / of * 1000) / 10}%"></span></div>`;
const stepTitle = (text: string, aside = '') => `<div class="studio-step-head"><h3 id="wizard-step-title" class="capture-step-title" tabindex="-1">${text}</h3>${aside}</div>`;
const backLink = () => `<button type="button" class="back-link studio-back" data-action="wizard-back">${icon('back', 18)} Back</button>`;
function switchRow(id: string, name: string, title: string, hint: string, checked: boolean, hintId = ''): string {
  return `<label class="capture-switch studio-switch" for="${id}"><span class="capture-switch-text"><span>${title}</span><small${hintId ? ` id="${hintId}"` : ''}>${hint}</small></span><input type="checkbox" role="switch" id="${id}" name="${name}" ${checked ? 'checked' : ''}/></label>`;
}
function pick(name: string, value: string, title: string, detail: string, checked: boolean, extra = ''): string {
  return `<label class="studio-pick"><input type="checkbox" name="${name}" value="${attr(value)}" ${checked ? 'checked' : ''} ${extra}/><span class="studio-pick-text"><strong>${esc(title)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</span></label>`;
}
const confidentialHint = (left: number, include: boolean, total: number) => include
  ? (total ? `On: confidential records are included. Share this document only where that is appropriate.` : 'On: confidential records are included.')
  : left ? `Off: ${plural(left, 'confidential achievement')} ${left === 1 ? 'is' : 'are'} left out.` : 'Off: confidential records would be left out.';

// ---------------------------------------------------------------- Performance review journey
export interface ReviewDraft {
  step: 1 | 2; preset: PeriodPreset | 'custom'; start: string; end: string; roleId: string; title: string; titleTouched: boolean;
  includeConfidential: boolean; selected: string[] | null; includeSkills: boolean; includeNext: boolean;
}
export function newReviewDraft(today: string): ReviewDraft {
  const p = presetPeriod('last-6', today);
  return { step: 1, preset: 'last-6', start: p.start.value, end: p.end.value, roleId: '', title: '', titleTouched: false, includeConfidential: false, selected: null, includeSkills: true, includeNext: true };
}
export const monthDate = (value: string): PrecisionDate => ({ value, precision: 'month' });
export const defaultReviewTitle = (d: Pick<ReviewDraft, 'start' | 'end'>) => `Performance Review · ${periodShort(monthDate(d.start), monthDate(d.end))}`;
export function reviewScopeOf(d: ReviewDraft) {
  const [a, b] = d.start <= d.end ? [d.start, d.end] : [d.end, d.start];
  return { periodStart: monthDate(a), periodEnd: monthDate(b), roleId: d.roleId || null, excludeConfidential: !d.includeConfidential };
}
export function reviewInfo(c: CareerCollections, d: ReviewDraft): { summary: string; confidential: string } {
  const cands = reviewCandidates(c, reviewScopeOf(d));
  const summary = cands.total
    ? `<strong>${plural(cands.total, 'recorded achievement')}</strong> happened in this period${cands.experienceCount ? `, across ${plural(cands.experienceCount, 'experience')}` : ''}. Drafts are not included.`
    : 'No recorded achievements fall in this period' + (d.roleId ? ' and role' : '') + (cands.confidentialLeftOut && !d.includeConfidential ? ' that are not confidential' : '') + '. Choose another period, or include confidential records.';
  return { summary, confidential: confidentialHint(cands.confidentialLeftOut, d.includeConfidential, cands.total) };
}
export function reviewWizard(c: CareerCollections, d: ReviewDraft): WizardView {
  const subtitle = `Step ${d.step} of 3`;
  if (d.step === 1) {
    const presets: [PeriodPreset | 'custom', string][] = [['last-6', 'Last 6 months'], ['last-12', 'Last 12 months'], ['this-year', 'This year'], ['custom', 'Custom']];
    const roles = [...c.roles].sort(compareRolesByRecency);
    const info = reviewInfo(c, d);
    return { title: 'New Performance Review', subtitle, body: `<form id="studio-wizard" class="modal-body form-grid studio-wizard" data-kind="review" data-step="1" novalidate>
      <div id="form-error" class="form-error" role="alert" hidden></div>${progress(1, 3)}${stepTitle('Which Period?')}
      <div class="segmented studio-presets" role="group" aria-label="Period">${presets.map(([v, l]) => `<button type="button" class="segment" data-action="review-preset" data-preset="${v}" aria-pressed="${d.preset === v}">${l}</button>`).join('')}</div>
      <div class="field-row"><div class="field"><label for="review-start">From</label><input id="review-start" name="start" type="month" value="${attr(d.start)}" required/></div>
        <div class="field"><label for="review-end">Through</label><input id="review-end" name="end" type="month" value="${attr(d.end)}" required/></div></div>
      <div class="field"><label for="review-role">Role</label><select id="review-role" name="roleId"><option value="">All roles in the period</option>${roles.map(r => `<option value="${attr(r.id)}" ${d.roleId === r.id ? 'selected' : ''}>${esc(r.title)}</option>`).join('')}</select></div>
      <div class="field"><label for="review-title">Title</label><input id="review-title" name="title" maxlength="160" value="${attr(d.titleTouched ? d.title : defaultReviewTitle(d))}" required/></div>
      ${switchRow('review-confidential', 'includeConfidential', 'Include confidential records', info.confidential, d.includeConfidential, 'review-confidential-hint')}
      <p id="review-info" class="studio-info" aria-live="polite">${info.summary}</p>
    </form>`, footer: `<div class="modal-footer"><button type="button" class="button button-outline" data-action="close">Cancel</button><button type="button" class="button button-primary" data-action="wizard-next">Next →</button></div>` };
  }
  const scope = reviewScopeOf(d), cands = reviewCandidates(c, scope);
  const selected = new Set(d.selected ?? cands.groups.flatMap(g => g.items.map(i => i.achievement.id)));
  const chosen = cands.groups.flatMap(g => g.items).filter(i => selected.has(i.achievement.id)).length;
  const next = nextPeriodExperiences(c, { roleId: scope.roleId, excludeConfidential: scope.excludeConfidential, achievementIds: [...selected] });
  const groups = cands.groups.map(g => `<div class="studio-group"><p class="studio-group-label">${esc(g.label)} · ${g.items.length}</p><div class="studio-box">${g.items.map(i => pick('achievement', i.achievement.id, i.achievement.title, i.detail, selected.has(i.achievement.id))).join('')}</div></div>`).join('');
  return { title: 'New Performance Review', subtitle, body: `<form id="studio-wizard" class="modal-body form-grid studio-wizard" data-kind="review" data-step="2" novalidate>
    <div id="form-error" class="form-error" role="alert" hidden></div>${progress(2, 3)}${backLink()}
    ${stepTitle('Which Achievements?', `<span id="review-chosen" class="studio-count">${chosen} of ${cands.total}</span>`)}
    ${cands.total ? groups : '<p class="studio-info">No recorded achievements fall in this period. Go back and choose another period or role.</p>'}
    <div class="studio-group"><p class="studio-group-label">Also in the draft</p><div class="studio-box">
      ${pick('includeSkills', 'yes', 'Skills shown', 'Each skill with the achievements above that show it — not a rating', d.includeSkills)}
      ${pick('includeNext', 'yes', 'Next period', next.length ? `Expected Results of ${plural(next.length, 'ongoing experience')}, as a starting point` : 'No ongoing experience has an Expected Result yet', d.includeNext)}
    </div></div>
  </form>`, footer: `<div class="modal-footer"><button type="button" class="button button-outline" data-action="wizard-select-all">Select all</button><button type="button" class="button button-primary" data-action="wizard-finish" ${cands.total ? '' : 'disabled'}>Make draft →</button></div>` };
}
export function readReviewForm(form: HTMLFormElement, d: ReviewDraft): ReviewDraft {
  const fd = new FormData(form), next = { ...d };
  if (d.step === 1) {
    next.start = String(fd.get('start') ?? d.start); next.end = String(fd.get('end') ?? d.end); next.roleId = String(fd.get('roleId') ?? '');
    const title = String(fd.get('title') ?? '').trim();
    next.titleTouched = d.titleTouched || (title !== '' && title !== defaultReviewTitle(d));
    next.title = next.titleTouched ? title : defaultReviewTitle(next);
    next.includeConfidential = fd.get('includeConfidential') !== null;
  } else {
    next.selected = fd.getAll('achievement').map(String);
    next.includeSkills = fd.get('includeSkills') !== null; next.includeNext = fd.get('includeNext') !== null;
  }
  return next;
}

// ---------------------------------------------------------------- CV journey
export interface CvDraft {
  step: 1 | 2 | 3; templateId: 'cv-professional' | 'cv-technical'; from: string; title: string; includeConfidential: boolean;
  roleIds: string[] | null; selected: string[] | null; includeSkills: boolean; includeTechnologies: boolean; includeEducation: boolean; includeCredentials: boolean;
  contactFields: ContactField[] | null;
}
export function newCvDraft(): CvDraft {
  return { step: 1, templateId: 'cv-professional', from: 'record', title: '', includeConfidential: false, roleIds: null, selected: null,
    includeSkills: true, includeTechnologies: true, includeEducation: true, includeCredentials: true, contactFields: null };
}
export function defaultCvTitle(c: CareerCollections): string {
  const profile = c.profiles[0]!, role = [...c.roles].sort(compareRolesByRecency)[0];
  return `CV — ${role?.title || profile.headline || 'General'}`.slice(0, 160);
}
function cvRow(i: Candidate, checked: boolean): string { return pick('achievement', i.achievement.id, i.achievement.title, i.detail, checked); }
export function cvWizard(c: CareerCollections, d: CvDraft, today: string): WizardView {
  const subtitle = `Step ${d.step} of 3`;
  if (d.step === 1) {
    const cvs = c.careerDocuments.filter(x => x.documentType === 'cv').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const template = (id: 'cv-professional' | 'cv-technical', title: string, text: string) => `<label class="studio-template ${d.templateId === id ? 'is-selected' : ''}">
      <span class="studio-thumb studio-thumb-${id === 'cv-technical' ? 'technical' : 'professional'}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <span class="studio-template-text"><input type="radio" name="templateId" value="${id}" ${d.templateId === id ? 'checked' : ''}/><span><strong>${title}</strong><small>${text}</small></span></span></label>`;
    const from = (value: string, title: string, text: string) => `<label class="studio-option ${d.from === value ? 'is-selected' : ''}"><input type="radio" name="from" value="${attr(value)}" ${d.from === value ? 'checked' : ''}/><span class="studio-pick-text"><strong>${esc(title)}</strong><small>${esc(text)}</small></span></label>`;
    return { title: 'New CV', subtitle, body: `<form id="studio-wizard" class="modal-body form-grid studio-wizard" data-kind="cv" data-step="1" novalidate>
      <div id="form-error" class="form-error" role="alert" hidden></div>${progress(1, 3)}${stepTitle('Choose a Template')}
      <div class="studio-templates" role="radiogroup" aria-label="Template">${template('cv-professional', 'Professional Standard', 'Summary, experience, then skills. One column.')}${template('cv-technical', 'Technical Specialist', 'Skills and technologies first, then projects.')}</div>
      <p class="field-hint">Both are plain one-column layouts that applicant tracking systems read well. No skill bars.</p>
      <div class="studio-group"><p class="studio-group-label">Start from</p><div class="studio-options">
        ${from('record', 'Your record', 'Profile, roles, recorded achievements, education and credentials')}
        ${cvs.map(x => from(x.id, `A copy of “${x.title}”`, 'Keeps its choices and your edits; becomes a new version')).join('')}
      </div></div>
      <div class="field"><label for="cv-title">Name</label><input id="cv-title" name="title" maxlength="160" value="${attr(d.title || defaultCvTitle(c))}" required/></div>
    </form>`, footer: `<div class="modal-footer"><button type="button" class="button button-outline" data-action="close">Cancel</button><button type="button" class="button button-primary" data-action="${d.from === 'record' ? 'wizard-next' : 'wizard-finish'}">${d.from === 'record' ? 'Next →' : 'Make copy →'}</button></div>` };
  }
  if (d.step === 2) {
    const cands = cvCandidates(c, { excludeConfidential: !d.includeConfidential });
    const roles = new Set(d.roleIds ?? cands.roles.map(r => r.role.id));
    const selected = new Set(d.selected ?? cands.roles.flatMap(r => r.items.slice(0, 5).map(i => i.achievement.id)));
    const skills = c.recordLinks.filter(l => l.linkType === 'achievement-competency').length;
    const credentials = currentCredentials(c, today), expired = c.credentials.length - credentials.length;
    const techs = new Set([...c.roles.flatMap(r => r.technologies), ...c.projects.filter(p => d.includeConfidential || p.confidentiality !== 'confidential').flatMap(p => p.technologies)].map(t => t.trim()).filter(Boolean));
    const education = educationByRecency(c);
    const roleBoxes = cands.roles.map(r => {
      const chosen = r.items.filter(i => selected.has(i.achievement.id)).length;
      return `<div class="studio-box studio-role-box"><label class="studio-pick studio-role"><input type="checkbox" name="role" value="${attr(r.role.id)}" ${roles.has(r.role.id) ? 'checked' : ''}/><span class="studio-pick-text"><strong>${esc(r.role.title)}</strong><small>${esc([r.label.split(' · ').slice(1).join(' · '), r.dates, r.items.length ? `${chosen} of ${r.items.length} chosen` : 'No recorded achievements'].filter(Boolean).join(' · '))}</small></span></label>${r.items.map(i => cvRow(i, selected.has(i.achievement.id))).join('')}</div>`;
    }).join('');
    const other = cands.other.length ? `<div class="studio-group"><p class="studio-group-label">Not linked to a role · ${cands.other.length}</p><div class="studio-box">${cands.other.map(i => cvRow(i, selected.has(i.achievement.id))).join('')}</div></div>` : '';
    return { title: 'New CV', subtitle, body: `<form id="studio-wizard" class="modal-body form-grid studio-wizard" data-kind="cv" data-step="2" novalidate>
      <div id="form-error" class="form-error" role="alert" hidden></div>${progress(2, 3)}${backLink()}${stepTitle('Which Work to Show?')}
      <p class="field-hint studio-lead">Each role lists its recorded achievements, those with results first. Up to 5 per role reads best.</p>
      ${switchRow('cv-confidential', 'includeConfidential', 'Include confidential records', confidentialHint(cands.confidentialLeftOut, d.includeConfidential, 1), d.includeConfidential)}
      ${roleBoxes || '<p class="studio-info">No roles are recorded yet. Add employers and roles in Profile to build the Experience section.</p>'}${other}
      <div class="studio-group"><p class="studio-group-label">Also include</p><div class="studio-box">
        ${pick('includeSkills', 'yes', 'Skills', skills ? 'Skills shown in the achievements you choose' : 'No skills are linked to achievements yet', d.includeSkills)}
        ${pick('includeTechnologies', 'yes', 'Technologies', techs.size ? `From your roles and experiences: ${[...techs].slice(0, 4).join(', ')}${techs.size > 4 ? '…' : ''}` : 'None recorded yet', d.includeTechnologies)}
        ${pick('includeEducation', 'yes', 'Education', education.length ? education.slice(0, 2).map(e => e.qualification).join(' · ') : 'None recorded yet', d.includeEducation)}
        ${pick('includeCredentials', 'yes', 'Credentials', `${credentials.length} current${expired ? ` · ${expired} expired ${expired === 1 ? 'is' : 'are'} left out` : ''}`, d.includeCredentials)}
      </div></div>
    </form>`, footer: `<div class="modal-footer"><button type="button" class="button button-outline" data-action="wizard-back">← Back</button><button type="button" class="button button-primary" data-action="wizard-next">Next →</button></div>` };
  }
  const contact = availableContact(c), chosen = new Set(d.contactFields ?? contact.map(x => x.field).filter(f => f !== 'phone'));
  const profile = c.profiles[0]!;
  return { title: 'New CV', subtitle, body: `<form id="studio-wizard" class="modal-body form-grid studio-wizard" data-kind="cv" data-step="3" novalidate>
    <div id="form-error" class="form-error" role="alert" hidden></div>${progress(3, 3)}${backLink()}${stepTitle('Contact Details')}
    <p class="field-hint studio-lead">From your profile. Choose what this CV shows; you can still edit the text afterwards.</p>
    <div class="studio-box"><div class="studio-pick studio-static"><span class="studio-pick-text"><strong>${esc(profile.displayName || 'Your name is not set')}</strong><small>${esc(profile.headline || 'No headline yet')}</small></span></div>
      ${contact.map(x => pick('contact', x.field, CONTACT_LABELS[x.field], x.value, chosen.has(x.field))).join('')}</div>
    ${contact.some(x => x.field === 'phone') ? '<p class="field-hint">Phone is left off unless you choose it.</p>' : ''}
    ${!profile.displayName || !contact.length ? '<p class="studio-info">Add your name and contact details in Profile to fill this part, or type them into the CV after it is made.</p>' : ''}
  </form>`, footer: `<div class="modal-footer"><button type="button" class="button button-outline" data-action="wizard-back">← Back</button><button type="button" class="button button-primary" data-action="wizard-finish">Make CV →</button></div>` };
}
export function readCvForm(form: HTMLFormElement, d: CvDraft): CvDraft {
  const fd = new FormData(form), next = { ...d };
  if (d.step === 1) {
    const template = String(fd.get('templateId') ?? d.templateId);
    next.templateId = template === 'cv-technical' ? 'cv-technical' : 'cv-professional';
    next.from = String(fd.get('from') ?? 'record'); next.title = String(fd.get('title') ?? '').trim();
  } else if (d.step === 2) {
    next.includeConfidential = fd.get('includeConfidential') !== null;
    next.roleIds = fd.getAll('role').map(String); next.selected = fd.getAll('achievement').map(String);
    next.includeSkills = fd.get('includeSkills') !== null; next.includeTechnologies = fd.get('includeTechnologies') !== null;
    next.includeEducation = fd.get('includeEducation') !== null; next.includeCredentials = fd.get('includeCredentials') !== null;
  } else next.contactFields = fd.getAll('contact').map(String) as ContactField[];
  return next;
}

// ---------------------------------------------------------------- the document editor
const STATE_TEXT: Record<'missing' | 'confidential' | 'not-recorded', string> = {
  missing: 'The record this came from was deleted. Your text is kept as saved.',
  confidential: 'This record is now Confidential, and this document leaves confidential records out.',
  'not-recorded': 'This achievement is no longer Recorded (it is a Draft or archived).'
};
function changePreview(b: ContentBlock, next: BlockContent): string {
  const parts = (['heading', 'meta', 'date', 'text'] as const).filter(k => b.generated?.[k] !== next[k] || b[k] !== next[k]).map(k => next[k]).filter(Boolean);
  const text = (parts.join(' · ') || 'empty').replace(/\s+/g, ' ');
  return text.length > 220 ? text.slice(0, 217) + '…' : text;
}
function blockStatus(b: ContentBlock, state: BlockState | undefined): string {
  if (!state || state.state === 'current') return '';
  if (state.state === 'changed') return `<div class="block-alert" role="note"><p>${b.userEdited ? 'The source changed after you edited this. ' : 'The source changed. '}It now says: <strong>${esc(changePreview(b, state.next))}</strong></p>
    <div class="block-alert-actions"><button type="button" class="button button-primary" data-action="block-use-updated" data-id="${attr(b.id)}">Use updated text</button><button type="button" class="button button-outline" data-action="block-keep" data-id="${attr(b.id)}">Keep this text</button></div></div>`;
  return `<div class="block-alert" role="note"><p>${STATE_TEXT[state.state]}</p>
    <div class="block-alert-actions"><button type="button" class="button button-outline" data-action="block-remove" data-id="${attr(b.id)}">Remove from document</button><button type="button" class="button button-outline" data-action="block-keep" data-id="${attr(b.id)}">Keep this text</button></div></div>`;
}
const textHtml = (text: string) => esc(text).replace(/\n/g, '<br>');
function blockView(c: CareerCollections, doc: CareerDocument, b: ContentBlock, state: BlockState | undefined): string {
  const empty = !b.heading.trim() && !b.text.trim() && !b.meta.trim() && !b.date.trim();
  const placeholder = b.section === 'summary' ? 'Add your own summary…' : b.section === 'skills' ? 'No skills are linked to the chosen achievements yet.' : b.section === 'technologies' ? 'No technologies recorded yet.' : 'Empty — tap to add text.';
  const from = b.sourceKey ? sourceLabel(c, b.sourceKey) : '';
  const body = b.kind === 'bullet' ? `<span class="doc-bullet">${textHtml(b.text || b.heading)}</span>`
    : `${b.heading.trim() ? `<strong class="doc-heading">${esc(b.heading)}</strong>` : ''}${b.date.trim() || b.meta.trim() ? `<span class="doc-meta">${esc([b.meta, b.date].filter(x => x.trim()).join(' · '))}</span>` : ''}${b.text.trim() ? `<span class="doc-text">${textHtml(b.text)}</span>` : ''}`;
  const flagged = state && state.state !== 'current';
  return `<article class="doc-block doc-block-${b.kind}${flagged ? ' needs-review' : ''}" data-block="${attr(b.id)}">
    <button type="button" class="doc-block-edit" data-action="edit-block" data-id="${attr(b.id)}" aria-label="Edit ${attr(b.heading || sectionLabel(doc, b.section))}">${empty ? `<span class="doc-placeholder">${placeholder}</span>` : body}</button>
    ${blockStatus(b, state)}
    <div class="doc-block-tags">${b.userEdited ? '<span class="doc-tag">Edited by you</span>' : ''}${!b.sourceKey ? '<span class="doc-tag">Your text</span>' : ''}${from ? `<span class="doc-source">From: ${esc(from)}</span>` : ''}</div>
  </article>`;
}
export function documentPage(c: CareerCollections, doc: CareerDocument, states: Map<string, BlockState>): string {
  const attention = [...states.values()].filter(s => s.state !== 'current').length;
  const achievements = c.documentSources.filter(s => s.documentId === doc.id && s.sourceType === 'achievement').length;
  const meta = doc.documentType === 'review'
    ? ['Review', periodLong(doc.periodStart, doc.periodEnd), plural(achievements, 'achievement'), `saved ${editedLabel(doc.updatedAt)}`]
    : ['CV', TEMPLATE_LABELS[doc.templateId], `saved ${editedLabel(doc.updatedAt)}`];
  const order = doc.sections.filter(s => s.key !== 'contact');
  const sectionRows = doc.sections.map(s => {
    const i = order.findIndex(x => x.key === s.key), label = sectionLabel(doc, s.key);
    const moves = s.key === 'contact' ? '<span class="section-fixed">Always first</span>'
      : `<button type="button" id="move-${s.key}-up" class="icon-button section-move" data-action="move-section" data-section="${s.key}" data-delta="-1" aria-label="Move ${attr(label)} up" ${i <= 0 ? 'disabled' : ''}>${icon('up', 20)}</button><button type="button" id="move-${s.key}-down" class="icon-button section-move" data-action="move-section" data-section="${s.key}" data-delta="1" aria-label="Move ${attr(label)} down" ${i === order.length - 1 ? 'disabled' : ''}>${icon('down', 20)}</button>`;
    return `<div class="section-row"><label class="section-toggle"><input type="checkbox" id="show-${s.key}" data-action="toggle-section" data-section="${s.key}" ${s.visible ? 'checked' : ''}/><span>${esc(label)}</span></label>${moves}</div>`;
  }).join('');
  const sections = doc.sections.filter(s => s.visible).map(s => {
    const blocks = blocksOf(doc, s.key);
    return `<section class="doc-section" aria-labelledby="doc-section-${s.key}"><div class="doc-section-head"><h2 id="doc-section-${s.key}">${esc(sectionLabel(doc, s.key))}</h2>${s.key === 'contact' ? '' : `<button type="button" class="text-action" data-action="add-block" data-section="${s.key}">${icon('plus', 16)} Add text</button>`}</div>
      <div class="doc-blocks">${blocks.map(b => blockView(c, doc, b, states.get(b.id))).join('') || `<p class="doc-empty">Nothing here yet.</p>`}</div></section>`;
  }).join('');
  return `<div class="document-page">
    <div class="page-topbar document-topbar"><button type="button" class="back-link" data-action="close-document">${icon('back', 18)} Studio</button><button type="button" class="button button-primary" data-action="export-pdf">${icon('download', 16)} Export PDF</button></div>
    <header class="document-head"><h1>${esc(doc.title)}</h1><p class="document-meta">${esc(meta.filter(Boolean).join(' · '))} <button type="button" class="text-action document-details" data-action="document-settings">Details</button></p></header>
    ${attention ? `<div class="document-banner" role="status">${icon('alert', 18)}<span>${plural(attention, 'part')} of this document no longer ${attention === 1 ? 'matches its source' : 'match their sources'}. Nothing here was rewritten — review ${attention === 1 ? 'it' : 'them'} below.</span></div>` : ''}
    ${doc.excludeConfidential ? '' : `<div class="document-banner document-banner-quiet" role="note">${icon('lock', 18)}<span>Confidential records are included. Share this document only where that is appropriate.</span></div>`}
    <details class="panel document-order" data-keep-open="document-order"><summary><span><strong>Sections and Order</strong><small>Show, hide and reorder what the PDF contains</small></span>${icon('chevron', 17)}</summary><div class="section-rows">${sectionRows}</div></details>
    ${sections}
    <p class="footer-note">${icon('info', 14)} Tap any text to edit it. Edits stay in this document; your records are not changed.</p>
    <div class="document-actions"><button type="button" class="button button-outline" data-action="preview-document">Preview</button><button type="button" class="button button-outline" data-action="duplicate-document">Save as new version</button><button type="button" class="button button-danger-soft" data-action="delete-document">Delete document</button></div>
  </div>`;
}

// ---------------------------------------------------------------- sheets
const header = (title: string, subtitle: string) => `<div class="modal-header"><div><h2 id="dialog-title">${title}</h2><p id="dialog-description">${subtitle}</p></div><button class="icon-button close-dialog" data-action="close" aria-label="Close dialog">${icon('close', 24)}</button></div>`;
export function blockForm(c: CareerCollections, doc: CareerDocument, block: ContentBlock | null, section: DocumentSection): string {
  const kind = block?.kind ?? kindForSection(section), v = block ?? { heading: '', meta: '', date: '', text: '' };
  const field = (id: string, label: string, value: string, max: number, hint = '') => `<div class="field"><label for="block-${id}">${label}</label><input id="block-${id}" name="${id}" maxlength="${max}" value="${attr(value)}"/>${hint ? `<p class="field-hint">${hint}</p>` : ''}</div>`;
  const area = (label: string, rows: number) => `<div class="field"><label for="block-text">${label}</label><textarea id="block-text" name="text" rows="${rows}" maxlength="6000">${esc(v.text)}</textarea><p class="field-hint">Start a line with “- ” to make it a bullet in the PDF.</p></div>`;
  const fields = kind === 'paragraph' ? area('Text', 6) : kind === 'bullet' ? `<div class="field"><label for="block-text">Bullet</label><textarea id="block-text" name="text" rows="4" maxlength="6000">${esc(v.text || v.heading)}</textarea></div>`
    : kind === 'item' ? field('heading', 'Heading', v.heading, 300) + field('meta', 'Date and context', v.meta, 500) + area('Text', 6)
    : field('heading', 'Heading', v.heading, 300) + field('date', 'Dates', v.date, 80, 'Shown on the right, e.g. “2022 – Present”.') + field('meta', 'Second line', v.meta, 500) + area('Text', 4);
  const from = block?.sourceKey ? sourceLabel(c, block.sourceKey) : '';
  const canRestore = Boolean(block?.generated && !sameContent(block, block.generated));
  const removable = block && block.section !== 'contact';
  return header(block ? 'Edit Text' : 'Add Text', esc(sectionLabel(doc, section))) + `<form id="block-form" class="modal-body form-grid" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>
    ${fields}<p class="field-hint">${from ? `From: ${esc(from)}. ` : ''}Edits stay in this document; your records are not changed.</p>
    ${canRestore ? `<button type="button" class="text-action studio-restore" data-action="block-restore">${icon('refresh', 16)} Restore the text from its source</button>` : ''}
    ${removable ? `<button type="button" class="button button-danger-soft studio-remove" data-action="block-remove-current">${icon('trash', 16)} Remove from this document</button>` : ''}
  </form><div class="modal-footer"><button type="button" class="button button-outline" data-action="close">Cancel</button><button type="button" class="button button-primary" data-action="save-block">${icon('check', 17)} Save</button></div>`;
}
export function readBlockForm(form: HTMLFormElement, kind: ContentBlock['kind'], previous: BlockContent | null): BlockContent {
  const fd = new FormData(form), read = (k: string) => (fd.has(k) ? String(fd.get(k) ?? '') : null);
  const text = (read('text') ?? '').replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trim();
  const out = { heading: (read('heading') ?? previous?.heading ?? '').trim(), meta: (read('meta') ?? previous?.meta ?? '').trim(), date: (read('date') ?? previous?.date ?? '').trim(), text };
  if (kind === 'bullet') out.heading = '';
  return out;
}
export function documentSettingsForm(c: CareerCollections, doc: CareerDocument): string {
  const role = doc.roleId ? c.roles.find(r => r.id === doc.roleId)?.title ?? 'A role that was later removed' : 'All roles';
  const template = (id: 'cv-professional' | 'cv-technical') => `<label class="career-checkbox"><input type="radio" name="templateId" value="${id}" ${doc.templateId === id ? 'checked' : ''}/> ${TEMPLATE_LABELS[id]}</label>`;
  const line = (label: string, value: string) => `<p class="studio-detail"><span>${label}</span><strong>${esc(value)}</strong></p>`;
  return header('Document Details', doc.documentType === 'review' ? 'Performance review' : 'CV') + `<form id="document-settings-form" class="modal-body form-grid" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>
    <div class="field"><label for="document-title">Title</label><input id="document-title" name="title" maxlength="160" value="${attr(doc.title)}" required/></div>
    ${doc.documentType === 'cv' ? `<fieldset class="field studio-fieldset"><legend>Template</legend>${template('cv-professional')}${template('cv-technical')}<p class="field-hint">Changes the PDF's look. Sections and text stay as you arranged them.</p></fieldset>` : ''}
    <div class="studio-details">${doc.documentType === 'review' ? line('Period', periodLong(doc.periodStart, doc.periodEnd)) + line('Role', role) : ''}
      ${line('Confidential records', doc.excludeConfidential ? 'Left out' : 'Included')}${line('Made', new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(doc.createdAt)))}</div>
    <p class="field-hint">To change the period, role or confidential setting, make a new document; this one keeps its text.</p>
  </form><div class="modal-footer"><button type="button" class="button button-outline" data-action="close">Cancel</button><button type="button" class="button button-primary" data-action="save-document-settings">${icon('check', 17)} Save</button></div>`;
}
/** A paper-like preview of what the PDF will contain, in the same order. */
export function previewView(doc: CareerDocument, head: { name: string; subtitle: string }): string {
  const contact = blocksOf(doc, 'contact')[0], contactShown = doc.sections.find(s => s.key === 'contact')?.visible !== false;
  const top = doc.documentType === 'review'
    ? `<header class="paper-head paper-head-review"><div><strong>${esc(head.name || doc.title)}</strong><span>${esc(head.subtitle)}</span></div><div><strong>Performance Review</strong><span>${esc(periodLong(doc.periodStart, doc.periodEnd))}</span></div></header>`
    : contact && contactShown ? `<header class="paper-head ${doc.templateId === 'cv-professional' ? 'paper-head-centered' : ''}"><strong>${esc(contact.heading)}</strong><span>${esc(contact.meta)}</span><small>${esc(contact.text)}</small></header>` : '';
  const sections = doc.sections.filter(s => s.visible && s.key !== 'contact').map(s => {
    const blocks = blocksOf(doc, s.key).filter(b => b.heading.trim() || b.text.trim() || b.meta.trim() || b.date.trim());
    if (!blocks.length) return '';
    return `<section><h3>${esc(sectionLabel(doc, s.key))}</h3>${blocks.map(b => b.kind === 'bullet' ? `<p class="paper-bullet">• ${textHtml(b.text || b.heading)}</p>`
      : `<div class="paper-block">${b.heading.trim() || b.date.trim() ? `<p class="paper-line"><strong>${esc(b.heading)}</strong>${b.date.trim() ? `<span>${esc(b.date)}</span>` : ''}</p>` : ''}${b.meta.trim() ? `<p class="paper-meta">${esc(b.meta)}</p>` : ''}${b.text.trim() ? `<p>${textHtml(b.text)}</p>` : ''}</div>`).join('')}</section>`;
  }).join('');
  return header('Preview', 'What the PDF contains, in this order') + `<div class="modal-body"><div class="paper paper-${doc.templateId}">${top}${sections}</div></div><div class="modal-footer"><button type="button" class="button button-outline" data-action="close">Close</button><button type="button" class="button button-primary" data-action="export-pdf">${icon('download', 16)} Export PDF</button></div>`;
}
