import { type AchievementView as Achievement, type Profile, type AchievementStatus, type P0Store, type CareerCollections, IMPACT_CATEGORIES, APP_VERSION, SCHEMA_VERSION, P0_STORES, localDate, PROFILE_ID } from '../domain/models.js';
import { validateAchievementInput, validateProfileInput, summarizeAchievements, ValidationError } from '../domain/validation.js';
import { initialize, getProfile, saveProfile, listAchievements, getAchievement, saveAchievement, removeAchievement, getMeta, setMeta, database } from '../data/db.js';
import { careerSections, careerForm, readCareerForm, syncCareerDisclosures, toggleCareerDisclosure, type CareerKind, type CareerRecord } from '../ui/careerHistory.js';
import { portfolioForm,readPortfolioForm,updatePortfolioRoleChoices } from '../ui/experiencePortfolio.js';
import { timelinePage,timelineGroups,experiencePageView } from '../ui/experienceTimeline.js';
import { achievementRow,achievementStory,savedMessage } from '../ui/achievementStory.js';
import { achievementContexts,achievementYear,roleForExperience } from '../domain/timeline.js';
import { compareRolesByRecency } from '../domain/chronology.js';
import { createBackup, downloadBackup, parseBackupFile, restoreBackup, inspectDataHealth, type PreparedBackup } from '../data/backup.js';
import { dataHealthReport } from '../ui/dataHealth.js';
import { homeGapsSection, roleCoverageSection, recordTimelineSection, monthListTitle, monthEmpty } from '../ui/homeDashboard.js';
import { recordByMonth } from '../domain/dashboard.js';
import { motionAllowed, enableTouchFeedback, enterSheet, enterScreen, slideStep, snapshotBars, animateBars, glowRecord, type ScreenMove } from '../ui/motion.js';
import { removalImpact, type RemovableKind } from '../domain/removal.js';
import { removalContent, defaultRemovalChoice, removalReady, type RemovalChoice } from '../ui/removal.js';
import {icon} from '../ui/icons.js';
import {escapeHtml} from '../ui/html.js';
import { resolveActionTarget } from '../ui/actionRouting.js';
import { DialogController } from '../ui/dialog.js';
import {parseRichFields,metricRow,evidenceRow,ROLE_ONLY} from '../ui/achievementIntelligence.js';
import {captureForm,captureFooter,showCaptureStep,syncWhere,filterWhere,filterSkills,addInlineExperience,switchOccurrencePrecision,hasWhereChoices,type CaptureStep,type Precision} from '../ui/captureFlow.js';
import {competencyPage,competencyGroups,customCompetencyForm,readCustomCompetency,defaultSkillScope,skillExampleSummary,skillFilterLabel,type SkillScope} from '../ui/competencyLibrary.js';
import {proficiencyAssessmentForm,readProficiencyForm} from '../ui/proficiencyAssessment.js';
import {dateBounds,precisionDateFromInput} from '../domain/dates.js';

type Screen='home'|'vault'|'profile'|'portfolio'|'competencies';
type Modal='capture'|'detail'|'profile'|'settings'|'restore'|'career'|'project'|'competency'|'assessment'|'remove'|null;
const root=document.getElementById('app')!;
let profile:Profile;
let achievements:Achievement[]=[];
let careerCollections:CareerCollections|null=null;
let careerKind:CareerKind='employers';
let careerEmployerId:string|undefined;
let captureProjectId:string|null=null;
/** CP-UX2: the step a new capture is on (1 Where, 2 What, 3 When). */
let captureStep:CaptureStep=1;
// CP-UX1: the Experience tab shows a role-grouped timeline, or one experience's page.
let experienceId:string|null=null;
let experienceQuery='';
let timelineOpen:Set<string>|null=null;
let screen:Screen='home';
let modal:Modal=null;
let selectedId:string|null=null;
let editing=false;
let isDirty=false;
const dialogs=new DialogController();
let pendingBackup:PreparedBackup|null=null;
let saving=false;
let searchText='';
let filterStatus='recorded';
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
let skillFiltersOpen=false;
/** CP-UX-Fluid (DEC-038): the month picked on Home's record timeline (YYYY-MM), or null for Recent. */
let homeMonth:string|null=null;
/** The achievement to highlight once the screen behind a closing sheet is drawn. */
let pendingGlow:string|null=null;
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
let toastDetail='';
const collectionLabels:Record<P0Store,string>={profiles:'Career profiles',employers:'Employers',roles:'Roles',education:'Education',credentials:'Credentials',projects:'Projects',achievements:'Achievements',impactMetrics:'Impact metrics',competencyCategories:'Competency categories',competencies:'Competencies',evidenceReferences:'Evidence references',recordLinks:'Relationships',proficiencyAssessments:'Proficiency assessments'};

const escape=escapeHtml;
function relativeDate(v:string):string {if(!v)return 'Never';return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(v));}
function capitalize(v:string):string {return v.charAt(0).toUpperCase()+v.slice(1);}
function initials():string {return profile.displayName.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()??'').join('') || 'CP';}
function currentNav():Screen {const name=location.hash.replace('#/','').split('/')[0];return name==='vault'||name==='profile'||name==='portfolio'||name==='competencies'?name:'home';}
/** CP-UX1: #/portfolio/<id> opens that experience's page. */
function hashExperience():string|null {const [name,id]=location.hash.replace('#/','').split('/');return name==='portfolio'&&id?decodeURIComponent(id):null;}
function applyTheme(){document.documentElement.dataset.theme=theme;}
async function setTheme(value:string){if(!['system','light','dark'].includes(value))return;try{await setMeta('preferences',{theme:value});theme=value;localStorage.setItem('careerproof-theme',theme);applyTheme();}catch(err){notify(errorMessage(err),'error');}}
function navButton(id:Screen,label:string,glyph:string,mobile=false):string{return `<button class="nav-item ${mobile?'mobile-nav-item':''} ${screen===id?'active':''}" data-action="nav" data-screen="${id}" ${screen===id?'aria-current="page"':''}>${mobile?'<span class="nav-icon">':''}${icon(glyph,24)}${mobile?'</span>':''}<span>${label}</span></button>`;}
// CP-012.2 (DEC-029): five content destinations; capture and Settings live in the header.
const NAV:[Screen,string,string][]=[['home','Home','home'],['vault','Vault','vault'],['portfolio','Experience','layers'],['competencies','Skills','target'],['profile','Profile','user']];
function plural(n:number,word:string):string{return `${n} ${word}${n===1?'':'s'}`;}
// CP-012.3: page titles and subtitles use Title Case; minor words (a, and, of, the, with…) stay lower case.
function screenMeta():{title:string;subtitle:string}{
  const stats=summarizeAchievements(achievements);
  switch(screen){
    case 'vault':return {title:'Achievement Vault',subtitle:achievements.length?[plural(stats.recorded,'Achievement'),plural(stats.drafts,'Draft'),...(stats.archived?[`${stats.archived} Archived`]:[])].join(' · '):'Your Record of Contributions and Results'};
    case 'portfolio':{const n=careerCollections?.projects.length??0,r=careerCollections?.roles.length??0;return {title:'Experience',subtitle:n||r?`${plural(r,'Role')} · ${plural(n,'Experience')}`:'Your Work, Grouped by Role'};}
    case 'competencies':{const s=careerCollections?skillExampleSummary(careerCollections):{withExamples:0,total:0};return {title:'Skills',subtitle:`${s.withExamples} of ${s.total} Skills with Examples`};}
    case 'profile':return {title:'Career Profile',subtitle:'Identity, Work History and Qualifications'};
    default:{const first=profile.displayName.trim().split(/\s+/)[0];return {title:'CareerProof',subtitle:first?`Welcome Back, ${first}`:'Record the Work. Prove the Impact.'};}
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
  return pwaUpdateReady?`<div id="pwa-update-notice" class="pwa-update-notice" role="status" aria-live="polite"><div><strong>New Version Ready</strong><p id="pwa-update-version">${escape(pwaUpdateMessage())}</p></div><div class="pwa-update-actions"><button class="button button-outline" data-action="export">${icon('download',16)} Back up first</button><button class="button button-primary" data-action="reload-update">Restart app</button></div></div>`:'';
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
      <main class="page" id="main-content">${screen==='portfolio'&&experienceId&&careerCollections?experiencePageView(careerCollections,experienceId):pageHeader()+(screen==='home'?homeView():screen==='vault'?vaultView():screen==='portfolio'&&careerCollections?timelinePage(careerCollections,experienceQuery,timelineOpen):screen==='competencies'&&careerCollections?competencyPage(careerCollections,skillQuery,skillCategory,skillShowArchived,currentSkillScope(),skillFiltersOpen):profileView())}</main>
    </div>
    <nav class="mobile-nav" aria-label="Mobile navigation">${NAV.map(([id,label,glyph])=>navButton(id,label,glyph,true)).join('')}</nav>
    <div id="modal-layer">${modalView()}</div>${modal?'':toastView()}
  </div>`;
}
/** CP-UX1: one compact row per achievement — full title, then date and where it happened. */
function contexts():Map<string,string>{return careerCollections?achievementContexts(careerCollections):new Map();}
function smallAchievement(a:Achievement,ctx:Map<string,string>=contexts()):string{return achievementRow(a,ctx.get(a.id));}
function metricCard(label:string,value:string,sub:string,tone=''):string{return `<div class="metric-card ${tone}"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-sub">${sub}</div></div>`;}
function exportAge():{days:number|null;stale:boolean}{
  if(!lastExportAt)return {days:null,stale:true};
  const days=Math.max(0,Math.floor((Date.now()-Date.parse(lastExportAt))/86_400_000));
  return {days,stale:days>14};
}
/** One deterministic, truthful next step. No scores and no invented targets. */
function nextAction():{label:string;title:string;text:string;button:string;attrs:string}{
  const stats=summarizeAchievements(achievements),age=exportAge();
  if(!achievements.length)return {label:'Start here',title:'Capture Your First Achievement',text:'One contribution you are proud of is enough to start. You can add details, metrics and evidence later.',button:'Capture achievement',attrs:'data-action="capture"'};
  const draft=achievements.filter(a=>a.status==='draft').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
  if(draft)return {label:'Next action',title:`Finish ${plural(stats.drafts,'Draft')}`,text:`“${draft.title}” is saved as a draft. Add what you did and when, then record it.`,button:'Open draft',attrs:`data-action="detail" data-id="${escape(draft.id)}"`};
  if(age.stale)return {label:'Protect your records',title:'Export a Backup',text:age.days===null?'No backup has been exported from this device yet. Your records live only here.':`The last export was generated ${plural(age.days,'day')} ago. Your records live only on this device.`,button:'Export backup',attrs:'data-action="export"'};
  if(!profile.headline)return {label:'Next action',title:'Add Your Professional Headline',text:'A one-line headline helps every record make sense later.',button:'Edit profile',attrs:'data-action="edit-profile"'};
  return {label:'Next action',title:'Capture a Recent Win',text:'Record it while the details are fresh, then link it to an experience or skill.',button:'New achievement',attrs:'data-action="capture"'};
}
function homeRecord(){return recordByMonth(achievements,localDate());}
/** The picked month, if it is still inside the window. */
function homeMonthIn(record:ReturnType<typeof homeRecord>):string|null{return homeMonth&&record.months.some(m=>m.key===homeMonth)?homeMonth:null;}
/** Home's list: Recent, or the achievements of the month picked on the timeline (DEC-038). */
function homeList(record=homeRecord()):string{
  const ctx=contexts(),month=record.months.find(m=>m.key===homeMonthIn(record));
  if(month){
    const rows=month.ids.map(id=>achievements.find(a=>a.id===id)).filter((a):a is Achievement=>Boolean(a));
    return monthListTitle(record,month)+(rows.length?`<section class="panel list-card" aria-labelledby="home-list-title"><div class="achievement-list">${rows.map(a=>smallAchievement(a,ctx)).join('')}</div></section>`:monthEmpty(month));
  }
  const recent=achievements.filter(a=>a.status!=='archived').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,4);
  return `<div class="section-title"><h2 id="home-list-title">Recent</h2><button class="text-action" data-action="nav" data-screen="vault">View all ${icon('arrow',16)}</button></div><section class="panel list-card" aria-labelledby="home-list-title"><div class="achievement-list">${recent.map(a=>smallAchievement(a,ctx)).join('')}</div></section>`;
}
/** Pick a month (or none) without redrawing the screen: the bars keep their place and only the list changes. */
function pickHomeMonth(key:string|null){
  const record=homeRecord();
  homeMonth=key&&record.months.some(m=>m.key===key)?key:null;
  document.querySelectorAll<HTMLElement>('.record-month').forEach(b=>{const on=b.dataset.month===homeMonth;b.classList.toggle('is-selected',on);b.setAttribute('aria-pressed',String(on));});
  const list=document.getElementById('home-list');if(!list)return;
  // The list is replaced; keep keyboard focus on the control that was used.
  const active=document.activeElement as HTMLElement|null,wasStep=active?.classList.contains('month-step')?active.dataset.step:null,inList=Boolean(active&&list.contains(active));
  list.innerHTML=homeList(record);
  if(!inList)return;
  const step=wasStep?list.querySelector<HTMLButtonElement>(`.month-step[data-step="${wasStep}"]:not(:disabled)`):null;
  const heading=list.querySelector<HTMLElement>('#home-list-title');
  if(step)step.focus({preventScroll:true});else if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
function homeView():string {
  const stats=summarizeAchievements(achievements),next=nextAction(),age=exportAge();
  const projects=careerCollections?.projects??[];
  const linkedProjects=new Set((careerCollections?.recordLinks??[]).filter(l=>l.linkType==='achievement-project').map(l=>l.targetId));
  const skills=careerCollections?skillExampleSummary(careerCollections):{withExamples:0,total:0};
  const recent=achievements.filter(a=>a.status!=='archived');
  const record=homeRecord();
  const quick=(label:string,glyph:string,attrs:string)=>`<button class="quick-action" ${attrs}>${icon(glyph,19)}<span>${label}</span></button>`;
  return `<section class="hero-card next-card" aria-labelledby="next-title"><div class="metric-label">${next.label}</div><h2 id="next-title">${escape(next.title)}</h2><p>${escape(next.text)}</p><button id="next-action-button" class="button button-light" ${next.attrs}>${next.button}</button></section>
  <section class="metric-grid" aria-label="Career record summary">
    ${metricCard('Recorded',String(stats.recorded),(stats.recorded===1?'achievement':'achievements')+(stats.drafts?` · ${plural(stats.drafts,'draft')}`:''))}
    ${metricCard('Experiences',String(projects.length),`${projects.filter(p=>linkedProjects.has(p.id)).length} with achievements`)}
    ${metricCard('Skills',String(skills.withExamples),`of ${skills.total} have examples`)}
    ${metricCard('Last export',age.days===null?'Never':age.days===0?'Today':`${plural(age.days,'day')} ago`,age.days===null?'no export from this device yet':'generated on this device',age.stale?'metric-warn':'')}
  </section>
  ${recordTimelineSection(record,homeMonthIn(record))}
  ${recent.length?`<div id="home-list">${homeList(record)}</div>`:''}
  ${careerCollections?homeGapsSection(careerCollections,localDate())+roleCoverageSection(careerCollections):''}
  <div class="section-title"><h2>Quick Capture</h2></div>
  <div class="quick-grid">${quick('Achievement','trophy','data-action="capture"')}${quick('Experience','layers','data-action="add-project"')}${quick('Employer','briefcase','data-action="add-career" data-kind="employers"')}${quick('Credential','badge','data-action="add-career" data-kind="credentials"')}</div>
  <p class="footer-note">${icon('lock',14)} Local-first: your records stay on this device. There is no account or sync, so export backups regularly.</p>`;
}
function emptyState(heading:string,body:string,button:string,action:string):string {return `<div class="empty-state"><div class="empty-illustration">${icon('vault',27)}</div><h3>${heading}</h3><p>${body}</p><button class="button button-primary" data-action="${action}">${icon('plus',17)} ${button}</button></div>`;}
/** Every filter except status, so the Recorded / Drafts / Archived counts reflect the same search. */
function matchesFilters(a:Achievement):boolean{
  const q=searchText.trim().toLocaleLowerCase();
  if(filterRole&&a.roleId!==filterRole)return false;
  const linked=careerCollections?.recordLinks??[];
  if(filterProject&&!linked.some(l=>l.linkType==='achievement-project'&&l.sourceId===a.id&&l.targetId===filterProject))return false;
  if(filterCompetency&&!linked.some(l=>l.linkType==='achievement-competency'&&l.sourceId===a.id&&l.targetId===filterCompetency))return false;
  if(filterDateStart&&(!a.occurredStart||dateBounds(a.occurredStart).latest<filterDateStart))return false;
  if(filterDateEnd&&(!a.occurredStart||dateBounds(a.occurredStart).earliest>filterDateEnd))return false;
  return !q||[a.title,a.contribution,a.situation,a.actions,a.outcome,a.notes,IMPACT_CATEGORIES[a.impactCategory]].join(' ').toLocaleLowerCase().includes(q);
}
function statusMatches(a:Achievement):boolean{return filterStatus==='all'||(filterStatus==='active'?a.status!=='archived':a.status===filterStatus);}
const dateKey=(a:Achievement)=>a.occurredStart?dateBounds(a.occurredStart).latest:'';
function filtered():Achievement[]{
  return achievements.filter(a=>statusMatches(a)&&matchesFilters(a))
    .sort((a,b)=>sortOrder==='oldest'?(dateKey(a)||'9999').localeCompare(dateKey(b)||'9999'):sortOrder==='updated'?b.updatedAt.localeCompare(a.updatedAt):dateKey(b).localeCompare(dateKey(a))||b.updatedAt.localeCompare(a.updatedAt));
}
/** CP-UX1: rows grouped under year headings when sorted by date. */
function vaultRows():string {
  const entries=filtered(),ctx=contexts();
  const narrowed=Boolean(searchText.trim()||filterRole||filterProject||filterCompetency||filterDateStart||filterDateEnd);
  if(!entries.length&&!narrowed){
    // An empty segment is not a failed search: say what is (not) there.
    const [title,text]=filterStatus==='draft'?['No Drafts','Anything saved as a draft appears here until it has what you did and a date.']
      :filterStatus==='archived'?['Nothing Archived','Archived achievements are kept here, out of your lists and counts.']
      :['Nothing Recorded Yet','Drafts move here once they have what you did and a date.'];
    return `<div class="no-results">${icon('vault',24)}<strong>${title}</strong><p>${text}</p></div>`;
  }
  if(!entries.length)return `<div class="no-results">${icon('search',24)}<strong>No matching achievements</strong><p>Try a different search or filter.</p><button class="text-action" data-action="clear-filters">Clear filters ${icon('arrow',15)}</button></div>`;
  if(sortOrder==='updated')return `<div class="panel list-card">${entries.map(a=>smallAchievement(a,ctx)).join('')}</div>`;
  const years:[string,Achievement[]][]=[];
  for(const a of entries){const y=achievementYear(a.occurredStart);const last=years[years.length-1];if(last&&last[0]===y)last[1].push(a);else years.push([y,[a]]);}
  return years.map(([y,list])=>`<h2 class="vault-year">${escape(y)}</h2><div class="panel list-card">${list.map(a=>smallAchievement(a,ctx)).join('')}</div>`).join('');
}
function vaultStatusSegments():string{
  const pool=achievements.filter(matchesFilters);
  const count=(s:AchievementStatus)=>pool.filter(a=>a.status===s).length;
  const segs:[string,string,number][]=[['recorded','Recorded',count('recorded')],['draft','Drafts',count('draft')]];
  const archived=count('archived');if(archived||filterStatus==='archived')segs.push(['archived','Archived',archived]);
  return segs.map(([value,label,n])=>`<button type="button" class="segment" data-action="vault-status" data-status="${value}" aria-pressed="${filterStatus===value}">${label} · ${n}</button>`).join('');
}
function advancedFilterCount():number{return [filterRole,filterProject,filterCompetency,filterDateStart,filterDateEnd,sortOrder!=='recent'?'sort':''].filter(Boolean).length;}
function filterToggleLabel():string{const n=advancedFilterCount();return `${icon('filter',17)}<span>Filters${n?` · ${n}`:''}</span>`;}
function refreshVaultResults(){const el=document.getElementById('vault-results');if(el)el.innerHTML=vaultRows();const seg=document.getElementById('vault-status');if(seg)seg.innerHTML=vaultStatusSegments();const toggle=document.getElementById('vault-filter-toggle');if(toggle)toggle.innerHTML=filterToggleLabel();}
function filterField(id:string,label:string,control:string):string{return `<div class="field"><label for="${id}">${label}</label>${control}</div>`;}
function vaultView():string {
  if(achievements.length===0)return `<section class="panel">${emptyState('Start Documenting Your Impact','Your vault is empty. Even one meaningful achievement is worth recording.','Add your first achievement','capture')}</section>`;
  const open=vaultFiltersOpen;
  return `<div id="vault-status" class="segmented vault-status" role="group" aria-label="Which achievements to show">${vaultStatusSegments()}</div>
  <div class="vault-toolbar"><label class="search-field">${icon('search',19)}<input id="vault-search" type="search" placeholder="Search achievements" value="${escape(searchText)}" autocomplete="off" aria-label="Search achievements"/></label><button id="vault-filter-toggle" class="button button-outline filter-toggle" data-action="toggle-vault-filters" aria-expanded="${open}" aria-controls="vault-filters">${filterToggleLabel()}</button></div>
    <div id="vault-filters" class="panel vault-advanced-filters" ${open?'':'hidden'}>
      ${filterField('sort-order','Sort',`<select id="sort-order"><option value="recent" ${sortOrder==='recent'?'selected':''}>Newest first</option><option value="oldest" ${sortOrder==='oldest'?'selected':''}>Oldest first</option><option value="updated" ${sortOrder==='updated'?'selected':''}>Last edited</option></select>`)}
      ${filterField('role-filter','Employment role',`<select id="role-filter"><option value="">All roles</option>${(careerCollections?.roles??[]).map(r=>`<option value="${escape(r.id)}" ${filterRole===r.id?'selected':''}>${escape(r.title)}</option>`).join('')}</select>`)}
      ${filterField('project-filter','Experience',`<select id="project-filter"><option value="">All experiences</option>${(careerCollections?.projects??[]).map(p=>`<option value="${escape(p.id)}" ${filterProject===p.id?'selected':''}>${escape(p.name)}</option>`).join('')}</select>`)}
      ${filterField('competency-filter','Skill',`<select id="competency-filter"><option value="">All skills</option>${(careerCollections?.competencies??[]).filter(c=>c.status==='active').map(c=>`<option value="${escape(c.id)}" ${filterCompetency===c.id?'selected':''}>${escape(c.name)}</option>`).join('')}</select>`)}
      ${filterField('date-start-filter','From date',`<input type="date" id="date-start-filter" value="${escape(filterDateStart)}"/>`)}
      ${filterField('date-end-filter','Through date',`<input type="date" id="date-end-filter" value="${escape(filterDateEnd)}"/>`)}
    </div><div id="vault-results" class="vault-results">${vaultRows()}</div>
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
  if(modal==='assessment'&&careerCollections){const skill=careerCollections.competencies.find(x=>x.id===selectedId);if(skill)content=proficiencyAssessmentForm(skill,localDate());}
  if(modal==='remove')content=removalView();
  if(modal==='settings')content=settingsView();
  if(modal==='restore')content=restoreView();
  return `<div class="modal-backdrop" data-action="backdrop"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" tabindex="-1" class="modal ${modal==='capture'?'capture-modal':''}">${content}</section></div>`;
}
function dialogHeader(title:string,subtitle:string):string {return `<div class="modal-header"><div><h2 id="dialog-title">${title}</h2><p id="dialog-description">${subtitle}</p></div><button class="icon-button close-dialog" data-action="close" aria-label="Close dialog">${icon('close',24)}</button></div>${toastView(true)}`;}
const stepText=(step:CaptureStep)=>`Step ${step} of 3`;
/** The role a new achievement or experience is offered first: the primary role, else the most recent current one. */
function defaultRoleId():string|null{
  const c=careerCollections;if(!c||!c.roles.length)return null;
  if(c.profiles[0]?.primaryRoleId&&c.roles.some(r=>r.id===c.profiles[0]!.primaryRoleId))return c.profiles[0]!.primaryRoleId;
  return [...c.roles].sort(compareRolesByRecency)[0]?.id??null;
}
/** CP-UX2 (DEC-037): a new achievement is captured in three steps; editing shows the same sections on one page. */
function achievementForm():string {
  const existing=editing&&selectedId?achievements.find(a=>a.id===selectedId):undefined;
  if(!careerCollections)return `${dialogHeader('Capture an Achievement','Your career records are still loading.')}<div class="modal-body"><p>Try again in a moment.</p></div>`;
  const o={existing,c:careerCollections,projectContext:existing?null:captureProjectId,mode:existing?'all' as const:'steps' as const,step:captureStep,defaultRoleId:defaultRoleId()};
  return dialogHeader(existing?'Edit Achievement':'Capture an Achievement',existing?'Update the details of your contribution.':stepText(captureStep))+captureForm(o)+captureFooter(o);
}
function openCapture(projectId:string|null){
  captureProjectId=projectId;
  const fromExperience=Boolean(projectId&&careerCollections?.projects.some(p=>p.id===projectId));
  // Started from an experience, or nothing to choose from yet: begin with "What happened?".
  captureStep=fromExperience||!careerCollections||!hasWhereChoices(careerCollections)?2:1;
  openModal('capture');
}
function captureFormEl():HTMLFormElement|null{return document.getElementById('achievement-form') as HTMLFormElement|null;}
function goToCaptureStep(step:CaptureStep){
  const form=captureFormEl();if(!form||!careerCollections)return;
  const forward=step>Number(form.dataset.step??'1');
  captureStep=step;syncWhere(form,careerCollections);
  const heading=showCaptureStep(form,step);
  slideStep(form.querySelector<HTMLElement>(`.capture-step[data-step="${step}"]`),forward);
  const description=document.getElementById('dialog-description');if(description)description.textContent=stepText(step);
  heading?.focus({preventScroll:true});
}
function captureNext(){
  const form=captureFormEl();if(!form)return;
  const step=Number(form.dataset.step) as CaptureStep;
  if(step===1&&!form.querySelector('input[name="where"]:checked'))return showError('Choose where this happened, or choose “Not part of an experience”.');
  if(step===2&&!form.querySelector<HTMLInputElement>('#title')?.value.trim())return showError('Add a title before you continue.');
  if(step<3)goToCaptureStep((step+1) as CaptureStep);
}
/** On a failed save in the step flow, return to the step that holds the problem. */
function captureStepFor(message:string):CaptureStep|null{
  const form=captureFormEl();if(!form||form.dataset.mode!=='steps')return null;
  return /title|contribution/i.test(message)?2:/date/i.test(message)?3:/metric|evidence|reference|numeric/i.test(message)?3:null;
}
function achievementDetail():string {
  const a=achievements.find(x=>x.id===selectedId);if(!a||!careerCollections)return `${dialogHeader('Achievement Unavailable','This entry might have been deleted.')}<div class="modal-body">Please reload your vault.</div>`;
  // CP-UX1: read as a story — Result, What I did, Context; the rest folds under More Details.
  const story=achievementStory(a,careerCollections);
  return dialogHeader(escape(story.title),escape(story.subtitle))+story.body+story.footer;
}
function profileForm():string {
  return `${dialogHeader('Edit Career Profile','Your professional introduction and contact details.')}
  <form id="profile-form" class="modal-body form-grid" novalidate><div id="form-error" class="form-error" role="alert" hidden></div>
    <div class="field"><label for="displayName">Display name <span class="optional">optional</span></label><input id="displayName" name="displayName" maxlength="120" value="${escape(profile.displayName)}" placeholder="Your professional name"/></div>
    <div class="field"><label for="headline">Professional headline</label><input id="headline" name="headline" maxlength="200" value="${escape(profile.headline)}" placeholder="e.g., Manufacturing Engineer & Technical Project Lead"/></div>
    <div class="field"><label for="summary">Professional summary</label><textarea id="summary" name="summary" rows="5" maxlength="10000" placeholder="Your background, specialization and professional goals">${escape(profile.summary)}</textarea></div>
    <div class="field-row"><div class="field"><label for="location">Location</label><input id="location" name="location" maxlength="150" value="${escape(profile.location)}" placeholder="City, country"/></div><div class="field"><label for="email">Professional email</label><input id="email" name="email" type="email" maxlength="254" value="${escape(profile.email)}" placeholder="you@example.com"/></div></div>
    <div class="form-guidance">${icon('shield',18)}<p>Profile information stays on this device. Only enter details you're comfortable storing locally.</p></div>
  </form><div class="modal-footer"><button class="button button-outline" data-action="close">Cancel</button><button class="button button-primary" data-action="save-profile">${icon('check',17)} Save profile</button></div>`;
}
function settingsView():string {
  return `${dialogHeader('Settings & Data','Your workspace preferences and data controls.')}
  <div class="modal-body settings-body"><div class="settings-group"><h3>Appearance</h3><div class="settings-line settings-line-stack"><div><strong>Theme</strong><p>System follows your phone's light or dark setting.</p></div><div class="segmented" role="radiogroup" aria-label="Color theme">${(['system','light','dark'] as const).map(value=>`<button type="button" class="segment" role="radio" aria-checked="${theme===value}" tabindex="${theme===value?0:-1}" data-action="set-theme" data-value="${value}">${capitalize(value)}</button>`).join('')}</div></div></div>
  <div class="settings-group"><h3>Data Management</h3><div class="settings-line"><div><strong>Export Career Backup</strong><p>Download all career records, relationships, taxonomy and preferences as an unencrypted JSON file (up to 12 MiB).</p></div><button id="export-backup" class="button button-outline" data-action="export">${icon('download',16)} Export</button></div><div class="settings-line"><div><strong>Data Health</strong><p>Read-only check that your records and backup format are intact, plus suggestions for what is worth completing or protecting. Nothing is changed, uploaded or scored.</p></div><button id="check-integrity" class="button button-outline" data-action="check-integrity">Check data</button></div><p id="integrity-check-result" class="integrity-check-result" role="status" aria-live="polite"></p><div id="data-health-report" class="data-health-report"></div><div class="settings-line"><div><strong>Restore from Backup</strong><p>Replace local records with a validated CareerProof backup.</p></div><button class="button button-outline" data-action="choose-restore">${icon('upload',16)} Restore</button></div><input id="restore-file" type="file" accept=".json,application/json" hidden/><p class="backup-note">${lastExportAt?`Last export generated: ${relativeDate(lastExportAt)}`:'No export generated from this browser yet.'} Your downloaded JSON is not encrypted. Keep it somewhere secure.</p></div>
  <div class="settings-group"><h3>Application</h3><div class="settings-line"><div><strong>CareerProof OS</strong><p>Local-first PWA · v${APP_VERSION} · Database schema ${SCHEMA_VERSION}</p></div>${icon('shield',20)}</div><div class="settings-line"><div><strong>Check for Updates</strong><p id="pwa-update-status">${pwaUpdateReady?'Update ready. Close Settings to back up or restart.':`Checks automatically each time you open CareerProof, without removing the app or your records. ${lastCheckedText()}`}</p></div><button class="button button-outline" data-action="check-updates">Check now</button></div><div class="form-guidance">${icon('info',18)}<p>Closing this app does not delete saved records, but browser data may be cleared or lost. This version has no cloud sync; export backups regularly.</p></div></div></div>`;
}
function removalView():string{
  if(!removal||!careerCollections)return '';
  try{
    const impact=removalImpact(careerCollections,removal.kind,removal.id);
    const view=removalContent(impact,removal);
    return dialogHeader(escape(view.title),escape(view.subtitle))+view.body+view.footer;
  }catch(err){return `${dialogHeader('Record Unavailable','It may have been changed or deleted elsewhere.')}<div class="modal-body"><p>${escape(errorMessage(err))}</p></div>`;}
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
    // CP-UX1: deleting the experience whose page is open returns to the timeline.
    if(removal.kind==='projects'&&experienceId===removal.id){experienceId=null;history.replaceState(null,'','#/portfolio');}
    closeModal(true);notify(plan.summary);
  }catch(err){showError(errorMessage(err));}finally{setSaving(false);}
}
function restoreView():string {
  if(!pendingBackup)return '';
  const m=pendingBackup.backup.manifest;
  return `${dialogHeader('Restore Career Data','Review the backup before replacing your local records.')}<div class="modal-body"><div class="restore-warning">${icon('alert',20)}<div><strong>This Replaces Your Current Data</strong><p>Every local career collection and portable preference will be replaced. Export your current data before proceeding.</p>${pendingBackup.sourceFormat===2?'<p><strong>Older format-2 backup:</strong> this file predates proficiency history. Restoring it replaces local data and removes any newer self-assessments. Export your current data first.</p>':''}${pendingBackup.legacy?'<p><strong>Legacy format-1 backup:</strong> employers, roles, qualifications, projects, metrics, evidence, custom competencies and links currently stored here will be removed. This file restores its profile and achievements and the 32 built-in competencies. Theme resets to System. Any proficiency assessments will also be removed.</p>':''}</div></div><div class="restore-preview"><p><span>Backup created</span><strong>${relativeDate(m.exportedAt)}</strong></p><p><span>Achievements</span><strong>${m.counts.achievements}</strong></p>${P0_STORES.filter(s=>s!=='achievements').map(s=>`<p><span>${collectionLabels[s]}</span><strong>${m.counts[s]}</strong></p>`).join('')}<p><span>Schema</span><strong>${m.schemaVersion}</strong></p></div><div class="form-guidance">${icon('shield',17)}<p>This backup passed initial structure and record validation. Its contents are not independently verified.</p></div></div><div class="modal-footer"><button class="button button-outline" data-action="settings">Cancel</button><button class="button button-danger" data-action="confirm-restore">Replace local data</button></div>`;
}
let lastRenderedScreen:Screen|null=null;
let lastRenderedExperience:string|null=null;
let lastRenderedModal:Modal=null;
let modalOpenedAt=0;
/** Keep expanded Experience cards and skill entries open when the same screen redraws (e.g. after a dialog closes). */
// Expanded cards (any details[data-keep-open]) stay open when the same screen re-renders, e.g. after a dialog closes.
function openDisclosureKeys():string[]{return lastRenderedScreen===screen?[...root.querySelectorAll<HTMLDetailsElement>('details[open][data-keep-open]')].map(d=>d.dataset.keepOpen??''):[];}
function restoreDisclosures(keys:string[]){if(!keys.length)return;const all=[...root.querySelectorAll<HTMLDetailsElement>('details[data-keep-open]')];for(const key of keys){const el=all.find(d=>d.dataset.keepOpen===key);if(el)el.open=true;}}
function render(preserveFocus=false):void {const focusId=preserveFocus?(document.activeElement as HTMLElement|null)?.id:'';const openKeys=openDisclosureKeys();
  // CP-UX-Fluid (DEC-038): motion follows changes, not redraws.
  const firstRender=lastRenderedScreen===null,moved=!firstRender&&(lastRenderedScreen!==screen||lastRenderedExperience!==experienceId);
  const bars=firstRender||moved?null:snapshotBars(root),opening=Boolean(modal)&&!lastRenderedModal;
  const move:ScreenMove=experienceId&&experienceId!==lastRenderedExperience?'forward':!experienceId&&lastRenderedExperience&&screen==='portfolio'?'back':'tab';
  root.classList.remove('app-loading');root.innerHTML=shell()+pwaUpdateNotice();restoreDisclosures(openKeys);lastRenderedScreen=screen;lastRenderedExperience=experienceId;lastRenderedModal=modal;dialogs.update(Boolean(modal));
  const main=document.getElementById('main-content');
  if(opening){modalOpenedAt=Date.now();enterSheet(root);}
  if(moved)enterScreen(main,move);
  if(main)animateBars(main,bars,!bars);
  if(pendingGlow&&!modal&&main){glowRecord(main,pendingGlow);pendingGlow=null;}syncCareerDisclosures(root);if(modal==='project'){const form=document.getElementById('portfolio-form') as HTMLFormElement|null;if(form)updatePortfolioRoleChoices(form);}if(modal==='capture'){const form=captureFormEl();if(form&&careerCollections)syncWhere(form,careerCollections);}
  if(focusId){document.getElementById(focusId)?.focus({preventScroll:true});}else if(modal){dialogs.focusFirst();}
}
function toastBody():string{return toastMessage?`${icon(toastKind==='success'?'check':'alert',20)}${toastDetail?`<span class="toast-text"><strong>${escape(toastMessage)}</strong><small>${escape(toastDetail)}</small></span>`:`<span>${escape(toastMessage)}</span>`}`:'';}
function toastView(inDialog=false):string{return `<div id="toast" role="status" aria-live="polite" class="toast ${inDialog?'toast-in-dialog':''} ${toastMessage?'visible':''} toast-${toastKind}">${toastBody()}</div>`;}
/** A short message; `detail` adds a second, quieter line (CP-UX-Fluid). The toast eases in when it appears, not on later redraws. */
function notify(message:string,kind:'success'|'error'='success',detail=''){toastMessage=message;toastKind=kind;toastDetail=detail;window.clearTimeout(toastTimer);const el=document.getElementById('toast');if(el){el.innerHTML=toastBody();el.classList.add('visible');el.classList.toggle('toast-error',kind==='error');el.classList.toggle('toast-success',kind==='success');if(motionAllowed()&&!el.classList.contains('toast-in-dialog')){el.classList.remove('toast-enter');void el.offsetWidth;el.classList.add('toast-enter');}}toastTimer=window.setTimeout(()=>{toastMessage='';toastDetail='';document.getElementById('toast')?.classList.remove('visible');},kind==='error'?10000:detail?6500:5000);}
function openModal(kind:Modal,id:string|null=null,edit=false){if(!modal)dialogs.rememberInvoker();modal=kind;selectedId=id;editing=edit;isDirty=false;render();}
function closeModal(force=false){if(saving&&!force)return;if(!force&&isDirty&& !window.confirm('You have unsaved changes. Discard them?'))return;modal=null;selectedId=null;editing=false;pendingBackup=null;isDirty=false;captureProjectId=null;removal=null;render();dialogs.restoreFocus();}
function showError(message:string){
  const el=document.getElementById('form-error');
  if(!el){notify(message,'error');return;}
  el.hidden=false;
  el.textContent=message;
  // CP-012D.2: focus the error summary so keyboard and screen-reader users
  // encounter the reason for a failed save. Do not auto-focus a mobile input
  // and unexpectedly summon the iOS keyboard.
  el.tabIndex=-1;
  el.focus({preventScroll:true});
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({block:'nearest',behavior:reduced?'auto':'smooth'});
}
function setSaving(value:boolean){saving=value;const dialog=document.querySelector<HTMLElement>('.modal');dialog?.setAttribute('aria-busy',String(value));for(const button of dialog?.querySelectorAll<HTMLButtonElement>('button[data-action]')??[])button.disabled=value;}
function readAchieveInput(status:'draft'|'recorded') {
  const form=document.getElementById('achievement-form') as HTMLFormElement|null;
  if(!form)throw new Error('Achievement form not available');const values=new FormData(form);
  // CP-UX2: a draft saved before "When did it happen?" was shown gets no date, rather than the pre-filled month.
  const occurredOn=form.dataset.mode==='steps'&&form.dataset.reachedWhen!=='true'?'':String(values.get('occurredOn')??'');
  return {title:String(values.get('title')??'').trim(),contribution:String(values.get('contribution')??'').trim(),occurredOn,status,outcome:String(values.get('outcome')??'').trim(),impactCategory:String(values.get('impactCategory')??'')};
}
async function saveAchievementForm(status:'draft'|'recorded'){
  if(saving)return;setSaving(true);
  try{const input=readAchieveInput(status);const errors=validateAchievementInput(input);if(errors.length){failCapture(errors.join(' '));return;}
    const existing=editing&&selectedId?achievements.find(x=>x.id===selectedId):undefined;
    if(!careerCollections)throw new ValidationError('Career records are unavailable.');
    const form=document.getElementById('achievement-form') as HTMLFormElement;
    const rich=parseRichFields(form);
    const roleId=captureRole(rich,existing,input.occurredOn,form.dataset.initialWhere??'');
    const record=await database.saveAchievementBundle({
      id:existing?.id??crypto.randomUUID(),revision:existing?.revision??0,
      title:input.title,contribution:input.contribution,occurredOn:input.occurredOn,
      status,preArchiveStatus:existing?.status==='archived'?null:existing?.preArchiveStatus??null,
      outcome:input.outcome,impactCategory:input.impactCategory as Achievement['impactCategory'],
      roleId,situation:rich.situation,actions:rich.actions,notes:rich.notes,
      confidentiality:rich.confidentiality
    },rich.projectIds,rich.primaryProjectId,rich.competencyIds,rich.metrics,rich.references,rich.newExperiences);
    achievements=await listAchievements();await loadCareerCollections();
    // CP-UX-Fluid: say what the save did, then light up the record where it now appears.
    const saved=achievements.find(a=>a.id===record.id)??record;
    const message=savedMessage(careerCollections!,saved,existing?.status??null);
    if(homeMonth&&saved.occurredStart?.value.slice(0,7)!==homeMonth)homeMonth=null;
    pendingGlow=saved.id;closeModal(true);notify(message.title+'.','success',message.detail);
  }catch(err){failCapture(errorMessage(err));}finally{setSaving(false);}
}
function failCapture(message:string){const step=captureStepFor(message);if(step&&step!==captureStep)goToCaptureStep(step);showError(message);}
/**
 * CP-UX2: the achievement's role. "Not part of an experience" uses the chosen
 * role; a new experience uses the role picked with it; an experience gives its
 * role (by date when it spans several). An edit that keeps the same Where
 * choice keeps the role already stored.
 */
function captureRole(rich:ReturnType<typeof parseRichFields>,existing:Achievement|undefined,occurredOn:string,initialWhere:string):string|null{
  const where=rich.where;
  if(where===ROLE_ONLY)return rich.roleSelect;
  if(rich.newExperiences.some(x=>x.id===where))return rich.whereRoleId;
  if(!where||(existing&&where===initialWhere))return existing?.roleId??null;
  const role=careerCollections?roleForExperience(careerCollections,where,occurredOn?precisionDateFromInput(occurredOn):null):null;
  return role?.id??existing?.roleId??null;
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
/** CP-012.4: link a new (or same-named existing) experience from the achievement form. */
function addInlineExperienceFromForm(){
  const form=document.getElementById('achievement-form') as HTMLFormElement|null;
  if(!form||!careerCollections)return;
  if(!addInlineExperience(form,careerCollections.projects))return;
  syncWhere(form,careerCollections);isDirty=true;
  // Collapse the mini form; the status line announces what was linked.
  const panel=document.getElementById('inline-experience-panel'),toggle=form.querySelector<HTMLElement>('[data-action=toggle-inline-experience]');
  if(panel)panel.hidden=true;
  if(toggle){toggle.setAttribute('aria-expanded','false');toggle.focus();}
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
    // CP-UX1: a new experience added from the Experience tab opens its page, ready for its first achievement.
    if(!prior&&screen==='portfolio')openExperience(input.record.id);else closeModal(true);
    notify('Experience saved.');
  }catch(err){showError(errorMessage(err));}finally{setSaving(false);}
}
async function saveProficiencyForm(){
  if(saving||!careerCollections)return;
  setSaving(true);
  try{
    const skill=careerCollections.competencies.find(x=>x.id===selectedId);
    if(!skill)throw new ValidationError('Selected competency is unavailable.');
    const form=document.getElementById('proficiency-form') as HTMLFormElement|null;
    if(!form)throw new ValidationError('Proficiency form is unavailable.');
    await database.saveProficiencyAssessment(readProficiencyForm(form,skill.id));
    await loadCareerCollections();closeModal(true);notify('Self-assessment saved to your history.');
  }catch(err){showError(errorMessage(err));}finally{setSaving(false);}
}
function currentSkillScope():SkillScope{return skillScope??(careerCollections?defaultSkillScope(careerCollections):'all');}
function refreshCompetencies(){
  const target=document.querySelector<HTMLElement>('.skill-groups');
  if(target&&careerCollections)target.innerHTML=competencyGroups(careerCollections,skillQuery,skillCategory,skillShowArchived,currentSkillScope());
  const toggle=document.getElementById('skill-filter-toggle');if(toggle)toggle.innerHTML=skillFilterLabel(skillCategory,skillShowArchived);
}
function refreshTimeline(){
  const target=document.getElementById('timeline-groups');
  if(target&&careerCollections)target.innerHTML=timelineGroups(careerCollections,experienceQuery,timelineOpen);
}
/** CP-UX1: open one experience as its own page (#/portfolio/<id>), or go back to the timeline. */
function openExperience(id:string|null){
  if(modal)closeModal(true);
  screen='portfolio';experienceId=id;location.hash=id?`/portfolio/${encodeURIComponent(id)}`:'/portfolio';render();window.scrollTo(0,0);
  const heading=document.querySelector<HTMLElement>('#main-content h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
/** Open the exact existing Skill record; this is navigation, not assessment or record editing. */
function openLinkedSkill(id:string){
  const skill=careerCollections?.competencies.find(s=>s.id===id);
  if(!skill)return;
  skillQuery=skill.name;skillCategory='';skillScope='all';skillShowArchived=skill.status==='archived';
  navigate('competencies');
  const entry=[...document.querySelectorAll<HTMLDetailsElement>('details.skill-entry')].find(el=>el.dataset.skill===id);
  if(!entry)return;
  entry.open=true;
  entry.querySelector<HTMLElement>('summary')?.focus({preventScroll:true});
  entry.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
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
function navigate(to:Screen){if(modal)closeModal(true);if(to!==screen)homeMonth=null;screen=to;experienceId=null;location.hash=`/${to}`;render();window.scrollTo(0,0);const heading=document.querySelector<HTMLElement>('#main-content h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
function focusables():HTMLElement[]{return Array.from(document.querySelectorAll<HTMLElement>('.modal button:not([disabled]),.modal input:not([disabled]):not([type="hidden"]),.modal textarea:not([disabled]),.modal select:not([disabled])')).filter(x=>x.offsetParent!==null);}
function runAction(node:HTMLElement){
  const action=node.dataset.action;switch(action){
    case 'nav':navigate(node.dataset.screen as Screen);break;
    case 'capture':openCapture(null);break;
    case 'add-competency':openModal('competency');break;
    case 'edit-competency':openModal('competency',node.dataset.id??null,true);break;
    case 'save-competency':void saveCustomSkill();break;
    case 'assess-competency':openModal('assessment',node.dataset.id??null);break;
    case 'save-proficiency':void saveProficiencyForm();break;
    case 'archive-competency':void changeCustomSkillStatus(node.dataset.id??'','archived');break;
    case 'restore-competency':void changeCustomSkillStatus(node.dataset.id??'','active');break;
    case 'competency-achievement':openModal('detail',node.dataset.id??null);break;
    case 'capture-next':captureNext();break;
    case 'capture-back':{const step=Number(captureFormEl()?.dataset.step??'1');if(step>1)goToCaptureStep((step-1) as CaptureStep);break;}
    case 'where-show-all':{const form=captureFormEl();if(!form)break;form.dataset.whereAll='true';filterWhere(form);node.setAttribute('aria-expanded','true');form.querySelector<HTMLInputElement>('.where-options input:checked, .where-options input')?.focus();break;}
    case 'find-skill':{
      const form=captureFormEl(),field=document.getElementById('skill-search-field');if(!form||!field)break;
      field.hidden=false;node.setAttribute('aria-expanded','true');node.hidden=true;filterSkills(form);document.getElementById('skill-search')?.focus();break;
    }
    case 'toggle-capture-extra':{
      const target=document.getElementById(node.getAttribute('aria-controls')??'');if(!target)break;
      target.hidden=!target.hidden;node.setAttribute('aria-expanded',String(!target.hidden));
      if(target.id==='capture-situation'){node.hidden=true;target.querySelector<HTMLElement>('textarea')?.focus();}
      // Opening an empty metrics or evidence section starts its first row.
      if(!target.hidden&&target.id==='capture-metrics'&&!target.querySelector('.metric-row')){document.getElementById('rich-metrics')?.insertAdjacentHTML('beforeend',metricRow());isDirty=true;}
      if(!target.hidden&&target.id==='capture-evidence'&&!target.querySelector('.evidence-row')){document.getElementById('rich-evidence')?.insertAdjacentHTML('beforeend',evidenceRow());isDirty=true;}
      break;
    }
    case 'add-rich-metric':document.getElementById('rich-metrics')?.insertAdjacentHTML('beforeend',metricRow());isDirty=true;break;
    case 'add-rich-evidence':document.getElementById('rich-evidence')?.insertAdjacentHTML('beforeend',evidenceRow());isDirty=true;break;
    case 'remove-rich-row':node.closest('.rich-row')?.remove();isDirty=true;break;
    case 'toggle-inline-experience':{
      const panel=document.getElementById('inline-experience-panel');
      if(!panel)return;
      panel.hidden=!panel.hidden;node.setAttribute('aria-expanded',String(!panel.hidden));
      if(!panel.hidden)document.getElementById('inline-experience-name')?.focus();
      break;
    }
    case 'add-inline-experience':addInlineExperienceFromForm();break;
    case 'add-project':openModal('project');break;
    case 'edit-project':openModal('project',node.dataset.id??null,true);break;
    case 'save-project':void saveProjectForm();break;
    case 'remove-project':openRemoval('projects',node.dataset.id??'');break;
    case 'delete-competency':openRemoval('competencies',node.dataset.id??'');break;
    case 'confirm-removal':void confirmRemoval();break;
    case 'portfolio-achievement':openModal('detail',node.dataset.id??null);break;
    case 'open-experience':openExperience(node.dataset.id??null);break;
    case 'open-skill':openLinkedSkill(node.dataset.id??'');break;
    case 'close-experience':openExperience(null);break;
    case 'vault-status':filterStatus=node.dataset.status??'recorded';refreshVaultResults();break;
    case 'project-capture':openCapture(node.dataset.id??null);break;
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
    // Only a direct tap on the dimmed page closes a sheet — and not while the sheet is still rising,
    // when the dimmed area briefly covers where the sheet is about to be.
    case 'backdrop':if(node.classList.contains('modal-backdrop')&&!(node.classList.contains('is-entering')&&Date.now()-modalOpenedAt<450))closeModal();break;
    case 'home-month':if(node.dataset.month)pickHomeMonth(node.dataset.month);break;
    case 'home-month-clear':pickHomeMonth(null);break;
    case 'detail':openModal('detail',node.dataset.id??null);break;
    case 'edit-achievement':openModal('capture',selectedId,true);break;
    case 'save-achievement':void saveAchievementForm(node.dataset.status as 'draft'|'recorded');break;
    case 'save-profile':void saveProfileForm();break;
    case 'toggle-archive':void toggleArchive();break;
    case 'delete-achievement':void deleteCurrent();break;
    case 'export':void doExport();break;
    case 'check-integrity':void doIntegrityCheck();break;
    case 'open-data-health':openModal('settings');document.getElementById('check-integrity')?.scrollIntoView({block:'center'});void doIntegrityCheck();break;
    case 'role-achievements':{
      // CP-012C: a role row on Home opens exactly that role's achievements.
      // CP-UX1: on the Recorded segment, or on Drafts when the role has only drafts.
      const roleId=node.dataset.id??'';
      searchText='';filterStatus=achievements.some(a=>a.roleId===roleId&&a.status==='recorded')?'recorded':'draft';sortOrder='recent';filterRole=roleId;filterProject='';filterCompetency='';filterDateStart='';filterDateEnd='';
      vaultFiltersOpen=true;navigate('vault');break;
    }
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
    case 'clear-filters':searchText='';filterStatus='recorded';sortOrder='recent';filterRole='';filterProject='';filterCompetency='';filterDateStart='';filterDateEnd='';render();break;
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
    case 'toggle-skill-filters':{
      skillFiltersOpen=!skillFiltersOpen;
      const panel=document.getElementById('skill-filters');if(panel)panel.hidden=!skillFiltersOpen;
      node.setAttribute('aria-expanded',String(skillFiltersOpen));
      break;
    }
    case 'skill-scope':
      skillScope=node.dataset.scope==='linked'?'linked':'all';
      document.querySelectorAll<HTMLElement>('[data-action="skill-scope"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===skillScope)));
      refreshCompetencies();
      break;
    case 'set-theme':{
      const value=node.dataset.value??'system';
      void setTheme(value).then(()=>document.querySelectorAll<HTMLElement>('[data-action="set-theme"]').forEach(b=>{
        const selected=b.dataset.value===theme;
        b.setAttribute('aria-checked',String(selected));
        b.tabIndex=selected?0:-1;
      }));
      break;
    }
  }
}
document.addEventListener('click',e=>{
  if(!(e.target instanceof Element))return;
  const actionTarget=resolveActionTarget(e.target);
  if(actionTarget)runAction(actionTarget);
});
document.addEventListener('input',e=>{const t=e.target as HTMLElement;
  // CP-UX2: searching the capture lists is not a change to the record.
  if(t.id==='where-search'||t.id==='skill-search'){const form=captureFormEl();if(form){if(t.id==='where-search')filterWhere(form);else filterSkills(form);}return;}
  if(t.id==='title'&&t.closest('#achievement-form')){const count=document.getElementById('title-count');if(count)count.textContent=`${(t as HTMLInputElement).value.length} / 160`;}
  if(t.closest('#achievement-form, #profile-form, #career-form,#portfolio-form,#competency-form,#proficiency-form'))isDirty=true;if(t.id==='experience-search'){experienceQuery=(t as HTMLInputElement).value;refreshTimeline();}if(t.id==='competency-search'){skillQuery=(t as HTMLInputElement).value;refreshCompetencies();}if(t.id==='vault-search'){searchText=(t as HTMLInputElement).value;refreshVaultResults();}});
document.addEventListener('change',e=>{const t=e.target as HTMLInputElement|HTMLSelectElement;if(t.id==='competency-category'){skillCategory=t.value;refreshCompetencies();}
  if(removal&&t.closest('#removal-form')){
    if(t.name==='removal-mode')removal.mode=t.value==='move'?'move':'unlink';
    if(t.id==='removal-target')removal.targetId=t.value;
    if(t.id==='removal-confirm')removal.confirmed=(t as HTMLInputElement).checked;
    if(removal.mode==='move'&&!removal.targetId&&careerCollections)removal.targetId=removalImpact(careerCollections,removal.kind,removal.id).targets[0]?.id??'';
    render(true);return;
  }
  if(t.name==='where'||t.id==='capture-roleId'){const form=t.closest('form');if(form&&careerCollections)syncWhere(form,careerCollections);isDirty=true;}
  if(t.id==='role-filter'){filterRole=t.value;refreshVaultResults();}
  if(t.id==='project-filter'){filterProject=t.value;refreshVaultResults();}
  if(t.id==='competency-filter'){filterCompetency=t.value;refreshVaultResults();}
  if(t.id==='date-start-filter'){filterDateStart=t.value;refreshVaultResults();}
  if(t.id==='date-end-filter'){filterDateEnd=t.value;refreshVaultResults();}
  if(t.name==='occurredPrecision'){switchOccurrencePrecision(t.value as Precision);isDirty=true;}
  if(t.id==='portfolio-employerId'){const form=t.closest('form');if(form)updatePortfolioRoleChoices(form);}if(t.dataset.action==='portfolio-date-precision'){const target=t.dataset.target??'';const input=document.getElementById('portfolio-'+target) as HTMLInputElement|null;if(input){input.type=t.value==='year'?'text':t.value==='month'?'month':'date';input.value='';input.placeholder=t.value==='year'?'YYYY':'';input.inputMode=t.value==='year'?'numeric':'';input.maxLength=t.value==='year'?4:524288;}}if(t.id==='sort-order'){sortOrder=t.value;refreshVaultResults();}if(t.id==='restore-file'&&t instanceof HTMLInputElement&&t.files?.[0]){void doFileRestore(t.files[0]);}if(t.dataset.action==='career-date-precision'){
    const target=t.dataset.target??'';
    const input=document.getElementById('career-'+target) as HTMLInputElement|null;
    if(input){input.type=t.value==='year'?'text':t.value==='month'?'month':'date';input.value='';input.placeholder=t.value==='year'?'YYYY':'';input.inputMode=t.value==='year'?'numeric':'';input.maxLength=t.value==='year'?4:524288;}
  }
  if(t.id==='career-isCurrent'&&t instanceof HTMLInputElement&&t.checked){
    const end=document.getElementById('career-endDate') as HTMLInputElement|null;if(end)end.value='';
  }
  if(t.closest('#achievement-form,#profile-form,#career-form,#portfolio-form,#competency-form,#proficiency-form'))isDirty=true;});
document.addEventListener('submit',e=>{if((e.target as HTMLElement).id==='achievement-form'){e.preventDefault();const f=e.target as HTMLFormElement;if(f.dataset.mode==='steps'&&f.dataset.step!=='3')captureNext();else void saveAchievementForm('recorded');}if((e.target as HTMLElement).id==='profile-form'){e.preventDefault();void saveProfileForm();}if((e.target as HTMLElement).id==='career-form'){e.preventDefault();void saveCareerForm();}if((e.target as HTMLElement).id==='portfolio-form'){e.preventDefault();void saveProjectForm();}if((e.target as HTMLElement).id==='competency-form'){e.preventDefault();void saveCustomSkill();}if((e.target as HTMLElement).id==='proficiency-form'){e.preventDefault();void saveProficiencyForm();}});
document.addEventListener('keydown',e=>{
  if(!modal)return;
  // A native radiogroup changes selection with arrow keys, not repeated Tab.
  // The Settings theme buttons are custom radios and require that behavior.
  const radio=e.target instanceof HTMLElement?e.target.closest<HTMLButtonElement>('[data-action="set-theme"][role="radio"]'):null;
  if(radio&&e.target===radio){
    const buttons=Array.from(radio.closest('[role="radiogroup"]')?.querySelectorAll<HTMLButtonElement>('button[role="radio"]')??[]);
    const index=buttons.indexOf(radio);
    const direction=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;
    const next=direction?(index+direction+buttons.length)%buttons.length:e.key==='Home'?0:e.key==='End'?buttons.length-1:-1;
    if(next>=0){e.preventDefault();buttons[next]?.focus();buttons[next]?.click();return;}
  }
  if(e.key==='Enter'&&(e.target as HTMLElement|null)?.id==='inline-experience-name'){e.preventDefault();addInlineExperienceFromForm();return;}
  if(e.key==='Enter'&&['where-search','skill-search'].includes((e.target as HTMLElement|null)?.id??'')){e.preventDefault();return;}if(e.key==='Escape'){e.preventDefault();closeModal();}if(e.key==='Tab'){const elements=focusables();if(!elements.length)return;const first=elements[0]!,last=elements[elements.length-1]!;if(!document.activeElement?.closest('.modal')){e.preventDefault();(e.shiftKey?last:first).focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
document.addEventListener('toggle',e=>{
  const d=e.target;if(!(d instanceof HTMLDetailsElement)||!d.classList.contains('role-group'))return;
  // CP-UX1: the timeline keeps the groups you opened or closed while you move between pages.
  if(!timelineOpen)timelineOpen=new Set([...document.querySelectorAll<HTMLDetailsElement>('details.role-group')].filter(x=>x.open).map(x=>x.dataset.keepOpen??''));
  const key=d.dataset.keepOpen??'';if(d.open)timelineOpen.add(key);else timelineOpen.delete(key);
},true);
window.addEventListener('resize',()=>syncCareerDisclosures(root),{passive:true});
// CP-UX-Fluid: on Home's timeline a finger can slide across the months, like a chart in Health.
// A tap still lands as a click on its month; sliding picks whichever month is under the finger.
// Scrolling the page past the chart never picks a month: sliding must start sideways.
let monthScrub:{id:number;x:number;y:number;sliding:boolean}|null=null;
document.addEventListener('pointerdown',e=>{monthScrub=e.target instanceof Element&&e.target.closest('.record-chart')?{id:e.pointerId,x:e.clientX,y:e.clientY,sliding:false}:null;});
document.addEventListener('pointermove',e=>{
  if(!monthScrub||monthScrub.id!==e.pointerId)return;
  if(!monthScrub.sliding){const dx=Math.abs(e.clientX-monthScrub.x),dy=Math.abs(e.clientY-monthScrub.y);if(dx<10||dx<dy)return;monthScrub.sliding=true;}
  const month=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('.record-month');
  if(month?.dataset.month&&month.dataset.month!==homeMonth)pickHomeMonth(month.dataset.month);
});
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,()=>{monthScrub=null;});
window.addEventListener('hashchange',()=>{const next=currentNav(),exp=hashExperience();if(next===screen&&exp===experienceId)return;screen=next;experienceId=exp;if(!modal)render();});
function renderStartupError(err:unknown){root.classList.remove('app-loading');root.innerHTML=`<div class="startup-error"><div>${icon('alert',32)}</div><h1>CareerProof Couldn't Open Your Local Database</h1><p>${escape(errorMessage(err))}</p><p>Your existing data has not been intentionally deleted. Try closing other tabs, checking browser storage permissions, and reopening this page.</p><button onclick="location.reload()" class="button button-primary">Retry</button></div>`;}
async function start(){try{
  dialogs.trackViewport();enableTouchFeedback();
  applyTheme();await initialize();const prefs=await getMeta('preferences') as {theme:string};const savedTheme=localStorage.getItem('careerproof-theme');theme=savedTheme&&['system','light','dark'].includes(savedTheme)?savedTheme:prefs.theme;await setMeta('preferences',{theme});applyTheme();[profile,achievements,lastExportAt]=await Promise.all([getProfile(),listAchievements(),getMeta('lastExportAt') as Promise<string|null>]);await loadCareerCollections();screen=currentNav();experienceId=hashExperience();render();
  configurePwaUpdates();
}catch(err){renderStartupError(err);}}
void start();
