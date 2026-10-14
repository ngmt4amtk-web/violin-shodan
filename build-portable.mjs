import fs from 'node:fs/promises';
const css=await fs.readFile('dist/style.css','utf8');
const modules=await Promise.all(['repertoire','content','engine','glyphs','score','app'].map(name=>fs.readFile(`dist/${name}.mjs`,'utf8')));
const patterns={};for(const p of ['12','23','34'])patterns[p]='data:image/svg+xml;base64,'+Buffer.from(await fs.readFile(`dist/assets/pattern-${p}.svg`)).toString('base64');
let script=modules.map(s=>s.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
script=script.replace('src="./assets/pattern-${p}.svg"','src="${EMBEDDED_PATTERNS[p]}"');
// A file copy does not register a service worker, even when rehosted elsewhere.
script=script.replace(/if\('serviceWorker' in navigator&&location.protocol==='https:'\).*?;\s*$/m,'');
let html=await fs.readFile('dist/index.html','utf8');
html=html.replace('<link rel="manifest" href="./manifest.webmanifest">','').replace('<link rel="icon" href="./assets/icon.svg" type="image/svg+xml">','').replace('<link rel="stylesheet" href="./style.css">',`<style>${css}</style>`).replace('<script type="module" src="./app.mjs"></script>',`<script>(()=>{const EMBEDDED_PATTERNS=${JSON.stringify(patterns)};\n${script.replaceAll('</script','<\\/script')}\n})();</script>`);
await fs.mkdir('portable',{recursive:true});await fs.writeFile('portable/弦しるべ.html',html);console.log('Portable HTML:',Buffer.byteLength(html),'bytes');
