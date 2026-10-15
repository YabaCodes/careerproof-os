import type {Competency} from '../domain/models.js';
import {localDate} from '../domain/models.js';
import {isValidLocalDate} from '../domain/dates.js';
import {ValidationError} from '../domain/validation.js';
import {PROFICIENCY_LEVELS,RUBRIC_VERSION} from '../domain/proficiency.js';
import {icon} from './icons.js';
import {escapeHtml as esc} from './html.js';

export function proficiencyAssessmentForm(skill:Competency,defaultDate:string):string{
  const options=PROFICIENCY_LEVELS.map(p=>'<option value="'+p.level+'">L'+p.level+' — '+esc(p.name)+' · '+esc(p.description)+'</option>').join('');
  return '<div class="modal-header"><div><h2 id="dialog-title">Assess Your Proficiency</h2><p id="dialog-description">'+esc(skill.name)+' · Your own assessment, not independent verification.</p></div>'+
    '<button class="icon-button close-dialog" data-action="close" aria-label="Close">'+icon('close',24)+'</button></div>'+
    '<form id="proficiency-form" class="modal-body form-grid" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>'+
    '<p class="field-hint">Use the generic CareerProof L1–L4 rubric. This rating is separate from Evidence Breadth. Saving always appends to your history; earlier ratings are preserved.</p>'+
    '<div class="field"><label for="proficiency-level">Self-assessed level <span class="required">*</span></label><select id="proficiency-level" name="level" required><option value="">Choose a level</option>'+options+'</select></div>'+
    '<div class="field"><label for="proficiency-date">Assessment date <span class="required">*</span></label><input id="proficiency-date" type="date" name="assessmentDate" value="'+esc(defaultDate)+'" max="'+esc(defaultDate)+'" required/></div>'+
    '<div class="field"><label for="proficiency-rationale">Why did you select this level? (optional)</label><textarea id="proficiency-rationale" name="rationale" maxlength="6000" rows="4" placeholder="Describe the autonomy and complexity of your work."></textarea></div>'+
    '<div class="field"><label for="proficiency-context">Assessment context (optional)</label><textarea id="proficiency-context" name="assessmentContext" maxlength="2000" rows="2" placeholder="For example, current responsibilities or a particular role."></textarea></div>'+
    '<div class="field"><label for="proficiency-development">Development note (optional)</label><textarea id="proficiency-development" name="developmentNote" maxlength="6000" rows="3" placeholder="A capability you want to strengthen or document."></textarea></div>'+
    '<p class="field-hint">Rubric version '+esc(RUBRIC_VERSION)+'. New assessments do not overwrite prior ratings.</p>'+
    '</form><div class="modal-footer"><button type="button" class="button button-outline" data-action="close">Cancel</button><button type="button" class="button button-primary" data-action="save-proficiency">Save assessment</button></div>';
}
export function readProficiencyForm(form:HTMLFormElement,competencyId:string){
  const data=new FormData(form),read=(key:string)=>String(data.get(key)??'').trim(),raw=read('level');
  if(!['1','2','3','4'].includes(raw))throw new ValidationError('Choose a self-assessed proficiency level (L1–L4).');
  const value=read('assessmentDate');
  if(!isValidLocalDate(value))throw new ValidationError('Choose a valid assessment date.');
  // The latest assessment date is the current level, so a future date would stay current indefinitely.
  if(value>localDate())throw new ValidationError('The assessment date cannot be in the future.');
  const rationale=read('rationale'),developmentNote=read('developmentNote'),assessmentContext=read('assessmentContext');
  if(rationale.length>6000||developmentNote.length>6000||assessmentContext.length>2000)
    throw new ValidationError('An assessment note exceeds the supported length.');
  return {competencyId,selfAssessedLevel:Number(raw) as 1|2|3|4,assessmentDate:{value,precision:'day' as const},
    rubricVersion:RUBRIC_VERSION,rationale,developmentNote,assessmentContext};
}
