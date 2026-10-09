import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist', {recursive:true});
for (const file of ['index.html', 'styles.css']) await cp(file, `dist/${file}`);
await cp('public', 'dist', {recursive:true});
console.log('CareerProof assets copied to dist/');
