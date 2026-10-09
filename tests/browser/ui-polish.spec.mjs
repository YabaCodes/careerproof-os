import {test,expect} from '@playwright/test';
import {fullCollections,legacyBackup,collections} from '../fixtures.mjs';
import {generateBackup} from '../../dist/app/domain/validation.js';

async function start(page){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
}
async function action(page,selector){
  const inside=page.locator('.modal').locator(selector).filter({visible:true});
  await ((await inside.count())?inside:page.locator(selector).filter({visible:true})).first().click();
}
async function seed(page,theme){
  const c=fullCollections();
  c.profiles[0].displayName='Alex Synthetic Professional';
  c.profiles[0].headline='Synthetic engineering leadership '.repeat(5);
  c.profiles[0].email='synthetic.professional.with.long.contact.address@example.test';
  c.profiles[0].summary='Synthetic summary. '.repeat(100);
  c.achievements[0].title='SyntheticLongTitle'.repeat(8);
  c.achievements[0].contribution='Synthetic detail with long supporting context. '.repeat(100);
  await page.evaluate(async({c,theme})=>{
    const {database}=await import('/app/data/db.js');
    await database.replaceAllData(c,{theme},await database.getGeneration());
    localStorage.setItem('careerproof-theme',theme);
  },{c,theme});
  await page.reload();
  await expect(page.locator('.hero-card')).toBeVisible();
  return c;
}
async function layout(page,state){
  const result=await page.evaluate(()=>{
    const visible=el=>el.getClientRects().length>0&&!el.closest('[inert]');
    const controls=[...document.querySelectorAll('button,input:not([type=file]),select')].filter(visible);
    return {
      overflow:document.documentElement.scrollWidth-innerWidth,
      small:controls.filter(el=>{const r=el.getBoundingClientRect();return r.width<43.9||r.height<43.9;}).map(el=>el.id||el.textContent.trim()),
      missingLabels:controls.filter(el=>el.tagName==='BUTTON'?!el.textContent.trim()&&!el.getAttribute('aria-label'):!el.labels?.length&&!el.getAttribute('aria-label')).map(el=>el.id||el.tagName),
      bodyOverflow:[...document.querySelectorAll('.modal-body')].some(el=>el.scrollWidth>el.clientWidth+1),
      outside:[...document.querySelectorAll('.modal button,.modal input,.modal select,.modal textarea')].filter(visible).some(el=>{const r=el.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}),
    };
  });
  expect(result.overflow,state+' page overflow').toBeLessThanOrEqual(1);
  expect(result.small,state+' tap targets').toEqual([]);
  expect(result.missingLabels,state+' accessible labels').toEqual([]);
  expect(result.bodyOverflow,state+' dialog overflow').toBe(false);
  expect(result.outside,state+' clipped controls').toBe(false);
}
for(const theme of ['light','dark'])for(const width of [320,375,390,430,768,1024,1440]){
  test('all screens and dialog states: '+width+'px '+theme,async({page})=>{
    test.setTimeout(60000);
    await page.setViewportSize({width,height:900});
    await start(page);
    const c=await seed(page,theme);
    await layout(page,'Home');
    for(const screen of ['vault','profile','home']){
      await action(page,'[data-screen="'+screen+'"]');
      await layout(page,screen);
    }
    if(width<768){
      const geometry=await page.locator('.mobile-nav > button').evaluateAll(nodes=>nodes.map(el=>{
        const r=el.getBoundingClientRect(),i=el.querySelector('.nav-icon').getBoundingClientRect();
        return {width:r.width,center:r.x+r.width/2,y:r.y+r.height/2,iconY:i.y+i.height/2};
      }));
      expect(geometry).toHaveLength(5);
      for(let i=1;i<5;i++){
        expect(Math.abs(geometry[i].width-geometry[0].width)).toBeLessThan(1);
        expect(Math.abs(geometry[i].center-geometry[i-1].center-(geometry[1].center-geometry[0].center))).toBeLessThan(1);
        expect(geometry[i].y).toBe(geometry[0].y);
        expect(geometry[i].iconY).toBe(geometry[0].iconY);
      }
      await expect(page.locator('.mobile-nav')).toContainText('Add');
    }else{
      await expect(page.locator('.side-links [data-screen="profile"]')).toBeVisible();
    }
    await action(page,'[data-screen="vault"]');
    await page.locator('#vault-search').fill('no-synthetic-match');
    await expect(page.locator('.no-results')).toBeVisible();await layout(page,'No results');
    await page.locator('#vault-search').fill('');
    await action(page,'[data-action="detail"]');await layout(page,'Details');
    await action(page,'[data-action="edit-achievement"]');await layout(page,'Edit');
    await expect(page.locator('#title')).toHaveValue(c.achievements[0].title);
    await action(page,'[data-action="close"]');
    await action(page,'[data-screen="profile"]');await layout(page,'Long Profile');
    await action(page,'[data-action="edit-profile"]');await layout(page,'Profile editor');
    await action(page,'[data-action="close"]');
    await action(page,'[data-action="capture"]');await layout(page,'Capture');
    expect(await page.locator('#title').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    await action(page,'[data-status="recorded"]');
    await expect(page.locator('#form-error')).toBeVisible();await layout(page,'Validation');
    await action(page,'[data-action="close"]');
    await action(page,'[data-action="settings"]');await layout(page,'Settings');
    for(const backup of [generateBackup(c),legacyBackup()]){
      await page.locator('#restore-file').setInputFiles({name:'Synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
      await expect(page.getByRole('dialog',{name:'Restore career data'})).toBeVisible();
      await layout(page,'Restore preview');
      await action(page,'[data-action="settings"]');
    }
    await action(page,'[data-action="close"]');
    await page.evaluate(async({empty,theme})=>{
      const {database}=await import('/app/data/db.js');
      await database.replaceAllData(empty,{theme},await database.getGeneration());
    },{empty:collections(),theme});
    await page.reload();
    // Initialization seeds only foundational records, so empty screens remain usable.
    await layout(page,'Empty Home');
    await action(page,'[data-screen="vault"]');await expect(page.locator('.empty-state')).toBeVisible();await layout(page,'Empty Vault');
    await action(page,'[data-screen="profile"]');await layout(page,'Empty Profile');
  });
}
test('dialog focus, scroll lock, dirty confirmation and hash events preserve input',async({page})=>{
  await start(page);
  await page.locator('.mobile-nav [data-action="capture"]').click();
  await expect(page.getByRole('dialog')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.close-dialog')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#title')).toBeFocused();
  await expect(page.locator('.content-wrap')).toHaveAttribute('inert','');
  await expect(page.locator('.mobile-nav')).toHaveAttribute('inert','');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.close-dialog')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('[data-status="recorded"]')).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.locator('.close-dialog')).toBeFocused();
  await page.locator('#title').fill('Synthetic unsaved form');
  await page.evaluate(()=>location.hash='/vault');
  await expect(page.locator('#title')).toHaveValue('Synthetic unsaved form');
  page.once('dialog',d=>d.dismiss());await page.keyboard.press('Escape');
  await expect(page.locator('#title')).toHaveValue('Synthetic unsaved form');
  page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.mobile-nav [data-action="capture"]')).toBeFocused();
  await expect(page.locator('.content-wrap')).not.toHaveAttribute('inert','');
  // An invocation far down the page restores both its scroll and keyboard focus.
  await action(page,'[data-screen="home"]');
  await page.locator('.privacy-note [data-action="settings"]').scrollIntoViewIfNeeded();
  const scroll=await page.evaluate(()=>scrollY);
  await page.locator('.privacy-note [data-action="settings"]').click();
  await page.locator('.modal-body').evaluate(el=>el.scrollTop=el.scrollHeight);
  await action(page,'[data-action="close"]');
  expect(await page.evaluate(()=>scrollY)).toBe(scroll);
  await expect(page.locator('.privacy-note [data-action="settings"]')).toBeFocused();
});
test('short visual viewport keeps dialog footer and final input reachable',async({page})=>{
  await page.addInitScript(()=>{
    const viewport=new EventTarget();
    Object.defineProperties(viewport,{height:{value:812,writable:true},offsetTop:{value:0,writable:true}});
    Object.defineProperty(window,'visualViewport',{get:()=>viewport});
    window.syntheticViewport=viewport;
  });
  await start(page);await action(page,'[data-action="capture"]');
  await page.evaluate(()=>{syntheticViewport.height=360;syntheticViewport.offsetTop=40;syntheticViewport.dispatchEvent(new Event('resize'));});
  await expect(page.locator('html')).toHaveAttribute('data-compact-dialog','true');
  await page.locator('#outcome').scrollIntoViewIfNeeded();
  const rects=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom};};
    return {header:rect('.modal-header'),body:rect('.modal-body'),footer:rect('.modal-footer'),input:rect('#outcome')};
  });
  expect(rects.header.top).toBeGreaterThanOrEqual(40);
  expect(rects.body.top).toBeGreaterThanOrEqual(rects.header.bottom);
  expect(rects.body.bottom).toBeLessThanOrEqual(rects.footer.top);
  expect(rects.footer.bottom).toBeLessThanOrEqual(400);
  expect(rects.input.top).toBeGreaterThanOrEqual(rects.body.top);
  expect(rects.input.bottom).toBeLessThanOrEqual(rects.body.bottom);
});
test('export focus and invalid restore notification remain inside the dialog',async({page})=>{
  await start(page);await action(page,'[data-action="settings"]');
  const download=page.waitForEvent('download');await page.locator('#export-backup').click();await download;
  await expect(page.locator('#export-backup')).toBeFocused();
  await expect(page.locator('.modal #toast')).toContainText('Backup file generated');
  await page.locator('#restore-file').setInputFiles({name:'Synthetic-invalid.json',mimeType:'application/json',buffer:Buffer.from('{"bad":true}')});
  await expect(page.locator('.modal #toast')).toContainText('Cannot restore');
  await layout(page,'Notification');
  const geometry=await page.evaluate(()=>{
    const toast=document.querySelector('#toast').getBoundingClientRect(),body=document.querySelector('.modal-body').getBoundingClientRect();
    return {toastBottom:toast.bottom,bodyTop:body.top};
  });
  expect(geometry.toastBottom).toBeLessThanOrEqual(geometry.bodyTop);
});
test('native delete confirmation can cancel and then delete a synthetic achievement',async({page})=>{
  await start(page);await seed(page,'light');
  await action(page,'[data-action="detail"]');
  page.once('dialog',d=>d.dismiss());await action(page,'[data-action="delete-achievement"]');
  await expect(page.getByRole('dialog',{name:'Achievement details'})).toBeVisible();
  page.once('dialog',d=>{expect(d.message()).toContain('Permanently delete');return d.accept();});
  await action(page,'[data-action="delete-achievement"]');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#toast')).toContainText('Achievement deleted');
});
test('pending achievement save exposes busy state and prevents duplicate button submissions',async({page})=>{
  await start(page);await action(page,'[data-action="capture"]');
  await page.locator('#title').fill('Synthetic pending save');
  await page.locator('#contribution').fill('Synthetic contribution');
  await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    const original=database.saveAchievement.bind(database);
    const gate=new Promise(resolve=>window.syntheticReleaseSave=resolve);
    database.saveAchievement=async input=>{await gate;return original(input);};
  });
  await action(page,'[data-status="recorded"]');
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-busy','true');
  await expect(page.locator('[data-status="recorded"]')).toBeDisabled();
  await expect(page.locator('.close-dialog')).toBeDisabled();
  await page.evaluate(()=>syntheticReleaseSave());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#toast')).toContainText('Achievement saved');
  const count=await page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections.achievements.length;});
  expect(count).toBe(1);
});
test('loading and startup errors fit a narrow viewport without overflow',async({page})=>{
  await page.setViewportSize({width:320,height:812});
  await page.route('**/app/app/main.js',route=>route.abort());
  await page.goto('/');await expect(page.getByText('Opening CareerProof…')).toBeVisible();await layout(page,'Loading');
  await page.unroute('**/app/app/main.js');
  await page.goto('/__fixture__');
  await page.evaluate(async()=>{
    const request=indexedDB.open('careerproof-local',99);
    const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    db.close();
  });
  await page.goto('/');
  await expect(page.locator('.startup-error')).toBeVisible();await layout(page,'Startup error');
  await expect(page.getByRole('button',{name:'Retry'})).toBeVisible();
});
for(const theme of ['light','dark'])test('shared text and control tokens have AA contrast in '+theme,async({page})=>{
  await start(page);await seed(page,theme);
  const contrasts=await page.evaluate(()=>{
    const styles=getComputedStyle(document.documentElement);
    const color=name=>styles.getPropertyValue(name).trim();
    const luminance=hex=>{
      const expanded=hex.length===4?'#'+[...hex.slice(1)].map(c=>c+c).join(''):hex;
      const c=[1,3,5].map(i=>parseInt(expanded.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
      return c[0]*.2126+c[1]*.7152+c[2]*.0722;
    };
    const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    return {text:ratio(color('--text'),color('--surface')),muted:ratio(color('--muted'),color('--surface')),hint:ratio(color('--muted'),color('--teal-soft')),placeholder:ratio(color('--muted'),color('--canvas')),teal:ratio(color('--teal'),color('--teal-soft')),danger:ratio(color('--danger'),color('--danger-soft')),control:ratio(color('--control-line'),color('--canvas')),focus:ratio(color('--focus'),color('--surface'))};
  });
  for(const [name,ratio] of Object.entries(contrasts))expect(ratio,name).toBeGreaterThanOrEqual(['control','focus'].includes(name)?3:4.5);
});
