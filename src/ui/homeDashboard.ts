/**
 * CP-012C — Home dashboard sections. Read-only views over the shared domain
 * rules: what is missing from the record, and where achievements are
 * recorded by role. Counts only; nothing here scores or rates the person.
 */
import type { CareerCollections, PrecisionDate } from '../domain/models.js';
import { formatPrecisionDate } from '../domain/dates.js';
import { homeGaps, roleCoverage } from '../domain/dashboard.js';
import { issueBlock } from './dataHealth.js';
import { escapeHtml as esc } from './html.js';
import { icon } from './icons.js';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const sectionTitle = (title: string, action = '') => `<div class="section-title"><h2>${title}</h2>${action}</div>`;
const when = (start: PrecisionDate, end: PrecisionDate | null, current: boolean) =>
  `${formatPrecisionDate(start.value)} – ${current ? 'Present' : end ? formatPrecisionDate(end.value) : 'End not recorded'}`;

/** "Complete Your Record": documentation gaps shared with Data Health. Empty string when there is nothing to show yet. */
export function homeGapsSection(c: CareerCollections, today: string): string {
  const gaps = homeGaps(c, today);
  const recorded = c.achievements.some(a => a.status === 'recorded');
  if (!gaps.length && !recorded) return '';
  const action = '<button class="text-action" data-action="open-data-health">Data Health ' + icon('arrow', 16) + '</button>';
  const body = gaps.length
    ? '<p class="home-gaps-note">Based on what you have recorded, not on your ability. Tap a record to complete it.</p>' +
      gaps.map(g => issueBlock(g, 'gap:' + g.code)).join('')
    : '<p class="home-gaps-done">' + icon('check', 18) + '<span>Nothing missing from your recorded achievements, experiences or credentials.</span></p>';
  return sectionTitle('Complete Your Record', action) + '<section class="panel home-gaps" aria-label="Complete your record">' + body + '</section>';
}

/** "Achievements by Role": active achievements per role, most recent role first. Empty string without roles. */
export function roleCoverageSection(c: CareerCollections): string {
  const { roles, withoutRole } = roleCoverage(c);
  if (!roles.length) return '';
  const rows = roles.map(r => {
    const counts = r.achievements
      ? plural(r.achievements, 'achievement') + (r.drafts ? ' · ' + plural(r.drafts, 'draft') : '')
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
  return sectionTitle('Achievements by Role') + '<section class="panel list-card role-coverage" aria-label="Achievements by role">' + rows + unassigned + '</section>';
}
