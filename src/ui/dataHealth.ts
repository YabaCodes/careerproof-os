import type { DataHealthReport } from '../data/backup.js';
import type { HealthIssue } from '../domain/dataHealth.js';
import { escapeHtml as esc } from './html.js';
import { icon } from './icons.js';

const MAX_ITEMS = 8;
function itemButton(issue: HealthIssue, index: number): string {
  const item = issue.items[index]!;
  if (item.kind === 'settings') return `<button type="button" class="button button-outline health-export" data-action="export">${icon('download', 16)} Export backup now</button>`;
  return `<button type="button" class="health-link" data-action="health-open" data-kind="${item.kind}" data-id="${esc(item.id ?? '')}">${esc(item.label)} ${icon('chevron', 15)}</button>`;
}
function issueBlock(issue: HealthIssue): string {
  const shown = Math.min(issue.items.length, MAX_ITEMS);
  const more = issue.items.length - shown;
  return `<details class="health-issue health-${issue.severity}" data-code="${esc(issue.code)}"${issue.severity === 'critical' ? ' open' : ''}>`
    + `<summary><span class="health-title">${esc(issue.title)}</span>${icon('chevron', 16)}</summary>`
    + `<div class="health-body"><p>${esc(issue.detail)}</p>`
    + (shown ? `<div class="health-items">${Array.from({ length: shown }, (_, i) => itemButton(issue, i)).join('')}</div>` : '')
    + (more > 0 ? `<p class="health-more">and ${more} more</p>` : '')
    + `</div></details>`;
}
/** CP-012A report body. Read-only; every link only opens an existing editor. */
export function dataHealthReport(report: DataHealthReport): string {
  const critical = report.issues.filter(i => i.severity === 'critical');
  const advisory = report.issues.filter(i => i.severity === 'advisory');
  const headline = critical.length
    ? `${critical.length} critical problem${critical.length === 1 ? '' : 's'} found.`
    : `No critical problems. ${advisory.length ? `${advisory.length} suggestion${advisory.length === 1 ? '' : 's'} to review.` : 'Nothing to review.'}`;
  const storage = report.storagePersisted === true ? 'Browser storage is marked persistent.'
    : report.storagePersisted === null ? 'This browser does not report whether storage is persistent.' : '';
  return `<p class="health-headline ${critical.length ? 'is-critical' : ''}">${headline}</p>`
    + (critical.length ? `<h4 class="health-group">Critical</h4>${critical.map(issueBlock).join('')}` : '')
    + (advisory.length ? `<h4 class="health-group">Suggestions</h4>${advisory.map(issueBlock).join('')}` : '')
    + `<p class="health-note">${storage ? esc(storage) + ' ' : ''}Suggestions are about what is documented, not about your ability. Nothing was changed, uploaded or scored.</p>`;
}
