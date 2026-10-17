/** CP-UX3 — Drafts are not plans until the user explicitly moves them. */
import type { Achievement, Project } from './models.js';
import { ValidationError } from './validation.js';

export interface ExpectedResultReceipt {
  draftId: string;
  experienceId: string;
  draftRevision: number;
  experienceRevision: number;
  previousObjective: string;
  appendedObjective: string;
}
/** Exact paragraph matching prevents accidental double appends after restore/retry. */
export function appendExpectedResult(previous: string, proposed: string): string {
  const addition = proposed.trim();
  if (!addition) throw new ValidationError('Describe the expected result before moving the draft.');
  if (previous.split(/\r?\n[ \t]*\r?\n/).some(part => part.trim() === addition))
    throw new ValidationError('This expected result is already in the experience. Nothing was moved.');
  const combined = previous ? previous + (previous.endsWith('\n') ? '\n' : '\n\n') + addition : addition;
  if (combined.length > 6000) throw new ValidationError('The Expected Result would exceed 6,000 characters. Shorten it before moving the draft.');
  return combined;
}
export function ensureExpectedMove(draft: Achievement, experience: Project, allowCompleted: boolean): void {
  if (draft.status !== 'draft') throw new ValidationError('Only active drafts can be moved to Expected Results.');
  if (experience.status === 'completed' && !allowCompleted)
    throw new ValidationError('Confirm that you want to add a goal to a completed experience.');
  if (draft.confidentiality === 'confidential' && experience.confidentiality !== 'confidential')
    throw new ValidationError('This draft is Confidential. First mark the experience Confidential in its editor, then try again.');
}
