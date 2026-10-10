import type { RemovalImpact, RemovalMode, RemovalRef } from '../domain/removal.js';
import { escapeHtml as esc } from './html.js';
import { icon } from './icons.js';

export interface RemovalChoice { mode: RemovalMode | null; targetId: string; confirmed: boolean }
const SHOWN = 4;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Sensible starting choice: move when a compatible target exists, else unlink when allowed. */
export function defaultRemovalChoice(impact: RemovalImpact): RemovalChoice {
  if (!impact.hasDependents) return { mode: 'delete', targetId: '', confirmed: false };
  if (impact.targets.length) return { mode: 'move', targetId: impact.targets[0]!.id, confirmed: false };
  return { mode: impact.canUnlink ? 'unlink' : null, targetId: '', confirmed: false };
}
export function removalReady(impact: RemovalImpact, choice: RemovalChoice): boolean {
  if (!impact.hasDependents) return true;
  if (!choice.confirmed) return false;
  if (choice.mode === 'move') return impact.targets.some(t => t.id === choice.targetId);
  return choice.mode === 'unlink' && impact.canUnlink;
}
function refs(list: RemovalRef[], word: string, note = ''): string {
  if (!list.length) return '';
  const names = list.slice(0, SHOWN).map(r => esc(r.label) + (r.primary ? ' <span class="removal-flag">primary</span>' : '')).join(', ');
  const more = list.length > SHOWN ? `, and ${list.length - SHOWN} more` : '';
  return `<li><strong>${plural(list.length, word)}</strong>${note}<span>${names}${more}</span></li>`;
}
function unlinkConsequence(impact: RemovalImpact): string {
  switch (impact.kind) {
    case 'roles': return 'Achievements stay in your Vault without a role; experiences lose the link to this role.' + (impact.primaryRole ? ' Your primary role will be cleared.' : '');
    case 'projects': {
      const primary = impact.achievements.filter(a => a.primary).length;
      return 'Achievements and roles stay; they are no longer linked to this experience.' + (primary ? ` ${plural(primary, 'achievement')} will have no primary experience.` : '');
    }
    case 'employers': return 'Experiences stay and become independent of any employer.';
    case 'competencies': return 'Achievements stay but are no longer linked to this skill, so the record of using it is lost. Archive keeps it instead.';
    default: return '';
  }
}
export function removalContent(impact: RemovalImpact, choice: RemovalChoice): { title: string; subtitle: string; body: string; footer: string } {
  const title = `Delete ${impact.noun} “${impact.label}”?`;
  const subtitle = impact.hasDependents ? 'Other records link to it. Choose what happens to them.' : 'Nothing else links to it.';
  let body = '<form id="removal-form" class="modal-body removal-body" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>';
  if (!impact.hasDependents) {
    body += `<p class="removal-lead">Deleting this ${esc(impact.noun)} cannot be undone.</p>`;
  } else {
    body += `<section class="removal-impact" aria-labelledby="removal-impact-title"><h3 id="removal-impact-title">Linked to this ${esc(impact.noun)}</h3><ul>`
      + refs(impact.achievements, 'achievement') + refs(impact.roles, 'role') + refs(impact.projects, 'experience')
      + (impact.primaryRole ? '<li><strong>Your primary role</strong><span>Shown as current on your profile</span></li>' : '')
      + '</ul></section>';
    const moveDisabled = !impact.targets.length;
    body += '<fieldset class="removal-options"><legend>What should happen to them?</legend>'
      + `<label class="removal-option${moveDisabled ? ' is-disabled' : ''}"><input type="radio" name="removal-mode" id="removal-mode-move" value="move" ${choice.mode === 'move' ? 'checked' : ''} ${moveDisabled ? 'disabled' : ''}/><span><strong>Move them to another ${esc(impact.noun)}</strong><small>${esc(impact.moveBlockedReason ?? 'They keep all their content and point to the one you choose. Duplicate links are merged.')}</small></span></label>`
      + (choice.mode === 'move' && !moveDisabled ? `<div class="field removal-target"><label for="removal-target">Move to</label><select id="removal-target">${impact.targets.map(t => `<option value="${esc(t.id)}" ${t.id === choice.targetId ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select></div>` : '')
      + `<label class="removal-option${impact.canUnlink ? '' : ' is-disabled'}"><input type="radio" name="removal-mode" id="removal-mode-unlink" value="unlink" ${choice.mode === 'unlink' ? 'checked' : ''} ${impact.canUnlink ? '' : 'disabled'}/><span><strong>Remove the links</strong><small>${esc(impact.unlinkBlockedReason ?? unlinkConsequence(impact))}</small></span></label>`
      + '</fieldset>'
      + `<label class="removal-confirm"><input type="checkbox" id="removal-confirm" ${choice.confirmed ? 'checked' : ''}/><span>I understand this ${esc(impact.noun)} is deleted permanently. No achievements are deleted.</span></label>`;
  }
  body += `<p class="removal-tip">${icon('download', 15)}<span>Export a backup first if you might want this back. <button type="button" class="inline-link" data-action="export">Export backup</button></span></p></form>`;
  const ready = removalReady(impact, choice);
  const footer = `<div class="modal-footer"><button class="button button-outline" data-action="close">Cancel</button><button class="button button-danger" data-action="confirm-removal" ${ready ? '' : 'disabled'}>${icon('trash', 16)} Delete ${esc(impact.noun)}</button></div>`;
  return { title, subtitle, body, footer };
}
