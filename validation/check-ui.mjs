import {chromium,webkit} from '/Users/ngmt.mtk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {LESSONS} from '../dist/content.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const BASE=process.env.APP_URL||'http://127.0.0.1:8773';const results=[];const errors=[];
async function record(name,run){await run();results.push(name);console.log('PASS',name);}
async function enter(page,id){await page.goto(BASE);const l=LESSONS.find(l=>l.id===id);await page.locator(`[data-chapter="${l.unit}"]`).click();await page.locator(`[data-lesson="${id}"]`).click();await page.locator('[data-action="setup"]').click();}
async function startManual(page){const mic=page.locator('[data-mic]');if(await mic.count())await mic.uncheck();await page.locator('#tempoNumber').fill('180');await page.locator('#tempoNumber').press('Tab');await page.locator('[data-action="start"]').click();await page.locator('#countdownArea:not([hidden])').waitFor();await page.locator('#countdownArea[hidden]').waitFor({state:'attached'});await page.locator('#noteScore g.active').waitFor();}
async function geometry(page){return page.evaluate(()=>{const bounds=s=>document.querySelector(s)?.getBoundingClientRect().toJSON();return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,viewport:bounds('#performanceViewport'),score:bounds('#noteScore'),controls:bounds('.practice-controls'),guide:bounds('.guidance-panel'),footer:bounds('.performance-footer'),body:bounds('.performance-body'),start:bounds('.start-button')};});}
for(const engine of ['chrome','webkit']){
 const browser=engine==='chrome'?await chromium.launch({channel:'chrome',headless:true}):await webkit.launch({headless:true,executablePath:'/Users/ngmt.mtk/Library/Caches/ms-playwright/webkit-2359/pw_run.sh'});
 const context=await browser.newContext({viewport:{width:390,height:740},deviceScaleFactor:1});const page=await context.newPage();page.on('pageerror',e=>errors.push(`${engine}: ${e.message}`));
 await record(`${engine}: all 24 introduction / setup flows and bounded preview`,async()=>{
  for(const l of LESSONS){await enter(page,l.id);assert.equal(await page.locator('h1').textContent(),l.title);assert(await page.locator('.compact-score .score-system').count()<=2);assert(await page.locator('[data-role=staff-line]').count()>=5);const g=await geometry(page);assert(!g.overflow,l.id+' overflow');assert(g.start.bottom<=810,l.id+' setup excessive height '+g.start.bottom);}
 });
 await record(`${engine}: manual player fits phone, short phone, landscape, tablet, desktop`,async()=>{
  for(const [width,height] of [[320,568],[390,650],[390,740],[430,932],[740,390],[820,1180],[1280,800]]){
   await page.setViewportSize({width,height});await enter(page,'application94');await startManual(page);const g=await geometry(page);assert(!g.overflow);assert(g.controls.bottom<=height+1,JSON.stringify(g));assert(g.guide.bottom<=g.controls.top,JSON.stringify(g));assert(g.score.bottom<=g.guide.top+1||g.score.right<=g.guide.left+1,JSON.stringify(g));assert(g.score.height>=80);assert.equal(await page.locator('#noteScore [data-role=staff-line]').count(),5);assert.equal(await page.locator('#noteScore g.active').count(),1);results.push({engine,viewport:[width,height],geometry:g});await page.screenshot({path:`validation/${engine}-play-${width}.png`});
  }
 });
 await page.setViewportSize({width:390,height:740});
 await record(`${engine}: mode disables mic, preserves row, controls settings and A-only alternate`,async()=>{
  await enter(page,'application94');await page.locator('[data-select-option=row]').selectOption('random');const selected=await page.locator('.random-row').textContent();await page.locator('[data-option=mode][data-value=continuous]').click();assert.equal(await page.locator('[data-mic]').isChecked(),false);assert.equal(await page.locator('.random-row').textContent(),selected);await page.locator('[data-action=settings]').click();await page.locator('[data-pref=colors]').uncheck();await page.locator('[data-action=closeSettings]').click();assert.equal(await page.locator('.random-row').textContent(),selected);await page.locator('[data-select-option=row]').selectOption('all');await page.locator('[data-action=fullScore]').click();assert.equal(await page.locator('dialog [data-role=barline]').count(),36);await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});assert.equal(await page.locator('dialog').count(),0);
  await enter(page,'fingers34');await page.locator('[data-select-option=variant]').selectOption('flat');await page.locator('[data-option=string][data-value=D]').click();assert.equal(await page.locator('[data-select-option=variant]').count(),0);await page.locator('[data-option=string][data-value=A]').click();assert.equal(await page.locator('[data-select-option=variant]').inputValue(),'flat');assert(await page.locator('[data-accidental=flat]').count()>0);
 });
 await record(`${engine}: manual advance crosses measures, pause/resume, completion/repeat`,async()=>{
  await enter(page,'add2');await startManual(page);for(let i=0;i<4;i++)await page.locator('#nextBtn').click();assert.equal(await page.locator('#barLabel').textContent(),'2 小節目');await page.locator('#pauseBtn').click();assert.equal(await page.locator('#phaseLabel').textContent(),'一時停止');assert(await page.locator('#nextBtn').isDisabled());await page.locator('#pauseBtn').click();await page.locator('#countdownArea:not([hidden])').waitFor();await page.locator('#countdownArea[hidden]').waitFor({state:'attached'});assert.equal(await page.locator('#barLabel').textContent(),'2 小節目');for(let i=0;i<7;i++)await page.locator('#nextBtn').click();await page.locator('.finish-page').waitFor();await page.locator('[data-action=repeat]').click();await page.locator('#sessionProgress').waitFor();assert((await page.locator('#sessionProgress').textContent()).startsWith('1 /'));
 });
 await record(`${engine}: 200 percent text reflows without horizontal overflow`,async()=>{
  await enter(page,'application94');await startManual(page);await page.addStyleTag({content:':root{font-size:32px!important}'});const g=await geometry(page);assert(!g.overflow,JSON.stringify(g));assert(g.guide.bottom<=g.controls.top+1,JSON.stringify(g));await page.screenshot({path:`validation/${engine}-200-percent.png`,fullPage:true});
 });
 await record(`${engine}: denied microphone retains choices and offers no-mic fallback`,async()=>{
  await page.addInitScript(()=>{if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');};});await enter(page,'add3');await page.locator('[data-option=string][data-value=G]').click();await page.locator('[data-action=start]').click();await page.locator('[data-action=startNoMic]').waitFor();assert.equal(await page.locator('[data-option=string][data-value=G]').getAttribute('aria-pressed'),'true');await page.locator('[data-action=startNoMic]').click();await page.locator('#performanceViewport').waitFor();
 });
 await browser.close();
}
assert.deepEqual(errors,[]);await fs.writeFile('validation/ui-results.json',JSON.stringify({at:new Date().toISOString(),base:BASE,results,errors},null,2));console.log('ALL UI CHECKS PASSED');
