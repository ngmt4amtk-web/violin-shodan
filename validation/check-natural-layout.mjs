import {chromium,webkit} from '/Users/ngmt.mtk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {LESSONS,CHAPTERS,chapterItems,makeExercise} from '../dist/content.mjs';
import {targetForNote} from '../dist/intonation.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.APP_URL||'http://127.0.0.1:8773',results=[],errors=[];
async function enter(p,id){await p.goto(base);await p.locator(`[data-chapter="${LESSONS.find(l=>l.id===id).unit}"]`).click();if(LESSONS.find(l=>l.id===id).menu==='add')await p.locator('[data-action=addList]').click();await p.locator(`[data-lesson="${id}"]`).click();await p.locator('[data-action=setup]').click();}
async function inspect(p,label){
 const g=await p.evaluate(()=>{
  const r=e=>e.getBoundingClientRect(),center=e=>{const b=r(e);return b.y+b.height/2;};
  const systems=[...document.querySelectorAll('.compact-score svg')];
  return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,startBottom:r(document.querySelector('.start-button')).bottom,
   labelOffsets:[...document.querySelectorAll('.field')].map(f=>Math.abs(center(f.querySelector('.field-title'))-center(f.querySelector('.segmented')))),
   systems:systems.map(s=>{const rect=r(s),matrix=s.getScreenCTM(),ink=[...s.querySelectorAll('path,text')].map(e=>r(e)).filter(b=>b.width&&b.height);return {width:rect.width,height:rect.height,staffWidth:r(s.querySelector('[data-role=staff-line]')).width,scaleX:matrix.a,scaleY:matrix.d,clipped:ink.filter(b=>b.left<rect.left-1||b.right>rect.right+1||b.top<rect.top-1||b.bottom>rect.bottom+1).map(b=>b.toJSON())};})};
 });
 assert(!g.overflow,label+' overflow');assert(g.systems.length<=2,label+' more than two systems');if(g.width<=640)assert(g.labelOffsets.every(n=>n<1),label+' misaligned label');
 for(const s of g.systems){assert(Math.abs(s.scaleX-s.scaleY)<.001,label+' stretched glyphs');assert.deepEqual(s.clipped,[],label+' clipped notation');}
 assert(Math.max(...g.systems.map(s=>s.staffWidth/s.width))>.9,label+' centered small staff');
 if(g.width===390)assert(g.startBottom<=740,label+' start below phone viewport '+g.startBottom);
 results.push({label,...g});
}
for(const engine of ['chrome','webkit']){
 const browser=engine==='chrome'?await chromium.launch({channel:'chrome'}):await webkit.launch({executablePath:'/Users/ngmt.mtk/Library/Caches/ms-playwright/webkit-2359/pw_run.sh'});
 const p=await browser.newPage({viewport:{width:390,height:740},deviceScaleFactor:2});p.on('pageerror',e=>errors.push(e.message));
 for(const l of LESSONS){await enter(p,l.id);await inspect(p,engine+' '+l.id);}
 for(const width of [320,390,1280]){
  await p.setViewportSize({width,height:width===320?568:800});
  for(const id of ['fingers','fingers12','fingers34','application94']){
   await enter(p,id);
   for(const string of ['G','D','A','E']){await p.locator(`[data-option=string][data-value=${string}]`).click();await inspect(p,`${engine} ${id} ${string} ${width}`);}
  }
 }
 for(const l of LESSONS.filter(l=>l.pattern==='34')){await p.setViewportSize({width:320,height:568});await enter(p,l.id);await p.locator('[data-option=string][data-value=A]').click();await p.locator('[data-select-option=variant]').selectOption('flat');await inspect(p,engine+' '+l.id+' 34low 320');}
 for(const id of ['switch3','switch23','eighth23','pivot12','triples34']){await enter(p,id);for(const string of ['G','D','A','E']){await p.locator(`[data-option=string][data-value=${string}]`).click();await inspect(p,engine+' '+id+' '+string+' 320');}}
 await p.setViewportSize({width:390,height:740});await enter(p,'fingers');await p.screenshot({path:`validation/${engine}-natural-fingers.png`,fullPage:true});
 await enter(p,'application94');await p.screenshot({path:`validation/${engine}-natural-application94.png`,fullPage:true});
 await p.locator('[data-action=intro]').click();assert.equal(await p.locator('.intro-visual .pattern-diagram').count(),3);
 await p.locator('[data-action=setup]').click();await p.locator('[data-option=pattern][data-value="34"]').click();assert.equal(await p.locator('[data-option=pattern][data-value="34"]').getAttribute('aria-pressed'),'true');
 await enter(p,'open');for(const rhythm of ['half','quarter','eighth','random']){await p.locator('[data-select-option=rhythm]').selectOption(rhythm);await inspect(p,engine+' '+rhythm);}
 await browser.close();console.log('PASS',engine,'natural score and aligned controls');
}
assert.deepEqual(errors,[]);await fs.writeFile('validation/natural-layout-results.json',JSON.stringify({base,checkedAt:new Date().toISOString(),results,errors,iPhoneHardwareTested:false},null,2));console.log('PASS',results.length,'layout checks');
