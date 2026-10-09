import {test,expect} from '@playwright/test';

test.use({isMobile:true,hasTouch:true});

async function openWithViewport(page,theme,width){
  await page.setViewportSize({width,height:812});
  await page.addInitScript(theme=>{
    localStorage.setItem('careerproof-theme',theme);
    const viewport=new EventTarget();
    Object.assign(viewport,{height:812,offsetTop:0,scale:1});
    Object.defineProperty(window,'visualViewport',{configurable:true,get:()=>viewport});
    window.syntheticViewport=viewport;
  },theme);
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.locator('.mobile-create').click();
  await expect(page.getByRole('dialog',{name:'Capture an achievement'})).toBeFocused();
}

async function stepKeyboard(page,height){
  await page.evaluate(height=>{
    syntheticViewport.height=height;
    syntheticViewport.offsetTop=40;
    syntheticViewport.dispatchEvent(new Event('resize'));
    syntheticViewport.dispatchEvent(new Event('scroll'));
  },height);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.style.getPropertyValue('--visual-height'))).toBe(height+'px');
}

async function focusedGeometry(page){
  return page.evaluate(()=>{
    const field=document.activeElement?.closest('.field');
    const scrollport=field?.closest('.modal-body');
    if(!field||!scrollport)throw Error('Focused field has no modal scrollport');
    const f=field.getBoundingClientRect(),b=scrollport.getBoundingClientRect();
    const c=document.activeElement.getBoundingClientRect(),label=field.querySelector('label').getBoundingClientRect();
    const styles=getComputedStyle(scrollport);
    const top=b.top+Math.min(parseFloat(styles.paddingTop)||0,12)+4;
    const bottom=b.bottom-Math.min(parseFloat(styles.paddingBottom)||0,12)-4;
    return {top,bottom,fieldTop:f.top,fieldBottom:f.bottom,fieldHeight:f.height,
      labelTop:label.top,labelBottom:label.bottom,controlTop:c.top,controlBottom:c.bottom,
      controlVisible:Math.max(0,Math.min(c.bottom,bottom)-Math.max(c.top,top)),
      scrollTop:scrollport.scrollTop,viewportHeight:syntheticViewport.height,
      footerTop:document.querySelector('.modal-footer').getBoundingClientRect().top,
      footerBottom:document.querySelector('.modal-footer').getBoundingClientRect().bottom,
      dialogBottom:document.querySelector('.modal').getBoundingClientRect().bottom};
  });
}

for(const theme of ['light','dark'])for(const width of [320,375,390,430]){
  test(`Outcome auto-reveals during staged iOS keyboard animation: ${width}px ${theme}`,async({page})=>{
    await openWithViewport(page,theme,width);

    // Focus without Playwright's scrollIntoViewIfNeeded, reproducing the
    // actual bug: a low field remains covered unless the app scrolls itself.
    await page.locator('#outcome').evaluate(node=>node.focus({preventScroll:true}));
    for(const height of [700,550,430,360,300]){
      await stepKeyboard(page,height);
      await expect.poll(async()=>{
        const v=await focusedGeometry(page);
        // Even if a textarea does not fit completely, its beginning is
        // readable and above the persistent Save footer.
        return v.controlVisible>=Math.min(42,(v.bottom-v.top)/2)
          &&v.controlTop<v.bottom-16
          &&v.labelTop>=v.top-2
          &&v.footerBottom<=40+height+1
          &&v.controlTop<v.footerTop;
      },{timeout:2500}).toBe(true);
    }

    // Cursor/typing should not re-hide the outcome or reset the modal scroll.
    await page.locator('#outcome').fill('Synthetic outcome with several words. '.repeat(18));
    await expect.poll(async()=> (await focusedGeometry(page)).controlVisible).toBeGreaterThan(42);

    // Switching fields while the keyboard is open automatically reveals each
    // field's label and input, without manually scrolling a parent viewport.
    for(const selector of ['#title','#contribution','#outcome']){
      await page.locator(selector).evaluate(node=>node.focus({preventScroll:true}));
      await expect.poll(async()=>{
        const v=await focusedGeometry(page);
        return v.labelTop>=v.top-2&&v.controlVisible>=Math.min(42,(v.bottom-v.top)/2);
      },{timeout:2500}).toBe(true);
    }

    await page.locator('#outcome').evaluate(node=>node.blur());
    await stepKeyboard(page,812);
    await expect(page.locator('html')).toHaveAttribute('data-keyboard-open','false');
    await expect(page.locator('.modal')).toBeVisible();
  });
}

test('late keyboard resize after focus reveals Outcome without a second tap',async({page})=>{
  await openWithViewport(page,'dark',390);
  await page.locator('#outcome').evaluate(node=>node.focus({preventScroll:true}));
  // Focus has occurred but iOS has not resized yet.
  await page.waitForTimeout(75);
  for(const height of [710,620,520,360]){
    await stepKeyboard(page,height);
  }
  await expect.poll(async()=>{
    const v=await focusedGeometry(page);
    return v.controlVisible>50&&v.labelTop>=v.top-2&&v.footerBottom<=400;
  },{timeout:2500}).toBe(true);
  // A scroll event after resize must not undo the focus correction.
  await page.evaluate(()=>syntheticViewport.dispatchEvent(new Event('scroll')));
  await expect.poll(async()=>(await focusedGeometry(page)).controlVisible).toBeGreaterThan(50);
});
