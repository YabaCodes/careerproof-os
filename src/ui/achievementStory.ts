/**
 * CP-UX1 (DEC-036) — an achievement read as a short story, and the compact row
 * used in the Vault and on Home.
 *
 * Reading order: Result → What I did → Context → skills; everything else
 * (detailed actions, notes, impact category, evidence, other experiences,
 * privacy and record dates) sits under "More Details". Nothing is hidden from
 * the record, only folded.
 */
import type { AchievementView, CareerCollections, ImpactMetric } from '../domain/models.js';
import { IMPACT_CATEGORIES } from '../domain/models.js';
import { formatPrecisionDate } from '../domain/dates.js';
import { escapeHtml as esc } from './html.js';
import { icon } from './icons.js';

const dateText = (a: AchievementView) => a.occurredStart ? formatPrecisionDate(a.occurredStart.value) : 'No date';
const statusTag = (s: AchievementView['status']) => s === 'recorded' ? '' : `<span class="status-tag status-${s}">${s === 'draft' ? 'Draft' : 'Archived'}</span>`;

/** A two-line row: full title, then date and where it happened. Only drafts and archived entries carry a tag. */
export function achievementRow(a: AchievementView, context: string | undefined): string {
  const meta = [dateText(a), context].filter(Boolean).join(' · ');
  return `<button type="button" class="achievement-row vault-row" data-action="detail" data-id="${esc(a.id)}">`
    + `<span class="vault-row-text"><strong>${esc(a.title)}</strong><span class="vault-row-meta">${esc(meta)}</span></span>`
    + statusTag(a.status) + `<span class="row-arrow">${icon('chevron', 17)}</span></button>`;
}

function metricLine(m: ImpactMetric): string {
  const values = m.baselineValue !== null && m.resultValue !== null ? `${m.baselineValue} → ${m.resultValue}`
    : m.resultValue !== null ? String(m.resultValue) : m.reportedValue !== null ? String(m.reportedValue) : m.baselineValue !== null ? `from ${m.baselineValue}` : '';
  return `<li><span>${esc(m.metricName)}</span><strong>${esc([values, m.unit].filter(Boolean).join(' '))}</strong></li>`;
}
const section = (title: string, body: string) => body ? `<section class="story-section"><h3>${title}</h3>${body}</section>` : '';
const para = (text: string) => text.trim() ? `<p class="readable-text">${esc(text)}</p>` : '';

export interface StoryParts { title: string; subtitle: string; body: string; footer: string }
export function achievementStory(a: AchievementView, c: CareerCollections): StoryParts {
  const projectLinks = c.recordLinks.filter(l => l.linkType === 'achievement-project' && l.sourceId === a.id)
    .sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary));
  const projects = projectLinks.map(l => c.projects.find(p => p.id === l.targetId)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const role = c.roles.find(r => r.id === a.roleId);
  const skills = c.recordLinks.filter(l => l.linkType === 'achievement-competency' && l.sourceId === a.id)
    .map(l => c.competencies.find(s => s.id === l.targetId)?.name).filter((n): n is string => Boolean(n)).sort((x, y) => x.localeCompare(y));
  const metrics = c.impactMetrics.filter(m => m.achievementId === a.id);
  const evidence = c.evidenceReferences.filter(e => e.achievementId === a.id);
  const subtitle = [dateText(a), projects[0]?.name, role?.title].filter(Boolean).join(' · ');

  const missing = [a.contribution.trim() ? '' : 'what you did', a.occurredStart ? '' : 'a date'].filter(Boolean);
  const notice = a.status === 'draft'
    ? `<p class="story-notice">${icon('info', 16)}<span>Draft — not counted yet. ${missing.length ? `Add ${missing.join(' and ')}, then record it.` : 'Open Edit and record it when it is ready.'}</span></p>`
    : a.status === 'archived' ? `<p class="story-notice">${icon('archive', 16)}<span>Archived — kept, but left out of lists and counts.</span></p>` : '';
  const result = `<section class="story-result" aria-labelledby="story-result-title"><h3 id="story-result-title">Result</h3>`
    + (a.outcome.trim() ? `<p>${esc(a.outcome)}</p>` : '<p class="is-missing">No result stated yet</p>')
    + (metrics.length ? `<ul class="story-metrics">${metrics.map(metricLine).join('')}</ul>` : '') + '</section>';
  const more = [
    section('Detailed Actions', para(a.actions)),
    section('Notes', para(a.notes)),
    section('Impact Category', a.impactCategory ? `<p class="readable-text">${esc(IMPACT_CATEGORIES[a.impactCategory])}</p>` : ''),
    section('Evidence References', evidence.length ? `<ul class="story-list">${evidence.map(e => `<li><strong>${esc(e.label)}</strong> ${e.referenceType === 'url'
      ? `<a href="${esc(e.referenceValue)}" target="_blank" rel="noopener noreferrer">${esc(e.referenceValue)}</a>` : esc(e.referenceValue)}${e.notes ? `<span class="fine-text">${esc(e.notes)}</span>` : ''}</li>`).join('')}</ul><p class="fine-text">User provided, not independently verified.</p>` : ''),
    section('Other Experiences', projects.length > 1 ? `<p class="readable-text">${esc(projects.slice(1).map(p => p.name).join(' · '))}</p>` : ''),
    section('Privacy', `<p class="readable-text">${a.confidentiality === 'confidential' ? 'Confidential — excluded from anything you share later' : 'Standard private'}</p>`),
    `<p class="fine-text story-record">Created ${esc(new Date(a.createdAt).toLocaleDateString())} · Last updated ${esc(new Date(a.updatedAt).toLocaleDateString())}</p>`,
    `<div class="story-actions"><button type="button" class="button button-outline" data-action="toggle-archive">${icon(a.status === 'archived' ? 'refresh' : 'archive', 16)} ${a.status === 'archived' ? 'Restore' : 'Archive'}</button>`
      + `<button type="button" class="button button-danger-soft" data-action="delete-achievement">${icon('trash', 16)} Delete</button></div>`
  ].join('');
  const body = `<div class="modal-body story">${notice}${result}`
    + section('What I Did', a.contribution.trim() ? para(a.contribution) : '<p class="readable-text is-missing">Not added yet</p>')
    + section('Context', para(a.situation))
    + (skills.length ? `<section class="story-section"><h3>Skills Shown</h3><div class="chip-row">${skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div></section>` : '')
    + `<details class="story-more" data-keep-open="story-more"><summary>More Details</summary>${more}</details></div>`;
  const footer = `<div class="modal-footer"><button type="button" class="button button-primary" data-action="edit-achievement">${icon('edit', 16)} Edit</button></div>`;
  return { title: a.title, subtitle, body, footer };
}
