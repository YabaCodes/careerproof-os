/**
 * CP-012C — Home dashboard sections. Read-only views over the shared domain
 * rules: what is missing from the record, and where achievements are
 * recorded by role. Counts only; nothing here scores or rates the person.
 */
import type { CareerCollections, PrecisionDate } from '../domain/models.js';
import { formatPrecisionDate } from '../domain/dates.js';
import { homeGaps, roleCoverage, type MonthlyRecord, type RecordMonth } from '../domain/dashboard.js';
import { issueBlock } from './dataHealth.js';
import { escapeHtml as esc } from './html.js';
import { icon } from './icons.js';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const sectionTitle = (title: string, action = '') => `<div class="section-title"><h2>${title}</h2>${action}</div>`;
const when = (start: PrecisionDate, end: PrecisionDate | null, current: boolean) =>
  `${formatPrecisionDate(start.value)} – ${current ? 'Present' : end ? formatPrecisionDate(end.value) : 'End not recorded'}`;

/** "Complete Your Record": documentation gaps shared with Data Health. Empty string when there is nothing to show yet. */
export function homeGapsSection(c: CareerCollections, today: string, embedded = false): string {
  const gaps = homeGaps(c, today);
  const recorded = c.achievements.some(a => a.status === 'recorded');
  if (!gaps.length && !recorded && !embedded) return '';
  const action = '<button class="text-action" data-action="open-data-health">Data Health ' + icon('arrow', 16) + '</button>';
  const body = gaps.length
    ? '<p class="home-gaps-note">Based on what you have recorded, not on your ability. Tap a record to complete it.</p>' +
      gaps.map(g => issueBlock(g, 'gap:' + g.code)).join('')
    : '<p class="home-gaps-done">' + icon('check', 18) + '<span>Nothing missing from your recorded achievements, experiences or credentials.</span></p>';
  return (embedded ? '' : sectionTitle('Complete Your Record', action)) + '<section class="panel home-gaps" aria-label="Complete your record">' + (embedded ? action : '') + body + '</section>';
}

/** "Achievements by Role": active achievements per role, most recent role first. Empty string without roles. */
export function roleCoverageSection(c: CareerCollections, embedded = false): string {
  const { roles, withoutRole } = roleCoverage(c);
  if (!roles.length) return embedded ? '<p class="home-gaps-note">Add a role in Profile to see achievements grouped by role.</p>' : '';
  const rows = roles.map(r => {
    // CP-UX1: "achievements" means recorded ones everywhere; drafts are counted on their own.
    const recorded = r.achievements - r.drafts;
    const counts = r.achievements
      ? [recorded ? plural(recorded, 'achievement') : '', r.drafts ? plural(r.drafts, 'draft') : ''].filter(Boolean).join(' · ')
      : 'No achievements recorded yet';
    const extra = r.experiences ? ' · ' + plural(r.experiences, 'experience') : '';
    const text = '<span class="role-row-text"><strong>' + esc(r.title) + '</strong>' +
      '<small>' + esc([r.employer, when(r.startDate, r.endDate, r.current)].filter(Boolean).join(' · ')) + '</small>' +
      '<span class="role-row-counts' + (r.achievements ? '' : ' is-empty') + '">' + esc(counts + extra) + '</span></span>';
    // Only rows with achievements open the Vault; an empty filtered list helps nobody.
    return r.achievements
      ? '<button type="button" class="role-row" data-action="role-achievements" data-id="' + esc(r.roleId) + '">' + text + '<span class="row-arrow">' + icon('chevron', 17) + '</span></button>'
      : '<div class="role-row">' + text + '</div>';
  }).join('');
  const unassigned = withoutRole
    ? '<div class="role-row role-row-none"><span class="role-row-text"><strong>Not linked to a role</strong><span class="role-row-counts">' + plural(withoutRole, 'achievement') + '</span></span></div>'
    : '';
  return (embedded ? '' : sectionTitle('Achievements by Role')) + '<section class="panel list-card role-coverage" aria-label="Achievements by role">' + rows + unassigned + '</section>';
}

/* ---------- CP-UX-Fluid (DEC-038): the record over the last 12 months ---------- */
const monthDate = (key: string) => new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 15));
const monthFormat = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' });
/** "March 2026" */
export const monthName = (key: string) => monthFormat({ month: 'long', year: 'numeric' }).format(monthDate(key));
const monthShort = (key: string) => monthFormat({ month: 'short', year: 'numeric' }).format(monthDate(key));
const monthLetter = (key: string) => monthFormat({ month: 'narrow' }).format(monthDate(key));

/**
 * "Last 12 Months": one bar per month for the recorded achievements that
 * happened in it, with the count above. Each month is a button that lists that
 * month below. Empty string when nothing in the window can be shown by month.
 * Counts only — no target line, average, streak or score.
 */
export function recordTimelineSection(r: MonthlyRecord, selected: string | null): string {
  if (!r.total) return '';
  const max = Math.max(...r.months.map(m => m.count));
  const current = r.months[r.months.length - 1]!.key;
  const bars = r.months.map(m => {
    const height = m.count ? Math.max(8, Math.round((m.count / max) * 100)) : 0;
    const cls = ['record-month', m.key === selected ? 'is-selected' : '', m.key === current ? 'is-current' : '', m.count ? '' : 'is-empty'].filter(Boolean).join(' ');
    return '<button type="button" class="' + cls + '" data-action="home-month" data-month="' + m.key + '" aria-pressed="' + (m.key === selected) + '" aria-label="' + esc(monthName(m.key) + ': ' + plural(m.count, 'achievement')) + '">' +
      '<span class="record-count" aria-hidden="true">' + (m.count || '') + '</span>' +
      '<span class="record-track" aria-hidden="true"><span class="record-fill" data-bar="month:' + m.key + '" style="height:' + height + '%"></span></span>' +
      '<span class="record-letter" aria-hidden="true">' + esc(monthLetter(m.key)) + '</span></button>';
  }).join('');
  const range = monthShort(r.months[0]!.key) + ' – ' + monthShort(current);
  const yearOnly = r.yearOnly
    ? '<p class="record-note">' + esc(plural(r.yearOnly, 'achievement') + ' from ' + r.years.join('–') + (r.yearOnly === 1 ? ' has' : ' have') + ' only a year, so ' + (r.yearOnly === 1 ? 'it is' : 'they are') + ' not shown by month.') + '</p>'
    : '';
  return sectionTitle('Last 12 Months', '<span class="section-meta">' + plural(r.total, 'achievement') + '</span>') +
    '<section class="panel record-card" aria-label="Recorded achievements by month">' +
    '<div class="record-chart" role="group" aria-label="Recorded achievements by the month they happened, ' + esc(range) + '">' + bars + '</div>' +
    '<p class="record-note">' + esc(range) + ', by the month each happened. Tap a month to list it.</p>' + yearOnly + '</section>';
}

/** The heading over the list when a month is picked: the month, a step back or forward, and the way back to Recent. */
export function monthListTitle(r: MonthlyRecord, month: RecordMonth): string {
  const index = r.months.findIndex(m => m.key === month.key);
  const step = (delta: -1 | 1, label: string, glyph: string) => {
    const target = r.months[index + delta];
    return '<button type="button" class="icon-button month-step" data-action="home-month" data-step="' + delta + '" data-month="' + (target?.key ?? '') + '" aria-label="' + label + (target ? ': ' + esc(monthName(target.key)) : '') + '"' + (target ? '' : ' disabled') + '>' + icon(glyph, 18) + '</button>';
  };
  return '<div class="section-title month-title"><h2 id="home-list-title">' + esc(monthName(month.key)) + '</h2>' +
    '<div class="month-actions">' + step(-1, 'Previous month', 'back') + step(1, 'Next month', 'chevron') +
    '<button type="button" class="text-action" data-action="home-month-clear">Recent</button></div></div>';
}
/** A picked month with nothing recorded in it says so plainly. */
export function monthEmpty(month: RecordMonth): string {
  return '<section class="panel list-card"><p class="month-empty">Nothing recorded in ' + esc(monthName(month.key)) + '.</p></section>';
}
