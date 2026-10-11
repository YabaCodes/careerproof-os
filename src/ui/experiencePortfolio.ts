import type {CareerCollections,PrecisionDate,Project,Role,RecordLink} from '../domain/models.js';
import {datesInOrder,formatPrecisionDate,precisionDateFromInput} from '../domain/dates.js';
import {ValidationError} from '../domain/validation.js';
import {experienceRollup,legacyExperienceNotes,type LegacyExperienceField} from '../domain/experience.js';
import {icon} from './icons.js';
import {escapeHtml} from './html.js';

export type PortfolioFilters={query:string;type:string;status:string};
export type ProjectWrite={record:Omit<Project,'createdAt'|'updatedAt'>;roleIds:string[]};
const esc=escapeHtml;
const typeNames:Record<Project['experienceType'],string>={project:'Project',initiative:'Initiative','ongoing-responsibility':'Ongoing responsibility'};
const statuses:Record<Project['status'],string>={planned:'Planned',active:'Active','on-hold':'On hold',completed:'Completed'};
const dateLabel=(date:PrecisionDate|null)=>date?formatPrecisionDate(date.value):'Not specified';
const range=(r:Project)=>r.startDate||r.endDate?dateLabel(r.startDate)+' – '+dateLabel(r.endDate):'Dates not specified';
const meta=(items:(string|null|undefined)[])=>items.filter(Boolean).map(esc).join(' · ');
const field=(name:string,label:string,value:string,max=6000,required=false)=>'<div class="field"><label for="portfolio-'+name+'">'+esc(label)+(required?' <span class="required">*</span>':'')+'</label><input type="text" name="'+name+'" id="portfolio-'+name+'" maxlength="'+max+'" value="'+esc(value)+'" '+(required?'required':'')+'/></div>';
const area=(name:string,label:string,value:string,hint='',rows=3)=>'<div class="field"><label for="portfolio-'+name+'">'+esc(label)+'</label><textarea rows="'+rows+'" name="'+name+'" id="portfolio-'+name+'" maxlength="6000"'+(hint?' aria-describedby="portfolio-'+name+'-hint"':'')+'>'+esc(value)+'</textarea>'+(hint?'<p class="field-hint" id="portfolio-'+name+'-hint">'+esc(hint)+'</p>':'')+'</div>';
const plural=(n:number,word:string)=>n+' '+word+(n===1?'':'s');
function dateControl(name:string,label:string,date:PrecisionDate|null){
  const precision=date?.precision??'month';
  const type=precision==='year'?'text':precision==='month'?'month':'date';
  return '<div class="field"><label for="portfolio-'+name+'">'+esc(label)+'</label><div class="career-date-control">'+
    '<select name="'+name+'Precision" id="portfolio-'+name+'-precision" data-action="portfolio-date-precision" data-target="'+name+'" aria-label="'+esc(label)+' precision">'+
    ['year','month','day'].map(p=>'<option value="'+p+'" '+(precision===p?'selected':'')+'>'+({year:'Year',month:'Month',day:'Day'} as Record<string,string>)[p]+'</option>').join('')+'</select>'+
    '<input id="portfolio-'+name+'" name="'+name+'" type="'+type+'" '+(precision==='year'?'inputmode="numeric" maxlength="4" placeholder="YYYY"':'')+' value="'+esc(date?.value??'')+'" aria-label="'+esc(label)+'"/></div></div>';
}
function select(name:string,label:string,choices:{id:string;name:string}[],value:string){
  return '<div class="field"><label for="portfolio-'+name+'">'+esc(label)+'</label><select id="portfolio-'+name+'" name="'+name+'">'+choices.map(v=>'<option value="'+esc(v.id)+'" '+(v.id===value?'selected':'')+'>'+esc(v.name)+'</option>').join('')+'</select></div>';
}
function roleCheck(role:Role,c:CareerCollections,selected:Set<string>){
  const employer=c.employers.find(e=>e.id===role.employerId);
  return '<label class="portfolio-role-option" data-role-employer="'+esc(role.employerId)+'"><input type="checkbox" name="projectRole" value="'+esc(role.id)+'" '+(selected.has(role.id)?'checked':'')+'/> <span>'+esc(role.title)+' <small>'+esc(employer?.name??'Unknown employer')+'</small></span></label>';
}
export function portfolioForm(p:Project|undefined,c:CareerCollections):string{
  const related=c.recordLinks.filter(r=>r.linkType==='role-project'&&r.targetId===p?.id);
  const selected=new Set(related.map(r=>r.sourceId));
  const typeOptions=Object.entries(typeNames).map(([id,name])=>({id,name}));
  const statusOptions=Object.entries(statuses).map(([id,name])=>({id,name}));
  const roles=[...c.roles].sort((a,b)=>a.title.localeCompare(b.title));
  // CP-012.4 (DEC-034): an experience is a container. Results, responsibilities and
  // outcomes belong to its linked achievements; earlier text stays editable below.
  const legacy=p?legacyExperienceNotes(p):[];
  const fields=field('name','Experience name',p?.name??'',160,true)+
    '<p class="field-hint portfolio-form-intro">A project, initiative or ongoing responsibility. Record each result as an achievement linked to it.</p>'+
    select('experienceType','Experience type',typeOptions,p?.experienceType??'project')+
    select('status','Status',statusOptions,p?.status??'active')+
    select('employerId','Employer (optional)',[{id:'',name:'Independent / no employer'},...c.employers.map(e=>({id:e.id,name:e.name}))],p?.employerId??'')+
    '<div class="career-date-grid">'+dateControl('startDate','Start date',p?.startDate??null)+dateControl('endDate','End date',p?.endDate??null)+'</div>'+
    area('scope','Context',p?.scope??'','One or two lines on what this was. Results belong in linked achievements.',2)+
    field('technologies','Technologies (comma separated)',p?.technologies.join(', ')??'',2000)+
    select('confidentiality','Confidentiality',[
      {id:'confidential',name:'Confidential (recommended)'},
      {id:'standard-private',name:'Standard private'}
    ],p?.confidentiality??'confidential')+
    '<fieldset class="portfolio-role-fieldset"><legend>Associated Employment Roles</legend><p class="career-meta">Optional. Choose existing roles; the employer must match if one is selected. These are links, not duplicate job records.</p>'+
    '<div class="portfolio-role-options">'+(roles.length?roles.map(r=>roleCheck(r,c,selected)).join(''):'<p class="career-empty">No roles recorded yet. You can link them later.</p>')+'</div></fieldset>'+
    (legacy.length?'<fieldset class="portfolio-role-fieldset portfolio-legacy"><legend>Earlier Notes</legend><p class="career-meta">Written before results moved to linked achievements. Keep, edit or clear them. Nothing here is removed automatically.</p>'+
      legacy.map(n=>area(n.key,n.label,n.value)).join('')+'</fieldset>':'');
  return '<div class="modal-header"><div><p class="eyebrow">EXPERIENCE PORTFOLIO</p><h2 id="dialog-title">'+(p?'Edit Experience':'Add Experience')+'</h2><p id="dialog-description">The project or responsibility your achievements belong to. Avoid proprietary information.</p></div>'+
    '<button class="icon-button close-dialog" data-action="close" aria-label="Close dialog">'+icon('close',24)+'</button></div>'+
    '<form id="portfolio-form" class="modal-body form-grid" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>'+fields+'</form>'+
    '<div class="modal-footer"><button type="button" class="button button-outline" data-action="close">Cancel</button><button type="button" class="button button-primary" data-action="save-project">'+icon('check',17)+' Save experience</button></div>';
}
const read=(f:FormData,key:string)=>String(f.get(key)??'').trim();
function date(f:FormData,key:string):PrecisionDate|null{
  const value=read(f,key),precision=read(f,key+'Precision');
  if(!value)return null;
  if(!['year','month','day'].includes(precision)||value.length!==(precision==='year'?4:precision==='month'?7:10))throw new ValidationError('Invalid '+key+' precision.');
  const parsed=precisionDateFromInput(value);
  if(parsed?.precision!==precision)throw new ValidationError('Check '+key+': invalid date.');
  return parsed;
}
export function readPortfolioForm(form:HTMLFormElement,previous?:Project):ProjectWrite {
  const fd=new FormData(form);
  const name=read(fd,'name');
  if(!name)throw new ValidationError('Experience name is required.');
  const startDate=date(fd,'startDate'),endDate=date(fd,'endDate');
  if(!datesInOrder(startDate,endDate))throw new ValidationError('End date cannot precede start date.');
  const technologies=read(fd,'technologies').split(',').map(x=>x.trim()).filter(Boolean);
  if(technologies.length>100||technologies.some(t=>t.length>200))throw new ValidationError('Too many or oversized technologies.');
  const roleIds=fd.getAll('projectRole').map(String);
  const confidentiality=read(fd,'confidentiality');
  if(!['confidential','standard-private'].includes(confidentiality))throw new ValidationError('Choose a valid confidentiality setting.');
  const type=read(fd,'experienceType'),status=read(fd,'status');
  if(!(type in typeNames)||!(status in statuses))throw new ValidationError('Choose a valid experience type and status.');
  // CP-012.4: fields that are not on the form keep their stored value, so editing
  // never clears earlier text; a shown Earlier Notes field saves what it contains.
  const kept=(key:LegacyExperienceField)=>fd.has(key)?read(fd,key):previous?.[key]??'';
  return {record:{
    id:previous?.id??crypto.randomUUID(),revision:previous?.revision??0,name,
    experienceType:type as Project['experienceType'],status:status as Project['status'],employerId:read(fd,'employerId')||null,
    startDate,endDate,objective:kept('objective'),scope:read(fd,'scope'),
    personalResponsibility:kept('personalResponsibility'),technologies:[...new Set(technologies)],
    outcome:kept('outcome'),confidentiality:confidentiality as Project['confidentiality']
  },roleIds};
}
export function updatePortfolioRoleChoices(form:HTMLFormElement):void {
  const employer=(form.elements.namedItem('employerId') as HTMLSelectElement|null)?.value??'';
  for(const row of form.querySelectorAll<HTMLElement>('[data-role-employer]')){
    const matches=!employer||row.dataset.roleEmployer===employer;
    row.hidden=!matches;
    const check=row.querySelector<HTMLInputElement>('input');
    if(check){check.disabled=!matches;if(!matches)check.checked=false;}
  }
}
function linkedRoles(c:CareerCollections,p:Project):Role[] {
  const ids=new Set(c.recordLinks.filter(r=>r.linkType==='role-project'&&r.targetId===p.id).map(r=>r.sourceId));
  return c.roles.filter(r=>ids.has(r.id));
}
const statusLabel={draft:'Draft',recorded:'',archived:'Archived'} as const;
/** CP-012.4: the results of an experience are its linked achievements and their stated outcomes. */
function rollupSection(c:CareerCollections,p:Project):string{
  const roll=experienceRollup(c,p.id),n=roll.items.length;
  if(!n)return '<div class="portfolio-detail"><strong>Linked Achievements (0)</strong><p>No linked achievements yet. Use New Achievement to record a result from this experience.</p></div>';
  return '<div class="portfolio-detail"><strong>Linked Achievements ('+n+')</strong>'+
    '<p class="career-meta rollup-summary">'+roll.withOutcome+' of '+n+' '+(n===1?'has':'have')+' a stated outcome</p>'+
    '<ul class="experience-rollup">'+roll.items.map(i=>'<li class="rollup-item">'+
      '<div class="rollup-head"><button type="button" class="rollup-title" data-action="portfolio-achievement" data-id="'+esc(i.id)+'">'+esc(i.title)+'</button>'+
      (statusLabel[i.status]?'<span class="status-tag status-'+i.status+'">'+statusLabel[i.status]+'</span>':'')+'</div>'+
      (i.outcome?'<p class="rollup-outcome">'+esc(i.outcome)+'</p>':'<p class="rollup-outcome is-missing">No outcome stated yet</p>')+
      (i.metrics?'<p class="rollup-metrics">'+plural(i.metrics,'metric')+'</p>':'')+
      '</li>').join('')+'</ul></div>';
}
function card(p:Project,c:CareerCollections):string{
  const employer=c.employers.find(e=>e.id===p.employerId);
  const roles=linkedRoles(c,p),linked=experienceRollup(c,p.id).items.length,legacy=legacyExperienceNotes(p);
  const preview=p.scope||p.objective||p.personalResponsibility||p.outcome;
  const detail=(label:string,value:string)=>value?'<div class="portfolio-detail"><strong>'+esc(label)+'</strong><p>'+esc(value)+'</p></div>':'';
  return '<details class="portfolio-card" data-project-id="'+esc(p.id)+'">'+
    '<summary><div class="portfolio-summary-top"><h3>'+esc(p.name)+'</h3><span class="portfolio-type">'+esc(typeNames[p.experienceType])+'</span></div>'+
    '<p class="career-meta">'+meta([employer?.name||'Independent',range(p),statuses[p.status],plural(linked,'achievement')])+'</p>'+
    (preview?'<p class="portfolio-preview">'+esc(preview)+'</p>':'')+
    '<span class="portfolio-summary-hint">'+icon('chevron',15)+' <span class="portfolio-show-label">View details</span></span></summary>'+
    '<div class="portfolio-expanded">'+
    (p.confidentiality==='confidential'?'<p class="portfolio-confidential">'+icon('lock',14)+' Confidential · private backup only</p>':'')+
    detail('Context',p.scope)+detail('Technologies',p.technologies.join(', '))+
    '<div class="portfolio-detail"><strong>Associated Roles</strong><p>'+(roles.length?roles.map(r=>esc(r.title)).join(' · '):'None linked yet')+'</p></div>'+
    rollupSection(c,p)+
    (legacy.length?'<div class="portfolio-detail portfolio-legacy-notes"><strong>Earlier Notes</strong><p class="career-meta">Written before results moved to linked achievements.</p>'+
      legacy.map(n=>'<span class="portfolio-legacy-label">'+esc(n.label)+'</span><p>'+esc(n.value)+'</p>').join('')+'</div>':'')+
    '<div class="portfolio-actions">'+
    '<button class="button button-primary" data-action="project-capture" data-id="'+esc(p.id)+'">'+icon('plus',16)+' New achievement</button>'+
    '<button class="button button-outline" data-action="edit-project" data-id="'+esc(p.id)+'">'+icon('edit',15)+' Edit</button>'+
    '<button class="button button-outline" data-action="remove-project" data-id="'+esc(p.id)+'">'+icon('trash',15)+' Delete</button></div></div></details>';
}
export function portfolioCards(c:CareerCollections,f:PortfolioFilters):string {
  const q=f.query.toLowerCase().trim();
  const matches=[...c.projects].filter(p=>
    (!q||[p.name,p.objective,p.scope,p.personalResponsibility,p.outcome].some(s=>s.toLowerCase().includes(q)))&&
    (!f.type||f.type===p.experienceType)&&(!f.status||f.status===p.status)
  ).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  return matches.length?matches.map(p=>card(p,c)).join(''):
    '<div class="career-empty portfolio-empty">No experiences match. Try another filter or add your first project.</div>';
}
export function portfolioPage(c:CareerCollections,f:PortfolioFilters):string{
  const count=c.projects.length;
  return '<div class="portfolio-page">'+
    '<section class="panel portfolio-panel"><div class="portfolio-overview"><p class="career-meta">'+(count?'Each experience groups the achievements recorded in it. Tap one to see their outcomes.':'Group related achievements under a project, initiative or ongoing responsibility. Record each result as an achievement.')+'</p>'+
    '<button class="button button-outline" data-action="add-project">'+icon('plus',17)+' Add experience</button></div>'+
    '<div class="portfolio-filters"><div class="field"><label for="portfolio-search">Search experiences</label><input id="portfolio-search" placeholder="Search name, context or earlier notes" value="'+esc(f.query)+'"/></div>'+
    select('filter-type','Type',[{id:'',name:'All types'},...Object.entries(typeNames).map(([id,name])=>({id,name}))],f.type)+
    select('filter-status','Status',[{id:'',name:'All statuses'},...Object.entries(statuses).map(([id,name])=>({id,name}))],f.status)+'</div>'+
    '<div id="portfolio-results" class="portfolio-list" aria-live="polite">'+portfolioCards(c,f)+'</div></section></div>';
}
