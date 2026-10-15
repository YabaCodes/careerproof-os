import type {CareerCollections,PrecisionDate,Project,Role,RecordLink} from '../domain/models.js';
import {datesInOrder,precisionDateFromInput} from '../domain/dates.js';
import {ValidationError} from '../domain/validation.js';
import {legacyExperienceNotes,type LegacyExperienceField} from '../domain/experience.js';
import {icon} from './icons.js';
import {escapeHtml} from './html.js';

export type ProjectWrite={record:Omit<Project,'createdAt'|'updatedAt'>;roleIds:string[]};
const esc=escapeHtml;
const typeNames:Record<Project['experienceType'],string>={project:'Project',initiative:'Initiative','ongoing-responsibility':'Ongoing responsibility'};
const statuses:Record<Project['status'],string>={planned:'Planned',active:'Active','on-hold':'On hold',completed:'Completed'};
const field=(name:string,label:string,value:string,max=6000,required=false)=>'<div class="field"><label for="portfolio-'+name+'">'+esc(label)+(required?' <span class="required">*</span>':'')+'</label><input type="text" name="'+name+'" id="portfolio-'+name+'" maxlength="'+max+'" value="'+esc(value)+'" '+(required?'required':'')+'/></div>';
const area=(name:string,label:string,value:string,hint='',rows=3)=>'<div class="field"><label for="portfolio-'+name+'">'+esc(label)+'</label><textarea rows="'+rows+'" name="'+name+'" id="portfolio-'+name+'" maxlength="6000"'+(hint?' aria-describedby="portfolio-'+name+'-hint"':'')+'>'+esc(value)+'</textarea>'+(hint?'<p class="field-hint" id="portfolio-'+name+'-hint">'+esc(hint)+'</p>':'')+'</div>';
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
  // CP-UX1 (DEC-036): the objective field is shown as the Goal / Expected result.
  const legacy=p?legacyExperienceNotes(p).filter(n=>n.key!=='objective'):[];
  const fields=field('name','Experience name',p?.name??'',160,true)+
    '<p class="field-hint portfolio-form-intro">A project, initiative or ongoing responsibility. Record each result as an achievement linked to it.</p>'+
    select('experienceType','Experience type',typeOptions,p?.experienceType??'project')+
    select('status','Status',statusOptions,p?.status??'active')+
    select('employerId','Employer (optional)',[{id:'',name:'Independent / no employer'},...c.employers.map(e=>({id:e.id,name:e.name}))],p?.employerId??'')+
    '<div class="career-date-grid">'+dateControl('startDate','Start date',p?.startDate??null)+dateControl('endDate','End date',p?.endDate??null)+'</div>'+
    area('scope','Context',p?.scope??'','One or two lines on what this was. Results belong in linked achievements.',2)+
    area('objective','Goal or expected result (optional)',p?.objective??'','What this should deliver. When it happens, record it as an achievement.',2)+
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
    '<div class="modal-footer">'+(p?'<button type="button" class="button button-danger-soft footer-delete" data-action="remove-project" data-id="'+esc(p.id)+'">'+icon('trash',16)+' Delete</button>':'')+
    '<button type="button" class="button button-outline" data-action="close">Cancel</button><button type="button" class="button button-primary" data-action="save-project">'+icon('check',17)+' Save experience</button></div>';
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
