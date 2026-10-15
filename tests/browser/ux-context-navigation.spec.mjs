import {test,expect} from '@playwright/test';
import {fullCollections,base} from '../fixtures.mjs';
import {openMore} from './ux-helpers.mjs';

// CP-UX-Links alpha.5: read-only navigation. All fixtures are synthetic.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
async function seed(page,c=fullCollections()){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async data=>{
    const {database}=await import('/app/data/db.js');
    await database.replaceAllData(data,{theme:'light'},await database.getGeneration());
  },c);
  await page.reload();
  await expect(page.locator('.hero-card')).toBeVisible();
}
const snapshot=page=>page.evaluate(async()=>{
  const {database}=await import('/app/data/db.js');
  return (await database.readSnapshot()).collections;
});
const linked=(id,sourceId,targetId)=>({...base(id),linkType:'achievement-project',sourceId,targetId,isPrimary:false,note:''});

test('UX301–UX304: achievement → experience → linked skill → supporting achievement preserves records',async({page})=>{
  await seed(page);
  const before=await snapshot(page);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  await expect(page.locator('.story > section h3')).toHaveText(['Result','What I Did','Context','Skills Shown']);
  await expect(page.locator('.story-related-link[data-action=open-experience][data-id=project-1]')).toContainText('Synthetic Initiative');
  await expect(page.locator('.story-related-link[data-action=role-achievements][data-id=role-1]')).toContainText('Synthetic Engineer');
  await expect(page.locator('.story-section .chip-action[data-id=custom-competency]')).toContainText('Synthetic Skill');
  await page.locator('.story-related-link[data-action=open-experience][data-id=project-1]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.locator('.experience-page h1')).toHaveText('Synthetic Initiative');
  await page.locator('.experience-skills .chip-action[data-id=custom-competency]').click();
  await expect(page.locator('#main-content h1')).toHaveText('Skills');
  await expect(page.locator('#competency-search')).toHaveValue('Synthetic Skill');
  const skill=page.locator('.skill-entry[data-skill=custom-competency]');
  await expect(skill).toHaveAttribute('open','');
  await expect(skill.locator('summary')).toBeFocused();
  await expect(skill).toContainText('1 linked example');
  await skill.locator('[data-action=competency-achievement][data-id=achievement-1]').click();
  await expect(page.getByRole('dialog',{name:'Resolved synthetic issue'})).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
});

test('UX303: tap a story skill, then the linked role; role context filters the Vault',async({page})=>{
  await seed(page);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  await page.locator('.story-section .chip-action[data-id=custom-competency]').click();
  await expect(page.locator('.skill-entry[data-skill=custom-competency]')).toHaveAttribute('open','');
  await page.locator('.skill-entry[data-skill=custom-competency] [data-action=competency-achievement]').click();
  await page.locator('.story-related-link[data-action=role-achievements][data-id=role-1]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.locator('#main-content h1')).toHaveText('Achievement Vault');
  await expect(page.locator('#role-filter')).toHaveValue('role-1');
  await expect(page.locator('#vault-results .achievement-row[data-id=achievement-1]')).toBeVisible();
});

test('UX305–UX306: other experiences stay under More Details; archived linked skills remain inspectable',async({page})=>{
  const c=fullCollections();
  c.projects.push({...c.projects[0],...base('project-other'),name:'Synthetic Second Initiative'});
  c.recordLinks.push(linked('link-other','achievement-1','project-other'));
  c.competencies.find(x=>x.id==='custom-competency').status='archived';
  await seed(page,c);
  const before=await snapshot(page);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  await openMore(page);
  await expect(page.locator('.story-more [data-action=open-experience][data-id=project-other]')).toContainText('Synthetic Second Initiative');
  await page.locator('.story-more [data-action=open-experience][data-id=project-other]').click();
  await expect(page.locator('.experience-page h1')).toHaveText('Synthetic Second Initiative');
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  await page.locator('.story-section .chip-action[data-id=custom-competency]').click();
  const archived=page.locator('.skill-entry[data-skill=custom-competency]');
  await expect(archived).toHaveAttribute('open','');
  await expect(archived.locator('summary')).toContainText('Archived');
  expect(await snapshot(page)).toEqual(before);
});

test('UX306–UX307: an unlinked achievement has no invented navigation, mobile remains within viewport',async({page})=>{
  const c=fullCollections();
  c.achievements.push({...c.achievements[0],...base('unlinked'),title:'Synthetic Unlinked Result',roleId:null});
  await seed(page,c);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.achievement-row[data-id=unlinked]').click();
  await expect(page.locator('.story-related-link')).toHaveCount(0);
  await expect(page.locator('.story-section .chip-action')).toHaveCount(0);
  await page.locator('.close-dialog').click();
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  for(const width of [320,390]){
    await page.setViewportSize({width,height:750});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const rects=await page.locator('.story-related-link, .story-section .chip-action').evaluateAll(els=>els.map(el=>({height:el.getBoundingClientRect().height})));
    expect(rects.length).toBeGreaterThan(0);
    expect(rects.every(r=>r.height>=44)).toBe(true);
  }
});
