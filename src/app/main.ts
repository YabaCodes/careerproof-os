import { type AchievementView as Achievement, type Profile, type AchievementStatus, type P0Store, type CareerCollections, IMPACT_CATEGORIES, APP_VERSION, SCHEMA_VERSION, P0_STORES, localDate, PROFILE_ID } from '../domain/models.js';
import { validateAchievementInput, validateProfileInput, summarizeAchievements, ValidationError } from '../domain/validation.js';
import { initialize, getProfile, saveProfile, listAchievements, getAchievement, saveAchievement, removeAchievement, getMeta, setMeta, database } from '../data/db.js';
import { careerSections, careerForm, readCareerForm, dependentCareerRecords, syncCareerDisclosures, toggleCareerDisclosure, type CareerKind, type CareerRecord } from '../ui/careerHistory.js';
import { createBackup, downloadBackup, parseBackupFile, restoreBackup, type PreparedBackup } from '../data/backup.js';
import { formatPrecisionDate } from '../domain/dates.js';
import {icon} from '../ui/icons.js';
import { resolveActionTarget } from '../ui/actionRouting.js';
import { DialogController } from '../ui/dialog.js';

type Screen='home'|'vault'|'profile';
type Modal='capture'|'detail'|'profile'|'settings'|'restore'|'career'|null;
const root=document.getElementById('app')!;
let profile:Profile;
let achievements:Achievement[]=[];
let careerCollections:CareerCollections|null=null;
let careerKind:CareerKind='employers';
let careerEmployerId:string|undefined;
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
let sortOrder='recent';
let theme=localStorage.getItem('careerproof-theme')||'system';
let lastExportAt:string|null=null;
let pwaUpdateReady=false;
let pwaRegistration:ServiceWorkerRegistration|null=null;
let pwaLastCheck=0;
let pwaHadController=false;
let toastTimer:number|undefined;
let toastMessage='';
let toastKind:'success'|'error'='success';
const collectionLabels:Record<P0Store,string>={profiles:'Career profiles',employers:'Employers',roles:'Roles',education:'Education',credentials:'Credentials',projects:'Projects',achievements:'Achievements',impactMetrics:'Impact metrics',competencyCategories:'Competency categories',competencies:'Competencies',evidenceReferences:'Evidence references',recordLinks:'Relationships'};

function escape(value:unknown):string {return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));}
const formatDate=formatPrecisionDate;
function relativeDate(v:string):string {if(!v)return 'Never';return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(v));}
function titleCase(v:string):string {return v.charAt(0).toUpperCase()+v.slice(1);}
function statusBadge(status:AchievementStatus):string {return `<span class="status-tag status-${status}">${status==='recorded'?'Recorded':titleCase(status)}</span>`;}
function initials():string {return profile.displayName.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()??'').join('') || 'CP';}
function currentNav():Screen {const name=location.hash.replace('#/','');return name==='vault'||name==='profile'?name:'home';}
function applyTheme(){document.documentElement.dataset.theme=theme;}
async function setTheme(value:string){if(!['system','light','dark'].includes(value))return;try{await setMeta('preferences',{theme:value});theme=value;localStorage.setItem('careerproof-theme',theme);applyTheme();}catch(err){notify(errorMessage(err),'error');}}
function navButton(id:Screen,label:string,glyph:string,mobile=false):string{return `<button class="nav-item ${mobile?'mobile-nav-item':''} ${screen===id?'active':''}" data-action="nav" data-screen="${id}" ${screen===id?'aria-current="page"':''}>${mobile?'<span class="nav-icon">':''}${icon(glyph,24)}${mobile?'</span>':''}<span>${label}</span></button>`;}
function pwaUpdateNotice():string {
  return pwaUpdateReady?'<div id="pwa-update-notice" class="pwa-update-notice" role="status" aria-live="polite"><div><strong>New version ready</strong><p>Restart CareerProof to load the update. Your saved career records stay on this device.</p></div><button class="button button-primary" data-action="reload-update">Restart app</button></div>':'';
}
function displayPwaUpdateNotice(){
  pwaUpdateReady=true;
  // Never rerender an active editor merely because a new worker activated.
  if(!document.getElementById('pwa-update-notice'))root.insertAdjacentHTML('beforeend',pwaUpdateNotice());
  const message=document.getElementById('pwa-update-status');
  if(message)message.textContent='Update ready. Close Settings to access Restart app.';
}
async function checkPwaUpdates(userInitiated=false):Promise<void>{
  if(!('serviceWorker' in navigator)){
    if(userInitiated)notify('Updates are unavailable in this browser.','error');return;
  }
  if(!navigator.onLine){
    if(userInitiated)notify('Connect to the internet to check for app updates.','error');return;
  }
  if(!userInitiated&&Date.now()-pwaLastCheck<5*60*1000)return;
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
    if(userInitiated){
      const status=document.getElementById('pwa-update-status');
      if(status)status.textContent=pwaUpdateReady?'Update ready. Close Settings to restart.':'Update check completed. We will show a restart button when a newer version is ready.';
      notify(pwaUpdateReady?'New version ready. Close Settings to restart.':'Update check completed. We will notify you if a newer version activates.');
    }
  }catch{
    if(userInitiated)notify('Update check failed. Keep your data and try again with an internet connection.','error');
  }
}
function configurePwaUpdates():void {
  if(!('serviceWorker' in navigator)||location.protocol==='file:')return;
  pwaHadController=Boolean(navigator.serviceWorker.controller);
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
  // Installed iOS PWAs often stay suspended in memory. Explicitly check on
  // foreground/resume, throttled to avoid repeated network requests.
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)void checkPwaUpdates();
  });
  window.addEventListener('pageshow',()=>{void checkPwaUpdates();});
}
function shell():string {
  return `<div class="app-shell">
    <aside class="sidebar" aria-label="Primary navigation">
      <div class="brand"><img class="brand-mark" src="./icon.svg" alt="" width="44" height="44"/><div class="brand-copy"><strong>CareerProof</strong><small>Personal career OS</small></div></div>
      <p class="sidebar-caption">WORKSPACE</p>
      <nav class="side-links" aria-label="Main navigation">${navButton('home','Home','home')}${navButton('vault','Vault','vault')}${navButton('profile','Profile','user')}</nav>
      <div class="sidebar-future"><span class="future-label">COMING IN FUTURE RELEASES</span><p>${icon('layers',17)} Experience & competencies</p><p>${icon('sparkle',17)} Career Studio</p></div>
      <div class="sidebar-bottom"><button class="sidebar-settings" data-action="settings">${icon('settings',24)} Settings ${icon('chevron',16)}</button><div class="sidebar-version">CareerProof OS <span>v${APP_VERSION}</span></div></div>
    </aside>
    <div class="content-wrap">
      <header class="topbar"><div class="topbar-left"><span class="topbar-mark"><img src="./icon.svg" alt="CareerProof" width="36" height="36"/></span><span class="breadcrumb"><span class="workspace-label">Workspace /</span> ${screen==='home'?'Home':screen==='vault'?'Vault':'Profile'}</span></div>
      <div class="topbar-actions"><span class="local-pill">${icon('lock',13)} Local & private</span><button class="icon-button" data-action="settings" title="Settings" aria-label="Settings">${icon('settings',19)}</button><button class="button button-primary top-capture" data-action="capture">${icon('plus',17)} <span>New achievement</span></button></div></header>
      <main class="page" id="main-content">${screen==='home'?homeView():screen==='vault'?vaultView():profileView()}</main>
    </div>
    <nav class="mobile-nav" aria-label="Mobile navigation">${navButton('home','Home','home',true)}${navButton('vault','Vault','vault',true)}<button class="mobile-create" data-action="capture" aria-label="New achievement"><span class="nav-icon">${icon('plus',24)}</span><span>Add</span></button>${navButton('profile','Profile','user',true)}<button class="nav-item mobile-nav-item" data-action="settings"><span class="nav-icon">${icon('settings',24)}</span><span>Settings</span></button></nav>
    <div id="modal-layer">${modalView()}</div>${modal?'':toastView()}
  </div>`;
}
function statCard(label:string,value:number,glyph:string,sub:string):string {return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon(glyph,18)}</span></div><strong class="stat-value">${value}</strong><p>${sub}</p></div>`;}
function smallAchievement(a:Achievement):string{return `<button class="achievement-row" data-action="detail" data-id="${escape(a.id)}"><span class="achievement-icon">${icon('trophy',17)}</span><span class="achievement-text"><strong>${escape(a.title)}</strong><small>${escape(a.contribution||'Draft — add a contribution when ready')}</small><span class="achieve-meta">${formatDate(a.occurredOn)} <span aria-hidden="true">·</span> ${a.impactCategory?IMPACT_CATEGORIES[a.impactCategory]:'General impact'}</span></span>${statusBadge(a.status)}<span class="row-arrow">${icon('chevron',17)}</span></button>`;}
function homeView():string {
  const stats=summarizeAchievements(achievements);
  const recent=achievements.filter(a=>a.status!=='archived').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,4);
  const greeting=profile.displayName.trim()?`Welcome back, ${escape(profile.displayName.trim().split(' ')[0])}.`:'Your career, in focus.';
  return `<div class="page-heading"><div><p class="eyebrow">YOUR PERSONAL CAREER WORKSPACE</p><h1>${greeting}</h1><p class="page-subtitle">Every meaningful contribution deserves to be remembered.</p></div><div class="version-chip">RELEASE ${APP_VERSION}</div></div>
  <section class="hero-card" aria-label="Capture an achievement"><div class="hero-decoration"></div><div class="hero-content"><div class="hero-overline">BUILD YOUR PROFESSIONAL LEGACY</div><h2>Great careers are built.<br/>Strong stories are <em>documented.</em></h2><p>Capture what you've accomplished today. Give your future self the evidence to move forward.</p><button class="button button-light" data-action="capture">${icon('plus',18)} Capture achievement ${icon('arrow',17)}</button></div><div class="hero-symbol" aria-hidden="true">${icon('trophy',90)}</div></section>
  <section class="stats-grid" aria-label="Career record summary">${statCard('Total achievements',stats.total,'trophy','Your active career records')}${statCard('Completed entries',stats.recorded,'check','Contributions documented')}${statCard('Saved drafts',stats.drafts,'edit','Ready to be completed')}</section>
  <div class="home-grid"><section class="panel recent-panel"><div class="panel-heading"><div><h2>Recent achievements</h2><p>Your latest recorded contributions</p></div><button class="text-action" data-action="nav" data-screen="vault">View all ${icon('arrow',16)}</button></div>${recent.length?`<div class="achievement-list">${recent.map(smallAchievement).join('')}</div>`:emptyState('Your first achievement starts here','Capture a professional contribution, a solved problem, or a milestone worth remembering.','Create achievement','capture')}</section>
  <aside class="home-right"><div class="panel next-panel"><div class="panel-heading"><div><h2>Build your record</h2><p>Recommended next steps</p></div>${icon('sparkle',19)}</div><div class="next-action"><span class="next-number">01</span><div><strong>${profile.headline?'Capture a recent win':'Add your professional headline'}</strong><p>${profile.headline?'You can connect it to a career role in the next release.':'Start defining your professional identity.'}</p></div></div><button class="button button-outline button-block" data-action="${profile.headline?'capture':'edit-profile'}">${profile.headline?'New achievement':'Edit profile'} ${icon('arrow',16)}</button></div>
  <div class="privacy-note">${icon('shield',21)}<div><strong>Private by design</strong><p>Your career records stay in this browser. Export a backup regularly to protect them.</p><button class="inline-link" data-action="settings">Manage backups ${icon('arrow',14)}</button></div></div></aside></div>`;
}
function emptyState(heading:string,body:string,button:string,action:string):string {return `<div class="empty-state"><div class="empty-illustration">${icon('vault',27)}</div><h3>${heading}</h3><p>${body}</p><button class="button button-primary" data-action="${action}">${icon('plus',17)} ${button}</button></div>`;}
function filtered():Achievement[]{
  const q=searchText.trim().toLocaleLowerCase();
  return achievements.filter(a=>{
    if(filterStatus==='active'&&a.status==='archived')return false;
    if(filterStatus!=='active'&&filterStatus!=='all'&&a.status!==filterStatus)return false;
    return !q||[a.title,a.contribution,a.outcome,IMPACT_CATEGORIES[a.impactCategory]].join(' ').toLocaleLowerCase().includes(q);
  }).sort((a,b)=>sortOrder==='oldest'?a.occurredOn.localeCompare(b.occurredOn):sortOrder==='updated'?b.updatedAt.localeCompare(a.updatedAt):b.occurredOn.localeCompare(a.occurredOn));
}
function vaultRows():string {const entries=filtered();return entries.length?entries.map(smallAchievement).join(''):`<div class="no-results">${icon('search',24)}<strong>No matching achievements</strong><p>Try a different search or status filter.</p><button class="text-action" data-action="clear-filters">Clear filters ${icon('arrow',15)}</button></div>`;}
function vaultView():string {
  const stats=summarizeAchievements(achievements);
  return `<div class="page-heading page-heading-flex"><div><p class="eyebrow">CAREER RECORDS</p><h1>Achievement Vault</h1><p class="page-subtitle">The work you did. The impact you made. All in one place.</p></div><button class="button button-primary desktop-add" data-action="capture">${icon('plus',17)} Add achievement</button></div>
  <div class="vault-summary"><span>${stats.total} active records</span><span>${stats.recorded} completed</span><span>${stats.drafts} drafts</span>${stats.archived?`<span>${stats.archived} archived</span>`:''}</div>
  ${achievements.length===0?`<section class="panel">${emptyState('Start documenting your impact','Your vault is empty. Even one meaningful achievement is worth recording.','Add your first achievement','capture')}</section>`:
  `<section class="panel vault-panel"><div class="vault-toolbar"><label class="search-field">${icon('search',19)}<input id="vault-search" type="search" placeholder="Search your achievements..." value="${escape(searchText)}" autocomplete="off" aria-label="Search achievements"/></label><div class="filter-controls"><label class="sr-only" for="status-filter">Filter by status</label><select id="status-filter"><option value="active" ${filterStatus==='active'?'selected':''}>Active</option><option value="all" ${filterStatus==='all'?'selected':''}>All statuses</option><option value="recorded" ${filterStatus==='recorded'?'selected':''}>Recorded</option><option value="draft" ${filterStatus==='draft'?'selected':''}>Drafts</option><option value="archived" ${filterStatus==='archived'?'selected':''}>Archived</option></select><label class="sr-only" for="sort-order">Sort achievements</label><select id="sort-order"><option value="recent" ${sortOrder==='recent'?'selected':''}>Newest first</option><option value="oldest" ${sortOrder==='oldest'?'selected':''}>Oldest first</option><option value="updated" ${sortOrder==='updated'?'selected':''}>Recently edited</option></select></div></div><div id="vault-results" class="achievement-list">${vaultRows()}</div></section>`}
  <div class="below-note">${icon('info',17)}<p>Achievements will connect to projects and competencies in v0.1.1. Existing entries will be retained.</p></div>`;
}
function profileView():string {
  const has=Boolean(profile.displayName||profile.headline||profile.summary||profile.location||profile.email);
  return `<div class="page-heading page-heading-flex"><div><p class="eyebrow">YOUR PROFESSIONAL IDENTITY</p><h1>Career Profile</h1><p class="page-subtitle">Build a foundation that grows with your experience.</p></div><button class="button button-outline desktop-add" data-action="edit-profile">${icon('edit',17)} Edit profile</button></div>
  <div class="profile-grid"><section class="panel profile-card"><div class="profile-top"><div class="avatar">${escape(initials())}</div><div><h2>${escape(profile.displayName||'Your name')}</h2><p>${escape(profile.headline||'Add your current professional headline')}</p>${profile.location?`<span class="profile-location">${escape(profile.location)}</span>`:''}</div></div><div class="profile-section"><p class="section-kicker">ABOUT</p>${profile.summary?`<p class="profile-summary">${escape(profile.summary)}</p>`:`<p class="muted">Describe the expertise, responsibilities, and career direction that define you.</p>`}</div>${profile.email?`<div class="profile-section"><p class="section-kicker">CONTACT</p><p>${escape(profile.email)}</p></div>`:''}<button class="button button-outline" data-action="edit-profile">${icon('edit',16)} ${has?'Edit your profile':'Complete profile'}</button></section>
  <aside class="profile-aside"><div class="panel"><div class="mini-heading">${icon('trophy',20)}<h2>Your professional story</h2></div><p class="muted">The Achievement Vault is where you can start building evidence of your experience today.</p><button class="text-action" data-action="nav" data-screen="vault">Open Vault ${icon('arrow',16)}</button></div></aside></div>${careerCollections?careerSections(profile,careerCollections):''}`;
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
  if(modal==='settings')content=settingsView();
  if(modal==='restore')content=restoreView();
  return `<div class="modal-backdrop" data-action="backdrop"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" tabindex="-1" class="modal ${modal==='capture'?'capture-modal':''}">${content}</section></div>`;
}
function dialogHeader(title:string,subtitle:string):string {return `<div class="modal-header"><div><p class="eyebrow">CAREERPROOF OS</p><h2 id="dialog-title">${title}</h2><p id="dialog-description">${subtitle}</p></div><button class="icon-button close-dialog" data-action="close" aria-label="Close dialog">${icon('close',24)}</button></div>${toastView(true)}`;}
function achievementForm():string {
  const existing=editing&&selectedId?achievements.find(a=>a.id===selectedId):undefined;
  const status=existing?.status==='archived'?existing.preArchiveStatus:existing?.status;
  const dateType=existing?.occurredStart?.precision==='year'?'text':existing?.occurredStart?.precision==='month'?'month':'date';
  return `${dialogHeader(existing?'Edit achievement':'Capture an achievement',existing?'Update the details of your contribution.':'Start with what you accomplished. Refine the details later.')}
  <form id="achievement-form" class="modal-body form-grid" novalidate>
    <div id="form-error" class="form-error" role="alert" hidden></div>
    <div class="field"><label for="title">Achievement title <span class="required">*</span></label><input id="title" name="title" maxlength="160" placeholder="e.g., Resolved a critical technical issue" value="${escape(existing?.title??'')}" required/><p class="field-hint">Write a short, action-focused title.</p></div>
    <div class="field"><label for="contribution">What did you do? <span class="required">*</span></label><textarea id="contribution" name="contribution" rows="5" maxlength="6000" placeholder="Describe your personal contribution, decisions, or actions...">${escape(existing?.contribution??'')}</textarea><p class="field-hint">Required for a recorded achievement. Optional for a draft.</p></div>
    <div class="field-row"><div class="field"><label for="occurredOn">Occurrence date${dateType==='text'?' (year)':''}</label><input id="occurredOn" type="${dateType}" ${dateType==='text'?'inputmode="numeric" maxlength="4"':''} name="occurredOn" value="${escape(existing?.occurredOn??localDate())}"/></div><div class="field"><label for="impactCategory">Impact category</label><select name="impactCategory" id="impactCategory">${Object.entries(IMPACT_CATEGORIES).map(([key,value])=>`<option value="${key}" ${existing?.impactCategory===key?'selected':''}>${value}</option>`).join('')}</select></div></div>
    <div class="field"><label for="outcome">Outcome <span class="optional">optional</span></label><textarea id="outcome" name="outcome" rows="3" maxlength="6000" placeholder="What changed as a result? Add measurable results if known.">${escape(existing?.outcome??'')}</textarea></div>
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
  <div class="modal-body settings-body"><div class="settings-group"><h3>Appearance</h3><div class="settings-line"><div><strong>Color theme</strong><p>Choose your preferred display style.</p></div><select id="theme-select" aria-label="Color theme"><option value="system" ${theme==='system'?'selected':''}>System</option><option value="light" ${theme==='light'?'selected':''}>Light</option><option value="dark" ${theme==='dark'?'selected':''}>Dark</option></select></div></div>
  <div class="settings-group"><h3>Data management</h3><div class="settings-line"><div><strong>Export career backup</strong><p>Download all career records, relationships, taxonomy and preferences as an unencrypted JSON file (up to 12 MiB).</p></div><button id="export-backup" class="button button-outline" data-action="export">${icon('download',16)} Export</button></div><div class="settings-line"><div><strong>Restore from backup</strong><p>Replace local records with a validated CareerProof backup.</p></div><button class="button button-outline" data-action="choose-restore">${icon('upload',16)} Restore</button></div><input id="restore-file" type="file" accept=".json,application/json" hidden/><p class="backup-note">${lastExportAt?`Last export generated: ${relativeDate(lastExportAt)}`:'No export generated from this browser yet.'} Your downloaded JSON is not encrypted. Keep it somewhere secure.</p></div>
  <div class="settings-group"><h3>Application</h3><div class="settings-line"><div><strong>CareerProof OS</strong><p>Local-first PWA · v${APP_VERSION} · Database schema ${SCHEMA_VERSION}</p></div>${icon('shield',20)}</div><div class="settings-line"><div><strong>Check for updates</strong><p id="pwa-update-status">Checks for a new release without removing the installed app or local records.</p></div><button class="button button-outline" data-action="check-updates">Check now</button></div><div class="form-guidance">${icon('info',18)}<p>Closing this app does not delete saved records, but browser data may be cleared or lost. This version has no cloud sync; export backups regularly.</p></div></div></div>`;
}
function restoreView():string {
  if(!pendingBackup)return '';
  const m=pendingBackup.backup.manifest;
  return `${dialogHeader('Restore career data','Review the backup before replacing your local records.')}<div class="modal-body"><div class="restore-warning">${icon('alert',20)}<div><strong>This replaces your current data</strong><p>Every local career collection and portable preference will be replaced. Export your current data before proceeding.</p>${pendingBackup.legacy?'<p><strong>Legacy format-1 backup:</strong> employers, roles, qualifications, projects, metrics, evidence, custom competencies and links currently stored here will be removed. This file restores its profile and achievements and the 32 built-in competencies. Theme resets to System.</p>':''}</div></div><div class="restore-preview"><p><span>Backup created</span><strong>${relativeDate(m.exportedAt)}</strong></p><p><span>Achievements</span><strong>${m.counts.achievements}</strong></p>${P0_STORES.filter(s=>s!=='achievements').map(s=>`<p><span>${collectionLabels[s]}</span><strong>${m.counts[s]}</strong></p>`).join('')}<p><span>Schema</span><strong>${m.schemaVersion}</strong></p></div><div class="form-guidance">${icon('shield',17)}<p>This backup passed initial structure and record validation. Its contents are not independently verified.</p></div></div><div class="modal-footer"><button class="button button-outline" data-action="settings">Cancel</button><button class="button button-danger" data-action="confirm-restore">Replace local data</button></div>`;
}
function render(preserveFocus=false):void {const focusId=preserveFocus?(document.activeElement as HTMLElement|null)?.id:'';root.classList.remove('app-loading');root.innerHTML=shell()+pwaUpdateNotice();dialogs.update(Boolean(modal));syncCareerDisclosures(root);
  if(focusId){document.getElementById(focusId)?.focus({preventScroll:true});}else if(modal){dialogs.focusFirst();}
}
function toastView(inDialog=false):string{return `<div id="toast" role="status" aria-live="polite" class="toast ${inDialog?'toast-in-dialog':''} ${toastMessage?'visible':''} toast-${toastKind}">${toastMessage?`${icon(toastKind==='success'?'check':'alert',20)}<span>${escape(toastMessage)}</span>`:''}</div>`;}
function notify(message:string,kind:'success'|'error'='success'){toastMessage=message;toastKind=kind;window.clearTimeout(toastTimer);const el=document.getElementById('toast');if(el){el.innerHTML=`${icon(kind==='success'?'check':'alert',20)}<span>${escape(message)}</span>`;el.classList.add('visible');el.classList.toggle('toast-error',kind==='error');el.classList.toggle('toast-success',kind==='success');}toastTimer=window.setTimeout(()=>{toastMessage='';document.getElementById('toast')?.classList.remove('visible');},kind==='error'?10000:5000);}
function openModal(kind:Modal,id:string|null=null,edit=false){if(!modal)dialogs.rememberInvoker();modal=kind;selectedId=id;editing=edit;isDirty=false;render();}
function closeModal(force=false){if(saving&&!force)return;if(!force&&isDirty&& !window.confirm('You have unsaved changes. Discard them?'))return;modal=null;selectedId=null;editing=false;pendingBackup=null;isDirty=false;render();dialogs.restoreFocus();}
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
    const record=await saveAchievement({id:existing?.id??crypto.randomUUID(),revision:existing?.revision??0,title:input.title,contribution:input.contribution,occurredOn:input.occurredOn,status,preArchiveStatus:null,outcome:input.outcome,impactCategory:input.impactCategory as Achievement['impactCategory']});
    achievements=await listAchievements();closeModal(true);notify(existing?'Achievement updated.':status==='draft'?'Draft saved.':'Achievement saved.');
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
async function deleteCareer(kind:CareerKind,id:string){
  if(saving||!careerCollections)return;
  const record=careerCollections[kind].find(r=>r.id===id);
  if(!record)return notify('Record no longer available. Reload this page.','error');
  const dependencies=dependentCareerRecords(kind,id,careerCollections);
  if(dependencies.length){notify('Cannot delete: this record is referenced by '+dependencies.join(', ')+'. Reassign or unlink these records first.','error');return;}
  if(!window.confirm('Permanently delete this '+(kind==='education'?'education entry':kind==='credentials'?'credential':kind==='roles'?'role':'employer')+'? This cannot be undone.'))return;
  try{await database.removeRecord(kind,id,record.revision);await loadCareerCollections();render();notify('Career record deleted.');}
  catch(err){notify(errorMessage(err),'error');}
}

function errorMessage(err:unknown):string{return err instanceof Error?err.message:'An unexpected error occurred.';}
async function doExport(){try{const file=await createBackup();downloadBackup(file.name,file.json);await setMeta('lastExportAt',file.exportedAt);lastExportAt=file.exportedAt;if(modal==='settings')render(true);notify('Backup file generated. Check that it was saved securely.');}catch(err){notify(`Backup failed: ${errorMessage(err)}`,'error');}}
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
    case 'capture':openModal('capture');break;
    case 'edit-profile':openModal('profile');break;
    case 'add-career':openCareer(node.dataset.kind as CareerKind,null,node.dataset.employer);break;
    case 'edit-career':openCareer(node.dataset.kind as CareerKind,node.dataset.id??null);break;
    case 'toggle-career-details':toggleCareerDisclosure(node);break;
    case 'delete-career':void deleteCareer(node.dataset.kind as CareerKind,node.dataset.id??'');break;
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
    case 'choose-restore':(document.getElementById('restore-file') as HTMLInputElement|null)?.click();break;
    case 'confirm-restore':void doConfirmRestore();break;
    case 'clear-filters':searchText='';filterStatus='active';sortOrder='recent';render();break;
  }
}
document.addEventListener('click',e=>{
  if(!(e.target instanceof Element))return;
  const actionTarget=resolveActionTarget(e.target);
  if(actionTarget)runAction(actionTarget);
});
document.addEventListener('input',e=>{const t=e.target as HTMLElement;if(t.closest('#achievement-form, #profile-form, #career-form'))isDirty=true;if(t.id==='vault-search'){searchText=(t as HTMLInputElement).value;const results=document.getElementById('vault-results');if(results)results.innerHTML=vaultRows();}});
document.addEventListener('change',e=>{const t=e.target as HTMLInputElement|HTMLSelectElement;if(t.id==='status-filter'){filterStatus=t.value;const el=document.getElementById('vault-results');if(el)el.innerHTML=vaultRows();}if(t.id==='sort-order'){sortOrder=t.value;const el=document.getElementById('vault-results');if(el)el.innerHTML=vaultRows();}if(t.id==='theme-select'){void setTheme(t.value);}if(t.id==='restore-file'&&t instanceof HTMLInputElement&&t.files?.[0]){void doFileRestore(t.files[0]);}if(t.dataset.action==='career-date-precision'){
    const target=t.dataset.target??'';
    const input=document.getElementById('career-'+target) as HTMLInputElement|null;
    if(input){input.type=t.value==='year'?'text':t.value==='month'?'month':'date';input.value='';input.placeholder=t.value==='year'?'YYYY':'';input.inputMode=t.value==='year'?'numeric':'';input.maxLength=t.value==='year'?4:524288;}
  }
  if(t.id==='career-isCurrent'&&t instanceof HTMLInputElement&&t.checked){
    const end=document.getElementById('career-endDate') as HTMLInputElement|null;if(end)end.value='';
  }
  if(t.closest('#achievement-form,#profile-form,#career-form'))isDirty=true;});
document.addEventListener('submit',e=>{if((e.target as HTMLElement).id==='achievement-form'){e.preventDefault();void saveAchievementForm('recorded');}if((e.target as HTMLElement).id==='profile-form'){e.preventDefault();void saveProfileForm();}if((e.target as HTMLElement).id==='career-form'){e.preventDefault();void saveCareerForm();}});
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
