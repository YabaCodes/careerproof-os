import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAchievementInput,validateProfileInput,validateBackup,generateBackup,ValidationError,isValidLocalDate,summarizeAchievements} from '../dist/app/domain/validation.js';
import {emptyProfile} from '../dist/app/domain/models.js';
const base={title:'Resolved issue',contribution:'Coordinated technical recovery',occurredOn:'2026-10-09',status:'recorded',outcome:'Line restarted',impactCategory:'delivery'};
function record(id='ach1'){return {...base,id,createdAt:'2026-10-09T01:01:00.000Z',updatedAt:'2026-10-09T01:01:00.000Z',revision:1,preArchiveStatus:null};}
test('records require meaningful contribution; draft requires only title',()=>{
  assert.deepEqual(validateAchievementInput(base),[]);
  assert.ok(validateAchievementInput({...base,contribution:''}).some(x=>x.includes('contribution')));
  assert.deepEqual(validateAchievementInput({...base,contribution:'',occurredOn:'',status:'draft'}),[]);
});
test('exact occurrence dates reject impossible dates',()=>{
  assert.equal(isValidLocalDate('2026-02-30'),false);
  assert.equal(isValidLocalDate('2024-02-29'),true);
  assert.equal(isValidLocalDate('2026-10-09'),true);
  assert.equal(isValidLocalDate('2026-00-12'),false);
});
test('profile validates email and character lengths',()=>{
  assert.deepEqual(validateProfileInput({displayName:'',headline:'',summary:'',email:'',location:''}),[]);
  assert.ok(validateProfileInput({displayName:'',headline:'',summary:'',email:'not-an-email',location:''}).length>0);
});
test('backup round-trip preserves records',()=>{
  const backup=generateBackup([emptyProfile()],[record()]);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(backup))),backup);
});
test('backup rejects malicious or corrupt structure before replacement',()=>{
  const b=generateBackup([emptyProfile()],[record(),record('ach2')]);
  assert.throws(()=>validateBackup({...b,manifest:{...b.manifest,schemaVersion:55}}),ValidationError);
  assert.throws(()=>validateBackup({...b,collections:{...b.collections,achievements:[record(),record()]}}),ValidationError);
  assert.throws(()=>validateBackup({...b,manifest:{...b.manifest,counts:{profiles:1,achievements:1}}}),ValidationError);
  assert.throws(()=>validateBackup({...b,collections:{...b.collections,achievements:[{...record(),occurredOn:'2026-02-31'},record('ach2')]}}),ValidationError);
});
test('summaries account for archived and draft states',()=>{
  assert.deepEqual(summarizeAchievements([record(),{...record('draft'),status:'draft'}, {...record('arc'),status:'archived',preArchiveStatus:'recorded'}]),{total:2,recorded:1,drafts:1,archived:1});
});
