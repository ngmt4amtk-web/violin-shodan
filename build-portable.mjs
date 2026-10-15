import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const css=await fs.readFile('dist/style.css','utf8');
const modules=await Promise.all(['intonation','repertoire','content','engine','settings','glyphs','score','app'].map(name=>fs.readFile(`dist/${name}.mjs`,'utf8')));
const patterns={};for(const p of ['12','23','34'])patterns[p]='data:image/svg+xml;base64,'+Buffer.from(await fs.readFile(`dist/assets/pattern-${p}.svg`)).toString('base64');
let script=modules.map(s=>s.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
script=script.replace('src="./assets/pattern-${p}.svg"','src="${EMBEDDED_PATTERNS[p]}"');
// A file copy does not register a service worker, even when rehosted elsewhere.
script=script.replace(/if\('serviceWorker' in navigator&&location.protocol==='https:'\).*?;\s*$/m,'');
let html=await fs.readFile('dist/index.html','utf8');
html=html.replace('<link rel="manifest" href="./manifest.webmanifest">','').replace('<link rel="icon" href="./assets/icon.svg" type="image/svg+xml">','').replace('<link rel="stylesheet" href="./style.css">',`<style>${css}</style>`).replace('<script type="module" src="./app.mjs"></script>',`<script>(()=>{const EMBEDDED_PATTERNS=${JSON.stringify(patterns)};\n${script.replaceAll('</script','<\\/script')}\n})();</script>`);
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
assert(!/\bimport\s+.*from\s+['"]/.test(script));
await fs.mkdir('portable',{recursive:true});await fs.writeFile('portable/バイオリン初段.html',html);assert.equal(await fs.readFile('portable/バイオリン初段.html','utf8'),html);await fs.rm('portable/弦しるべ.html',{force:true});assert.equal((await fs.readdir('portable')).includes('弦しるべ.html'),false);console.log('Portable HTML:',Buffer.byteLength(html),'bytes; syntax and readback OK');
