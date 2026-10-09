import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';

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
    expect(nav.items.map(x=>x.label)).toEqual(['Home','Vault','Add','Profile','Settings']);
    for(const [index,item] of nav.items.entries()){
      expect(item.height).toBe(60);expect(item.width).toBeGreaterThanOrEqual(44);
      expect(item.frame).toBe(24);expect(item.frameHeight).toBe(24);
      expect(item.size).toBe(width<=390?19:20);expect(item.stroke).toBe('1.8px');expect(item.font).toBe('10.5px');
      expect(Math.abs(item.iconX-item.center)).toBeLessThan(.1);
      expect(item.iconY).toBe(nav.items[0].iconY);expect(item.labelY).toBe(nav.items[0].labelY);
      if(index){expect(Math.abs(item.width-nav.items[0].width)).toBeLessThan(.1);expect(Math.abs((item.center-nav.items[index-1].center)-(nav.items[1].center-nav.items[0].center))).toBeLessThan(.1);}
    }
    expect(nav.items[0].background).toBe('rgba(0, 0, 0, 0)');expect(nav.items[2].circle).toBe('34px');
    await info.attach('navigation',{body:await page.locator('.mobile-nav').screenshot(),contentType:'image/png'});
    await page.locator('.mobile-create').click();
    await expect(page.getByRole('dialog')).toBeFocused();
    expect(await page.locator('.modal-body').evaluate(el=>el.scrollTop)).toBe(0);
    const titleLabel=await page.locator('label[for=title]').boundingBox(),body=await page.locator('.modal-body').boundingBox();
    expect(titleLabel.y).toBeGreaterThanOrEqual(body.y);
    const fields=await page.locator('#title,#contribution,#occurredOn,#impactCategory,#outcome').evaluateAll(nodes=>nodes.map(el=>{
      const r=el.getBoundingClientRect(),field=el.closest('.field').getBoundingClientRect(),body=el.closest('.modal-body'),b=body.getBoundingClientRect(),s=getComputedStyle(el),bs=getComputedStyle(body);
      return {id:el.id,left:r.left,right:r.right,width:r.width,height:r.height,fieldLeft:field.left,fieldRight:field.right,bodyLeft:b.left+parseFloat(bs.paddingLeft),bodyRight:b.right-parseFloat(bs.paddingRight),appearance:s.appearance,align:s.textAlign,border:s.borderTopWidth,borderColor:s.borderTopColor,radius:s.borderTopLeftRadius,bg:s.backgroundColor,font:s.fontSize,padding:s.padding,line:s.lineHeight};
    }));
    for(const f of fields){expect(f.left).toBeGreaterThanOrEqual(f.bodyLeft-.1);expect(f.right).toBeLessThanOrEqual(f.bodyRight+.1);expect(f.left).toBe(f.fieldLeft);expect(f.right).toBe(f.fieldRight);expect(f.font).toBe('16px');}
    const date=fields.find(f=>f.id==='occurredOn'),title=fields.find(f=>f.id==='title'),category=fields.find(f=>f.id==='impactCategory');
    expect(date.height).toBe(48);expect(date.width).toBe(title.width);expect(category.height).toBe(48);
    for(const key of ['border','borderColor','radius','bg','font','padding','line'])expect(date[key],key).toBe(title[key]);
    expect(date.appearance).toBe('none');expect(date.align).toBe('left');
    await expect(page.getByLabel('Occurrence date',{exact:true})).toHaveAttribute('type','date');
    await page.getByLabel('Occurrence date',{exact:true}).fill('2024-02-29');
    await info.attach('date-and-category',{body:await page.locator('.field-row').screenshot(),contentType:'image/png'});
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
        return {header:r('.modal-header'),body:r('.modal-body'),label:r('label[for=outcome]'),input:r('#outcome'),footer:r('.modal-footer'),buttons:[...document.querySelectorAll('.modal-footer button')].map(el=>{const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height,width:b.width};})};
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
  expect(await page.locator('.mobile-create').evaluate(el=>el.getBoundingClientRect().height)).toBe(60);
  await page.locator('.mobile-nav [data-screen=profile]').click();await page.locator('[data-action=edit-profile]').last().click();
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
    await expect(date).toHaveAttribute('type',occurredStart?.precision==='year'?'text':occurredStart?.precision==='month'?'month':'date');
    if(occurredStart?.precision!=='year')expect(await date.evaluate(el=>getComputedStyle(el).appearance)).toBe('none');
    await page.locator('#title').fill('Edited synthetic precision entry');
    await page.locator(`[data-status=${occurredStart?'recorded':'draft'}]`).click();await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
    const out=(await snapshot(page)).collections.achievements.find(x=>x.id===a.id);
    expect(out.occurredStart).toEqual(occurredStart);expect(out.id).toBe(before.id);expect(out.createdAt).toBe(before.createdAt);expect(out.revision).toBe(before.revision+1);
    for(const key of ['actions','situation','confidentiality','roleId','occurredEnd'])expect(out[key]).toEqual(before[key]);
    expect(out).not.toHaveProperty('occurredOn');
    await page.locator(`.achievement-row[data-id="${a.id}"]`).first().click();await page.locator('[data-action=toggle-archive]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
    const archived=(await snapshot(page)).collections.achievements.find(x=>x.id===a.id);expect(archived.status).toBe('archived');expect(archived.occurredStart).toEqual(occurredStart);
    await page.locator('.mobile-nav [data-screen=vault]').click();await page.locator('#status-filter').selectOption('archived');
    await page.locator(`.achievement-row[data-id="${a.id}"]`).click();await page.locator('[data-action=toggle-archive]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
    const restored=(await snapshot(page)).collections.achievements.find(x=>x.id===a.id);expect(restored.status).toBe(occurredStart?'recorded':'draft');expect(restored.occurredStart).toEqual(occurredStart);
  });
}
test('a deliberately cleared new draft remains unspecified after reopening',async({page})=>{
  await start(page);await page.locator('.mobile-create').click();await page.locator('#title').fill('Synthetic blank-date draft');await page.locator('#occurredOn').fill('');
  await page.locator('[data-status=draft]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  const a=(await snapshot(page)).collections.achievements[0];expect(a.occurredStart).toBeNull();
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();await edit(page,a.id);await expect(page.locator('#occurredOn')).toHaveValue('');
});
