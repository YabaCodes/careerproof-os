import type {CareerCollections,Competency} from '../domain/models.js';
import {normalizeName} from '../domain/taxonomy.js';
import {ValidationError} from '../domain/validation.js';
import {icon} from './icons.js';
import {escapeHtml} from './html.js';
const esc=escapeHtml;
export type SkillScope='linked'|'all';
/** Number of achievement links per competency; counts links, not proficiency. */
function exampleCounts(c:CareerCollections):Map<string,number>{
  const counts=new Map<string,number>();
  for(const l of c.recordLinks)if(l.linkType==='achievement-competency')counts.set(l.targetId,(counts.get(l.targetId)??0)+1);
  return counts;
}
export function skillExampleSummary(c:CareerCollections):{withExamples:number;total:number}{
  const counts=exampleCounts(c),active=c.competencies.filter(r=>r.status==='active');
  return {withExamples:active.filter(r=>(counts.get(r.id)??0)>0).length,total:active.length};
}
/** CP-012.2: show skills with linked examples by default once any exist. */
export function defaultSkillScope(c:CareerCollections):SkillScope{return skillExampleSummary(c).withExamples>0?'linked':'all';}
export function competencyGroups(c:CareerCollections,query:string,category:string,showArchived=false,scope:SkillScope='all'):string{
  const counts=exampleCounts(c);
  const active=c.competencies.filter(r=>r.status==='active'||showArchived);
  // A search always looks across every skill, so nothing is hidden by the scope.
  const filtered=active.filter(r=>(!category||r.categoryId===category)&&
    (query||scope==='all'||(counts.get(r.id)??0)>0)&&
    (!query||[r.name,r.description,...r.aliases].join(' ').toLowerCase().includes(query.toLowerCase())));
  const categories=[...c.competencyCategories].sort((a,b)=>a.sortOrder-b.sortOrder);
  const groups=categories.map(cat=>{
    const items=filtered.filter(r=>r.categoryId===cat.id).sort((a,b)=>a.name.localeCompare(b.name));
    if(!items.length)return '';
    return '<section class="panel skill-panel"><div class="career-section-heading"><h2>'+esc(cat.name)+'</h2><span class="career-meta">'+items.length+' skill'+(items.length===1?'':'s')+'</span></div>'+
      items.map(skill=>{
        const links=c.recordLinks.filter(l=>l.linkType==='achievement-competency'&&l.targetId===skill.id);
        const examples=links.map(l=>c.achievements.find(a=>a.id===l.sourceId)).filter((a):a is NonNullable<typeof a>=>Boolean(a));
        return '<details class="skill-entry" data-skill="'+esc(skill.id)+'"><summary><span><strong>'+esc(skill.name)+'</strong>'+
          (skill.isBuiltIn?'':' <span class="career-primary">Custom</span>')+(skill.status==='archived'?' <span class="career-meta">Archived</span>':'')+
          '<small>'+examples.length+' linked example'+(examples.length===1?'':'s')+'</small></span>'+
          icon('chevron',17)+'</summary><div class="skill-entry-details">'+
          (skill.description?'<p>'+esc(skill.description)+'</p>':'<p class="career-meta">No skill definition provided.</p>')+
          (examples.length?'<div class="portfolio-achievement-links">'+examples.map(a=>
            '<button class="career-inline-add" data-action="competency-achievement" data-id="'+esc(a.id)+'">'+esc(a.title)+'</button>').join('')+'</div>':
            '<p class="career-meta">No linked achievements. Connect a documented example from the Achievement Vault.</p>')+
          (!skill.isBuiltIn?'<div class="portfolio-actions">'+(skill.status==='active'?
            '<button class="button button-outline" data-action="edit-competency" data-id="'+esc(skill.id)+'">Edit custom skill</button>'+
            '<button class="button button-outline" data-action="archive-competency" data-id="'+esc(skill.id)+'">Archive</button>':
            '<button class="button button-outline" data-action="restore-competency" data-id="'+esc(skill.id)+'">Restore skill</button>')+'</div>':'')+
          '</div></details>';
      }).join('')+'</section>';
  }).join('');
  return groups||'<div class="panel"><p class="career-empty">'+(scope==='linked'&&!query?'No skills have linked examples yet. Link a skill from an achievement\'s More details, or choose All.':'No competencies match your search.')+'</p></div>';
}
export function competencyPage(c:CareerCollections,query:string,category:string,showArchived=false,scope:SkillScope='all'):string{
  const categories=[...c.competencyCategories].sort((a,b)=>a.sortOrder-b.sortOrder);
  const summary=skillExampleSummary(c);
  const segment=(value:SkillScope,label:string)=>'<button type="button" class="segment" data-action="skill-scope" data-scope="'+value+'" aria-pressed="'+(scope===value)+'">'+label+'</button>';
  return '<div class="competency-page">'+
    '<div class="segmented" role="group" aria-label="Which skills to show">'+segment('linked','With examples · '+summary.withExamples)+segment('all','All · '+summary.total)+'</div>'+
    '<section class="panel skill-toolbar"><div class="field"><label for="competency-search">Search competencies</label><input id="competency-search" value="'+esc(query)+'" placeholder="Search skills"/></div>'+
    '<div class="field"><label for="competency-category">Category</label><select id="competency-category"><option value="">All categories</option>'+
    categories.map(cat=>'<option value="'+esc(cat.id)+'" '+(category===cat.id?'selected':'')+'>'+esc(cat.name)+'</option>').join('')+'</select></div>'+
    '<button type="button" id="competency-archived" class="button button-outline skill-archived-toggle" data-action="toggle-archived-skills" aria-pressed="'+showArchived+'">Show archived</button>'+
    '<button class="button button-outline" data-action="add-competency">'+icon('plus',17)+' Custom skill</button></section>'+
    '<div class="skill-groups">'+competencyGroups(c,query,category,showArchived,scope)+'</div>'+
    '<p class="footer-note">Linked examples show where you recorded using a skill. They are not a proficiency rating or independent verification.</p></div>';
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
