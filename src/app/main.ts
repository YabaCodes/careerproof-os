import { type AchievementView as Achievement, type Profile, type AchievementStatus, type P0Store, type CareerCollections, IMPACT_CATEGORIES, APP_VERSION, SCHEMA_VERSION, P0_STORES, localDate, PROFILE_ID } from '../domain/models.js';
import { validateAchievementInput, validateProfileInput, summarizeAchievements, ValidationError } from '../domain/validation.js';
import { initialize, getProfile, saveProfile, listAchievements, getAchievement, saveAchievement, removeAchievement, getMeta, setMeta, database } from '../data/db.js';
import { careerSections, careerForm, readCareerForm, syncCareerDisclosures, toggleCareerDisclosure, type CareerKind, type CareerRecord } from '../ui/careerHistory.js';
import { portfolioPage,portfolioCards,portfolioForm,readPortfolioForm,updatePortfolioRoleChoices,type PortfolioFilters } from '../ui/experiencePortfolio.js';
import { createBackup, downloadBackup, parseBackupFile, restoreBackup, inspectDataHealth, type PreparedBackup } from '../data/backup.js';
import { dataHealthReport } from '../ui/dataHealth.js';
import { removalImpact, type RemovableKind } from '../domain/removal.js';
import { removalContent, defaultRemovalChoice, removalReady, type RemovalChoice } from '../ui/removal.js';
import { formatPrecisionDate } from '../domain/dates.js';
import {icon} from '../ui/icons.js';
import {escapeHtml} from '../ui/html.js';
import { resolveActionTarget } from '../ui/actionRouting.js';
import { DialogController } from '../ui/dialog.js';
import {richAchievementFields,parseRichFields,metricRow,evidenceRow,updatePrimaryOptions,achievementEnrichmentDetails} from '../ui/achievementIntelligence.js';
import {competencyPage,competencyGroups,customCompetencyForm,readCustomCompetency,defaultSkillScope,skillExampleSummary,type SkillScope} from '../ui/competencyLibrary.js';
import {dateBounds} from '../domain/dates.js';

type Screen='home'|'vault'|'profile'|'portfolio'|'competencies';
type Modal='capture'|'detail'|'profile'|'settings'|'restore'|'career'|'project'|'competency'|'remove'|null;
const root=document.getElementById('app')!;
let profile:Profile;
let achievements:Achievement[]=[];
let careerCollections:CareerCollections|null=null;
let careerKind:CareerKind='employers';
let careerEmployerId:string|undefined;
let captureProjectId:string|null=null;
let portfolioFilters:PortfolioFilters={query:'',type:'',status:''};
let screen:Screen='home';
let modal:Modal=null;
let selectedId:string|null=null;
let editing=false;
let isDirty=false;
const dialogs=new DialogController();
let pendingBackup:PreparedBackup|null=null;
let saving=false;
let searchText='';
let filterStatus='active';
let filterRole='';
let filterProject='';
let filterCompetency='';
let filterDateStart='';
let filterDateEnd='';
let skillQuery='';
let skillCategory='';
let skillShowArchived=false;
let skillScope:SkillScope|null=null;
let vaultFiltersOpen=false;
let removal:({kind:RemovableKind;id:string}&RemovalChoice)|null=null;
let sortOrder='recent';
let theme=localStorage.getItem('careerproof-theme')||'system';
let lastExportAt:string|null=null;
let pwaUpdateReady=false;
let pwaRegistration:ServiceWorkerRegistration|null=null;
let pwaLastCheck=0;
let pwaCheckInFlight:Promise<void>|null=null;
let pwaReadyVersion='';
let pwaHadController=false;
let toastTimer:number|undefined;
let toastMessage='';
let toastKind:'success'|'error'='success';
const collectionLabels:Record<P0Store,string>={profiles:'Career profiles',employers:'Employers',roles:'Roles',education:'Education',credentials:'Credentials',projects:'Projects',achievements:'Achievements',impactMetrics:'Impact metrics',competencyCategories:'Competency categories',competencies:'Competencies',evidenceReferences:'Evidence references',recordLinks:'Relationships'};

const escape=escapeHtml;
const formatDate=formatPrecisionDate;
function relativeDate(v:string):string {if(!v)return 'Never';return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(v));}
function titleCase(v:string):string {return v.charAt(0).toUpperCase()+v.slice(1);}
function statusBadge(status:AchievementStatus):string {return `<span class="status-tag status-${status}">${status==='recorded'?'Recorded':titleCase(status)}</span>`;}
function initials():string {return profile.displayName.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()??'').join('') || 'CP';}
function currentNav():Screen {const name=location.hash.replace('#/','');return name==='vault'||name==='profile'||name==='portfolio'||name==='competencies'?name:'home';}
function applyTheme(){document.documentElement.dataset.theme=theme;}
async function setTheme(value:string){if(!['system','light','dark'].includes(value))return;try{await setMeta('preferences',{theme:value});theme=value;localStorage.setItem('careerproof-theme',theme);applyTheme();}catch(err){notify(errorMessage(err),'error');}}
function navButton(id:Screen,label:string,glyph:string,mobile=false):string{return `<button class="nav-item ${mobile?'mobile-nav-item':''} ${screen===id?'active':''}" data-action="nav" data-screen="${id}" ${screen===id?'aria-current="page"':''}>${mobile?'<span class="nav-icon">':''}${icon(glyph,24)}${mobile?'</span>':''}<span>${label}</span></button>`;}
// CP-012.2 (DEC-029): five content destinations; capture and Settings live in the header.
const NAV:[Screen,string,string][]=[['home','Home','home'],['vault','Vault','vault'],['portfolio','Experience','layers'],['competencies','Skills','target'],['profile','Profile','user']];
function plural(n:number,word:string):string{return `${n} ${word}${n===1?'':'s'}`;}
function screenMeta():{title:string;subtitle:string}{
  const stats=summarizeAchievements(achievements);
  switch(screen){
    case 'vault':return {title:'Achievement Vault',subtitle:achievements.length?[plural(stats.total,'achievement'),plural(stats.drafts,'draft'),...(stats.archived?[`${stats.archived} archived`]:[])].join(' · '):'Your record of contributions and results'};
    case 'portfolio':{const n=careerCollections?.projects.length??0;return {title:'Experience Portfolio',subtitle:n?plural(n,'experience'):'Projects, initiatives and ongoing responsibilities'};}
    case 'competencies':{const s=careerCollections?skillExampleSummary(careerCollections):{withExamples:0,total:0};return {title:'Skills',subtitle:`${s.withExamples} of ${s.total} skills have linked examples`};}
    case 'profile':return {title:'Career Profile',subtitle:'Identity, work history and qualifications'};
    default:{const first=profile.displayName.trim().split(/\s+/)[0];return {title:'CareerProof',subtitle:first?`Welcome back, ${first}.`:'Record the work. Prove the impact.'};}
  }
}
function pageHeader():string{
  const meta=screenMeta();
  return `<header class="page-header"><div class="page-title"><h1>${escape(meta.title)}</h1><p>${escape(meta.subtitle)}</p></div><div class="page-actions"><button class="header-button mobile-create" data-action="capture" aria-label="New achievement" title="New achievement">${icon('plus',21)}<span class="header-button-label">New achievement</span></button><button class="header-button header-settings" data-action="settings" aria-label="Settings" title="Settings">${icon('settings',21)}</button></div></header>`;
}
function pwaUpdateMessage():string {
  const target=pwaReadyVersion?`version ${pwaReadyVersion}`:'the new version';
  return `Restart to load ${target}. Your records stay on this device. You can export a backup first.`;
}
function pwaUpdateNotice():string {
  // CP-012.1 (DEC-028): restart stays user-controlled so a backup can be taken first.
  return pwaUpdateReady?`<div id="pwa-update-notice" class="pwa-update-notice" role="status" aria-live="polite"><div><strong>New version ready</strong><p id="pwa-update-version">${escape(pwaUpdateMessage())}</p></div><div class="pwa-update-actions"><button class="button button-outline" data-action="export">${icon('download',16)} Back up first</button><button class="button button-primary" data-action="reload-update">Restart app</button></div></div>`:'';
}
function displayPwaUpdateNotice(){
  pwaUpdateReady=true;
  // Never rerender an active editor merely because a new worker activated.
  if(!document.getElementById('pwa-update-notice'))root.insertAdjacentHTML('beforeend',pwaUpdateNotice());
  const message=document.getElementById('pwa-update-status');
  if(message)message.textContent='Update ready. Close Settings to back up or restart.';
  // Ask the newly active worker which release it carries; older workers do not answer.
  navigator.serviceWorker?.controller?.postMessage({type:'careerproof-version'});
}
function lastCheckedText():string {
  return pwaLastCheck?`Last checked ${new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(pwaLastCheck))}.`:'';
}
async function checkPwaUpdates(userInitiated=false):Promise<void>{
  if(!('serviceWorker' in navigator)){
    if(userInitiated)notify('Updates are unavailable in this browser.','error');return;
  }
  if(!navigator.onLine){
    if(userInitiated)notify('Connect to the internet to check for app updates.','error');return;
  }
  // CP-012.1: no time throttle. Every launch/foreground checks; an in-flight
  // guard only merges duplicate events (visibilitychange + pageshow + online).
  if(pwaCheckInFlight){
    if(!userInitiated)return;
    await pwaCheckInFlight.catch(()=>{});
  }
  const run=runPwaUpdateCheck(userInitiated);
  pwaCheckInFlight=run;
  try{await run;}finally{if(pwaCheckInFlight===run)pwaCheckInFlight=null;}
}
async function runPwaUpdateCheck(userInitiated:boolean):Promise<void>{
  pwaLastCheck=Date.now();
  try {
    // The service-worker script is fetched outside the app's cache-first
    // handler. updateViaCache:none ensures an HTTP-cache bypass where supported.
    const registration=pwaRegistration??await navigator.serviceWorker.getRegistration('./');
    if(!registration){
      if(userInitiated)notify('No app update registration found. Try reopening CareerProof.','error');
      return;
    }
    pwaRegistration=registration;
    await registration.update();
    const status=document.getElementById('pwa-update-status');
    const downloading=Boolean(registration.installing||registration.waiting);
    const text=pwaUpdateReady?'Update ready. Close Settings to back up or restart.':
      downloading?'A newer version is downloading. A Restart app button will appear when it is ready.':
      `You have the latest version available (v${APP_VERSION}). A new release can take up to about 10 minutes to reach your phone after it is published. ${lastCheckedText()}`;
    if(status&&(userInitiated||pwaUpdateReady||downloading))status.textContent=text;
    if(userInitiated)notify(pwaUpdateReady?'New version ready. Close Settings to back up or restart.':downloading?'Downloading the new version…':'No newer version found yet.');
  }catch{
    if(userInitiated)notify('Update check failed. Keep your data and try again with an internet connection.','error');
  }
}
function configurePwaUpdates():void {
  if(!('serviceWorker' in navigator)||location.protocol==='file:')return;
  pwaHadController=Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('message',event=>{
    const data=event.data as {type?:unknown;cache?:unknown}|null;
    if(data?.type!=='careerproof-version'||typeof data.cache!=='string')return;
    const version=data.cache.replace(/^careerproof-v/,'');
    if(!/^[0-9A-Za-z.+-]{1,40}$/.test(version))return;
    pwaReadyVersion=version;
    const target=document.getElementById('pwa-update-version');
    if(target)target.textContent=pwaUpdateMessage();
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    // Initial SW installation also raises controllerchange. It is NOT an
    // application update and must not prompt users to restart.
    if(pwaHadController)displayPwaUpdateNotice();
    pwaHadController=true;
  });
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>{
    pwaRegistration=registration;
    void checkPwaUpdates();
  }).catch(()=>{/* Local records and offline usage remain available. */});
  // Installed iOS PWAs often stay suspended in memory. Check every time the
  // app is opened, brought to the foreground or regains a connection.
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)void checkPwaUpdates();
  });
  window.addEventListener('pageshow',()=>{void checkPwaUpdates();});
  window.addEventListener('online',()=>{void checkPwaUpdates();});
}
function shell():string {
  return `<div class="app-shell">
    <aside class="sidebar" aria-label="Primary navigation">
      <div class="brand"><img class="brand-mark" src="./icon.svg" alt="" width="44" height="44"/><div class="brand-copy"><strong>CareerProof</strong><small>Personal career OS</small></div></div>
      <p class="sidebar-caption">WORKSPACE</p>
      <nav class="side-links" aria-label="Main navigation">${NAV.map(([id,label,glyph])=>navButton(id,label,glyph)).join('')}</nav>
      <div class="sidebar-bottom"><button class="sidebar-settings" data-action="settings">${icon('settings',24)} Settings ${icon('chevron',16)}</button><div class="sidebar-version">CareerProof OS <span>v${APP_VERSION}</span></div></div>
    </aside>
    <div class="content-wrap">
      <main class="page" id="main-content">${pageHeader()}${screen==='home'?homeView():screen==='vault'?vaultView():screen==='portfolio'&&careerCollections?portfolioPage(careerCollections,portfolioFilters):screen==='competencies'&&careerCollections?competencyPage(careerCollections,skillQuery,skillCategory,skillShowArchived,currentSkillScope()):profileView()}</main>
    </div>
    <nav class="mobile-nav" aria-label="Mobile navigation">${NAV.map(([id,label,glyph])=>navButton(id,label,glyph,true)).join('')}</nav>
    <div id="modal-layer">${modalView()}</div>${modal?'':toastView()}
  </div>`;
}
function smallAchievement(a:Achievement):string{return `<button class="achievement-row" data-action="detail" data-id="${escape(a.id)}"><span class="achievement-icon">${icon('trophy',17)}</span><span class="achievement-text"><strong>${escape(a.title)}</strong><small>${escape(a.contribution||'Draft — add a contribution when ready')}</small><span class="achieve-meta">${formatDate(a.occurredOn)} <span aria-hidden="true">·</span> ${a.impactCategory?IMPACT_CATEGORIES[a.impactCategory]:'General impact'}</span></span>${statusBadge(a.status)}<span class="row-arrow">${icon('chevron',17)}</span></button>`;}
function metricCard(label:string,value:string,sub:string,tone=''):string{return `<div class="metric-card ${tone}"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-sub">${sub}</div></div>`;}
function exportAge():{days:number|null;stale:boolean}{
  if(!lastExportAt)return {days:null,stale:true};
  const days=Math.max(0,Math.floor((Date.now()-Date.parse(lastExportAt))/86_400_000));
  return {days,stale:days>14};
}
/** One deterministic, truthful next step. No scores and no invented targets. */
function nextAction():{label:string;title:string;text:string;button:string;attrs:string}{
  const stats=summarizeAchievements(achievements),age=exportAge();
  if(!achievements.length)return {label:'Start here',title:'Capture your first achievement',text:'One contribution you are proud of is enough to start. You can add details, metrics and evidence later.',button:'Capture achievement',attrs:'data-action="capture"'};
  const draft=achievements.filter(a=>a.status==='draft').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
  if(draft)return {label:'Next action',title:`Finish ${plural(stats.drafts,'draft')}`,text:`“${draft.title}” is saved as a draft. Add what you did and when, then record it.`,button:'Open draft',attrs:`data-action="detail" data-id="${escape(draft.id)}"`};
  if(age.stale)return {label:'Protect your records',title:'Export a backup',text:age.days===null?'No backup has been exported from this device yet. Your records live only here.':`The last export was generated ${plural(age.days,'day')} ago. Your records live only on this device.`,button:'Export backup',attrs:'data-action="export"'};
  if(!profile.headline)return {label:'Next action',title:'Add your professional headline',text:'A one-line headline helps every record make sense later.',button:'Edit profile',attrs:'data-action="edit-profile"'};
  return {label:'Next action',title:'Capture a recent win',text:'Record it while the details are fresh, then link it to an experience or skill.',button:'New achievement',attrs:'data-action="capture"'};
}
function homeView():string {
  const stats=summarizeAchievements(achievements),next=nextAction(),age=exportAge();
  const projects=careerCollections?.projects??[];
  const linkedProjects=new Set((careerCollections?.recordLinks??[]).filter(l=>l.linkType==='achievement-project').map(l=>l.targetId));
  const skills=careerCollections?skillExampleSummary(careerCollections):{withExamples:0,total:0};
  const recent=achievements.filter(a=>a.status!=='archived').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,4);
  const quick=(label:string,glyph:string,attrs:string)=>`<button class="quick-action" ${attrs}>${icon(glyph,19)}<span>${label}</span></button>`;
  return `<section class="hero-card next-card" aria-labelledby="next-title"><div class="metric-label">${next.label}</div><h2 id="next-title">${escape(next.title)}</h2><p>${escape(next.text)}</p><button id="next-action-button" class="button button-light" ${next.attrs}>${next.button}</button></section>
  <section class="metric-grid" aria-label="Career record summary">
    ${metricCard('Recorded',String(stats.recorded),stats.drafts?`achievements · ${plural(stats.drafts,'draft')}`:'achievements')}
    ${metricCard('Experiences',String(projects.length),`${projects.filter(p=>linkedProjects.has(p.id)).length} with achievements`)}
    ${metricCard('Skills',String(skills.withExamples),`of ${skills.total} have examples`)}
    ${metricCard('Last export',age.days===null?'Never':age.days===0?'Today':`${plural(age.days,'day')} ago`,age.days===null?'no export from this device yet':'generated on this device',age.stale?'metric-warn':'')}
  </section>
  ${recent.length?`<div class="section-title"><h2>Recent</h2><button class="text-action" data-action="nav" data-screen="vault">View all ${icon('arrow',16)}</button></div><section class="panel list-card"><div class="achievement-list">${recent.map(smallAchievement).join('')}</div></section>`:''}
  <div class="section-title"><h2>Quick capture</h2></div>
  <div class="quick-grid">${quick('Achievement','trophy','data-action="capture"')}${quick('Experience','layers','data-action="add-project"')}${quick('Employer','briefcase','data-action="add-career" data-kind="employers"')}${quick('Credential','badge','data-action="add-career" data-kind="credentials"')}</div>
  <p class="footer-note">${icon('lock',14)} Local-first: your records stay on this device. There is no account or sync, so export backups regularly.</p>`;
}
function emptyState(heading:string,body:string,button:string,action:string):string {return `<div class="empty-state"><div class="empty-illustration">${icon('vault',27)}</div><h3>${heading}</h3><p>${body}</p><button class="button button-primary" data-action="${action}">${icon('plus',17)} ${button}</button></div>`;}
function filtered():Achievement[]{
  const q=searchText.trim().toLocaleLowerCase();
  return achievements.filter(a=>{
    if(filterStatus==='active'&&a.status==='archived')return false;
    if(filterStatus!=='active'&&filterStatus!=='all'&&a.status!==filterStatus)return false;
    if(filterRole&&a.roleId!==filterRole)return false;
    const linked=careerCollections?.recordLinks??[];
    if(filterProject&&!linked.some(l=>l.linkType==='achievement-project'&&l.sourceId===a.id&&l.targetId===filterProject))return false;
    if(filterCompetency&&!linked.some(l=>l.linkType==='achievement-competency'&&l.sourceId===a.id&&l.targetId===filterCompetency))return false;
    if(filterDateStart&&(!a.occurredStart||dateBounds(a.occurredStart).latest<filterDateStart))return false;
    if(filterDateEnd&&(!a.occurredStart||dateBounds(a.occurredStart).earliest>filterDateEnd))return false;
    return !q||[a.title,a.contribution,a.situation,a.actions,a.outcome,a.notes,IMPACT_CATEGORIES[a.impactCategory]].join(' ').toLocaleLowerCase().includes(q);
  }).sort((a,b)=>sortOrder==='oldest'?a.occurredOn.localeCompare(b.occurredOn):sortOrder==='updated'?b.updatedAt.localeCompare(a.updatedAt):b.occurredOn.localeCompare(a.occurredOn));
}
function vaultRows():string {const entries=filtered();return entries.length?entries.map(smallAchievement).join(''):`<div class="no-results">${icon('search',24)}<strong>No matching achievements</strong><p>Try a different search or status filter.</p><button class="text-action" data-action="clear-filters">Clear filters ${icon('arrow',15)}</button></div>`;}
function advancedFilterCount():number{return [filterRole,filterProject,filterCompetency,filterDateStart,filterDateEnd].filter(Boolean).length;}
function filterToggleLabel():string{const n=advancedFilterCount();return `${icon('filter',17)}<span>Filters${n?` · ${n}`:''}</span>`;}
function refreshVaultResults(){const el=document.getElementById('vault-results');if(el)el.innerHTML=vaultRows();const toggle=document.getElementById('vault-filter-toggle');if(toggle)toggle.innerHTML=filterToggleLabel();}
function filterField(id:string,label:string,control:string):string{return `<div class="field"><label for="${id}">${label}</label>${control}</div>`;}
function vaultView():string {
  if(achievements.length===0)return `<section class="panel">${emptyState('Start documenting your impact','Your vault is empty. Even one meaningful achievement is worth recording.','Add your first achievement','capture')}</section>`;
  const open=vaultFiltersOpen;
  return `<section class="panel vault-panel"><div class="vault-toolbar"><label class="search-field">${icon('search',19)}<input id="vault-search" type="search" placeholder="Search achievements" value="${escape(searchText)}" autocomplete="off" aria-label="Search achievements"/></label><div class="filter-controls"><label class="sr-only" for="status-filter">Filter by status</label><select id="status-filter"><option value="active" ${filterStatus==='active'?'selected':''}>Active</option><option value="all" ${filterStatus==='all'?'selected':''}>All statuses</option><option value="recorded" ${filterStatus==='recorded'?'selected':''}>Recorded</option><option value="draft" ${filterStatus==='draft'?'selected':''}>Drafts</option><option value="archived" ${filterStatus==='archived'?'selected':''}>Archived</option></select><label class="sr-only" for="sort-order">Sort achievements</label><select id="sort-order"><option value="recent" ${sortOrder==='recent'?'selected':''}>Newest</option><option value="oldest" ${sortOrder==='oldest'?'selected':''}>Oldest</option><option value="updated" ${sortOrder==='updated'?'selected':''}>Last edited</option></select><button id="vault-filter-toggle" class="button button-outline filter-toggle" data-action="toggle-vault-filters" aria-expanded="${open}" aria-controls="vault-filters">${filterToggleLabel()}</button></div></div>
    <div id="vault-filters" class="vault-advanced-filters" ${open?'':'hidden'}>
      ${filterField('role-filter','Employment role',`<select id="role-filter"><option value="">All roles</option>${(careerCollections?.roles??[]).map(r=>`<option value="${escape(r.id)}" ${filterRole===r.id?'selected':''}>${escape(r.title)}</option>`).join('')}</select>`)}
      ${filterField('project-filter','Experience',`<select id="project-filter"><option value="">All experiences</option>${(careerCollections?.projects??[]).map(p=>`<option value="${escape(p.id)}" ${filterProject===p.id?'selected':''}>${escape(p.name)}</option>`).join('')}</select>`)}
      ${filterField('competency-filter','Skill',`<select id="competency-filter"><option value="">All skills</option>${(careerCollections?.competencies??[]).filter(c=>c.status==='active').map(c=>`<option value="${escape(c.id)}" ${filterCompetency===c.id?'selected':''}>${escape(c.name)}</option>`).join('')}</select>`)}
      ${filterField('date-start-filter','From date',`<input type="date" id="date-start-filter" value="${escape(filterDateStart)}"/>`)}
      ${filterField('date-end-filter','Through date',`<input type="date" id="date-end-filter" value="${escape(filterDateEnd)}"/>`)}
    </div><div id="vault-results" class="achievement-list">${vaultRows()}</div></section>
  <p class="footer-note">${icon('info',14)} Outcomes, metrics and evidence are self-reported; nothing here is independently verified.</p>`;
}
function profileView():string {
  const has=Boolean(profile.displayName||profile.headline||profile.summary||profile.location||profile.email);
  return `<div class="profile-grid"><section class="panel profile-card"><div class="profile-top"><div class="avatar">${escape(initials())}</div><div><h2>${escape(profile.displayName||'Your name')}</h2><p>${escape(profile.headline||'Add your current professional headline')}</p>${profile.location?`<span class="profile-location">${escape(profile.location)}</span>`:''}</div></div><div class="profile-section"><p class="section-kicker">ABOUT</p>${profile.summary?`<p class="profile-summary">${escape(profile.summary)}</p>`:`<p class="muted">Describe the expertise, responsibilities, and career direction that define you.</p>`}</div>${profile.email?`<div class="profile-section"><p class="section-kicker">CONTACT</p><p>${escape(profile.email)}</p></div>`:''}<button class="button button-outline" data-action="edit-profile">${icon('edit',16)} ${has?'Edit your profile':'Complete profile'}</button></section></div>${careerCollections?careerSections(profile,careerCollections):''}`;
}
function modalView():string {
  if(!modal)return '';
  let content='';
  if(modal==='capture')content=achievementForm();
  if(modal==='detail')content=achievementDetail();
  if(modal==='profile')content=profileForm();
  if(modal==='career'&&careerCollections){
    const record=careerCollections[careerKind].find(r=>r.id===selectedId) as CareerRecord|undefined;
    content=careerForm(careerKind,record,careerCollections,careerEmployerId);
  }
  if(modal==='project'&&careerCollections){
    const record=careerCollections.projects.find(r=>r.id===selectedId);
    content=portfolioForm(record,careerCollections);
  }
  if(modal==='competency'&&careerCollections)content=customCompetencyForm(careerCollections,
    careerCollections.competencies.find(x=>x.id===selectedId));
  if(modal==='remove')content=removalView();
  if(modal==='settings')content=settingsView();
  if(modal==='restore')content=restoreView();
  return `<div class="modal-backdrop" data-action="backdrop"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" tabindex="-1" class="modal ${modal==='capture'?'capture-modal':''}">${content}</section></div>`;
}
function dialogHeader(title:string,subtitle:string):string {return `<div class="modal-header"><div><h2 id="dialog-title">${title}</h2><p id="dialog-description">${subtitle}</p></div><button class="icon-button close-dialog" data-action="close" aria-label="Close dialog">${icon('close',24)}</button></div>${toastView(true)}`;}
function achievementForm():string {
  const existing=editing&&selectedId?achievements.find(a=>a.id===selectedId):undefined;
  const status=existing?.status==='archived'?existing.preArchiveStatus:existing?.status;
  const dateType=existing?.occurredStart?.precision==='year'?'text':existing?.occurredStart?.precision==='month'?'month':'date';
  return `${dialogHeader(existing?'Edit achievement':'Capture an achievement',existing?'Update the details of your contribution.':'Start with what you accomplished. Refine the details later.')}
  <form id="achievement-form" class="modal-body form-grid" novalidate>
    <div id="form-error" class="form-error" role="alert" hidden></div>
    ${captureProjectId&&careerCollections?.projects.some(p=>p.id===captureProjectId)?`<p class="portfolio-capture-context">${icon('layers',16)} Linked experience: <strong>${escape(careerCollections.projects.find(p=>p.id===captureProjectId)?.name)}</strong></p>`:''}
    <div class="field"><label for="title">Achievement title <span class="required">*</span></label><input id="title" name="title" maxlength="160" placeholder="e.g., Resolved a critical technical issue" value="${escape(existing?.title??'')}" required/><p class="field-hint">Write a short, action-focused title.</p></div>
    <div class="field"><label for="contribution">What did you do? <span class="required">*</span></label><textarea id="contribution" name="contribution" rows="5" maxlength="6000" placeholder="Describe your personal contribution, decisions, or actions...">${escape(existing?.contribution??'')}</textarea><p class="field-hint">Required for a recorded achievement. Optional for a draft.</p></div>
    <div class="field-row"><div class="field"><label for="occurredOn">Occurrence date${dateType==='text'?' (year)':''}</label><input id="occurredOn" type="${dateType}" ${dateType==='text'?'inputmode="numeric" maxlength="4"':''} name="occurredOn" value="${escape(existing?.occurredOn??localDate())}"/></div><div class="field"><label for="impactCategory">Impact category</label><select name="impactCategory" id="impactCategory">${Object.entries(IMPACT_CATEGORIES).map(([key,value])=>`<option value="${key}" ${existing?.impactCategory===key?'selected':''}>${value}</option>`).join('')}</select></div></div>
    <div class="field"><label for="outcome">Outcome <span class="optional">optional</span></label><textarea id="outcome" name="outcome" rows="3" maxlength="6000" placeholder="What changed as a result? Add measurable results if known.">${escape(existing?.outcome??'')}</textarea></div>
    ${careerCollections?richAchievementFields(existing,careerCollections,captureProjectId):''}
    <div class="form-guidance">${icon('info',18)} <p>Capture the facts as you know them. Don't invent metrics or outcomes; you can complete your record later.</p></div>
  </form><div class="modal-footer"><button class="button button-outline" data-action="save-achievement" data-status="draft">Save draft</button><button class="button button-primary" data-action="save-achievement" data-status="recorded">${icon('check',17)} ${existing?'Save changes':'Save achievement'}</button></div>`;
}
function achievementDetail():string {
  const a=achievements.find(x=>x.id===selectedId);if(!a)return `${dialogHeader('Achievement unavailable','This entry might have been deleted.')}<div class="modal-body">Please reload your vault.</div>`;
  return `${dialogHeader('Achievement details','Your contribution, preserved.')}
  <div class="modal-body"><div class="detail-title-row">${statusBadge(a.status)}<span class="detail-date">${icon('calendar',15)} ${formatDate(a.occurredOn)}</span></div><h3 class="detail-title">${escape(a.title)}</h3>
  <div class="detail-section"><p class="section-kicker">YOUR CONTRIBUTION</p><p class="readable-text">${escape(a.contribution||'Not added yet. Edit this draft to describe what you contributed.')}</p></div>
  <div class="detail-section"><p class="section-kicker">OUTCOME</p><p class="readable-text ${!a.outcome?'muted':''}">${escape(a.outcome||'Not recorded yet')}</p></div>
  <div class="detail-section"><p class="section-kicker">IMPACT CATEGORY</p><span class="pill">${escape(IMPACT_CATEGORIES[a.impactCategory])}</span></div>
  ${careerCollections?achievementEnrichmentDetails(a,careerCollections):''}
  <div class="detail-section"><p class="section-kicker">RECORD INFORMATION</p><p class="fine-text">Created ${relativeDate(a.createdAt)} · Last updated ${relativeDate(a.updatedAt)}</p></div>
  <div class="detail-actions"><button class="button button-outline" data-action="edit-achievement">${icon('edit',16)} Edit</button><button class="button button-outline" data-action="toggle-archive">${icon(a.status==='archived'?'refresh':'archive',16)} ${a.status==='archived'?'Restore':'Archive'}</button><button class="button button-danger-soft" data-action="delete-achievement">${icon('trash',16)} Delete</button></div></div>`;
}
function profileForm():string {
  return `${dialogHeader('Edit career profile','Your professional introduction and contact details.')}
  <form id="profile-form" class="modal-body form-grid" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>
    <div class="field"><label for="displayName">Display name <span class="optional">optional</span></label><input id="displayName" name="displayName" maxlength="120" value="${escape(profile.displayName)}" placeholder="Your professional name"/></div>
    <div class="field"><label for="headline">Professional headline</label><input id="headline" name="headline" maxlength="200" value="${escape(profile.headline)}" placeholder="e.g., Manufacturing Engineer & Technical Project Lead"/></div>
    <div class="field"><label for="summary">Professional summary</label><textarea id="summary" name="summary" rows="5" maxlength="10000" placeholder="Your background, specialization and professional goals">${escape(profile.summary)}</textarea></div>
    <div class="field-row"><div class="field"><label for="location">Location</label><input id="location" name="location" maxlength="150" value="${escape(profile.location)}" placeholder="City, country"/></div><div class="field"><label for="email">Professional email</label><input id="email" name="email" type="email" maxlength="254" value="${escape(profile.email)}" placeholder="you@example.com"/></div></div>
    <div class="form-guidance">${icon('shield',18)}<p>Profile information stays on this device. Only enter details you're comfortable storing locally.</p></div>
  </form><div class="modal-footer"><button class="button button-outline" data-action="close">Cancel</button><button class="button button-primary" data-action="save-profile">${icon('check',17)} Save profile</button></div>`;
}
function settingsView():string {
  return `${dialogHeader('Settings & data','Your workspace preferences and data controls.')}
  <div class="modal-body settings-body"><div class="settings-group"><h3>Appearance</h3><div class="settings-line settings-line-stack"><div><strong>Theme</strong><p>System follows your phone's light or dark setting.</p></div><div class="segmented" role="radiogroup" aria-label="Color theme">${(['system','light','dark'] as const).map(value=>`<button type="button" class="segment" role="radio" aria-checked="${theme===value}" data-action="set-theme" data-value="${value}">${titleCase(value)}</button>`).join('')}</div></div></div>
  <div class="settings-group"><h3>Data management</h3><div class="settings-line"><div><strong>Export career backup</strong><p>Download all career records, relationships, taxonomy and preferences as an unencrypted JSON file (up to 12 MiB).</p></div><button id="export-backup" class="button button-outline" data-action="export">${icon('download',16)} Export</button></div><div class="settings-line"><div><strong>Data health</strong><p>Read-only check that your records and backup format are intact, plus suggestions for what is worth completing or protecting. Nothing is changed, uploaded or scored.</p></div><button id="check-integrity" class="button button-outline" data-action="check-integrity">Check data</button></div><p id="integrity-check-result" class="integrity-check-result" role="status" aria-live="polite"></p><div id="data-health-report" class="data-health-report"></div><div class="settings-line"><div><strong>Restore from backup</strong><p>Replace local records with a validated CareerProof backup.</p></div><button class="button button-outline" data-action="choose-restore">${icon('upload',16)} Restore</button></div><input id="restore-file" type="file" accept=".json,application/json" hidden/><p class="backup-note">${lastExportAt?`Last export generated: ${relativeDate(lastExportAt)}`:'No export generated from this browser yet.'} Your downloaded JSON is not encrypted. Keep it somewhere secure.</p></div>
  <div class="settings-group"><h3>Application</h3><div class="settings-line"><div><strong>CareerProof OS</strong><p>Local-first PWA · v${APP_VERSION} · Database schema ${SCHEMA_VERSION}</p></div>${icon('shield',20)}</div><div class="settings-line"><div><strong>Check for updates</strong><p id="pwa-update-status">${pwaUpdateReady?'Update ready. Close Settings to back up or restart.':`Checks automatically each time you open CareerProof, without removing the app or your records. ${lastCheckedText()}`}</p></div><button class="button button-outline" data-action="check-updates">Check now</button></div><div class="form-guidance">${icon('info',18)}<p>Closing this app does not delete saved records, but browser data may be cleared or lost. This version has no cloud sync; export backups regularly.</p></div></div></div>`;
}
function removalView():string{
  if(!removal||!careerCollections)return '';
  try{
    const impact=removalImpact(careerCollections,removal.kind,removal.id);
    const view=removalContent(impact,removal);
    return dialogHeader(escape(view.title),escape(view.subtitle))+view.body+view.footer;
  }catch(err){return `${dialogHeader('Record unavailable','It may have been changed or deleted elsewhere.')}<div class="modal-body"><p>${escape(errorMessage(err))}</p></div>`;}
}
/** CP-012B: every delete of a career record goes through the dependency preview. */
function openRemoval(kind:RemovableKind,id:string){
  if(!careerCollections)return notify('Career records are still loading.','error');
  try{removal={kind,id,...defaultRemovalChoice(removalImpact(careerCollections,kind,id))};openModal('remove',id);}
  catch(err){notify(errorMessage(err),'error');}
}
async function confirmRemoval(){
  if(!removal||!careerCollections||saving)return;
  const impact=removalImpact(careerCollections,removal.kind,removal.id);
  if(!removalReady(impact,removal))return showError('Choose what happens to the linked records and confirm first.');
  const record=(careerCollections[removal.kind] as {id:string;revision:number}[]).find(r=>r.id===removal!.id);
  if(!record)return showError('This record no longer exists. Reload and try again.');
  setSaving(true);
  try{
    const plan=await database.removeWithPlan(removal.kind,removal.id,record.revision,impact.hasDependents?removal.mode!:'delete',removal.mode==='move'?removal.targetId:null);
    achievements=await listAchievements();await loadCareerCollections();
    closeModal(true);notify(plan.summary);
  }catch(err){showError(errorMessage(err));}finally{setSaving(false);}
}
function restoreView():string {
  if(!pendingBackup)return '';
  const m=pendingBackup.backup.manifest;
  return `${dialogHeader('Restore career data','Review the backup before replacing your local records.')}<div class="modal-body"><div class="restore-warning">${icon('alert',20)}<div><strong>This replaces your current data</strong><p>Every local career collection and portable preference will be replaced. Export your current data before proceeding.</p>${pendingBackup.legacy?'<p><strong>Legacy format-1 backup:</strong> employers, roles, qualifications, projects, metrics, evidence, custom competencies and links currently stored here will be removed. This file restores its profile and achievements and the 32 built-in competencies. Theme resets to System.</p>':''}</div></div><div class="restore-preview"><p><span>Backup created</span><strong>${relativeDate(m.exportedAt)}</strong></p><p><span>Achievements</span><strong>${m.counts.achievements}</strong></p>${P0_STORES.filter(s=>s!=='achievements').map(s=>`<p><span>${collectionLabels[s]}</span><strong>${m.counts[s]}</strong></p>`).join('')}<p><span>Schema</span><strong>${m.schemaVersion}</strong></p></div><div class="form-guidance">${icon('shield',17)}<p>This backup passed initial structure and record validation. Its contents are not independently verified.</p></div></div><div class="modal-footer"><button class="button button-outline" data-action="settings">Cancel</button><button class="button button-danger" data-action="confirm-restore">Replace local data</button></div>`;
}
let lastRenderedScreen:Screen|null=null;
/** Keep expanded Experience cards and skill entries open when the same screen redraws (e.g. after a dialog closes). */
function openDisclosureKeys():string[]{return lastRenderedScreen===screen?[...root.querySelectorAll<HTMLDetailsElement>('details[open][data-project-id],details[open][data-skill]')].map(d=>d.dataset.projectId?'p:'+d.dataset.projectId:'s:'+(d.dataset.skill??'')):[];}
function restoreDisclosures(keys:string[]){for(const key of keys){const [kind,id]=[key.slice(0,1),key.slice(2)];const el=[...root.querySelectorAll<HTMLDetailsElement>(kind==='p'?'details[data-project-id]':'details[data-skill]')].find(d=>(kind==='p'?d.dataset.projectId:d.dataset.skill)===id);if(el)el.open=true;}}
function render(preserveFocus=false):void {const focusId=preserveFocus?(document.activeElement as HTMLElement|null)?.id:'';const openKeys=openDisclosureKeys();root.classList.remove('app-loading');root.innerHTML=shell()+pwaUpdateNotice();restoreDisclosures(openKeys);lastRenderedScreen=screen;dialogs.update(Boolean(modal));syncCareerDisclosures(root);if(modal==='project'){const form=document.getElementById('portfolio-form') as HTMLFormElement|null;if(form)updatePortfolioRoleChoices(form);}
  if(focusId){document.getElementById(focusId)?.focus({preventScroll:true});}else if(modal){dialogs.focusFirst();}
}
function toastView(inDialog=false):string{return `<div id="toast" role="status" aria-live="polite" class="toast ${inDialog?'toast-in-dialog':''} ${toastMessage?'visible':''} toast-${toastKind}">${toastMessage?`${icon(toastKind==='success'?'check':'alert',20)}<span>${escape(toastMessage)}</span>`:''}</div>`;}
function notify(message:string,kind:'success'|'error'='success'){toastMessage=message;toastKind=kind;window.clearTimeout(toastTimer);const el=document.getElementById('toast');if(el){el.innerHTML=`${icon(kind==='success'?'check':'alert',20)}<span>${escape(message)}</span>`;el.classList.add('visible');el.classList.toggle('toast-error',kind==='error');el.classList.toggle('toast-success',kind==='success');}toastTimer=window.setTimeout(()=>{toastMessage='';document.getElementById('toast')?.classList.remove('visible');},kind==='error'?10000:5000);}
function openModal(kind:Modal,id:string|null=null,edit=false){if(!modal)dialogs.rememberInvoker();modal=kind;selectedId=id;editing=edit;isDirty=false;render();}
function closeModal(force=false){if(saving&&!force)return;if(!force&&isDirty&& !window.confirm('You have unsaved changes. Discard them?'))return;modal=null;selectedId=null;editing=false;pendingBackup=null;isDirty=false;captureProjectId=null;removal=null;render();dialogs.restoreFocus();}
function showError(message:string){const el=document.getElementById('form-error');if(el){el.hidden=false;el.textContent=message;el.scrollIntoView({block:'nearest',behavior:'smooth'});}else notify(message,'error');}
function setSaving(value:boolean){saving=value;const dialog=document.querySelector<HTMLElement>('.modal');dialog?.setAttribute('aria-busy',String(value));for(const button of dialog?.querySelectorAll<HTMLButtonElement>('button[data-action]')??[])button.disabled=value;}
function readAchieveInput(status:'draft'|'recorded') {
  const form=document.getElementById('achievement-form') as HTMLFormElement|null;
  if(!form)throw new Error('Achievement form not available');const values=new FormData(form);
  return {title:String(values.get('title')??'').trim(),contribution:String(values.get('contribution')??'').trim(),occurredOn:String(values.get('occurredOn')??''),status,outcome:String(values.get('outcome')??'').trim(),impactCategory:String(values.get('impactCategory')??'')};
}
async function saveAchievementForm(status:'draft'|'recorded'){
  if(saving)return;setSaving(true);
  try{const input=readAchieveInput(status);const errors=validateAchievementInput(input);if(errors.length){showError(errors.join(' '));return;}
    const existing=editing&&selectedId?achievements.find(x=>x.id===selectedId):undefined;
    if(!careerCollections)throw new ValidationError('Career records are unavailable.');
    const form=document.getElementById('achievement-form') as HTMLFormElement;
    const rich=parseRichFields(form);
    if(captureProjectId&&!rich.projectIds.includes(captureProjectId))rich.projectIds.push(captureProjectId);
    const record=await database.saveAchievementBundle({
      id:existing?.id??crypto.randomUUID(),revision:existing?.revision??0,
      title:input.title,contribution:input.contribution,occurredOn:input.occurredOn,
      status,preArchiveStatus:existing?.status==='archived'?null:existing?.preArchiveStatus??null,
      outcome:input.outcome,impactCategory:input.impactCategory as Achievement['impactCategory'],
      roleId:rich.roleId,situation:rich.situation,actions:rich.actions,notes:rich.notes,
      confidentiality:rich.confidentiality
    },rich.projectIds,rich.primaryProjectId,rich.competencyIds,rich.metrics,rich.references);
    achievements=await listAchievements();await loadCareerCollections();closeModal(true);notify(existing?'Achievement updated.':status==='draft'?'Draft saved.':'Achievement saved.');
  }catch(err){showError(errorMessage(err));}finally{setSaving(false);}
}
async function saveProfileForm(){if(saving)return;setSaving(true);try{
  const form=document.getElementById('profile-form') as HTMLFormElement;const fd=new FormData(form);const input={displayName:String(fd.get('displayName')??'').trim(),headline:String(fd.get('headline')??'').trim(),summary:String(fd.get('summary')??'').trim(),email:String(fd.get('email')??'').trim(),location:String(fd.get('location')??'').trim()};
  const errors=validateProfileInput(input);if(errors.length){showError(errors.join(' '));return;}
  profile=await saveProfile({...input,id:PROFILE_ID,revision:profile.revision});if(careerCollections)careerCollections.profiles[0]=profile;closeModal(true);notify('Profile updated.');
}catch(err){showError(errorMessage(err));}finally{setSaving(false);}}
async function loadCareerCollections(){careerCollections=(await database.readSnapshot()).collections;profile=careerCollections.profiles[0]!;}
function openCareer(kind:CareerKind,id:string|null=null,employerId?:string){
  if(!careerCollections)return notify('Career records are still loading.','error');
  if(kind==='roles'&&!careerCollections.employers.length){notify('Add an employer before creating a role.','error');return;}
  careerKind=kind;careerEmployerId=employerId;openModal('career',id,Boolean(id));
}
async function saveCareerForm(){
  if(saving||!careerCollections)return;
  setSaving(true);
  try{
    const form=document.getElementById('career-form') as HTMLFormElement|null;
    if(!form)throw new ValidationError('The career form is not available.');
    const previous=careerCollections[careerKind].find(r=>r.id===selectedId) as CareerRecord|undefined;
    const result=readCareerForm(careerKind,form,previous);
    switch(result.kind){
      case 'roles':await database.saveCareerRole(result.record,result.primary);break;
      case 'employers':await database.saveRecord('employers',result.record);break;
      case 'education':await database.saveRecord('education',result.record);break;
      case 'credentials':await database.saveRecord('credentials',result.record);break;
    }
    await loadCareerCollections();closeModal(true);notify('Career record saved.');
  }catch(err){showError(errorMessage(err));}finally{setSaving(false);}
}
async function saveProjectForm(){
  if(saving||!careerCollections)return;
  setSaving(true);
  try{
    const form=document.getElementById('portfolio-form') as HTMLFormElement|null;
    if(!form)throw new ValidationError('Experience form is unavailable.');
    const prior=careerCollections.projects.find(r=>r.id===selectedId);
    const input=readPortfolioForm(form,prior);
    await database.savePortfolioProject(input.record,input.roleIds);
    await loadCareerCollections();
    closeModal(true);notify('Experience saved.');
  }catch(err){showError(errorMessage(err));}finally{setSaving(false);}
}
function currentSkillScope():SkillScope{return skillScope??(careerCollections?defaultSkillScope(careerCollections):'all');}
function refreshCompetencies(){
  const target=document.querySelector<HTMLElement>('.skill-groups');
  if(target&&careerCollections)target.innerHTML=competencyGroups(careerCollections,skillQuery,skillCategory,skillShowArchived,currentSkillScope());
}
function refreshPortfolioCards(){
  const target=document.getElementById('portfolio-results');
  if(target&&careerCollections)target.innerHTML=portfolioCards(careerCollections,portfolioFilters);
}
async function saveCustomSkill(){
  if(saving||!careerCollections)return;
  setSaving(true);
  try{
    const form=document.getElementById('competency-form') as HTMLFormElement|null;
    if(!form)throw new ValidationError('Competency editor unavailable.');
    const existing=careerCollections.competencies.find(r=>r.id===selectedId);
    if(existing?.isBuiltIn)throw new ValidationError('Built-in competencies cannot be edited.');
    const input=readCustomCompetency(form,careerCollections,existing);
    await database.saveRecord('competencies',input);
    // A new skill has no examples yet; show All so it is visible after saving.
    if(!existing)skillScope='all';
    await loadCareerCollections();closeModal(true);notify('Competency saved.');
  }catch(err){showError(errorMessage(err));}finally{setSaving(false);}
}
async function changeCustomSkillStatus(id:string,status:'active'|'archived'){
  if(!careerCollections||saving)return;
  const skill=careerCollections.competencies.find(r=>r.id===id);
  if(!skill||skill.isBuiltIn)return notify('Only custom competencies can change archive status.','error');
  if(skill.status===status)return;
  if(status==='archived'&&!window.confirm('Archive custom competency "'+skill.name+'"? Linked achievements will remain recorded.'))return;
  try{await database.saveRecord('competencies',{...skill,status});await loadCareerCollections();render();notify(status==='archived'?'Custom competency archived.':'Custom competency restored.');}
  catch(err){notify(errorMessage(err),'error');}
}
function errorMessage(err:unknown):string{return err instanceof Error?err.message:'An unexpected error occurred.';}
async function doIntegrityCheck(){
  if(saving)return;
  const target=document.getElementById('integrity-check-result');
  const reportTarget=document.getElementById('data-health-report');
  const button=document.getElementById('check-integrity') as HTMLButtonElement|null;
  if(!target)return;
  if(button)button.disabled=true;
  if(reportTarget)reportTarget.innerHTML='';
  target.classList.remove('integrity-failed');
  target.textContent='Checking local records and recovery-format compatibility…';
  try{
    const health=await inspectDataHealth();
    const report=health.integrity;
    if(report){
      const total=report.counts.achievements+report.counts.projects+report.counts.roles+
        report.counts.education+report.counts.credentials;
      target.textContent='Check passed. '+total+' career and achievement records; '+
        report.counts.recordLinks+' relationships, '+report.counts.impactMetrics+
        ' metrics, '+report.counts.evidenceReferences+' evidence references. '+
        'Backup format '+report.formatVersion+' and schema '+report.schemaVersion+
        ' validated ('+Math.ceil(report.jsonBytes/1024)+' KiB estimated JSON). '+
        'Read-only: nothing was restored or uploaded. This does not verify the accuracy of your claims or replace a downloaded backup.';
    }else{
      target.classList.add('integrity-failed');
      target.textContent='Check incomplete: a critical problem was found. No restore was performed. Keep your current data and export a backup if possible.';
    }
    if(reportTarget)reportTarget.innerHTML=dataHealthReport(health);
  }catch(err){
    target.classList.add('integrity-failed');
    target.textContent='Check incomplete: '+errorMessage(err)+
      ' No restore was performed. Keep your current data and export a backup if possible.';
  }finally{if(button)button.disabled=false;}
}
async function doExport(){try{const file=await createBackup();downloadBackup(file.name,file.json);await setMeta('lastExportAt',file.exportedAt);lastExportAt=file.exportedAt;if(!modal||modal==='settings')render(true);notify('Backup file generated. Check that it was saved securely.');}catch(err){notify(`Backup failed: ${errorMessage(err)}`,'error');}}
async function doFileRestore(file:File){try{pendingBackup=await parseBackupFile(file);openModal('restore');}catch(err){notify(`Cannot restore: ${errorMessage(err)}`,'error');}}
async function doConfirmRestore(){if(!pendingBackup||saving)return;const prepared=pendingBackup;setSaving(true);try{await restoreBackup(prepared);profile=await getProfile();achievements=await listAchievements();await loadCareerCollections();theme=prepared.backup.preferences.theme;localStorage.setItem('careerproof-theme',theme);applyTheme();lastExportAt=null;closeModal(true);screen='home';location.hash='/home';render();dialogs.restoreFocus();notify('Backup restored successfully.');}catch(err){notify(`Restore failed: ${errorMessage(err)}`,'error');}finally{setSaving(false);}}
async function toggleArchive(){const a=achievements.find(x=>x.id===selectedId);if(!a)return;try{
  const isArchived=a.status==='archived';await saveAchievement({...a,revision:a.revision,status:isArchived?a.preArchiveStatus??'draft':'archived',preArchiveStatus:isArchived?null:a.status as 'draft'|'recorded'});
  achievements=await listAchievements();closeModal(true);notify(isArchived?'Achievement restored.':'Achievement archived.');
}catch(err){notify(errorMessage(err),'error');}}
async function deleteCurrent(){const a=achievements.find(x=>x.id===selectedId);if(!a)return;if(!window.confirm(`Permanently delete "${a.title}"? This cannot be undone.`))return;
  try{await removeAchievement(a.id,a.revision);achievements=await listAchievements();closeModal(true);notify('Achievement deleted.');}catch(err){notify(errorMessage(err),'error');}
}
function navigate(to:Screen){if(modal)closeModal(true);screen=to;location.hash=`/${to}`;render();window.scrollTo(0,0);const heading=document.querySelector<HTMLElement>('#main-content h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
function focusables():HTMLElement[]{return Array.from(document.querySelectorAll<HTMLElement>('.modal button:not([disabled]),.modal input:not([disabled]):not([type="hidden"]),.modal textarea:not([disabled]),.modal select:not([disabled])')).filter(x=>x.offsetParent!==null);}
function runAction(node:HTMLElement){
  const action=node.dataset.action;switch(action){
    case 'nav':navigate(node.dataset.screen as Screen);break;
    case 'capture':captureProjectId=null;openModal('capture');break;
    case 'add-competency':openModal('competency');break;
    case 'edit-competency':openModal('competency',node.dataset.id??null,true);break;
    case 'save-competency':void saveCustomSkill();break;
    case 'archive-competency':void changeCustomSkillStatus(node.dataset.id??'','archived');break;
    case 'restore-competency':void changeCustomSkillStatus(node.dataset.id??'','active');break;
    case 'competency-achievement':openModal('detail',node.dataset.id??null);break;
    case 'toggle-rich-panel':{
      const body=document.getElementById('rich-panel-content');
      if(!body)return;
      body.hidden=!body.hidden;
      node.setAttribute('aria-expanded',String(!body.hidden));
      break;
    }
    case 'add-rich-metric':document.getElementById('rich-metrics')?.insertAdjacentHTML('beforeend',metricRow());isDirty=true;break;
    case 'add-rich-evidence':document.getElementById('rich-evidence')?.insertAdjacentHTML('beforeend',evidenceRow());isDirty=true;break;
    case 'remove-rich-row':node.closest('.rich-row')?.remove();isDirty=true;break;
    case 'add-project':openModal('project');break;
    case 'edit-project':openModal('project',node.dataset.id??null,true);break;
    case 'save-project':void saveProjectForm();break;
    case 'remove-project':openRemoval('projects',node.dataset.id??'');break;
    case 'delete-competency':openRemoval('competencies',node.dataset.id??'');break;
    case 'confirm-removal':void confirmRemoval();break;
    case 'portfolio-achievement':openModal('detail',node.dataset.id??null);break;
    case 'project-capture':captureProjectId=node.dataset.id??null;openModal('capture');break;
    case 'edit-profile':openModal('profile');break;
    case 'add-career':openCareer(node.dataset.kind as CareerKind,null,node.dataset.employer);break;
    case 'edit-career':openCareer(node.dataset.kind as CareerKind,node.dataset.id??null);break;
    case 'toggle-career-details':toggleCareerDisclosure(node);break;
    case 'delete-career':openRemoval(node.dataset.kind as RemovableKind,node.dataset.id??'');break;
    case 'save-career':void saveCareerForm();break;
    case 'settings':openModal('settings');break;
    case 'check-updates':void checkPwaUpdates(true);break;
    case 'reload-update':
      if(!pwaUpdateReady)return;
      if(saving){notify('Finish the current save before restarting.','error');return;}
      if(isDirty&&!window.confirm('You have unsaved changes. Discard them and restart to update?'))return;
      window.location.reload();
      break;
    case 'close':closeModal();break;
    case 'backdrop':if(node.classList.contains('modal-backdrop'))closeModal();break;
    case 'detail':openModal('detail',node.dataset.id??null);break;
    case 'edit-achievement':openModal('capture',selectedId,true);break;
    case 'save-achievement':void saveAchievementForm(node.dataset.status as 'draft'|'recorded');break;
    case 'save-profile':void saveProfileForm();break;
    case 'toggle-archive':void toggleArchive();break;
    case 'delete-achievement':void deleteCurrent();break;
    case 'export':void doExport();break;
    case 'check-integrity':void doIntegrityCheck();break;
    case 'health-open':{
      // CP-012A: open the record behind a suggestion; the report itself never edits.
      const kind=node.dataset.kind,id=node.dataset.id||null;
      if(kind==='achievement'&&id)openModal('detail',id);
      else if(kind==='project'&&id)openModal('project',id,true);
      else if(kind==='profile')openModal('profile');
      else if(kind==='credential'&&id)openCareer('credentials',id);
      break;
    }
    case 'choose-restore':(document.getElementById('restore-file') as HTMLInputElement|null)?.click();break;
    case 'confirm-restore':void doConfirmRestore();break;
    case 'clear-filters':searchText='';filterStatus='active';sortOrder='recent';filterRole='';filterProject='';filterCompetency='';filterDateStart='';filterDateEnd='';render();break;
    case 'toggle-vault-filters':{
      vaultFiltersOpen=!vaultFiltersOpen;
      const panel=document.getElementById('vault-filters');if(panel)panel.hidden=!vaultFiltersOpen;
      node.setAttribute('aria-expanded',String(vaultFiltersOpen));
      break;
    }
    case 'toggle-archived-skills':
      skillShowArchived=!skillShowArchived;
      node.setAttribute('aria-pressed',String(skillShowArchived));
      refreshCompetencies();
      break;
    case 'skill-scope':
      skillScope=node.dataset.scope==='linked'?'linked':'all';
      document.querySelectorAll<HTMLElement>('[data-action="skill-scope"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===skillScope)));
      refreshCompetencies();
      break;
    case 'set-theme':{
      const value=node.dataset.value??'system';
      void setTheme(value).then(()=>document.querySelectorAll<HTMLElement>('[data-action="set-theme"]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.value===theme))));
      break;
    }
  }
}
document.addEventListener('click',e=>{
  if(!(e.target instanceof Element))return;
  const actionTarget=resolveActionTarget(e.target);
  if(actionTarget)runAction(actionTarget);
});
document.addEventListener('input',e=>{const t=e.target as HTMLElement;if(t.closest('#achievement-form, #profile-form, #career-form,#portfolio-form,#competency-form'))isDirty=true;if(t.id==='portfolio-search'){portfolioFilters.query=(t as HTMLInputElement).value;refreshPortfolioCards();}if(t.id==='competency-search'){skillQuery=(t as HTMLInputElement).value;refreshCompetencies();}if(t.id==='vault-search'){searchText=(t as HTMLInputElement).value;const results=document.getElementById('vault-results');if(results)results.innerHTML=vaultRows();}});
document.addEventListener('change',e=>{const t=e.target as HTMLInputElement|HTMLSelectElement;if(t.id==='competency-category'){skillCategory=t.value;refreshCompetencies();}
  if(removal&&t.closest('#removal-form')){
    if(t.name==='removal-mode')removal.mode=t.value==='move'?'move':'unlink';
    if(t.id==='removal-target')removal.targetId=t.value;
    if(t.id==='removal-confirm')removal.confirmed=(t as HTMLInputElement).checked;
    if(removal.mode==='move'&&!removal.targetId&&careerCollections)removal.targetId=removalImpact(careerCollections,removal.kind,removal.id).targets[0]?.id??'';
    render(true);return;
  }
  if(t.id==='rich-primaryProjectId'||t.name==='projectId')isDirty=true;
  if(t.name==='projectId'){const form=t.closest('form');if(form)updatePrimaryOptions(form);}
  if(t.id==='role-filter'){filterRole=t.value;refreshVaultResults();}
  if(t.id==='project-filter'){filterProject=t.value;refreshVaultResults();}
  if(t.id==='competency-filter'){filterCompetency=t.value;refreshVaultResults();}
  if(t.id==='date-start-filter'){filterDateStart=t.value;refreshVaultResults();}
  if(t.id==='date-end-filter'){filterDateEnd=t.value;refreshVaultResults();}
  if(t.id==='portfolio-filter-type'){portfolioFilters.type=t.value;refreshPortfolioCards();}if(t.id==='portfolio-filter-status'){portfolioFilters.status=t.value;refreshPortfolioCards();}if(t.id==='portfolio-employerId'){const form=t.closest('form');if(form)updatePortfolioRoleChoices(form);}if(t.dataset.action==='portfolio-date-precision'){const target=t.dataset.target??'';const input=document.getElementById('portfolio-'+target) as HTMLInputElement|null;if(input){input.type=t.value==='year'?'text':t.value==='month'?'month':'date';input.value='';input.placeholder=t.value==='year'?'YYYY':'';input.inputMode=t.value==='year'?'numeric':'';input.maxLength=t.value==='year'?4:524288;}}if(t.id==='status-filter'){filterStatus=t.value;const el=document.getElementById('vault-results');if(el)el.innerHTML=vaultRows();}if(t.id==='sort-order'){sortOrder=t.value;const el=document.getElementById('vault-results');if(el)el.innerHTML=vaultRows();}if(t.id==='restore-file'&&t instanceof HTMLInputElement&&t.files?.[0]){void doFileRestore(t.files[0]);}if(t.dataset.action==='career-date-precision'){
    const target=t.dataset.target??'';
    const input=document.getElementById('career-'+target) as HTMLInputElement|null;
    if(input){input.type=t.value==='year'?'text':t.value==='month'?'month':'date';input.value='';input.placeholder=t.value==='year'?'YYYY':'';input.inputMode=t.value==='year'?'numeric':'';input.maxLength=t.value==='year'?4:524288;}
  }
  if(t.id==='career-isCurrent'&&t instanceof HTMLInputElement&&t.checked){
    const end=document.getElementById('career-endDate') as HTMLInputElement|null;if(end)end.value='';
  }
  if(t.closest('#achievement-form,#profile-form,#career-form,#portfolio-form,#competency-form'))isDirty=true;});
document.addEventListener('submit',e=>{if((e.target as HTMLElement).id==='achievement-form'){e.preventDefault();void saveAchievementForm('recorded');}if((e.target as HTMLElement).id==='profile-form'){e.preventDefault();void saveProfileForm();}if((e.target as HTMLElement).id==='career-form'){e.preventDefault();void saveCareerForm();}if((e.target as HTMLElement).id==='portfolio-form'){e.preventDefault();void saveProjectForm();}if((e.target as HTMLElement).id==='competency-form'){e.preventDefault();void saveCustomSkill();}});
document.addEventListener('keydown',e=>{if(!modal)return;if(e.key==='Escape'){e.preventDefault();closeModal();}if(e.key==='Tab'){const elements=focusables();if(!elements.length)return;const first=elements[0]!,last=elements[elements.length-1]!;if(!document.activeElement?.closest('.modal')){e.preventDefault();(e.shiftKey?last:first).focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('resize',()=>syncCareerDisclosures(root),{passive:true});
window.addEventListener('hashchange',()=>{const next=currentNav();if(next===screen)return;screen=next;if(!modal)render();});
function renderStartupError(err:unknown){root.classList.remove('app-loading');root.innerHTML=`<div class="startup-error"><div>${icon('alert',32)}</div><h1>CareerProof couldn't open your local database</h1><p>${escape(errorMessage(err))}</p><p>Your existing data has not been intentionally deleted. Try closing other tabs, checking browser storage permissions, and reopening this page.</p><button onclick="location.reload()" class="button button-primary">Retry</button></div>`;}
async function start(){try{
  dialogs.trackViewport();
  applyTheme();await initialize();const prefs=await getMeta('preferences') as {theme:string};const savedTheme=localStorage.getItem('careerproof-theme');theme=savedTheme&&['system','light','dark'].includes(savedTheme)?savedTheme:prefs.theme;await setMeta('preferences',{theme});applyTheme();[profile,achievements,lastExportAt]=await Promise.all([getProfile(),listAchievements(),getMeta('lastExportAt') as Promise<string|null>]);await loadCareerCollections();screen=currentNav();render();
  configurePwaUpdates();
}catch(err){renderStartupError(err);}}
void start();
