import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';

// CP-012.3: Title Case for app-authored titles and subtitles; most recent employer first.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});

const MINOR=new Set(['a','an','and','as','at','but','by','for','from','in','into','nor','of','on','or','per','the','to','via','vs','with']);
/** Words that break Title Case: minor words stay lower case unless first, last or after a full stop. */
function titleCaseViolations(text){
  const words=text.trim().split(/\s+/).filter(Boolean);
  return words.filter((word,i)=>{
    const core=word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
    if(!core||!/^\p{L}/u.test(core))return false; // numbers and symbols
    const edge=i===0||i===words.length-1||/[.:?!]$/.test(words[i-1]);
    if(MINOR.has(core.toLowerCase())&&!edge)return core!==core.toLowerCase();
    return core[0]!==core[0].toUpperCase();
  });
}
// App-authored titles only. User-entered names are never re-cased.
const TITLE_SELECTORS=['.page-title h1','.page-title p','#next-title','.section-title h2','.career-section-heading h2','#dialog-title',
  '.modal legend','.settings-group h3','.settings-line strong','.rich-section-heading h3','#removal-impact-title','.health-group','.portfolio-detail strong','.empty-state h3'].join(',');
async function expectTitleCase(page,where){
  const texts=await page.locator(TITLE_SELECTORS).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>n.textContent.replace(/\s+/g,' ').trim()).filter(Boolean));
  expect(texts.length,where+' has titles to check').toBeGreaterThan(0);
  const bad=texts.map(t=>({t,words:titleCaseViolations(t)})).filter(x=>x.words.length);
  expect(bad,where).toEqual([]);
  return texts;
}
async function seed(page,c){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  if(c)await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const tab=(page,screen)=>page.locator(`.mobile-nav [data-screen=${screen}]`).click();
const close=page=>page.locator('.close-dialog').click();

test('CP-012.3 titles and subtitles use Title Case on every screen and main dialog',async({page})=>{
  await seed(page);
  expect(await expectTitleCase(page,'empty home')).toEqual(expect.arrayContaining(['CareerProof','Record the Work. Prove the Impact.','Capture Your First Achievement','Quick Capture']));
  await tab(page,'vault');
  expect(await expectTitleCase(page,'empty vault')).toEqual(expect.arrayContaining(['Your Record of Contributions and Results','Start Documenting Your Impact']));

  await seed(page,fullCollections());
  expect(await expectTitleCase(page,'home')).toContain('Welcome Back, Synthetic');
  await tab(page,'vault');
  expect(await expectTitleCase(page,'vault')).toContain('1 Achievement · 0 Drafts');
  await tab(page,'portfolio');
  await page.locator('details.portfolio-card summary').first().click();
  expect(await expectTitleCase(page,'experience')).toEqual(expect.arrayContaining(['1 Experience','Associated Roles','Linked Achievements (1)']));
  await tab(page,'competencies');
  expect(await expectTitleCase(page,'skills')).toContain('1 of 33 Skills with Examples');
  await tab(page,'profile');
  expect(await expectTitleCase(page,'profile')).toEqual(expect.arrayContaining(['Identity, Work History and Qualifications','Employment History','Education','Certifications & Credentials']));

  const dialogs=[
    ['settings','.header-settings',['Settings & Data','Data Management','Export Career Backup','Data Health','Restore from Backup','Check for Updates']],
    ['capture','.mobile-create',['Capture an Achievement','Associated Experiences','Competencies Demonstrated','Impact Metrics','Evidence References']],
    ['profile editor','[data-action=edit-profile]',['Edit Career Profile']],
    ['role editor','[data-action=add-career][data-kind=roles]',['Add Employment Role']],
    ['credential editor','[data-action=add-career][data-kind=credentials]',['Add Credential']]
  ];
  for(const [name,trigger,expected] of dialogs){
    await page.locator(trigger).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    if(name==='capture')await page.locator('[data-action=toggle-rich-panel]').click();
    expect(await expectTitleCase(page,name)).toEqual(expect.arrayContaining(expected));
    await close(page);
  }
  await tab(page,'portfolio');
  await page.locator('[data-action=add-project]').first().click();
  expect(await expectTitleCase(page,'experience editor')).toEqual(expect.arrayContaining(['Add Experience','Associated Employment Roles']));
  await close(page);
  await page.locator('details.portfolio-card summary').first().click();
  await page.locator('[data-action=remove-project]').click();
  expect(await expectTitleCase(page,'removal sheet')).toEqual(expect.arrayContaining(['Delete Experience “Synthetic Initiative”?','Linked to This Experience','What Should Happen to Them?']));
  await close(page);
  // User-entered text is never re-cased.
  await tab(page,'profile');
  await expect(page.locator('.career-employer h3').first()).toHaveText('Synthetic Company');
});

test('CP-012.3 the most recent employer stays first when an older employer is added afterwards',async({page})=>{
  await seed(page);
  await tab(page,'profile');
  const addEmployer=async name=>{
    await page.locator('[data-action=add-career][data-kind=employers]').first().click();
    await page.locator('#career-name').fill(name);
    await page.locator('[data-action=save-career]').click();await expect(page.locator('#career-form')).toHaveCount(0);
  };
  const addRole=async(employer,title,start,end)=>{
    await page.locator('.career-employer').filter({has:page.getByRole('heading',{name:employer,exact:true})}).locator('[data-action=add-career][data-kind=roles]').click();
    await page.locator('#career-title').fill(title);
    await page.locator('#career-startDate-precision').selectOption('year');await page.locator('#career-startDate').fill(start);
    if(end){await page.locator('#career-endDate-precision').selectOption('year');await page.locator('#career-endDate').fill(end);}
    else await page.locator('#career-isCurrent').check();
    await page.locator('[data-action=save-career]').click();await expect(page.locator('#career-form')).toHaveCount(0);
  };
  const order=()=>page.locator('.career-employer > .career-employer-head h3');
  // The reported flow: current employer first, then the previous one. Names deliberately sort the other way.
  await addEmployer('Zephyr Recent Labs');
  await addRole('Zephyr Recent Labs','Lead Engineer','2022');
  await addEmployer('Alder Older Works');
  await expect(order()).toHaveText(['Zephyr Recent Labs','Alder Older Works']); // no roles yet: after the dated timeline
  await addRole('Alder Older Works','Engineer','2016','2019');
  await addEmployer('Birch Middle Systems');
  await addRole('Birch Middle Systems','Senior Engineer','2019','2022');
  await expect(order()).toHaveText(['Zephyr Recent Labs','Birch Middle Systems','Alder Older Works']);
  // A promotion inside the current employer lists the newest role first.
  await addRole('Zephyr Recent Labs','Principal Engineer','2024');
  await expect(page.locator('.career-employer').first().locator('.career-role h3')).toHaveText(['Principal Engineer','Lead Engineer']);
  await page.reload();
  await tab(page,'profile');
  await expect(order()).toHaveText(['Zephyr Recent Labs','Birch Middle Systems','Alder Older Works']);
});
