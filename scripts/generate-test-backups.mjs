import {mkdir,writeFile} from 'node:fs/promises';
import {legacyBackup,fullCollections} from '../tests/fixtures.mjs';
import {generateBackup} from '../dist/app/domain/validation.js';
const current=generateBackup(fullCollections(),{theme:'dark'});
const files={
  'Synthetic_Backup_v1.json':legacyBackup(),
  'Synthetic_Backup_v2.json':current,
  'Synthetic_Invalid_Enum.json':structuredClone(current),
  'Synthetic_Invalid_Reference.json':structuredClone(current),
  'Synthetic_Unsupported_Version.json':structuredClone(current)
};
files['Synthetic_Invalid_Enum.json'].collections.achievements[0].status=['recorded'];
files['Synthetic_Invalid_Reference.json'].collections.recordLinks[0].targetId='missing-synthetic-project';
files['Synthetic_Unsupported_Version.json'].manifest.formatVersion=99;
await mkdir('test-results/manual-fixtures',{recursive:true});
for(const [name,data] of Object.entries(files))await writeFile('test-results/manual-fixtures/'+name,JSON.stringify(data,null,2)+'\n');
console.log('Synthetic manual backups created in test-results/manual-fixtures/. Use only in a disposable test origin.');
