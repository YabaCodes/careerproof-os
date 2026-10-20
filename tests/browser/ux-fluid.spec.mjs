import {test,expect} from '@playwright/test';
import {fullCollections,base} from '../fixtures.mjs';
import {captureWhere,captureWhen} from './ux-helpers.mjs';

// CP-UX-Fluid (DEC-038): feel, the recorded moment, tidy-ups and the Home record timeline.
// Synthetic records only. Dates are placed relative to the day the test runs.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});

/** YYYY-MM for n months before this month, or YYYY-MM-DD with a day. */
function monthsAgo(n,day){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-n);const m=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return day?`${m}-${String(day).padStart(2,'0')}`:m;}
const monthName=key=>new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+key.slice(0,4),+key.slice(5,7)-1,15)));
const precision=v=>v.length===4?'year':v.length===7?'month':'day';

function world(){
  const c=fullCollections();
  c.projects.push({...c.projects[0],...base('project-2'),name:'Synthetic Platform Migration',experienceType:'project',startDate:{value:monthsAgo(10),precision:'month'},endDate:null,status:'active',confidentiality:'standard-private'});
  c.recordLinks.push({...base('link-p2'),linkType:'role-project',sourceId:'role-1',targetId:'project-2',isPrimary:false,note:''});
  const add=(id,when,over={})=>{
    c.achievements.push({...c.achievements[0],...base(id),title:'Synthetic '+id,status:'recorded',preArchiveStatus:null,occurredStart:when?{value:when,precision:precision(when)}:null,roleId:'role-1',...over});
  };
  add('now-1',monthsAgo(0,2));
  add('four-a',monthsAgo(4,5));add('four-b',monthsAgo(4));add('four-c',monthsAgo(4,28));
  add('four-draft',monthsAgo(4),{status:'draft',contribution:''});
  add('four-archived',monthsAgo(4,9),{status:'archived',preArchiveStatus:'recorded'});
  add('eleven',monthsAgo(11));
  add('too-old',monthsAgo(12,3));
  add('year-only',monthsAgo(0).slice(0,4));
  return c;
}
async function seed(page,c){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const snapshot=page=>page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});
const month=(page,key)=>page.locator(`.record-month[data-month="${key}"]`);

test('CP-UX-Fluid Home shows the last 12 months by when achievements happened; a month lists only its recorded achievements',async({page})=>{
  await seed(page,world());
  const before=await snapshot(page);
  await expect(page.locator('.section-title h2',{hasText:'Last 12 Months'})).toBeVisible();
  await expect(page.locator('.record-month')).toHaveCount(12);
  await expect(page.locator('.record-month').first()).toHaveAttribute('data-month',monthsAgo(11));
  await expect(page.locator('.record-month').last()).toHaveAttribute('data-month',monthsAgo(0));
  await expect(month(page,monthsAgo(4))).toHaveAttribute('aria-label',`${monthName(monthsAgo(4))}: 3 achievements`);
  await expect(month(page,monthsAgo(0))).toHaveAttribute('aria-label',`${monthName(monthsAgo(0))}: 1 achievement`);
  await expect(month(page,monthsAgo(2))).toHaveAttribute('aria-label',`${monthName(monthsAgo(2))}: 0 achievements`);
  await expect(page.locator('.section-title',{hasText:'Last 12 Months'}).locator('.section-meta')).toHaveText('5 achievements');
  await expect(page.locator('.record-card')).toContainText('has only a year, so it is not shown by month');
  await expect(page.locator('.record-card')).not.toContainText(/streak|target|goal|score|average/i);

  // Tap a month: the list below becomes that month, latest date first; drafts and archived stay out.
  await expect(page.locator('#home-list-title')).toHaveText('Recent');
  await month(page,monthsAgo(4)).click();
  await expect(month(page,monthsAgo(4))).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#home-list-title')).toHaveText(monthName(monthsAgo(4)));
  await expect(page.locator('#home-list .achievement-row strong')).toHaveText(['Synthetic four-c','Synthetic four-a','Synthetic four-b']);
  // Step through months with the 44px buttons; an empty month says so.
  await page.getByRole('button',{name:/^Previous month/}).click();
  await expect(page.locator('#home-list-title')).toHaveText(monthName(monthsAgo(5)));
  await expect(page.locator('#home-list .month-empty')).toHaveText(`Nothing recorded in ${monthName(monthsAgo(5))}.`);
  await expect(page.getByRole('button',{name:/^Previous month/})).toBeFocused();
  await page.getByRole('button',{name:/^Next month/}).click();
  await page.getByRole('button',{name:/^Next month/}).click();
  await expect(page.locator('#home-list-title')).toHaveText(monthName(monthsAgo(3)));
  await month(page,monthsAgo(0)).click();
  await expect(page.getByRole('button',{name:'Next month'})).toBeDisabled();
  // A row opens its achievement; closing keeps the month.
  await page.locator('#home-list .achievement-row').first().click();
  await expect(page.getByRole('dialog',{name:'Synthetic now-1'})).toBeVisible();
  await page.locator('.close-dialog').click();
  await expect(page.locator('#home-list-title')).toHaveText(monthName(monthsAgo(0)));
  await page.locator('[data-action=home-month-clear]').click();
  await expect(page.locator('#home-list-title')).toHaveText('Recent');
  await expect(page.locator('.record-month[aria-pressed=true]')).toHaveCount(0);
  // Leaving Home forgets the month.
  await month(page,monthsAgo(4)).click();
  await page.locator('.mobile-nav-item[data-screen=vault]').click();
  await page.locator('.mobile-nav-item[data-screen=home]').click();
  await expect(page.locator('#home-list-title')).toHaveText('Recent');
  expect(await snapshot(page)).toEqual(before);
});

test('CP-UX-Fluid sliding sideways across the months picks them; scrolling past the chart does not',async({page})=>{
  await seed(page,world());
  const chart=page.locator('.record-chart');
  await chart.scrollIntoViewIfNeeded();
  const box=await chart.boundingBox(),y=box.y+box.height/2;
  // A mostly vertical drag that starts on the chart picks nothing.
  await page.mouse.move(box.x+box.width*0.2,y);await page.mouse.down();
  await page.mouse.move(box.x+box.width*0.21,y+130,{steps:4});await page.mouse.up();
  await expect(page.locator('.record-month[aria-pressed=true]')).toHaveCount(0);
  // Sideways: the month under the pointer is picked as it moves.
  await page.mouse.move(box.x+box.width*(1.5/12),y);await page.mouse.down();
  await page.mouse.move(box.x+box.width*(7.5/12),y,{steps:12});
  await expect(page.locator('#home-list-title')).toHaveText(monthName(monthsAgo(4)));
  await page.mouse.move(box.x+box.width*(11.5/12),y,{steps:8});await page.mouse.up();
  await expect(page.locator('#home-list-title')).toHaveText(monthName(monthsAgo(0)));
  // Month columns span the chart height; on phones they are narrower than 44px, so ‹ › step with 44px buttons.
  const sizes=await page.locator('.record-month').evaluateAll(n=>n.map(el=>el.getBoundingClientRect()).map(r=>[r.width,r.height]));
  for(const [w,h] of sizes){expect(h).toBeGreaterThanOrEqual(44);expect(w).toBeGreaterThanOrEqual(24);}
  for(const step of await page.locator('.month-step').all()){const b=await step.boundingBox();expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);}
});

test('CP-UX-Fluid recording says where it went, glows where it appears and grows its month; a draft says what it needs',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await seed(page,world());
  const current=month(page,monthsAgo(0));
  await expect(current).toHaveAttribute('aria-label',/: 1 achievement$/);
  await page.locator('.mobile-create').click();
  await captureWhere(page,'project-2');
  await page.locator('#title').fill('Synthetic recorded moment');
  await page.locator('#contribution').fill('Synthetic contribution');
  await captureWhen(page);
  await page.locator('#occurredPrecision-month').check();
  await page.locator('#occurredOn').fill(monthsAgo(0));
  await page.locator('[data-action=find-skill]').click();
  await page.locator('#skill-search').fill('Synthetic Skill');
  await page.locator('.skill-chip:visible').first().click();
  const skillName='Synthetic Skill';
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#toast')).toContainText('Achievement recorded.');
  await expect(page.locator('#toast small')).toHaveText(`In Synthetic Platform Migration · Adds an example to ${skillName}`);
  const saved=(await snapshot(page)).achievements.find(a=>a.title==='Synthetic recorded moment');
  await expect(page.locator(`#home-list .just-saved[data-id="${saved.id}"]`)).toBeVisible();
  await expect(current).toHaveAttribute('aria-label',/: 2 achievements$/);
  // The glow is not kept: a later redraw does not replay it.
  await expect(page.locator('.just-saved')).toHaveCount(0,{timeout:4000});

  await page.locator('.mobile-create').click();
  await captureWhere(page,'project-2');
  await page.locator('#title').fill('Synthetic draft moment');
  await page.locator('[data-action=save-achievement][data-status=draft]').click();
  await expect(page.locator('#toast')).toContainText('Draft saved.');
  await expect(page.locator('#toast small')).toHaveText('Add what you did and a date to record it.');
});

/** Log every scripted animation and every sheet entrance, so short animations are seen however slow the run. */
async function recordMotion(page){
  await page.addInitScript(()=>{
    window.__motion=[];
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(keyframes,options){window.__motion.push({target:this.id||String(this.className),from:keyframes[0].transform??keyframes[0].height});return animate.call(this,keyframes,options);};
    new MutationObserver(list=>{for(const m of list)if(m.target.classList?.contains('modal-backdrop')&&m.target.classList.contains('is-entering'))window.__motion.push({target:'sheet'});})
      .observe(document,{subtree:true,attributes:true,attributeFilter:['class']});
  });
}
const motion=page=>page.evaluate(()=>window.__motion.splice(0));

test('CP-UX-Fluid motion follows changes, not redraws, and Reduce Motion turns it off',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await recordMotion(page);
  await seed(page,world());
  await motion(page);
  // A sheet rises when it opens…
  await page.locator('.mobile-create').click();
  await expect(page.locator('#achievement-form')).toBeVisible();
  expect(await motion(page)).toEqual([{target:'sheet'}]);
  await expect(page.locator('.modal-backdrop')).not.toHaveClass(/is-entering/);
  // …and each capture step slides in its own direction.
  await captureWhere(page,'project-2');
  expect(await motion(page)).toEqual([{target:'capture-step',from:'translateX(28px)'}]);
  await page.locator('[data-action=capture-back]:visible').click();
  expect(await motion(page)).toEqual([{target:'capture-step',from:'translateX(-28px)'}]);
  page.once('dialog',d=>d.accept());
  await page.locator('.close-dialog').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Switching from an achievement to its editor redraws the sheet without sliding it again.
  await page.locator('#home-list .achievement-row').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await motion(page)).toEqual([{target:'sheet'}]);
  await page.locator('[data-action=edit-achievement]').click();
  await expect(page.locator('#achievement-form')).toBeVisible();
  expect(await motion(page)).toEqual([]);
  await page.locator('.close-dialog').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await motion(page);
  // Screens ease in when you move to them; an experience pushes in and Back returns from the left.
  await page.locator('.mobile-nav-item[data-screen=portfolio]').click();
  await expect(page.locator('.timeline')).toBeVisible();
  expect(await motion(page)).toEqual([{target:'main-content',from:'translateY(8px)'}]);
  await page.locator('.experience-row').first().click();
  await expect(page.locator('.experience-page')).toBeVisible();
  expect(await motion(page)).toEqual([{target:'main-content',from:'translateX(18px)'}]);
  await page.locator('.back-link').click();
  await expect(page.locator('.timeline')).toBeVisible();
  expect(await motion(page)).toEqual([{target:'main-content',from:'translateX(-18px)'}]);
  // Bars grow when Home opens; those below the fold wait until they are scrolled to.
  await page.setViewportSize({width:390,height:560});
  await page.locator('.mobile-nav-item[data-screen=home]').click();
  await expect(page.locator('.record-chart')).toBeAttached();
  expect((await motion(page)).filter(m=>m.target==='record-fill').map(m=>m.from)).toEqual(['0%','0%','0%']);
  const states=()=>page.locator('.record-fill').evaluateAll(n=>n.flatMap(el=>el.getAnimations().map(a=>a.playState)));
  // CP-UX3's shorter Home can bring the chart into view without scrolling.
  // If visible already, the bars should be running; otherwise they stay paused
  // until the card comes into view.
  const chartVisible=await page.locator('.record-card').evaluate(el=>{
    const rect=el.getBoundingClientRect();return rect.top<innerHeight&&rect.bottom>0;
  });
  if(chartVisible)expect((await states()).every(s=>s!=='paused')).toBe(true);
  else expect(await states()).toEqual(['paused','paused','paused']);
  await page.locator('.record-card').scrollIntoViewIfNeeded();
  await expect.poll(async()=>(await states()).includes('paused')).toBe(false);

  // With Reduce Motion nothing animates, and the result is the same.
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.mobile-nav-item[data-screen=vault]').click();
  await page.locator('.mobile-nav-item[data-screen=home]').click();
  await page.locator('.mobile-create').click();
  await expect(page.locator('#achievement-form')).toBeVisible();
  expect(await motion(page)).toEqual([]);
  expect(await page.evaluate(()=>document.getAnimations().length)).toBe(0);
});

test.describe('with a mouse',()=>{
// :active is easiest to hold with a mouse; touch emulation cannot press and hold.
test.use({isMobile:false,hasTouch:false});
test('CP-UX-Fluid buttons give under a press; a tap that opens a sheet cannot also close it',async({page})=>{
  await seed(page,world());
  const quick=page.locator('.compact-quick-add .button').first();
  await quick.scrollIntoViewIfNeeded();
  const box=await quick.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  expect(await quick.evaluate(el=>getComputedStyle(el).transform)).toBe('matrix(0.97, 0, 0, 0.97, 0, 0)');
  await page.mouse.move(2,2);await page.mouse.up();
  expect(await quick.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  // While a sheet is still rising, a tap on the dimmed area (where the sheet is about to be) does not close it;
  // once it has settled, the backdrop works as before.
  await page.locator('.header-profile').click();
  const openAndTapBackdrop=()=>page.evaluate(()=>{document.querySelector('.profile-settings').click();document.querySelector('.modal-backdrop').click();});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await openAndTapBackdrop();
  await expect(page.getByRole('dialog',{name:'Settings & Data'})).toBeVisible();
  await expect(page.locator('.modal-backdrop')).not.toHaveClass(/is-entering/);
  await page.evaluate(()=>document.querySelector('.modal-backdrop').click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // With Reduce Motion there is no rise, so nothing is held back.
  await page.emulateMedia({reducedMotion:'reduce'});
  await openAndTapBackdrop();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
});

for(const width of [320,390])test(`CP-UX-Fluid tidy-ups at ${width}px: singular count, compact Skills toolbar, role headers`,async({page})=>{
  await page.setViewportSize({width,height:844});
  const c=fullCollections();
  c.employers[0].name='Synthetic Advanced Manufacturing Company';
  await seed(page,c);
  // "1 achievement", not "1 achievements".
  await expect(page.locator('.compact-metric').first()).toContainText('Recorded');
  await expect(page.locator('.compact-metric').first().locator('strong')).toHaveText('1');

  await page.locator('.mobile-nav-item[data-screen=competencies]').click();
  const search=page.locator('#competency-search'),filters=page.locator('#skill-filter-toggle'),add=page.locator('.toolbar-add');
  await expect(page.locator('#skill-filters')).toBeHidden();
  await expect(filters).toHaveAttribute('aria-expanded','false');
  const [s,f,a]=await Promise.all([search,filters,add].map(l=>l.boundingBox()));
  for(const b of [f,a]){expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);}
  expect(s.height).toBeGreaterThanOrEqual(44);
  if(width>=360)expect(Math.abs(s.y-f.y)).toBeLessThan(8);else expect(f.y).toBeGreaterThan(s.y+s.height-1);
  expect(Math.abs(f.y-a.y)).toBeLessThan(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await filters.click();
  await expect(page.locator('#skill-filters')).toBeVisible();
  await page.locator('#competency-category').selectOption('custom-category');
  await expect(filters).toHaveText('Filters · 1');
  await page.locator('#competency-archived').click();
  await expect(filters).toHaveText('Filters · 2');
  await expect(page.locator('details.skill-entry')).toHaveCount(1);
  await add.click();
  await expect(page.getByRole('dialog',{name:'Add Custom Competency'})).toBeVisible();
  await page.locator('.close-dialog').click();
  await expect(page.locator('#skill-filters')).toBeVisible(); // the open panel stays open behind a dialog

  await page.locator('.mobile-nav-item[data-screen=portfolio]').click();
  const group=page.locator('.role-group').first();
  await expect(group.locator('.role-group-title h2')).toHaveText('Synthetic Engineer');
  await expect(group.locator('.role-group-title .role-current')).toHaveText('Current');
  await expect(group.locator('.role-group-sub')).toHaveText('Synthetic Advanced Manufacturing Company · 2022 – Present · 1 experience');
  // Lines break between parts, never inside a date range or a count.
  expect(await group.locator('.role-group-sub .nowrap, .experience-row-meta .nowrap').evaluateAll(n=>n.map(el=>el.getClientRects().length))).toEqual(expect.not.arrayContaining([2]));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});
