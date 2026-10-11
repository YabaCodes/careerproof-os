import type {AchievementView, CareerCollections, ImpactMetric, EvidenceReference, Confidentiality, RecordLink} from '../domain/models.js';
import {ValidationError} from '../domain/validation.js';
import {icon} from './icons.js';
import {escapeHtml} from './html.js';

const html=escapeHtml;
const optional=(items:string[])=>items.filter(Boolean).join('');
const field=(name:string,label:string,value:string,area=false)=>{
  const attrs='id="rich-'+name+'" name="'+name+'" maxlength="6000"';
  return '<div class="field"><label for="rich-'+name+'">'+html(label)+'</label>'+
    (area?'<textarea '+attrs+' rows="3">'+html(value)+'</textarea>':
      '<input '+attrs+' type="text" value="'+html(value)+'"/>')+'</div>';
};
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
export function richAchievementFields(a:AchievementView|undefined,c:CareerCollections,projectContext:string|null):string{
  const linked=(type:string):Set<string>=>new Set(c.recordLinks.filter(l=>l.sourceId===a?.id&&l.linkType===type).map(l=>l.targetId));
  const linkedProjects=linked('achievement-project');
  if(projectContext)linkedProjects.add(projectContext);
  const linkedCompetencies=linked('achievement-competency');
  const activeCompetencies=c.competencies.filter(x=>x.status==='active'||linkedCompetencies.has(x.id))
    .sort((a,b)=>a.name.localeCompare(b.name));
  const primary=c.recordLinks.find(l=>l.sourceId===a?.id&&l.linkType==='achievement-project'&&l.isPrimary)?.targetId??'';
  // IndexedDB's primary-key order is unrelated to when a metric was entered.
  // Keep the editing ledger stable after reload and across backup restoration.
  const chronological=<T extends {createdAt:string;id:string}>(rows:T[]):T[]=>
    rows.sort((left,right)=>left.createdAt.localeCompare(right.createdAt)||left.id.localeCompare(right.id));
  const metrics=chronological(c.impactMetrics.filter(m=>m.achievementId===a?.id));
  const references=chronological(c.evidenceReferences.filter(e=>e.achievementId===a?.id));
  const roleSelect='<div class="field"><label for="rich-roleId">Employment role</label><select id="rich-roleId" name="roleId">'+
    '<option value="">No role selected</option>'+c.roles.map(r=>{
      const employer=c.employers.find(x=>x.id===r.employerId);
      return '<option value="'+html(r.id)+'" '+(a?.roleId===r.id?'selected':'')+'>'+html(r.title+' — '+(employer?.name??''))+'</option>';
    }).join('')+'</select></div>';
  const projectOptions=c.projects.map(p=>{
    const checked=linkedProjects.has(p.id);
    return '<label class="rich-check"><input type="checkbox" name="projectId" value="'+html(p.id)+'" '+(checked?'checked':'')+'/>'+
      '<span>'+html(p.name)+'</span></label>';
  }).join('');
  const competencyOptions=activeCompetencies.map(x=>
    '<label class="rich-check"><input type="checkbox" name="competencyId" value="'+html(x.id)+'" '+(linkedCompetencies.has(x.id)?'checked':'')+'/>'+
    '<span>'+html(x.name)+(x.status==='archived'?' (archived historical link)':'')+'</span></label>').join('');
  const primaryOptions='<div class="field"><label for="rich-primaryProjectId">Primary experience (optional)</label><select id="rich-primaryProjectId" name="primaryProjectId">'+
    '<option value="">No primary experience</option>'+c.projects.filter(p=>linkedProjects.has(p.id)).map(p=>
      '<option value="'+html(p.id)+'" '+(primary===p.id?'selected':'')+'>'+html(p.name)+'</option>').join('')+'</select></div>';
  const confidentiality='<div class="field"><label for="rich-confidentiality">Confidentiality</label><select name="confidentiality" id="rich-confidentiality">'+
    [['confidential','Confidential (default)'],['standard-private','Standard private']].map(([v,l])=>
      '<option value="'+v+'" '+((a?.confidentiality??'confidential')===v?'selected':'')+'>'+l+'</option>').join('')+'</select></div>';
  return '<div class="rich-panel" id="rich-detail-panel"><button type="button" class="rich-expander" data-action="toggle-rich-panel" aria-label="Show more achievement details, experience and evidence" aria-expanded="false" aria-controls="rich-panel-content"><span>More details</span><span class="rich-summary-hint">Optional</span></button>'+
    '<div class="rich-panel-body" id="rich-panel-content" hidden>'+
    field('situation','Situation / challenge',a?.situation??'',true)+
    field('actions','Actions taken',a?.actions??'',true)+field('notes','Additional notes',a?.notes??'',true)+
    confidentiality+roleSelect+
    '<fieldset class="rich-link-fieldset"><legend>Associated Experiences</legend><div class="rich-choice-list">'+
    (projectOptions||'<p class="career-empty">Create an Experience in Profile to link it here.</p>')+'</div>'+primaryOptions+'</fieldset>'+
    '<fieldset class="rich-link-fieldset"><legend>Competencies Demonstrated</legend><p class="field-hint">Link documented examples to skills. These are not proficiency scores.</p>'+
    '<div class="rich-choice-list rich-competencies">'+(competencyOptions||'<p class="career-empty">No active competencies available.</p>')+
    '</div></fieldset>'+
    '<section><div class="rich-section-heading"><h3>Impact Metrics</h3><button type="button" class="button button-outline" data-action="add-rich-metric">Add metric</button></div>'+
    '<div id="rich-metrics">'+metrics.map(m=>metricRow(m)).join('')+'</div><p class="field-hint">Use measured values and state their source or context. Never estimate results as facts.</p></section>'+
    '<section><div class="rich-section-heading"><h3>Evidence References</h3><button type="button" class="button button-outline" data-action="add-rich-evidence">Add reference</button></div>'+
    '<div id="rich-evidence">'+references.map(e=>evidenceRow(e)).join('')+'</div></section>'+
    '</div></div>';
}
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
  const projectIds=fd.getAll('projectId').map(String),competencyIds=fd.getAll('competencyId').map(String);
  const primaryProjectId=str(fd,'primaryProjectId')||null;
  if(primaryProjectId&&!projectIds.includes(primaryProjectId))throw new ValidationError('Choose a selected experience as primary.');
  const confidentiality=str(fd,'confidentiality');
  if(confidentiality!=='confidential'&&confidentiality!=='standard-private')throw new ValidationError('Invalid confidentiality selection.');
  const metrics=[...form.querySelectorAll<HTMLElement>('.metric-row')].map(row=>{
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
  const references=[...form.querySelectorAll<HTMLElement>('.evidence-row')].map(row=>{
    const data=FormDataFromRow(row);
    const referenceType=str(data,'referenceType');
    if(!['description','url','document-reference'].includes(referenceType))throw new ValidationError('Choose a valid evidence type.');
    if(!str(data,'label')||!str(data,'referenceValue'))throw new ValidationError('Evidence name and reference value are required.');
    if(referenceType==='url'&&!safeUrl(str(data,'referenceValue')))throw new ValidationError('Evidence URL must be a valid http:// or https:// address.');
    return {id:row.dataset.id??crypto.randomUUID(),revision:Number(row.dataset.revision??'0'),
      referenceType:referenceType as EvidenceReference['referenceType'],label:str(data,'label'),
      referenceValue:str(data,'referenceValue'),notes:str(data,'notes'),userReviewedAt:row.dataset.reviewedAt||null};
  });
  return {projectIds,primaryProjectId,competencyIds,metrics,references,roleId:str(fd,'roleId')||null,
    confidentiality:confidentiality as Confidentiality,
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
export function updatePrimaryOptions(form:HTMLFormElement):void{
  const selected=new Set([...form.querySelectorAll<HTMLInputElement>('input[name="projectId"]:checked')].map(x=>x.value));
  const select=form.querySelector<HTMLSelectElement>('#rich-primaryProjectId');
  if(!select)return;
  const current=select.value;
  for(const option of [...select.options]){if(option.value&&!selected.has(option.value))option.remove();}
  const available=[...form.querySelectorAll<HTMLInputElement>('input[name="projectId"]')];
  for(const field of available)if(selected.has(field.value)&&![...select.options].some(x=>x.value===field.value)){
    const o=document.createElement('option');o.value=field.value;o.textContent=field.parentElement?.querySelector('span')?.textContent??field.value;select.append(o);
  }
  select.value=selected.has(current)?current:'';
}
export function achievementEnrichmentDetails(a:AchievementView,c:CareerCollections):string {
  const role=c.roles.find(r=>r.id===a.roleId);
  const links=(type:'achievement-project'|'achievement-competency')=>c.recordLinks.filter(x=>x.linkType===type&&x.sourceId===a.id);
  const projects=links('achievement-project').map(l=>c.projects.find(p=>p.id===l.targetId)?.name).filter(Boolean);
  const competencies=links('achievement-competency').map(l=>c.competencies.find(p=>p.id===l.targetId)?.name).filter(Boolean);
  const metrics=c.impactMetrics.filter(m=>m.achievementId===a.id);
  const evidence=c.evidenceReferences.filter(e=>e.achievementId===a.id);
  const detail=(label:string,value:string)=>value?'<div class="detail-section"><p class="section-kicker">'+html(label)+'</p><p class="readable-text">'+html(value)+'</p></div>':'';
  return optional([
    detail('SITUATION',a.situation),detail('ACTIONS',a.actions),detail('NOTES',a.notes),
    detail('ROLE',role?.title??''),detail('EXPERIENCES',projects.join(' · ')),
    detail('COMPETENCIES',competencies.join(' · ')),
    metrics.length?'<div class="detail-section"><p class="section-kicker">IMPACT METRICS</p>'+metrics.map(m=>
      '<p class="readable-text">'+html(m.metricName)+': '+html([
        m.baselineValue!==null?'baseline '+m.baselineValue:'',m.resultValue!==null?'result '+m.resultValue:'',
        m.reportedValue!==null?'reported '+m.reportedValue:''
      ].filter(Boolean).join(' → '))+' '+html(m.unit)+(m.sourceNote?' · '+html(m.sourceNote):'')+'</p>').join('')+'</div>':'',
    evidence.length?'<div class="detail-section"><p class="section-kicker">EVIDENCE REFERENCES (USER PROVIDED)</p>'+
      evidence.map(e=>'<p class="readable-text">'+html(e.label)+': '+(e.referenceType==='url'?
        '<a href="'+html(e.referenceValue)+'" target="_blank" rel="noopener noreferrer">'+html(e.referenceValue)+'</a>':
        html(e.referenceValue))+'</p>').join('')+'</div>':'',
    detail('PRIVACY',a.confidentiality==='confidential'?'Confidential — excluded from future external sharing by default':'Standard private')
  ]);
}
