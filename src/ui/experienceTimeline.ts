/**
 * CP-UX1 (DEC-036) — the Experience tab as a timeline grouped by role, and a
 * page for each experience. Read-only views; editing still happens in the
 * existing experience editor and achievement form.
 */
import type { CareerCollections, PrecisionDate, Project } from '../domain/models.js';
import { formatPrecisionDate } from '../domain/dates.js';
import { experienceTimeline, experienceRoles, experienceSkills, type TimelineExperience, type TimelineGroup } from '../domain/timeline.js';
import { experienceRollup, legacyExperienceNotes } from '../domain/experience.js';
import { escapeHtml as esc } from './html.js';
import { icon } from './icons.js';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const TYPE: Record<Project['experienceType'], string> = { project: 'Project', initiative: 'Initiative', 'ongoing-responsibility': 'Ongoing responsibility' };
const STATUS: Record<Project['status'], string> = { planned: 'Planned', active: 'Active', 'on-hold': 'On hold', completed: 'Completed' };
const when = (d: PrecisionDate | null) => (d ? formatPrecisionDate(d.value) : '');

/** "Oct 2023 – now", "Jun 2025 – Oct 2026", "2025", or '' when no dates are recorded. */
export function experienceRange(p: Project): string {
  const start = when(p.startDate), end = when(p.endDate), ongoing = p.status !== 'completed';
  if (!start && !end) return '';
  if (start && end) return start === end ? start : `${start} – ${end}`;
  if (start) return ongoing ? `${start} – now` : start;
  return `Until ${end}`;
}
function roleRange(g: TimelineGroup): string {
  if (!g.startDate) return '';
  return `${when(g.startDate)} – ${g.current ? 'Present' : when(g.endDate) || 'End not recorded'}`;
}

function experienceRow(x: TimelineExperience): string {
  const p = x.project;
  const parts = [
    p.experienceType !== 'project' ? TYPE[p.experienceType] : '',
    x.ongoing && p.status !== 'active' ? STATUS[p.status] : '',
    experienceRange(p) || (p.experienceType === 'ongoing-responsibility' ? '' : 'No dates'),
    x.achievements ? plural(x.achievements, 'achievement') : x.drafts ? '' : 'No achievements yet',
    x.drafts ? plural(x.drafts, 'draft') : ''
  ].filter(Boolean);
  return `<button type="button" class="experience-row" data-action="open-experience" data-id="${esc(p.id)}">`
    + `<span class="experience-row-text"><strong>${esc(p.name)}</strong>`
    + `<span class="experience-row-meta">${x.ongoing ? '<span class="live-dot" aria-hidden="true"></span>' : ''}${esc(parts.join(' · '))}</span>`
    + (x.alsoRoles.length ? `<span class="experience-row-also">Also: ${esc(x.alsoRoles.join(', '))}</span>` : '')
    + `</span><span class="row-arrow">${icon('chevron', 17)}</span></button>`;
}
function matches(x: TimelineExperience, q: string): boolean {
  const p = x.project;
  return [p.name, p.scope, p.objective, p.personalResponsibility, p.outcome].join(' ').toLocaleLowerCase().includes(q);
}

/**
 * The grouped list. The two most recent roles start open, then the groups the
 * viewer opened stay open (`openKeys`); a search opens every group with a match.
 */
export function timelineGroups(c: CareerCollections, query = '', openKeys: ReadonlySet<string> | null = null): string {
  const q = query.trim().toLocaleLowerCase();
  const groups = experienceTimeline(c).map(g => ({ ...g, experiences: q ? g.experiences.filter(x => matches(x, q)) : g.experiences }))
    .filter(g => !q || g.experiences.length);
  if (!groups.length) return q ? '<p class="timeline-empty">No experiences match your search.</p>' : '';
  return groups.map((g, i) => {
    const count = g.role ? plural(g.experiences.length, 'experience') : '';
    const sub = [g.employer, roleRange(g), count].filter(Boolean).join(' · ');
    const rows = g.experiences.map(experienceRow).join('')
      + (g.looseAchievements && g.role ? `<button type="button" class="experience-row experience-row-loose" data-action="role-achievements" data-id="${esc(g.role.id)}"><span class="experience-row-text"><strong>${esc(plural(g.looseAchievements, 'achievement'))} not in an experience</strong><span class="experience-row-meta">Open them in the Vault</span></span><span class="row-arrow">${icon('chevron', 17)}</span></button>` : '');
    const open = q || (openKeys ? openKeys.has(g.key) : i < 2) ? ' open' : '';
    return `<details class="role-group" data-keep-open="${esc(g.key)}"${open}><summary>`
      + `<span class="role-group-text"><h2>${esc(g.title)}</h2>${sub ? `<span class="role-group-sub">${esc(sub)}</span>` : ''}</span>`
      + (g.current ? '<span class="role-current">Current</span>' : '')
      + `<span class="role-group-chevron" aria-hidden="true">${icon('chevron', 17)}</span></summary>`
      + `<div class="panel list-card role-group-body">${rows || '<p class="timeline-empty">Nothing recorded for this role yet.</p>'}</div></details>`;
  }).join('');
}

/** The Experience tab body. */
export function timelinePage(c: CareerCollections, query: string, openKeys: ReadonlySet<string> | null = null): string {
  if (!c.projects.length && !c.roles.length) {
    return `<section class="panel timeline-intro"><p>Your work, grouped by role. Add a role in Profile, then add the projects, initiatives and ongoing responsibilities your achievements belong to.</p><button class="button button-outline" data-action="add-project">${icon('plus', 17)} Add experience</button></section>`;
  }
  return `<div class="timeline">`
    + `<div class="timeline-toolbar"><label class="search-field timeline-search">${icon('search', 19)}<input id="experience-search" type="search" placeholder="Search experiences" value="${esc(query)}" autocomplete="off" aria-label="Search experiences"/></label>`
    + `<button class="button button-outline timeline-add" data-action="add-project" aria-label="Add experience">${icon('plus', 17)}<span>Add</span></button></div>`
    + `<div id="timeline-groups" class="timeline-groups">${timelineGroups(c, query, openKeys)}</div></div>`;
}

const statusTag = (s: 'draft' | 'recorded' | 'archived') => s === 'recorded' ? '' : `<span class="status-tag status-${s}">${s === 'draft' ? 'Draft' : 'Archived'}</span>`;

/** One experience: what it is, its goal, its achievements and the skills they show. */
export function experiencePageView(c: CareerCollections, projectId: string): string {
  const p = c.projects.find(x => x.id === projectId);
  if (!p) return `<div class="experience-page"><div class="page-topbar"><button type="button" class="back-link" data-action="close-experience">${icon('back', 20)}Experience</button></div><p class="timeline-empty">This experience no longer exists.</p></div>`;
  const employer = c.employers.find(e => e.id === p.employerId)?.name ?? '';
  const roles = experienceRoles(c, p.id).map(r => r.title);
  const sub = [employer, roles.join(' → '), experienceRange(p)].filter(Boolean).join(' · ');
  const ongoing = p.status !== 'completed';
  const roll = experienceRollup(c, p.id);
  const skills = experienceSkills(c, p.id);
  const notes = legacyExperienceNotes(p).filter(n => n.key !== 'objective');
  const goal = p.objective.trim()
    ? `<section class="goal-box" aria-labelledby="goal-title"><h2 id="goal-title">${icon('target', 17)}<span>${ongoing ? 'Expected Result' : 'Goal'}</span></h2><p>${esc(p.objective)}</p>`
      + (ongoing ? `<button type="button" class="text-action" data-action="project-capture" data-id="${esc(p.id)}">It happened — record it as an achievement ${icon('arrow', 16)}</button>` : '') + '</section>'
    : '';
  const rows = roll.items.map(i => `<button type="button" class="achievement-row story-row" data-action="detail" data-id="${esc(i.id)}">`
    + `<span class="story-row-head"><strong>${esc(i.title)}</strong><span class="story-row-date">${esc(i.occurredStart ? formatPrecisionDate(i.occurredStart.value) : 'No date')}</span></span>`
    + (i.outcome ? `<span class="story-row-result">${esc(i.outcome)}</span>` : '<span class="story-row-result is-missing">No result stated yet</span>')
    + (i.status !== 'recorded' ? `<span class="story-row-tags">${statusTag(i.status)}</span>` : '')
    + '</button>').join('');
  return `<article class="experience-page" aria-labelledby="experience-title">`
    + `<div class="page-topbar"><button type="button" class="back-link" data-action="close-experience">${icon('back', 20)}Experience</button>`
    + `<button type="button" class="text-action" data-action="edit-project" data-id="${esc(p.id)}">${icon('edit', 16)} Edit</button></div>`
    + `<header class="experience-head"><div class="pill-row"><span class="pill-outline">${esc(TYPE[p.experienceType])}</span><span class="pill-status ${ongoing ? 'is-live' : ''}">${esc(STATUS[p.status])}</span></div>`
    + `<h1 id="experience-title">${esc(p.name)}</h1>${sub ? `<p class="experience-sub">${esc(sub)}</p>` : ''}`
    + (p.scope.trim() ? `<p class="experience-context">${esc(p.scope)}</p>` : '') + '</header>'
    + goal
    + `<section class="experience-achievements" aria-labelledby="experience-achievements-title"><div class="section-title"><h2 id="experience-achievements-title">Achievements · ${roll.items.length}</h2>`
    + `<button type="button" class="text-action" data-action="project-capture" data-id="${esc(p.id)}">${icon('plus', 16)} Add</button></div>`
    + (rows ? `<div class="panel list-card">${rows}</div>` : `<div class="panel experience-empty"><p>No achievements yet. Add the first result from this experience.</p></div>`)
    + '</section>'
    + (skills.length ? `<section class="experience-skills" aria-labelledby="experience-skills-title"><h2 id="experience-skills-title">Skills Shown Here</h2><div class="chip-row">${skills.map(s => `<button type="button" class="chip chip-action" data-action="open-skill" data-id="${esc(s.id)}" aria-label="View skill ${esc(s.name)}">${esc(s.name)} · ${s.count} ${icon('arrow',14)}</button>`).join('')}</div></section>` : '')
    + (p.technologies.length ? `<p class="experience-tech"><strong>Technologies</strong> ${esc(p.technologies.join(', '))}</p>` : '')
    + (notes.length ? `<details class="experience-notes" data-keep-open="notes:${esc(p.id)}"><summary>Earlier Notes</summary><p class="career-meta">Written before results moved to linked achievements.</p>${notes.map(n => `<h3>${esc(n.label)}</h3><p>${esc(n.value)}</p>`).join('')}</details>` : '')
    + (p.confidentiality === 'confidential' ? `<p class="experience-privacy">${icon('lock', 14)} Confidential · included only in your private backup</p>` : '')
    + '</article>';
}
