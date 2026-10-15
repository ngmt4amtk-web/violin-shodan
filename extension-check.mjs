import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExercise,makeNote,instructionFor,STRINGS,LESSONS} from './dist/content.mjs';
import {renderScore} from './dist/score.mjs';
import {PitchDetector,AudioEngine,AUDIO_CUES} from './dist/engine.mjs';
import {targetForNote,centsBetween,keyForShape} from './dist/intonation.mjs';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {appHarness} from './validation/app-harness.mjs';
const pitches=ns=>ns.filter(n=>!n.rest).map(n=>n.midi);
const bars=ns=>ns.at(-1).bar+1;
const barBeats=ns=>{for(let b=0;b<bars(ns);b++)assert.equal(ns.filter(n=>n.bar===b).reduce((s,n)=>s+n.beats,0),ns[0].meter);};
test('3つの指型・全4弦で音名と半音位置が一致',()=>{
 for(const string of Object.keys(STRINGS))for(const [pattern,intervals] of [['12',[0,2,3,5,7]],['23',[0,2,4,5,7]],['34',[0,2,4,6,7]]]){
  const ns=[0,1,2,3,4].map(f=>makeNote(string,f,1,{pattern}));assert.deepEqual(ns.map(n=>n.midi-ns[0].midi),intervals);
 }
 assert.equal(makeNote('G',2,1,{pattern:'12'}).name,'シ♭');
 assert.equal(makeNote('E',3,1,{pattern:'34'}).name,'ラ♯');
 const alt=makeExercise('fingers34',{string:'A',variant:'flat'});
 assert.deepEqual(alt.slice(0,5).map(n=>n.name),['ラ','シ♭','ド','レ','ミ♭']);
 assert.deepEqual(pitches(alt).slice(0,5),[69,70,72,74,75]);
 assert.deepEqual(pitches(makeExercise('fingers34',{string:'D',variant:'flat'})),pitches(makeExercise('fingers34',{string:'D'})));
});
test('固定19問は4小節、4分/2分のみ。4の指を保持',()=>{
 for(let problem=1;problem<=19;problem++){
  const ns=makeExercise('reading55',{problem});assert.equal(bars(ns),4);barBeats(ns);assert.ok(ns.every(n=>[1,2].includes(n.beats)));
  assert.deepEqual(ns,makeExercise('reading55',{problem}));
 }
 assert.equal(makeExercise('reading55',{problem:10}).filter(n=>n.finger===4).length,2);
 assert.deepEqual(pitches(makeExercise('reading55',{problem:1})),[62,66,67,67,66,64,62,66,67,64,64,62]);
});
test('64番は6段を分割、全弦で最後の開放弦4拍まで',()=>{
 for(let row=1;row<=6;row++)for(const string of Object.keys(STRINGS)){
  const ns=makeExercise('keep12',{row,string});assert.equal(bars(ns),5);barBeats(ns);assert.equal(ns.at(-1).finger,0);assert.equal(ns.at(-1).beats,4);
 }
 assert.deepEqual(makeExercise('keep12',{row:1}).map(n=>n.finger),[0,1,2,3,1,2,3,2,1,3,2,3,1,2,1,3,0]);
 assert.deepEqual(makeExercise('keep12',{row:'random',resolvedRow:6}),makeExercise('keep12',{row:6}));
});
test('形の切替は各弦8小節、同じ小節内で臨時記号を取り消す',()=>{
 for(const string of Object.keys(STRINGS)){
  const ns=makeExercise('switch2',{string}),svg=renderScore(ns,{},null);assert.equal(bars(ns),8);barBeats(ns);
  assert.equal(ns[2].midi-ns[10].midi,1);assert.equal(ns[20].midi-ns[21].midi,1);
  assert.ok(svg.includes('data-accidental="natural"'));assert.ok(svg.includes(`data-accidental="${string==='G'?'flat':'sharp'}"`));
  assert.ok(instructionFor(ns[21],ns[20],'switch2').includes('下げて'));
 }
 const connected=makeExercise('connect69');assert.equal(bars(connected),17);assert.equal(connected.at(-1).name,'ド');assert.equal(connected.at(-1).finger,3);barBeats(connected);
});
test('新しい音階はすべて長音階。イ長調2octで下2弦と上2弦を切り替え',()=>{
 const cases=[['scale12','C1',60,12,4],['scale12','G2',55,24,8],['scale34','A1',57,12,4],['scale34','E1',64,12,4],['scale34','A2',57,24,8]];
 for(const [type,scale,root,span,count] of cases){const ns=makeExercise(type,{scale}),ps=pitches(ns);assert.equal(ps[0],root);assert.equal(ps.at(-1),root);assert.equal(Math.max(...ps),root+span);assert.equal(bars(ns),count);barBeats(ns);assert.ok(ps.every(p=>[0,2,4,5,7,9,11].includes((p-root)%12)));}
 const a2=makeExercise('scale34',{scale:'A2'});for(const n of a2)assert.equal(n.pattern,['G','D'].includes(n.string)?'34':'23');assert.equal(a2.at(-1).beats,4);
});
test('3と4の8分音符は4/4の3小節、6組往復と形の比較は6小節',()=>{
 for(const string of Object.keys(STRINGS)){
  const ns=makeExercise('eighth34',{string});assert.equal(bars(ns),3);barBeats(ns);assert.equal(ns.at(-1).rest,true);assert.equal(ns[0].meter,4);assert.deepEqual(ns.slice(0,16).map(n=>n.finger),[0,1,2,3,4,3,2,1,0,1,2,3,4,3,2,1]);assert.equal(ns.at(-2).beats,2);assert.equal(ns.at(-1).beats,2);
  for(const type of ['pairs12','pairs34','compare']){const ns=makeExercise(type,{string});assert.equal(bars(ns),6);barBeats(ns);}
 }
});
test('94番は36小節すべてを8段に分けても欠落せず、全弦・3形で使える',()=>{
 for(const string of Object.keys(STRINGS))for(const pattern of ['12','23','34']){
  const whole=makeExercise('application94',{string,pattern,row:'all'}),parts=Array.from({length:8},(_,i)=>makeExercise('application94',{string,pattern,row:i+1})).flat();
  assert.equal(bars(whole),36);assert.deepEqual(pitches(parts),pitches(whole));barBeats(whole);
 }
});
test('追加全課題の全音符・指・譜面の数値に未定義なし',()=>{
 assert.equal(LESSONS.length,47);
 for(const lesson of LESSONS)for(const string of Object.keys(STRINGS)){
  const ns=makeExercise(lesson.type,{string});assert.ok(!/NaN|undefined/.test(renderScore(ns,{},null)));
 }
});
test('YIN: 全形の実目標Hzと上下オクターブを44.1/48kHzで取り違えない',()=>{
 for(const rate of [44100,48000])for(const string of Object.keys(STRINGS))for(const pattern of ['23','12','34',...(string==='A'?['34low']:[])])for(let finger=0;finger<=4;finger++)for(const octave of [.5,1,2]){
  const n=makeNote(string,finger,1,{pattern,key:keyForShape(string,pattern)}),hz=targetForNote(n).targetHz*octave,detector=new PitchDetector(rate),wave=Float32Array.from({length:4096},(_,i)=>.008*(Math.sin(2*Math.PI*hz*i/rate)+.4*Math.sin(4*Math.PI*hz*i/rate))),result=detector.detect(wave,'high');
  assert(result.frequency,`${rate} ${string} ${pattern} ${finger} ×${octave}`);assert(Math.abs(centsBetween(result.frequency,hz))<5,`${hz} → ${result.frequency}`);
 }
});
test('成功音880/1320Hz・音量/長さと、途中停止後の残響期限',()=>{
 const audio=new AudioEngine(),oscillators=[];
 audio.ctx={currentTime:10,createOscillator(){const o={frequency:{},connect(){},disconnect(){},start(t){this.startAt=t;},stop(t){this.stopAt=t;}};oscillators.push(o);return o;},createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}};audio.master={};
 audio.success();assert.deepEqual(oscillators.map(o=>o.frequency.value),[880,1320]);assert(Math.abs(audio.silentUntil-10.69)<1e-9);audio.ctx.currentTime=10.05;audio.stop();assert(Math.abs(audio.silentUntil-10.4)<1e-9);
 audio.correction(442);assert.equal(oscillators.at(-1).frequency.value,442);assert(Math.abs(oscillators.at(-1).stopAt-11.07)<1e-9);assert.equal(AUDIO_CUES.correction.duration,1);
});
test('実際のメーターは整数表示、別音では音名と修正方向だけ、次の入力で表示を戻す',async()=>{
 const app=appHarness();app.api.enterLesson('fingers');await app.api.startPractice();let time=0;
 for(const [offset,label,direction,message] of [[12.2,'+12¢','高い','高い'],[-4.6,'−5¢','ちょうど','ちょうど'],[.2,'0¢','ちょうど','ちょうど'],[-.2,'0¢','ちょうど','ちょうど'],[-900,'','','ドに聞こえる・高くして'],[900,'','','ファ♯に聞こえる・低くして'],[12,'+12¢','高い','高い']]){
  time+=.07;app.api.setTime(time);app.api.setReading({frequency:442*2**(offset/1200),rms:.02,confidence:.99});app.api.observeMic(time);
  assert.equal(app.node('#pitchCents').textContent,label);assert.equal(app.node('#pitchDirection').textContent,direction);assert.equal(app.node('#micFeedback').textContent,message);assert.equal(app.node('#pitchMeter').attributes['aria-valuetext'],message+(label?' '+label:''));assert.equal(Number(app.node('#pitchMeter').attributes['aria-valuenow']),Math.max(-50,Math.min(50,offset)));assert.equal(app.node('#pitchNeedle').hidden,false);
 }
 app.api.setReading({frequency:null,rms:0,confidence:0});app.api.observeMic(time+.07);assert.equal(app.node('#pitchCents').textContent,'— ¢');assert.equal(app.node('#pitchNeedle').hidden,true);
});
test('画面検査スクリプトは構文が正しく、新章・子一覧・偽マイクの検査を含む',async()=>{
 for(const file of ['validation/check-natural-layout.mjs','validation/check-ui.mjs']){const source=await fs.readFile(file,'utf8');new vm.Script('(async()=>{'+source.replace(/^import .*?;\s*$/gm,'')+'})()');assert(source.includes('addList'));assert(source.includes('34low'));}
 for(const file of ['validation/check-deployment.mjs','validation/check-playing.mjs']){const source=await fs.readFile(file,'utf8');new vm.Script('(async()=>{'+source.replace(/^import .*?;\s*$/gm,'').replaceAll('import.meta','moduleMeta')+'})()');}
 const ui=await fs.readFile('validation/check-ui.mjs','utf8');assert(ui.includes('fakePitch'));assert(ui.includes('568'));assert(ui.includes('pitchMeter'));
});
test('サービスワーカーは新アプリだけを保存・読込・旧キャッシュ削除し、他アプリを保全する',async()=>{
 const source=await fs.readFile('dist/sw.js','utf8'),listeners={},opened=[],deleted=[],scope='https://example.test/violin-shodan/',request={method:'GET',url:scope+'index.html'};
 const preserved=['genshirube-v1-20261015b','genshirube-v1-old','other-app','violin-shodanx-old'],stale=['violin-shodan-v1-old','violin-shodan-v0'],data=new Map([...preserved,...stale].map(name=>[name,new Map([[request.url,name]])]));let claimed=false,files;
 const context=vm.createContext({self:{registration:{scope},clients:{claim(){claimed=true;}},addEventListener(name,fn){listeners[name]=fn;}},caches:{async keys(){return [...data.keys()];},async open(name){assert.match(name,/^violin-shodan-/);opened.push(name);if(!data.has(name))data.set(name,new Map());return {async addAll(paths){files=Array.from(paths);data.get(name).set(request.url,'new app');},async match(req){return data.get(name).get(req.url);},async put(req,value){data.get(name).set(req.url,value);}};},async delete(name){deleted.push(name);return data.delete(name);}},async fetch(){throw new Error('offline');}});
 vm.runInContext(source,context);let pending;listeners.install({waitUntil(p){pending=p;}});await pending;const current=opened[0];assert.match(current,/^violin-shodan-/);assert(!stale.includes(current));assert(files.includes('./index.html'));
 listeners.activate({waitUntil(p){pending=p;}});await pending;assert.equal(claimed,true);assert.deepEqual(deleted.sort(),stale.sort());assert(data.has(current));
 listeners.fetch({request,respondWith(p){pending=p;}});assert.equal(await pending,'new app');assert(opened.every(name=>name===current));
 for(const name of preserved)assert.deepEqual([...data.get(name)],[[request.url,name]]);assert.deepEqual([...data.keys()].sort(),[...preserved,current].sort());
 for(const req of [{method:'GET',url:'https://example.test/genshirube/index.html'},{method:'POST',url:request.url}])listeners.fetch({request:req,respondWith(){assert.fail('別アプリの通信やPOSTを処理しない');}});
});
