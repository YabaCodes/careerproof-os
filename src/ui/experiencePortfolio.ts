import type {CareerCollections,PrecisionDate,Project,Role,RecordLink} from '../domain/models.js';
import {datesInOrder,formatPrecisionDate,precisionDateFromInput} from '../domain/dates.js';
import {ValidationError} from '../domain/validation.js';
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
const area=(name:string,label:string,value:string)=>'<div class="field"><label for="portfolio-'+name+'">'+esc(label)+'</label><textarea rows="3" name="'+name+'" id="portfolio-'+name+'" maxlength="6000">'+esc(value)+'</textarea></div>';
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
  const fields=field('name','Experience / project name',p?.name??'',160,true)+
    select('experienceType','Experience type',typeOptions,p?.experienceType??'project')+
    select('status','Status',statusOptions,p?.status??'active')+
    select('employerId','Employer (optional)',[{id:'',name:'Independent / no employer'},...c.employers.map(e=>({id:e.id,name:e.name}))],p?.employerId??'')+
    '<div class="career-date-grid">'+dateControl('startDate','Start date',p?.startDate??null)+dateControl('endDate','End date',p?.endDate??null)+'</div>'+
    area('objective','Objective / purpose',p?.objective??'')+
    area('scope','Scope and context',p?.scope??'')+
    area('personalResponsibility','My responsibilities',p?.personalResponsibility??'')+
    field('technologies','Technologies (comma separated)',p?.technologies.join(', ')??'',2000)+
    area('outcome','Outcome or results',p?.outcome??'')+
    select('confidentiality','Confidentiality',[
      {id:'confidential',name:'Confidential (recommended)'},
      {id:'standard-private',name:'Standard private'}
    ],p?.confidentiality??'confidential')+
    '<fieldset class="portfolio-role-fieldset"><legend>Associated employment roles</legend><p class="career-meta">Optional. Choose existing roles; the employer must match if one is selected. These are links, not duplicate job records.</p>'+
    '<div class="portfolio-role-options">'+(roles.length?roles.map(r=>roleCheck(r,c,selected)).join(''):'<p class="career-empty">No roles recorded yet. You can link them later.</p>')+'</div></fieldset>';
  return '<div class="modal-header"><div><p class="eyebrow">EXPERIENCE PORTFOLIO</p><h2 id="dialog-title">'+(p?'Edit experience':'Add experience')+'</h2><p id="dialog-description">Document the work you owned and its outcomes. Avoid proprietary information.</p></div>'+
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
  return {record:{
    id:previous?.id??crypto.randomUUID(),revision:previous?.revision??0,name,
    experienceType:type as Project['experienceType'],status:status as Project['status'],employerId:read(fd,'employerId')||null,
    startDate,endDate,objective:read(fd,'objective'),scope:read(fd,'scope'),
    personalResponsibility:read(fd,'personalResponsibility'),technologies:[...new Set(technologies)],
    outcome:read(fd,'outcome'),confidentiality:confidentiality as Project['confidentiality']
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
function linkedAchievements(c:CareerCollections,p:Project){
  const ids=new Set(c.recordLinks.filter(r=>r.linkType==='achievement-project'&&r.targetId===p.id).map(r=>r.sourceId));
  return c.achievements.filter(a=>ids.has(a.id)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
function card(p:Project,c:CareerCollections):string{
  const employer=c.employers.find(e=>e.id===p.employerId);
  const roles=linkedRoles(c,p),achievements=linkedAchievements(c,p);
  const objective=p.objective||p.personalResponsibility||p.scope||p.outcome;
  const detail=(label:string,value:string)=>value?'<div class="portfolio-detail"><strong>'+esc(label)+'</strong><p>'+esc(value)+'</p></div>':'';
  return '<details class="portfolio-card" data-project-id="'+esc(p.id)+'">'+
    '<summary><div class="portfolio-summary-top"><h3>'+esc(p.name)+'</h3><span class="portfolio-type">'+esc(typeNames[p.experienceType])+'</span></div>'+
    '<p class="career-meta">'+meta([employer?.name||'Independent',range(p),statuses[p.status]])+'</p>'+
    (objective?'<p class="portfolio-preview">'+esc(objective)+'</p>':'')+
    '<span class="portfolio-summary-hint">'+icon('chevron',15)+' <span class="portfolio-show-label">View details</span></span></summary>'+
    '<div class="portfolio-expanded">'+
    (p.confidentiality==='confidential'?'<p class="portfolio-confidential">'+icon('lock',14)+' Confidential · private backup only</p>':'')+
    detail('Objective',p.objective)+detail('Scope',p.scope)+detail('My responsibilities',p.personalResponsibility)+
    detail('Outcome',p.outcome)+detail('Technologies',p.technologies.join(', '))+
    '<div class="portfolio-detail"><strong>Associated roles</strong><p>'+(roles.length?roles.map(r=>esc(r.title)).join(' · '):'None linked yet')+'</p></div>'+
    '<div class="portfolio-detail"><strong>Linked achievements ('+achievements.length+')</strong>'+
    (achievements.length?'<div class="portfolio-achievement-links">'+achievements.map(a=>
      '<button class="career-inline-add" data-action="portfolio-achievement" data-id="'+esc(a.id)+'">'+esc(a.title)+'</button>').join('')+'</div>':
      '<p>No linked achievements yet. Capture an achievement from this experience to connect it.</p>')+'</div>'+
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
  return '<div class="portfolio-page"><div class="page-heading page-heading-flex"><div><p class="eyebrow">CAREER PROFILE / EXPERIENCE</p><h1>Experience Portfolio</h1>'+
    '<p class="page-subtitle">Projects, initiatives and ongoing responsibilities, separate from individual achievements.</p></div>'+
    '<button class="button button-primary" data-action="add-project">'+icon('plus',17)+' Add experience</button></div>'+
    '<button class="career-inline-add portfolio-back" data-action="nav" data-screen="profile">'+icon('back',16)+' Back to Career Profile</button>'+
    '<section class="panel portfolio-panel"><div class="portfolio-overview"><strong>'+count+' experience'+(count===1?'':'s')+'</strong><p class="career-meta">Tap an entry to explore its full details and linked achievements.</p></div>'+
    '<div class="portfolio-filters"><div class="field"><label for="portfolio-search">Search experiences</label><input id="portfolio-search" placeholder="Search title, objective, or responsibilities" value="'+esc(f.query)+'"/></div>'+
    select('filter-type','Type',[{id:'',name:'All types'},...Object.entries(typeNames).map(([id,name])=>({id,name}))],f.type)+
    select('filter-status','Status',[{id:'',name:'All statuses'},...Object.entries(statuses).map(([id,name])=>({id,name}))],f.status)+'</div>'+
    '<div id="portfolio-results" class="portfolio-list" aria-live="polite">'+portfolioCards(c,f)+'</div></section></div>';
}
