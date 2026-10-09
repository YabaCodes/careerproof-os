import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';

test.use({isMobile:true,hasTouch:true});

const longEmployer='Medical device engineering, automated assembly, process development, manufacturing quality and regulated product operations. '.repeat(7);
const longRole='Lead technical development, industrialization, integration, and validation of highly automated assembly equipment in regulated manufacturing. '.repeat(6);
const longEducation='Advanced engineering research, product validation and systematic design studies supporting industrial applications. '.repeat(6);
const longCredential='Continuing professional development supported by documented examinations, verified competence and maintenance requirements. '.repeat(6);

async function seed(page){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  const c=fullCollections();
  c.employers[0].name='Synthetic Medical';
  c.employers[0].description=longEmployer;
  c.roles[0].title='Senior Process Engineer';
  c.roles[0].startDate={value:'2026-04',precision:'month'};
  c.roles[0].employmentType='Full Time';
  c.roles[0].responsibilities=longRole;
  c.roles[0].leadershipScope='Lead a cross-functional engineering group';
  c.roles[0].technologies=['PLC','Validation','Robot cells'];
  c.roles.push({...c.roles[0],id:'role-2',title:'Process Engineer',startDate:{value:'2023-10',precision:'month'},endDate:{value:'2026-04',precision:'month'},
    isCurrent:false,responsibilities:'Manage assembly equipment development, qualification and process risk.',leadershipScope:'',technologies:[]});
  c.roles.push({...c.roles[0],id:'role-3',title:'Project Engineer',startDate:{value:'2022-02',precision:'month'},endDate:{value:'2023-10',precision:'month'},
    isCurrent:false,responsibilities:'Coordinate engineering projects, timelines and mechanical equipment.',leadershipScope:'',technologies:[]});
  c.education[0].description=longEducation;
  c.education[0].honors='Graduated with distinction';
  c.credentials[0].notes=longCredential;
  await page.evaluate(async c=>{
    const {database}=await import('/app/data/db.js');
    await database.replaceAllData(c,{theme:'dark'},await database.getGeneration());
  },c);
  await page.reload();
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await expect(page.getByRole('heading',{name:'Career Profile'})).toBeVisible();
}

async function previewGeometry(element){
  return element.evaluate(el=>{
    const p=el.querySelector('.career-description');
    const s=p&&getComputedStyle(p);
    return p?{height:p.getBoundingClientRect().height,lineHeight:parseFloat(s.lineHeight),clamp:s.webkitLineClamp,
      scrollHeight:p.scrollHeight,clientHeight:p.clientHeight,expanded:p.classList.contains('is-expanded')}:null;
  });
}

for(const width of [320,375,390,430]){
  test('employment history is scannable with two-line default previews at '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:812});
    await seed(page);
    const panel=page.locator('.career-panel').first();
    const employer=panel.locator('.career-employer');
    const roles=panel.locator('.career-role');
    await expect(roles).toHaveCount(3);
    await expect(roles.nth(0)).toContainText('Senior Process Engineer');
    await expect(roles.nth(0)).toContainText('Apr 2026 – Present · Full Time');
    await expect(roles.nth(1)).toContainText('Process Engineer');
    await expect(roles.nth(2)).toContainText('Project Engineer');
    await expect(roles.nth(0).locator('.career-primary')).toHaveText('Primary role');

    const e=await previewGeometry(employer),r=await previewGeometry(roles.nth(0));
    expect(e.clamp).toBe('2');
    expect(r.clamp).toBe('2');
    expect(e.height).toBeLessThanOrEqual(e.lineHeight*2+2);
    expect(r.height).toBeLessThanOrEqual(r.lineHeight*2+2);
    expect(e.scrollHeight).toBeGreaterThan(e.clientHeight);
    expect(r.scrollHeight).toBeGreaterThan(r.clientHeight);
    await expect(employer.locator('button.career-more').first()).toBeVisible();
    await expect(roles.nth(0).locator('button.career-more')).toBeVisible();
    await expect(roles.nth(0).locator('.career-hidden-extra')).toBeHidden();
    await expect(employer.locator('.career-employer-head .career-hidden-extra')).toBeHidden();

    const bounds=await panel.evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth);
  });
}

test('More/Less expands only selected role or employer without changing stored data',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await seed(page);
  const before=await page.evaluate(async()=> (await (await import('/app/data/db.js')).database.readSnapshot()).collections);
  const employer=page.locator('.career-employer');
  const eMore=employer.locator('button.career-more').first();
  const roles=employer.locator('.career-role');
  const rMore=roles.nth(0).locator('button.career-more');
  await eMore.click();
  await expect(eMore).toHaveAttribute('aria-expanded','true');
  await expect(eMore).toHaveText('Less');
  await expect(employer.locator('.career-link')).toBeVisible();
  expect((await previewGeometry(employer)).expanded).toBe(true);
  await expect(rMore).toHaveAttribute('aria-expanded','false');
  await expect(roles.nth(0).locator('.career-hidden-extra')).toBeHidden();
  await rMore.click();
  await expect(rMore).toHaveAttribute('aria-expanded','true');
  await expect(roles.nth(0).locator('.career-note')).toHaveCount(2);
  await expect(roles.nth(0).locator('.career-note').first()).toBeVisible();
  const id=await rMore.getAttribute('aria-controls');
  expect(id).toBeTruthy();
  await expect(page.locator('#'+id)).toHaveCount(1);
  await page.setViewportSize({width:430,height:812});
  await expect(rMore).toBeVisible();
  await expect(rMore).toHaveText('Less');
  await rMore.click();
  await expect(rMore).toHaveAttribute('aria-expanded','false');
  const restored=await previewGeometry(roles.nth(0));
  expect(restored.height).toBeLessThanOrEqual(restored.lineHeight*2+2);
  await expect(roles.nth(0).locator('.career-hidden-extra')).toBeHidden();
  await eMore.click();
  await expect(eMore).toHaveText('… More');
  const after=await page.evaluate(async()=> (await (await import('/app/data/db.js')).database.readSnapshot()).collections);
  expect(after).toEqual(before);
});

test('education and credential notes use the same compact previews with optional details',async({page})=>{
  await page.setViewportSize({width:390,height:812});
  await seed(page);
  const education=page.locator('.career-panel').nth(1).locator('.career-entry');
  const credential=page.locator('.career-panel').nth(2).locator('.career-entry');
  for(const entry of [education,credential]){
    const g=await previewGeometry(entry);
    expect(g.clamp).toBe('2');
    expect(g.height).toBeLessThanOrEqual(g.lineHeight*2+2);
    await expect(entry.locator('button.career-more')).toBeVisible();
    await entry.locator('button.career-more').click();
    await expect(entry.locator('button.career-more')).toHaveText('Less');
    await expect(entry.locator('.career-hidden-extra')).toBeVisible();
  }
  await expect(education.locator('.career-note')).toContainText('Graduated with distinction');
  await expect(credential.locator('.career-link')).toBeVisible();
  await page.reload();
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await expect(page.locator('button.career-more').first()).toHaveAttribute('aria-expanded','false');
});

test('brief descriptions do not show unnecessary More controls',async({page})=>{
  await page.setViewportSize({width:430,height:812});
  await page.goto('/');
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await page.locator('[data-action=add-career][data-kind=employers]').click();
  await page.locator('#career-name').fill('Brief Employer');
  await page.locator('#career-description').fill('Brief.');
  await page.locator('[data-action=save-career]').click();
  await expect(page.getByRole('heading',{name:'Brief Employer'})).toBeVisible();
  const employer=page.locator('.career-employer');
  await expect(employer.locator('button.career-more')).toBeHidden();
});
