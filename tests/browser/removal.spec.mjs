import {test,expect} from '@playwright/test';
import {fullCollections,base} from '../fixtures.mjs';
test.use({isMobile:true,hasTouch:true});
function world(){
  const c=fullCollections();
  c.projects.push({...c.projects[0],id:'project-2',name:'Target synthetic experience'});
  c.recordLinks.push({...base('link-a1p2'),linkType:'achievement-project',sourceId:'achievement-1',targetId:'project-2',isPrimary:false,note:''});
  return c;
}
async function seed(page,c){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const snapshot=page=>page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});

test('CP-012B moving an experience re-points links, keeps one primary and never deletes achievements',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await seed(page,world());
  const before=await snapshot(page);
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  const card=page.locator('details.portfolio-card[data-project-id=project-1]');
  await card.locator('summary').click();
  await card.locator('[data-action=remove-project]').click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toContainText('Linked to this experience');
  await expect(dialog.locator('.removal-flag')).toHaveText('primary');
  await expect(page.locator('#removal-mode-move')).toBeChecked();
  await page.locator('#removal-target').selectOption('project-2');
  await expect(page.locator('[data-action=confirm-removal]')).toBeDisabled();
  await page.locator('#removal-confirm').check();
  await page.locator('[data-action=confirm-removal]').click();
  await expect(page.locator('#toast')).toContainText('Experience deleted. 1 achievement, 1 role moved to “Target synthetic experience”.');
  const after=await snapshot(page);
  expect(after.projects.map(p=>p.id)).toEqual(['project-2']);
  expect(after.achievements.map(a=>a.id)).toEqual(before.achievements.map(a=>a.id));
  expect(after.impactMetrics).toEqual(before.impactMetrics);
  expect(after.evidenceReferences).toEqual(before.evidenceReferences);
  expect(after.recordLinks.filter(l=>l.linkType==='achievement-project').map(l=>[l.targetId,l.isPrimary])).toEqual([['project-2',true]]);
  expect(after.recordLinks.filter(l=>l.linkType==='role-project').map(l=>l.targetId)).toEqual(['project-2']);
});

test('CP-012B custom skill can be deleted from Skills with its links removed and achievements kept',async({page})=>{
  await seed(page,fullCollections());
  await page.locator('.mobile-nav [data-screen=competencies]').click();
  await page.locator('details.skill-entry[data-skill=custom-competency] summary').click();
  await page.locator('[data-action=delete-competency][data-id=custom-competency]').click();
  await expect(page.getByRole('dialog')).toContainText('Delete skill “Synthetic Skill”?');
  await page.locator('#removal-mode-unlink').check();
  await expect(page.getByRole('dialog')).toContainText('Archive keeps it instead');
  await page.locator('#removal-confirm').check();
  await page.locator('[data-action=confirm-removal]').click();
  await expect(page.locator('#toast')).toContainText('Skill deleted. 1 achievement kept without this skill.');
  const after=await snapshot(page);
  expect(after.competencies.some(s=>s.id==='custom-competency')).toBe(false);
  expect(after.recordLinks.some(l=>l.linkType==='achievement-competency')).toBe(false);
  expect(after.achievements).toHaveLength(1);
});

test('CP-012B removal sheet fits 320px, keeps 44px targets and can export a backup first',async({page})=>{
  await page.setViewportSize({width:320,height:640});
  const c=world();c.roles.push({...c.roles[0],id:'role-2',title:'Second synthetic role',isCurrent:false,startDate:{value:'2020',precision:'year'},endDate:{value:'2021',precision:'year'}});
  await seed(page,c);
  const before=await snapshot(page);
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await page.locator('[data-action=delete-career][data-kind=roles][data-id=role-1]').click();
  await expect(page.locator('#removal-form')).toBeVisible();
  expect(await page.locator('.modal-body').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
  for(const box of await page.locator('.removal-option, .removal-confirm, .modal-footer .button').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {h:r.height,l:r.left,r:r.right};}))){
    expect(box.h).toBeGreaterThanOrEqual(44);expect(box.l).toBeGreaterThanOrEqual(0);expect(box.r).toBeLessThanOrEqual(321);
  }
  const download=page.waitForEvent('download');await page.locator('#removal-form [data-action=export]').click();await download;
  await expect(page.locator('#removal-form')).toBeVisible();
  await page.locator('[data-action=close]').last().click();
  const after=await snapshot(page);
  expect(after).toEqual(before);
});
