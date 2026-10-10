import type {BaseRecord, CareerCollections, Credential, Education, Employer, PrecisionDate, Profile, Role} from '../domain/models.js';
import {datesInOrder,formatPrecisionDate,precisionDateFromInput} from '../domain/dates.js';
import {ValidationError} from '../domain/validation.js';
import {icon} from './icons.js';
import {escapeHtml} from './html.js';

export type CareerKind='employers'|'roles'|'education'|'credentials';
export type CareerRecord=Employer|Role|Education|Credential;
export type CareerWrite =
  | {kind:'employers';record:Omit<Employer,'createdAt'|'updatedAt'>}
  | {kind:'roles';record:Omit<Role,'createdAt'|'updatedAt'>;primary:boolean}
  | {kind:'education';record:Omit<Education,'createdAt'|'updatedAt'>}
  | {kind:'credentials';record:Omit<Credential,'createdAt'|'updatedAt'>};

const html=escapeHtml;
const dateLabel=(value:PrecisionDate|null):string=>value?formatPrecisionDate(value.value):'Not specified';
const action=(kind:CareerKind,id:string,verb:'edit'|'delete'):string=>
  '<button class="career-action" type="button" data-action="'+verb+'-career" data-kind="'+kind+'" data-id="'+html(id)+'" aria-label="'+(verb==='edit'?'Edit':'Delete')+' '+kind.slice(0,-1)+'">'+icon(verb==='edit'?'edit':'trash',15)+'<span>'+(verb==='edit'?'Edit':'Delete')+'</span></button>';
const dateRange=(start:PrecisionDate|null,end:PrecisionDate|null,current=false):string=>
  dateLabel(start)+' – '+(current?'Present':dateLabel(end));
/**
 * A two-line preview is the default for every saved career description.
 * Details stay in the DOM (and in IndexedDB) and can be expanded individually.
 * Buttons are enabled only when text is actually clipped or secondary details exist.
 */
function disclosure(kind:CareerKind,id:string,label:string,description:string,extras=''):string {
  if(!description&&!extras)return '';
  const target='career-detail-'+kind+'-'+id;
  return '<div class="career-disclosure" data-career-disclosure><div id="'+html(target)+'" class="career-detail-content">'+
    (description?'<p class="career-description career-clamped">'+html(description)+'</p>':'')+
    (extras?'<div class="career-hidden-extra" hidden>'+extras+'</div>':'')+
    '</div><button type="button" class="career-more" data-action="toggle-career-details" aria-controls="'+html(target)+
    '" aria-expanded="false" aria-label="Show full details for '+html(label)+'" data-detail-label="'+html(label)+'" hidden>… More</button></div>';
}

export function syncCareerDisclosures(root:ParentNode):void {
  for(const group of root.querySelectorAll<HTMLElement>('.career-disclosure')){
    const description=group.querySelector<HTMLElement>('.career-description');
    const extras=group.querySelector<HTMLElement>('.career-hidden-extra');
    const button=group.querySelector<HTMLButtonElement>('.career-more');
    if(!button)continue;
    const clipped=Boolean(description&&description.scrollHeight>description.clientHeight+2);
    button.hidden=!(clipped||extras||button.getAttribute('aria-expanded')==='true');
  }
}

export function toggleCareerDisclosure(button:HTMLElement):void {
  const group=button.closest<HTMLElement>('.career-disclosure');
  if(!group)return;
  const content=group.querySelector<HTMLElement>('.career-description');
  const extras=group.querySelector<HTMLElement>('.career-hidden-extra');
  const expanded=button.getAttribute('aria-expanded')==='true';
  content?.classList.toggle('is-expanded',!expanded);
  if(extras)extras.hidden=expanded;
  button.setAttribute('aria-expanded',String(!expanded));
  button.textContent=expanded?'… More':'Less';
  button.setAttribute('aria-label',(expanded?'Show':'Hide')+' full details for '+(button.dataset.detailLabel??'career record'));
}
const empty=(title:string):string=>'<p class="career-empty">'+html(title)+'</p>';
const heading=(label:string,kind:CareerKind):string=>
  '<div class="career-section-heading"><h2>'+html(label)+'</h2><button class="button button-outline" data-action="add-career" data-kind="'+kind+'">'+icon('plus',16)+' Add</button></div>';
const meta=(value:string):string=>'<p class="career-meta">'+html(value)+'</p>';

function roleCard(role:Role,primaryRoleId:string|null):string {
  return '<article class="career-entry career-role"><div class="career-entry-main"><div class="career-title-row"><h3>'+html(role.title)+'</h3>'+
    (role.id===primaryRoleId?'<span class="career-primary">Primary role</span>':'')+'</div>'+
    meta(dateRange(role.startDate,role.endDate,role.isCurrent)+(role.employmentType?' · '+role.employmentType:''))+
    disclosure('roles',role.id,role.title,role.responsibilities,
      (role.leadershipScope?'<p class="career-note"><strong>Leadership:</strong> '+html(role.leadershipScope)+'</p>':'')+
      (role.technologies.length?'<p class="career-note"><strong>Technologies:</strong> '+html(role.technologies.join(', '))+'</p>':''))+
    '</div><div class="career-entry-actions">'+action('roles',role.id,'edit')+action('roles',role.id,'delete')+'</div></article>';
}

export function careerSections(profile:Profile,collections:CareerCollections):string {
  const employers=[...collections.employers].sort((a,b)=>a.name.localeCompare(b.name));
  const employerContent=employers.map(e=>{
    const roles=collections.roles.filter(r=>r.employerId===e.id).sort((a,b)=>b.startDate.value.localeCompare(a.startDate.value));
    return '<article class="career-employer"><div class="career-employer-head"><div><h3>'+html(e.name)+'</h3>'+
      meta([e.industry,e.location].filter(Boolean).join(' · '))+
      disclosure('employers',e.id,e.name,e.description,
        e.website?'<a class="career-link" href="'+html(e.website)+'" target="_blank" rel="noopener noreferrer">Employer website</a>':'')+
      '</div><div class="career-entry-actions">'+action('employers',e.id,'edit')+action('employers',e.id,'delete')+'</div></div>'+
      (roles.length?'<div class="career-role-list">'+roles.map(r=>roleCard(r,profile.primaryRoleId)).join('')+'</div>':empty('No roles recorded yet.'))+
      '<button class="career-inline-add" data-action="add-career" data-kind="roles" data-employer="'+html(e.id)+'">'+icon('plus',15)+' Add role</button></article>';
  }).join('');
  const education=[...collections.education].sort((a,b)=>(b.completionDate?.value??b.startDate?.value??'').localeCompare(a.completionDate?.value??a.startDate?.value??''));
  const qualifications=education.map(r=>'<article class="career-entry"><div class="career-entry-main"><h3>'+html(r.qualification)+'</h3>'+
    meta(r.institution+(r.discipline?' · '+r.discipline:''))+
    meta(dateRange(r.startDate,r.completionDate))+
    disclosure('education',r.id,r.qualification,r.description,
      r.honors?'<p class="career-note"><strong>Honors:</strong> '+html(r.honors)+'</p>':'')+
    '</div><div class="career-entry-actions">'+action('education',r.id,'edit')+action('education',r.id,'delete')+'</div></article>').join('');
  const credentials=[...collections.credentials].sort((a,b)=>(b.issuedDate?.value??'').localeCompare(a.issuedDate?.value??''));
  const credentialContent=credentials.map(r=>'<article class="career-entry"><div class="career-entry-main"><h3>'+html(r.name)+'</h3>'+
    meta(r.issuer)+meta('Issued: '+dateLabel(r.issuedDate)+' · Expires: '+(r.expirationDate?dateLabel(r.expirationDate):'No expiry recorded'))+
    disclosure('credentials',r.id,r.name,r.notes,
      (r.credentialId?'<p class="career-note"><strong>Credential ID:</strong> '+html(r.credentialId)+'</p>':'')+
      (r.verificationUrl?'<a class="career-link" target="_blank" rel="noopener noreferrer" href="'+html(r.verificationUrl)+'">Verification link (user provided)</a>':''))+
    '</div><div class="career-entry-actions">'+action('credentials',r.id,'edit')+action('credentials',r.id,'delete')+'</div></article>').join('');
  return '<div class="career-sections" aria-label="Career history and qualifications">'+
    '<section class="panel career-panel">'+heading('Employment history','employers')+
    (employerContent||empty('Record an employer to begin your career timeline.'))+
    (employers.length?'<button class="career-inline-add" data-action="add-career" data-kind="roles">'+icon('plus',15)+' Add another role</button>':'')+
    '</section><section class="panel career-panel">'+heading('Education','education')+
    (qualifications||empty('Add a degree, qualification, or education experience.'))+
    '</section><section class="panel career-panel">'+heading('Certifications & credentials','credentials')+
    (credentialContent||empty('Record professional certifications, licenses, or credentials.'))+
    '</section></div>';
}

const input=(name:string,label:string,value:string,max=200,required=false,type='text'):string=>
  '<div class="field"><label for="career-'+name+'">'+html(label)+(required?' <span class="required">*</span>':'')+'</label>'+
  '<input id="career-'+name+'" name="'+name+'" type="'+type+'" '+(required?'required ':'')+'maxlength="'+max+'" value="'+html(value)+'"/></div>';
const area=(name:string,label:string,value:string,max=10000):string=>
  '<div class="field"><label for="career-'+name+'">'+html(label)+'</label><textarea id="career-'+name+'" name="'+name+'" rows="3" maxlength="'+max+'">'+html(value)+'</textarea></div>';
const dateControl=(name:string,label:string,value:PrecisionDate|null,required=false):string=>{
  const precision=value?.precision??'month';
  const type=precision==='year'?'text':precision==='month'?'month':'date';
  return '<div class="field"><label for="career-'+name+'">'+html(label)+(required?' <span class="required">*</span>':'')+'</label>'+
    '<div class="career-date-control"><label class="sr-only" for="career-'+name+'-precision">'+html(label)+' precision</label>'+
    '<select name="'+name+'Precision" id="career-'+name+'-precision" data-action="career-date-precision" data-target="'+name+'" aria-label="'+html(label)+' precision">'+
    ['year','month','day'].map(p=>'<option value="'+p+'" '+(precision===p?'selected':'')+'>'+({year:'Year',month:'Month',day:'Day'} as Record<string,string>)[p]+'</option>').join('')+'</select>'+
    '<input id="career-'+name+'" name="'+name+'" type="'+type+'" value="'+html(value?.value??'')+'" '+(precision==='year'?'inputmode="numeric" maxlength="4" placeholder="YYYY"':'')+' '+(required?'required':'')+' aria-label="'+html(label)+'"/></div></div>';
};
const formTitle:Record<CareerKind,string>={employers:'Employer',roles:'Employment role',education:'Education',credentials:'Credential'};
export function careerForm(kind:CareerKind,record:CareerRecord|undefined,collections:CareerCollections,employerId?:string):string {
  const e=kind==='employers'?record as Employer|undefined:undefined;
  const r=kind==='roles'?record as Role|undefined:undefined;
  const education=kind==='education'?record as Education|undefined:undefined;
  const credential=kind==='credentials'?record as Credential|undefined:undefined;
  let fields='';
  if(kind==='employers'){
    fields=input('name','Employer name',e?.name??'',160,true)+input('industry','Industry',e?.industry??'')+
      input('location','Location',e?.location??'',150)+input('website','Website (https://)',e?.website??'',2000,false,'url')+
      area('description','Description',e?.description??'');
  }
  if(kind==='roles'){
    const selected=r?.employerId??employerId??collections.employers[0]?.id??'';
    fields='<div class="field"><label for="career-employerId">Employer <span class="required">*</span></label><select name="employerId" id="career-employerId" required>'+
      collections.employers.map(e=>'<option value="'+html(e.id)+'" '+(selected===e.id?'selected':'')+'>'+html(e.name)+'</option>').join('')+'</select></div>'+
      input('title','Job title',r?.title??'',200,true)+
      '<div class="career-date-grid">'+dateControl('startDate','Start date',r?.startDate??null,true)+
      dateControl('endDate','End date',r?.endDate??null)+'</div>'+
      '<label class="career-checkbox"><input type="checkbox" name="isCurrent" id="career-isCurrent" '+(r?.isCurrent?'checked':'')+'/> Currently working in this role (no end date)</label>'+
      '<label class="career-checkbox"><input type="checkbox" name="isPrimary" id="career-isPrimary" '+(r&&r.id===collections.profiles[0]?.primaryRoleId?'checked':'')+'/> Designate as my primary role</label>'+
      input('employmentType','Employment type',r?.employmentType??'',100)+
      area('responsibilities','Key responsibilities',r?.responsibilities??'')+
      area('leadershipScope','Leadership scope',r?.leadershipScope??'',6000)+
      input('technologies','Technologies (comma separated)',r?.technologies.join(', ')??'',2000);
  }
  if(kind==='education'){
    fields=input('institution','Institution',education?.institution??'',200,true)+
      input('qualification','Qualification / degree',education?.qualification??'',200,true)+
      input('discipline','Field of study',education?.discipline??'')+
      '<div class="career-date-grid">'+dateControl('startDate','Start date',education?.startDate??null)+
      dateControl('completionDate','Completion date',education?.completionDate??null)+'</div>'+
      area('description','Description',education?.description??'')+
      area('honors','Honors / distinctions',education?.honors??'',2000);
  }
  if(kind==='credentials'){
    fields=input('name','Credential name',credential?.name??'',200,true)+
      input('issuer','Issuing organization',credential?.issuer??'',200,true)+
      '<div class="career-date-grid">'+dateControl('issuedDate','Issue date',credential?.issuedDate??null)+
      dateControl('expirationDate','Expiration date (optional)',credential?.expirationDate??null)+'</div>'+
      input('credentialId','Credential ID',credential?.credentialId??'')+
      input('verificationUrl','Verification URL (https://)',credential?.verificationUrl??'',2000,false,'url')+
      area('notes','Notes',credential?.notes??'',6000);
  }
  return '<div class="modal-header"><div><p class="eyebrow">CAREER HISTORY</p><h2 id="dialog-title">'+(record?'Edit ':'Add ')+formTitle[kind]+'</h2>'+
    '<p id="dialog-description">Your career history stays in this browser. Enter only information you wish to keep locally.</p></div>'+
    '<button class="icon-button close-dialog" data-action="close" aria-label="Close dialog">'+icon('close',24)+'</button></div>'+
    '<form id="career-form" class="modal-body form-grid" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>'+
    fields+'</form><div class="modal-footer"><button class="button button-outline" data-action="close">Cancel</button>'+
    '<button class="button button-primary" data-action="save-career">'+icon('check',17)+' Save '+formTitle[kind].toLowerCase()+'</button></div>';
}

function read(fd:FormData,key:string):string{return String(fd.get(key)??'').trim();}
function requiredText(value:string,label:string):string{
  if(!value)throw new ValidationError(label+' is required.');
  return value;
}
function date(fd:FormData,key:string,required=false):PrecisionDate|null {
  const value=read(fd,key),precision=read(fd,key+'Precision');
  if(!value){if(required)throw new ValidationError('Choose a '+key.replace(/([A-Z])/g,' $1').toLowerCase()+'.');return null;}
  if(value.length!==(precision==='year'?4:precision==='month'?7:10))throw new ValidationError('Check '+key+': its date precision does not match.');
  const parsed=precisionDateFromInput(value);
  if(parsed?.precision!==precision)throw new ValidationError('Check '+key+': invalid date or precision.');
  return parsed;
}
function chronology(start:PrecisionDate|null,end:PrecisionDate|null,label:string):void{
  if(!datesInOrder(start,end))throw new ValidationError(label+' cannot be before its start/issue date.');
}
function url(value:string):string {
  if(!value)return '';
  try{const parsed=new URL(value);if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)throw Error();}catch{throw new ValidationError('Enter a valid http:// or https:// URL without credentials.');}
  return value;
}
function technologies(value:string):string[]{
  if(!value)return [];
  const tags=value.split(',').map(x=>x.trim()).filter(Boolean);
  if(tags.length>100||tags.some(x=>x.length>200))throw new ValidationError('Use at most 100 technologies of 200 characters each.');
  return [...new Set(tags)];
}
export function readCareerForm(kind:CareerKind,form:HTMLFormElement,current?:CareerRecord):CareerWrite {
  const fd=new FormData(form),base={id:current?.id??crypto.randomUUID(),revision:current?.revision??0};
  if(kind==='employers'){
    return {kind,record:{...base,name:requiredText(read(fd,'name'),'Employer name'),industry:read(fd,'industry'),location:read(fd,'location'),
      website:url(read(fd,'website')),description:read(fd,'description')}};
  }
  if(kind==='roles'){
    const start=date(fd,'startDate',true)!;
    const isCurrent=fd.has('isCurrent');
    const end=isCurrent?null:date(fd,'endDate');
    chronology(start,end,'End date');
    return {kind,primary:fd.has('isPrimary'),record:{...base,employerId:requiredText(read(fd,'employerId'),'Employer'),
      title:requiredText(read(fd,'title'),'Job title'),startDate:start,endDate:end,isCurrent,
      employmentType:read(fd,'employmentType'),responsibilities:read(fd,'responsibilities'),leadershipScope:read(fd,'leadershipScope'),
      technologies:technologies(read(fd,'technologies'))}};
  }
  if(kind==='education'){
    const start=date(fd,'startDate'),end=date(fd,'completionDate');chronology(start,end,'Completion date');
    return {kind,record:{...base,institution:requiredText(read(fd,'institution'),'Institution'),
      qualification:requiredText(read(fd,'qualification'),'Qualification'),discipline:read(fd,'discipline'),
      startDate:start,completionDate:end,description:read(fd,'description'),honors:read(fd,'honors')}};
  }
  const start=date(fd,'issuedDate'),end=date(fd,'expirationDate');chronology(start,end,'Expiration date');
  return {kind:'credentials',record:{...base,name:requiredText(read(fd,'name'),'Credential name'),
    issuer:requiredText(read(fd,'issuer'),'Issuing organization'),issuedDate:start,expirationDate:end,
    credentialId:read(fd,'credentialId'),verificationUrl:url(read(fd,'verificationUrl')),notes:read(fd,'notes')}};
}

export function dependentCareerRecords(kind:CareerKind,id:string,c:CareerCollections):string[] {
  const affected:string[]=[];
  if(kind==='employers'){
    const roles=c.roles.filter(r=>r.employerId===id).length,projects=c.projects.filter(p=>p.employerId===id).length;
    if(roles)affected.push(roles+' role(s)');
    if(projects)affected.push(projects+' project(s)');
  }
  if(kind==='roles'){
    if(c.profiles.some(p=>p.primaryRoleId===id))affected.push('primary career profile');
    const achievements=c.achievements.filter(a=>a.roleId===id).length,links=c.recordLinks.filter(l=>l.linkType==='role-project'&&l.sourceId===id).length;
    if(achievements)affected.push(achievements+' achievement(s)');
    if(links)affected.push(links+' project link(s)');
  }
  return affected;
}
