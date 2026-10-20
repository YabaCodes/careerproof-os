import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';
import {openMore,vaultStatus} from './ux-helpers.mjs';

test.use({isMobile:true,hasTouch:true});
async function start(page,theme='light'){
  await page.addInitScript(theme=>localStorage.setItem('careerproof-theme',theme),theme);
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
}
async function snapshot(page){
  return page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return database.readSnapshot();});
}
async function edit(page,id){
  await page.locator(`.achievement-row[data-id="${id}"]`).first().click();
  await page.locator('[data-action="edit-achievement"]').click();
}
async function viewportFixture(page){
  await page.addInitScript(()=>{
    const viewport=new EventTarget();
    Object.assign(viewport,{height:812,offsetTop:0,scale:1});
    Object.defineProperty(window,'visualViewport',{get:()=>viewport});
    window.syntheticViewport=viewport;
  });
}
async function resize(page,height,scale=1){
  await page.evaluate(({height,scale})=>{
    Object.assign(syntheticViewport,{height,offsetTop:40,scale});
    syntheticViewport.dispatchEvent(new Event('resize'));
  },{height,scale});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.style.getPropertyValue('--visual-height'))).toBe(height+'px');
}
for(const theme of ['light','dark'])for(const width of [320,375,390,430]){
  test(`date controls and compact navigation: ${width}px ${theme}`,async({page},info)=>{
    await page.setViewportSize({width,height:812});await start(page,theme);
    const nav=await page.locator('.mobile-nav').evaluate(el=>{
      const box=el.getBoundingClientRect();
      return {height:box.height,paddingTop:getComputedStyle(el).paddingTop,paddingBottom:getComputedStyle(el).paddingBottom,
        items:[...el.children].map(button=>{
          const r=button.getBoundingClientRect(),frame=button.querySelector('.nav-icon'),f=frame.getBoundingClientRect(),svg=button.querySelector('svg'),s=svg.getBoundingClientRect(),label=button.querySelector('span:last-child'),l=label.getBoundingClientRect();
          return {label:label.textContent,width:r.width,height:r.height,center:r.x+r.width/2,iconX:f.x+f.width/2,iconY:f.y+f.height/2,frame:f.width,frameHeight:f.height,size:s.width,stroke:getComputedStyle(svg).strokeWidth,labelY:l.top,font:getComputedStyle(button).fontSize,background:getComputedStyle(button).backgroundColor,circle:getComputedStyle(frame,'::before').width};
        })};
    });
    expect(nav.height).toBe(61); // 60px content plus one divider; zero device inset here.
    expect(nav.paddingTop).toBe('0px');expect(nav.paddingBottom).toBe('0px');
    // DEC-029/030: five content tabs, Wealth OS line icons; capture and Settings moved to the header.
    expect(nav.items.map(x=>x.label)).toEqual(['Home','Vault','Experience','Skills','Studio']);
    for(const [index,item] of nav.items.entries()){
      expect(item.height).toBe(60);expect(item.width).toBeGreaterThanOrEqual(44);
      expect(item.frame).toBe(24);expect(item.frameHeight).toBe(24);
      expect(item.size).toBe(21);expect(item.stroke).toBe(index===0?'2.05px':'1.8px');expect(item.font).toBe('10.5px');
      expect(Math.abs(item.iconX-item.center)).toBeLessThan(.1);
      expect(item.iconY).toBe(nav.items[0].iconY);expect(item.labelY).toBe(nav.items[0].labelY);
      if(index){expect(Math.abs(item.width-nav.items[0].width)).toBeLessThan(.1);expect(Math.abs((item.center-nav.items[index-1].center)-(nav.items[1].center-nav.items[0].center))).toBeLessThan(.1);}
    }
    for(const item of nav.items)expect(item.background).toBe('rgba(0, 0, 0, 0)');
    await info.attach('navigation',{body:await page.locator('.mobile-nav').screenshot(),contentType:'image/png'});
    await page.locator('.mobile-create').click();
    await expect(page.getByRole('dialog')).toBeFocused();
    expect(await page.locator('.modal-body').evaluate(el=>el.scrollTop)).toBe(0);
    const titleLabel=await page.locator('label[for=title]').boundingBox(),body=await page.locator('.modal-body').boundingBox();
    expect(titleLabel.y).toBeGreaterThanOrEqual(body.y);
    // CP-UX2: "What happened?" (step 2) holds title, what you did and result; the date is on step 3.
    const measureFields=selector=>page.locator(selector).evaluateAll(nodes=>nodes.map(el=>{
      const r=el.getBoundingClientRect(),field=el.closest('.field').getBoundingClientRect(),body=el.closest('.modal-body'),b=body.getBoundingClientRect(),s=getComputedStyle(el),bs=getComputedStyle(body);
      return {id:el.id,left:r.left,right:r.right,width:r.width,height:r.height,fieldLeft:field.left,fieldRight:field.right,bodyLeft:b.left+parseFloat(bs.paddingLeft),bodyRight:b.right-parseFloat(bs.paddingRight),appearance:s.appearance,align:s.textAlign,border:s.borderTopWidth,borderColor:s.borderTopColor,radius:s.borderTopLeftRadius,bg:s.backgroundColor,font:s.fontSize,padding:s.padding,line:s.lineHeight};
    }));
    const fields=await measureFields('#title,#contribution,#outcome');
    await page.locator('#title').fill('Synthetic date check');
    await page.locator('[data-action=capture-next]').click();
    fields.push(...await measureFields('#occurredOn'));
    expect(fields).toHaveLength(4);
    for(const f of fields){expect(f.left).toBeGreaterThanOrEqual(f.bodyLeft-.1);expect(f.right).toBeLessThanOrEqual(f.bodyRight+.1);expect(f.left).toBe(f.fieldLeft);expect(f.right).toBe(f.fieldRight);expect(f.font).toBe('16px');}
    const date=fields.find(f=>f.id==='occurredOn'),title=fields.find(f=>f.id==='title');
    expect(date.height).toBe(48);expect(date.width).toBe(title.width);
    for(const key of ['border','borderColor','radius','bg','font','padding','line'])expect(date[key],key).toBe(title[key]);
    expect(date.appearance).toBe('none');expect(date.align).toBe('left');
    // CP-UX1: month is the default precision; the exact day is one tap away.
    await expect(page.getByRole('group',{name:'When did it happen?'})).toBeAttached();
    await expect(page.locator('#capture-title-3')).toHaveText('When Did It Happen?');
    await expect(page.locator('#occurredPrecision-month')).toBeChecked();
    await expect(page.getByLabel('Occurrence date',{exact:true})).toHaveAttribute('type','month');
    const options=await page.locator('.precision-option').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
    expect(options).toHaveLength(3);for(const h of options)expect(h).toBeGreaterThanOrEqual(40);
    await page.locator('#occurredPrecision-day').check();
    await expect(page.getByLabel('Occurrence date',{exact:true})).toHaveAttribute('type','date');
    await page.getByLabel('Occurrence date',{exact:true}).fill('2024-02-29');
    await info.attach('date-and-category',{body:await page.locator('.date-field').screenshot(),contentType:'image/png'});
    expect(await page.locator('.modal-body').evaluate(el=>el.scrollWidth-el.clientWidth)).toBe(0);
  });
  test(`keyboard viewport preserves labels and footer: ${width}px ${theme}`,async({page})=>{
    await page.setViewportSize({width,height:812});await viewportFixture(page);await start(page,theme);
    await page.evaluate(()=>document.documentElement.style.setProperty('--safe-bottom','34px'));
    await page.locator('.mobile-create').click();
    // The idle footer reserves the synthetic home-indicator inset exactly once.
    expect(await page.locator('.modal-footer').evaluate(el=>getComputedStyle(el).paddingBottom)).toBe('46px');
    for(const height of [360,300]){
      await page.locator('#outcome').focus();await resize(page,height);
      await expect(page.locator('html')).toHaveAttribute('data-keyboard-open','true');
      await expect.poll(()=>page.locator('.modal-footer').evaluate(el=>getComputedStyle(el).paddingBottom)).toBe('8px');
      // The correction happens after CSS reflow on two rendering frames.
      // Wait for final geometry instead of racing the keyboard resize event.
      const measure=()=>page.evaluate(()=>{
        const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {top:b.top,bottom:b.bottom};};
        return {header:r('.modal-header'),body:r('.modal-body'),label:r('label[for=outcome]'),input:r('#outcome'),footer:r('.modal-footer'),buttons:[...document.querySelectorAll('.modal-footer button')].filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height,width:b.width};})};
      });
      await expect.poll(async()=>{
        const b=await measure();
        return b.label.top>=b.body.top-1&&b.input.bottom<=b.body.bottom+1;
      },{timeout:3000}).toBe(true);
      const bounds=await measure();
      expect(bounds.header.top).toBeGreaterThanOrEqual(40);expect(bounds.footer.bottom).toBeLessThanOrEqual(40+height);
      expect(bounds.body.top).toBeGreaterThanOrEqual(bounds.header.bottom);expect(bounds.body.bottom).toBeLessThanOrEqual(bounds.footer.top);
      expect(bounds.label.top).toBeGreaterThanOrEqual(bounds.body.top);expect(bounds.input.bottom).toBeLessThanOrEqual(bounds.body.bottom);
      for(const b of bounds.buttons){expect(b.height).toBeGreaterThanOrEqual(44);expect(b.width).toBeGreaterThanOrEqual(44);expect(b.top).toBeGreaterThanOrEqual(bounds.footer.top);expect(b.bottom).toBeLessThanOrEqual(bounds.footer.bottom);expect(bounds.footer.bottom-b.bottom).toBe(8);}
      await page.locator('.modal-body').evaluate(el=>el.scrollTop=el.scrollHeight);
      await expect(page.locator('.form-guidance')).toBeInViewport();
      // Re-focus reclaims label context after manual scrolling, without page panning.
      await page.locator('#title').focus();await page.locator('#outcome').focus();
    }
    await resize(page,812);await expect(page.locator('html')).toHaveAttribute('data-keyboard-open','false');
    expect(await page.locator('.modal-footer').evaluate(el=>getComputedStyle(el).paddingBottom)).toBe('46px');
    await resize(page,360,2);await expect(page.locator('html')).toHaveAttribute('data-keyboard-open','false');
  });
}
test('safe-area inset is separate from navigation content and shared profile footer',async({page})=>{
  await start(page);await page.evaluate(()=>document.documentElement.style.setProperty('--safe-bottom','34px'));
  expect(await page.locator('.mobile-nav').evaluate(el=>el.getBoundingClientRect().height)).toBe(95);
  expect(await page.locator('.mobile-nav .nav-item').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height))).toEqual([60,60,60,60,60]);
  await page.locator('.header-profile').click();await page.locator('[data-action=edit-profile]').last().click();
  await expect(page.getByRole('dialog')).toBeFocused();expect(await page.locator('.modal-body').evaluate(el=>el.scrollTop)).toBe(0);
  expect(await page.locator('.modal-footer').evaluate(el=>getComputedStyle(el).paddingBottom)).toBe('46px');
});
for(const occurredStart of [null,{value:'2024',precision:'year'},{value:'2024-06',precision:'month'},{value:'2024-02-29',precision:'day'}]){
  test(`editing preserves ${occurredStart?.precision??'unspecified'} date and archive records`,async({page})=>{
    await start(page,'dark');
    const c=fullCollections(),a=c.achievements[0];a.occurredStart=occurredStart;
    if(!occurredStart){a.status='draft';a.preArchiveStatus=null;}
    await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'dark'},await database.getGeneration());},c);
    await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
    const before=(await snapshot(page)).collections.achievements[0];
    await edit(page,a.id);const date=page.getByLabel(/Occurrence date/);
    await expect(date).toHaveValue(occurredStart?.value??'');
    // CP-UX1: an undated record opens at the default Month precision; a stored precision is kept.
    await expect(date).toHaveAttribute('type',occurredStart?.precision==='year'?'text':occurredStart?.precision==='day'?'date':'month');
    await expect(page.locator('#occurredPrecision-'+(occurredStart?.precision??'month'))).toBeChecked();
    if(occurredStart?.precision!=='year')expect(await date.evaluate(el=>getComputedStyle(el).appearance)).toBe('none');
    await page.locator('#title').fill('Edited synthetic precision entry');
    await page.locator(`[data-status=${occurredStart?'recorded':'draft'}]`).click();await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
    const out=(await snapshot(page)).collections.achievements.find(x=>x.id===a.id);
    expect(out.occurredStart).toEqual(occurredStart);expect(out.id).toBe(before.id);expect(out.createdAt).toBe(before.createdAt);expect(out.revision).toBe(before.revision+1);
    for(const key of ['actions','situation','confidentiality','roleId','occurredEnd'])expect(out[key]).toEqual(before[key]);
    expect(out).not.toHaveProperty('occurredOn');
    await page.locator(`.achievement-row[data-id="${a.id}"]`).first().click();await openMore(page);await page.locator('[data-action=toggle-archive]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
    const archived=(await snapshot(page)).collections.achievements.find(x=>x.id===a.id);expect(archived.status).toBe('archived');expect(archived.occurredStart).toEqual(occurredStart);
    await page.locator('.mobile-nav [data-screen=vault]').click();await vaultStatus(page,'archived');
    await page.locator(`.achievement-row[data-id="${a.id}"]`).click();await openMore(page);await page.locator('[data-action=toggle-archive]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
    const restored=(await snapshot(page)).collections.achievements.find(x=>x.id===a.id);expect(restored.status).toBe(occurredStart?'recorded':'draft');expect(restored.occurredStart).toEqual(occurredStart);
  });
}
test('a new draft has no date unless one is entered on "When did it happen?"',async({page})=>{
  // CP-UX2: a draft saved from "What happened?" never gets the pre-filled month it was not shown.
  await start(page);await page.locator('.mobile-create').click();await page.locator('#title').fill('Synthetic step-two draft');
  await page.locator('[data-status=draft]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await snapshot(page)).collections.achievements[0].occurredStart).toBeNull();
  // A date deliberately cleared on step 3 stays unspecified too, also after reopening.
  await page.locator('.mobile-create').click();await page.locator('#title').fill('Synthetic blank-date draft');
  await page.locator('[data-action=capture-next]').click();await page.locator('#occurredOn').fill('');
  await page.locator('[data-status=draft]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  const a=(await snapshot(page)).collections.achievements.find(x=>x.title==='Synthetic blank-date draft');expect(a.occurredStart).toBeNull();
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();await edit(page,a.id);await expect(page.locator('#occurredOn')).toHaveValue('');
});

// CP-011D.1 native iPhone report, carried into CP-UX2: on every capture step, no control
// shares physical space with another or leaves the modal, including expanded optional sections.
for(const theme of ['light','dark'])for(const width of [320,375,390,430]){
  test('capture steps keep every control inside the iPhone modal without overlap: '+width+'px '+theme,async({page})=>{
    await page.setViewportSize({width,height:812});
    await start(page,theme);
    const c=fullCollections();c.projects.push({...c.projects[0],id:'project-2',name:'Synthetic second experience with a long name that wraps onto two lines'});
    await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
    await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
    await page.locator('.mobile-create').click();
    const form=page.locator('#achievement-form');
    // Visible controls of the current step: inside the scrollport, no overlaps, no sideways scroll.
    async function check(step){
      const r=await form.evaluate(el=>{
        const b=el.getBoundingClientRect();
        const boxes=[...el.querySelectorAll('input:not([type=radio]):not([type=checkbox]):not([type=hidden]),textarea,select,button,label.where-option,label.skill-chip,.capture-switch')]
          .filter(x=>x.getClientRects().length&&!x.closest('[hidden]')).map(x=>{const q=x.getBoundingClientRect();return {id:x.id||x.className||x.tagName,top:q.top,bottom:q.bottom,left:q.left,right:q.right,h:q.height};});
        return {overflow:el.scrollWidth-el.clientWidth,left:b.left,right:b.right,boxes};
      });
      expect(r.overflow,step+' sideways scroll').toBeLessThanOrEqual(1);
      for(const x of r.boxes){expect(x.left,step+' '+x.id).toBeGreaterThanOrEqual(r.left-.5);expect(x.right,step+' '+x.id).toBeLessThanOrEqual(r.right+.5);}
      const outside=r.boxes.filter(x=>!x.id.includes('skill-chip')&&!x.id.includes('precision'));
      for(let i=0;i<outside.length;i++)for(let j=i+1;j<outside.length;j++){
        const a=outside[i],o=outside[j];const nested=a.top<=o.top&&a.bottom>=o.bottom&&a.left<=o.left&&a.right>=o.right||o.top<=a.top&&o.bottom>=a.bottom&&o.left<=a.left&&o.right>=a.right;
        if(nested)continue; // e.g. a radio label containing nothing else measured
        const overlap=Math.min(a.bottom,o.bottom)-Math.max(a.top,o.top)>1&&Math.min(a.right,o.right)-Math.max(a.left,o.left)>1;
        expect(overlap,step+' '+a.id+' overlaps '+o.id).toBe(false);
      }
    }
    await expect(form).toHaveAttribute('data-step','1');
    await page.locator('[data-action=where-show-all]').isVisible().then(v=>v?page.locator('[data-action=where-show-all]').click():null);
    await page.locator('[data-action=toggle-inline-experience]').click();
    await check('Where');
    await page.locator('input[name=where][value=project-2]').check();
    await page.locator('[data-action=capture-next]').click();
    await page.locator('[data-action=toggle-capture-extra][aria-controls=capture-situation]').click();
    await expect(page.locator('#rich-situation')).toBeFocused();
    await page.locator('#title').fill('Synthetic overlap check');
    await check('What');
    await page.locator('[data-action=capture-next]').click();
    for(const id of ['capture-metrics','capture-evidence'])await page.locator(`[aria-controls=${id}]`).click();
    await page.locator('[data-action=find-skill]').click();
    await page.locator('details.capture-more > summary').click();
    await check('When');
    for(const h of await page.locator('.skill-chip:visible, .capture-add-row, .capture-switch').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height)))expect(h).toBeGreaterThanOrEqual(40);
    await page.locator('[data-action=save-achievement][data-status=draft]').click();
    await expect(form).toHaveCount(0);
    const saved=(await snapshot(page)).collections;
    expect(saved.achievements.some(x=>x.title==='Synthetic overlap check')).toBe(true);
    // Rows opened but left empty are not saved as metrics or evidence.
    expect(saved.impactMetrics).toHaveLength(1);expect(saved.evidenceReferences).toHaveLength(1);
  });
}
