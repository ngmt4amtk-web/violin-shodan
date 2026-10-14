import {chromium,webkit} from '/Users/ngmt.mtk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {LESSONS,makeExercise,STRINGS} from '../dist/content.mjs';
import {renderSystems} from '../dist/score.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const results=[],errors=[];
for(const engine of ['chrome','webkit']){
 const browser=engine==='chrome'?await chromium.launch({channel:'chrome'}):await webkit.launch({executablePath:'/Users/ngmt.mtk/Library/Caches/ms-playwright/webkit-2359/pw_run.sh'});const page=await browser.newPage({viewport:{width:320,height:568}});page.on('pageerror',e=>errors.push(e.message));
 for(const l of LESSONS){await page.goto('http://127.0.0.1:8773');await page.locator(`[data-chapter="${l.unit}"]`).click();await page.locator(`[data-lesson="${l.id}"]`).click();await page.locator('[data-action=setup]').click();if(await page.locator('[data-mic]').count())await page.locator('[data-mic]').uncheck();await page.locator('#tempoNumber').fill('180');await page.locator('#tempoNumber').press('Tab');await page.locator('[data-action=start]').click();await page.locator('#countdownArea:not([hidden])').waitFor();await page.locator('#countdownArea[hidden]').waitFor({state:'attached'});await page.locator('#noteScore g.active').waitFor();
 const g=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();return {controls:r('.practice-controls'),guide:r('.guidance-panel'),score:r('#noteScore'),width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth};});assert(g.controls.bottom<=568);assert(g.guide.bottom<=g.controls.top);assert(g.score.bottom<=g.guide.top);assert(g.scroll<=g.width);assert.equal(await page.locator('#noteScore [data-role=staff-line]').count(),5);if(l.id==='eighth34')assert.equal(await page.locator('[data-beat]:visible').count(),2);results.push({engine,lesson:l.id,controlsBottom:g.controls.bottom});
 }
 if(engine==='chrome'){
  await page.goto('file:///Users/ngmt.mtk/genshirube-20261014/portable/%E5%BC%A6%E3%81%97%E3%82%8B%E3%81%B9.html');await page.locator('[data-chapter="1"]').click();await page.locator('[data-lesson="fingers"]').click();assert.equal(await page.locator('.pattern-diagram img').evaluate(el=>el.complete&&el.naturalWidth>0),true);
 }
 await browser.close();console.log('PASS',engine,'all 24 performances fit 320 x 568');
}
for(const l of LESSONS)for(const string of Object.keys(STRINGS))for(const pattern of ['12','23','34']){const notes=makeExercise(l.type,{string,pattern,mode:'continuous',scale:l.type==='scale12'?'C1':l.type==='scale34'?'A1':'GD',row:'all'});const svg=renderSystems(notes,{},3);assert.equal((svg.match(/data-role="barline"/g)||[]).length,notes.at(-1).bar+1);assert.equal((svg.match(/<g data-score-index=/g)||[]).length,notes.length);assert(!/NaN|undefined/.test(svg));assert(svg.indexOf('class="note-highlight"')<svg.indexOf('data-role="staff-line"'));}
assert.deepEqual(errors,[]);await fs.writeFile('validation/playing-results.json',JSON.stringify({results,errors,notationCombinations:288},null,2));console.log('PASS all compact notation combinations and portable file');
