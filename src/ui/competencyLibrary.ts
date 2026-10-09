import type {CareerCollections,Competency} from '../domain/models.js';
import {normalizeName} from '../domain/taxonomy.js';
import {ValidationError} from '../domain/validation.js';
import {icon} from './icons.js';
const esc=(v:unknown):string=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]!));
export function competencyGroups(c:CareerCollections,query:string,category:string):string{
  const active=c.competencies.filter(r=>r.status==='active');
  const filtered=active.filter(r=>(!category||r.categoryId===category)&&
    (!query||[r.name,r.description,...r.aliases].join(' ').toLowerCase().includes(query.toLowerCase())));
  const categories=[...c.competencyCategories].sort((a,b)=>a.sortOrder-b.sortOrder);
  const groups=categories.map(cat=>{
    const items=filtered.filter(r=>r.categoryId===cat.id).sort((a,b)=>a.name.localeCompare(b.name));
    if(!items.length)return '';
    return '<section class="panel skill-panel"><div class="career-section-heading"><h2>'+esc(cat.name)+'</h2><span class="career-meta">'+items.length+' skills</span></div>'+
      items.map(skill=>{
        const links=c.recordLinks.filter(l=>l.linkType==='achievement-competency'&&l.targetId===skill.id);
        const examples=links.map(l=>c.achievements.find(a=>a.id===l.sourceId)).filter((a):a is NonNullable<typeof a>=>Boolean(a));
        return '<details class="skill-entry" data-skill="'+esc(skill.id)+'"><summary><span><strong>'+esc(skill.name)+'</strong>'+
          (skill.isBuiltIn?'':' <span class="career-primary">Custom</span>')+
          '<small>'+examples.length+' linked example'+(examples.length===1?'':'s')+'</small></span>'+
          icon('chevron',17)+'</summary><div class="skill-entry-details">'+
          (skill.description?'<p>'+esc(skill.description)+'</p>':'<p class="career-meta">No skill definition provided.</p>')+
          (examples.length?'<div class="portfolio-achievement-links">'+examples.map(a=>
            '<button class="career-inline-add" data-action="competency-achievement" data-id="'+esc(a.id)+'">'+esc(a.title)+'</button>').join('')+'</div>':
            '<p class="career-meta">No linked achievements. Connect a documented example from the Achievement Vault.</p>')+
          (!skill.isBuiltIn?'<div class="portfolio-actions"><button class="button button-outline" data-action="edit-competency" data-id="'+esc(skill.id)+'">Edit custom skill</button>'+
            '<button class="button button-outline" data-action="archive-competency" data-id="'+esc(skill.id)+'">Archive</button></div>':'')+
          '</div></details>';
      }).join('')+'</section>';
  }).join('');
  return groups||'<div class="panel"><p class="career-empty">No competencies match your search.</p></div>';
}
export function competencyPage(c:CareerCollections,query:string,category:string):string{
  const categories=[...c.competencyCategories].sort((a,b)=>a.sortOrder-b.sortOrder);
  return '<div class="competency-page"><div class="page-heading page-heading-flex"><div><p class="eyebrow">YOUR DOCUMENTED CAPABILITIES</p><h1>Competency Library</h1>'+
    '<p class="page-subtitle">Map recorded achievements to skills. Linked examples are not self-assessed proficiency or independent verification.</p></div>'+
    '<button class="button button-primary" data-action="add-competency">'+icon('plus',17)+' Custom skill</button></div>'+
    '<button class="career-inline-add" data-action="nav" data-screen="profile">'+icon('back',16)+' Back to Career Profile</button>'+
    '<section class="panel skill-toolbar"><div class="field"><label for="competency-search">Search competencies</label><input id="competency-search" value="'+esc(query)+'" placeholder="Search skills"/></div>'+
    '<div class="field"><label for="competency-category">Category</label><select id="competency-category"><option value="">All categories</option>'+
    categories.map(cat=>'<option value="'+esc(cat.id)+'" '+(category===cat.id?'selected':'')+'>'+esc(cat.name)+'</option>').join('')+'</select></div></section>'+
    '<div class="skill-groups">'+competencyGroups(c,query,category)+'</div></div>';
}
export function customCompetencyForm(c:CareerCollections,record?:Competency):string{
  const categories=[...c.competencyCategories].sort((a,b)=>a.sortOrder-b.sortOrder);
  return '<div class="modal-header"><div><p class="eyebrow">COMPETENCY LIBRARY</p><h2 id="dialog-title">'+(record?'Edit custom competency':'Add custom competency')+'</h2>'+
    '<p id="dialog-description">Describe a professional capability. Linking achievements does not independently verify proficiency.</p></div>'+
    '<button class="icon-button close-dialog" data-action="close" aria-label="Close">'+icon('close',24)+'</button></div>'+
    '<form id="competency-form" class="modal-body form-grid" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>'+
    '<div class="field"><label for="skill-name">Competency name <span class="required">*</span></label><input id="skill-name" name="name" maxlength="160" required value="'+esc(record?.name??'')+'"/></div>'+
    '<div class="field"><label for="skill-category">Category</label><select id="skill-category" name="categoryId">'+categories.map(cat=>
      '<option value="'+esc(cat.id)+'" '+(record?.categoryId===cat.id?'selected':'')+'>'+esc(cat.name)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label for="skill-description">Description (optional)</label><textarea name="description" id="skill-description" maxlength="6000" rows="4">'+esc(record?.description??'')+'</textarea></div>'+
    '<div class="field"><label for="skill-aliases">Related terms (comma separated)</label><input name="aliases" id="skill-aliases" maxlength="2000" value="'+esc(record?.aliases.join(', ')??'')+'"/></div>'+
    '</form><div class="modal-footer"><button class="button button-outline" data-action="close">Cancel</button>'+
    '<button class="button button-primary" data-action="save-competency">Save skill</button></div>';
}
export function readCustomCompetency(form:HTMLFormElement,c:CareerCollections,existing?:Competency){
  const fd=new FormData(form),read=(key:string)=>String(fd.get(key)??'').trim();
  const name=read('name'),normalizedName=normalizeName(name);
  if(!name||name.length>160||!normalizedName)throw new ValidationError('Enter a valid competency name.');
  const categoryId=read('categoryId');
  if(!c.competencyCategories.some(cat=>cat.id===categoryId))throw new ValidationError('Choose a valid competency category.');
  const aliases=read('aliases').split(',').map(x=>x.trim()).filter(Boolean);
  if(aliases.length>100||aliases.some(x=>x.length>200))throw new ValidationError('Too many or oversized aliases.');
  if(c.competencies.some(r=>r.id!==existing?.id&&r.categoryId===categoryId&&r.normalizedName===normalizedName))
    throw new ValidationError('That competency already exists in the category.');
  return {id:existing?.id??crypto.randomUUID(),revision:existing?.revision??0,
    name,categoryId,normalizedName,isBuiltIn:false,status:'active' as const,
    taxonomyKey:null,aliases:[...new Set(aliases)],description:read('description'),rubricId:null};
}
