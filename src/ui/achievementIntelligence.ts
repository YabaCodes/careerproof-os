/**
 * Achievement detail rows (impact metrics, evidence references) and reading
 * the capture form back into an achievement bundle. The form itself is built
 * by captureFlow.ts (CP-UX2, DEC-037).
 */
import type {ImpactMetric, EvidenceReference, Confidentiality, Project} from '../domain/models.js';
import {ValidationError} from '../domain/validation.js';
import type {InlineExperienceDraft} from '../domain/experience.js';
import {escapeHtml} from './html.js';

const html=escapeHtml;
/** The "Where" choice for an achievement that belongs to no experience (a role, or nothing). */
export const ROLE_ONLY='__role';
export function metricRow(record?:ImpactMetric):string {
  const id=html(record?.id??crypto.randomUUID()), revision=record?.revision??0;
  const data='data-id="'+id+'" data-revision="'+revision+'"';
  const numeric=(name:string,label:string,value:number|null|undefined)=>
    '<div class="field"><label>'+html(label)+'<input name="'+name+'" type="number" inputmode="decimal" step="any" value="'+(value??'')+'" placeholder="Optional"/></label></div>';
  return '<fieldset class="rich-row metric-row" '+data+'><legend>Impact Metric</legend>'+
    '<div class="rich-row-grid"><div class="field"><label>Metric name<input name="metricName" maxlength="200" required placeholder="e.g. Cycle time" value="'+html(record?.metricName??'')+'"/></label></div>'+
    '<div class="field"><label>Unit<input name="unit" maxlength="80" placeholder="%, seconds, units" value="'+html(record?.unit??'')+'"/></label></div>'+
    numeric('baselineValue','Baseline',record?.baselineValue)+numeric('resultValue','Result',record?.resultValue)+
    numeric('reportedValue','Reported value',record?.reportedValue)+
    '<div class="field"><label>Direction<select name="direction">'+
    [['','Not specified'],['increase','Increase'],['decrease','Decrease'],['neutral','Neutral']].map(([v,l])=>
      '<option value="'+v+'" '+((record?.direction??'')===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label></div></div>'+
    '<div class="field"><label>Measurement context / source note<textarea name="sourceNote" maxlength="6000" rows="2">'+html(record?.sourceNote??'')+'</textarea></label></div>'+
    '<button type="button" class="career-inline-add rich-remove" data-action="remove-rich-row">Remove metric</button></fieldset>';
}
export function evidenceRow(record?:EvidenceReference):string {
  const data='data-id="'+html(record?.id??crypto.randomUUID())+'" data-revision="'+(record?.revision??0)+'" data-reviewed-at="'+html(record?.userReviewedAt??'')+'"';
  const options=[['description','Description'],['url','URL'],['document-reference','Document reference']];
  return '<fieldset class="rich-row evidence-row" '+data+'><legend>Evidence Reference</legend>'+
    '<div class="rich-row-grid"><div class="field"><label>Reference name<input name="label" maxlength="200" required value="'+html(record?.label??'')+'" placeholder="e.g. Test report"/></label></div>'+
    '<div class="field"><label>Reference type<select name="referenceType">'+
    options.map(([v,l])=>'<option value="'+v+'" '+(record?.referenceType===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label></div></div>'+
    '<div class="field"><label>Reference value<input name="referenceValue" maxlength="6000" required value="'+html(record?.referenceValue??'')+'" placeholder="Describe or paste a safe URL"/></label></div>'+
    '<div class="field"><label>Notes<textarea name="notes" maxlength="6000" rows="2">'+html(record?.notes??'')+'</textarea></label></div>'+
    '<p class="field-hint">References are user-entered, not independently verified. Do not upload confidential company documents.</p>'+
    '<button type="button" class="career-inline-add rich-remove" data-action="remove-rich-row">Remove reference</button></fieldset>';
}
export const INLINE_TYPES:[Project['experienceType'],string][]=[['project','Project'],['initiative','Initiative'],['ongoing-responsibility','Ongoing responsibility']];
const str=(fd:FormData,key:string)=>String(fd.get(key)??'').trim();
const numeric=(fd:FormData,key:string):number|null=>{
  const raw=str(fd,key);
  if(!raw)return null;
  const val=Number(raw);
  if(!Number.isFinite(val))throw new ValidationError('Enter a finite numeric value for '+key+'.');
  return val;
};
const safeUrl=(v:string)=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
export function parseRichFields(form:HTMLFormElement){
  const fd=new FormData(form);
  // CP-UX2: the experience chosen under "Where" is the primary one; "Other
  // experiences" adds further links. A missing switch keeps the safe default.
  const where=str(fd,'where');
  const whereInput=form.querySelector<HTMLInputElement>('input[name="where"]:checked');
  const isExperience=Boolean(where)&&where!==ROLE_ONLY;
  const others=fd.getAll('projectId').map(String).filter(id=>id!==where);
  const projectIds=isExperience?[where,...others]:others;
  const primaryProjectId=isExperience?where:null;
  const competencyIds=fd.getAll('competencyId').map(String);
  const confidentialSwitch=form.querySelector<HTMLInputElement>('#rich-confidential');
  const confidentiality:Confidentiality=!confidentialSwitch||confidentialSwitch.checked?'confidential':'standard-private';
  // CP-UX2: a row opened but left completely empty is not a record; existing rows are always read.
  const untouched=(row:HTMLElement)=>row.dataset.revision==='0'&&[...row.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea')].every(el=>!el.value.trim());
  const metrics=[...form.querySelectorAll<HTMLElement>('.metric-row')].filter(row=>!untouched(row)).map(row=>{
    const data=FormDataFromRow(row);
    const metricName=str(data,'metricName'),baselineValue=numeric(data,'baselineValue'),resultValue=numeric(data,'resultValue'),reportedValue=numeric(data,'reportedValue');
    if(!metricName)throw new ValidationError('Metric name is required.');
    if([baselineValue,resultValue,reportedValue].every(v=>v===null))throw new ValidationError('Enter at least one numeric value for each metric.');
    const direction=str(data,'direction');
    if(!['','increase','decrease','neutral'].includes(direction))throw new ValidationError('Choose a valid direction.');
    return {id:row.dataset.id??crypto.randomUUID(),revision:Number(row.dataset.revision??'0'),
      metricName,unit:str(data,'unit'),baselineValue,resultValue,reportedValue,
      direction:direction===''?null:direction as 'increase'|'decrease'|'neutral',sourceNote:str(data,'sourceNote')};
  });
  const references=[...form.querySelectorAll<HTMLElement>('.evidence-row')].filter(row=>!untouched(row)).map(row=>{
    const data=FormDataFromRow(row);
    const referenceType=str(data,'referenceType');
    if(!['description','url','document-reference'].includes(referenceType))throw new ValidationError('Choose a valid evidence type.');
    if(!str(data,'label')||!str(data,'referenceValue'))throw new ValidationError('Evidence name and reference value are required.');
    if(referenceType==='url'&&!safeUrl(str(data,'referenceValue')))throw new ValidationError('Evidence URL must be a valid http:// or https:// address.');
    return {id:row.dataset.id??crypto.randomUUID(),revision:Number(row.dataset.revision??'0'),
      referenceType:referenceType as EvidenceReference['referenceType'],label:str(data,'label'),
      referenceValue:str(data,'referenceValue'),notes:str(data,'notes'),userReviewedAt:row.dataset.reviewedAt||null};
  });
  const newExperiences:InlineExperienceDraft[]=[...form.querySelectorAll<HTMLInputElement>('input[data-new-name]:checked')].map(box=>{
    const type=INLINE_TYPES.find(([v])=>v===box.dataset.newType)?.[0];
    if(!type)throw new ValidationError('Choose a valid experience type.');
    return {id:box.value,name:box.dataset.newName??'',experienceType:type};
  });
  return {projectIds,primaryProjectId,competencyIds,metrics,references,newExperiences,
    where,whereRoleId:whereInput?.dataset.newRole||null,roleSelect:str(fd,'roleId')||null,confidentiality,
    situation:str(fd,'situation'),actions:str(fd,'actions'),notes:str(fd,'notes')};
}
function FormDataFromRow(row:HTMLElement):FormData{
  const form=document.createElement('form');
  for(const el of row.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('input,textarea,select')){
    if(el.name){
      const entry=document.createElement('input');entry.name=el.name;entry.value=el.value;form.append(entry);
    }
  }
  return new FormData(form);
}
