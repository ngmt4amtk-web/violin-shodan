import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExercise,makeNote,instructionFor,STRINGS,LESSONS} from './dist/content.mjs';
import {renderScore,renderSingle} from './dist/score.mjs';
import {PitchDetector,AudioEngine,Microphone,MicJudge,MIC_LEVELS,AUDIO_CUES,RESUME_MAX_MS,GAP_MS,QUIET_MS,NO_INPUT_RMS,NO_INPUT_MS} from './dist/engine.mjs';
import {targetForNote,centsBetween,keyForShape} from './dist/intonation.mjs';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {appHarness} from './validation/app-harness.mjs';
import {MicStatusModel,MIC_VIEW,micPanelHTML,paintMicStatus} from './dist/mic-status.mjs';
import {READING55_BEFORE} from './validation/reading55-before.mjs';
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
test('19問の既定と形23は改修前の弦・指・音高・長さに全問一致',()=>{
 assert.equal(READING55_BEFORE.length,19);
 for(let problem=1;problem<=19;problem++){
  const ns=makeExercise('reading55',{problem});assert.equal(bars(ns),4);barBeats(ns);assert.ok(ns.every(n=>[1,2].includes(n.beats)));
  assert.deepEqual(ns,makeExercise('reading55',{problem,pattern:'23'}));
  assert.deepEqual(ns.map(n=>[n.string,n.finger,n.midi,n.beats]),READING55_BEFORE[problem-1],`その${problem}`);
 }
 assert.equal(makeExercise('reading55',{problem:10}).filter(n=>n.finger===4).length,2);
 assert.deepEqual(pitches(makeExercise('reading55',{problem:1})),[62,66,67,67,66,64,62,66,67,64,64,62]);
});
test('19問の形12・34は弦・指・長さを保持し、2か3の音高だけ半音変わる',()=>{
 for(let problem=1;problem<=19;problem++)for(const [pattern,changed,delta,intervals] of [['12',2,-1,[0,2,3,5,7]],['34',3,1,[0,2,4,6,7]]]){
  const before=READING55_BEFORE[problem-1],ns=makeExercise('reading55',{problem,pattern});assert.equal(ns.length,before.length);barBeats(ns);
  assert.deepEqual(ns.map(n=>[n.string,n.finger,n.beats]),before.map(([s,f,,b])=>[s,f,b]));
  for(const [i,n] of ns.entries()){
   assert.equal(n.pattern,pattern);assert.equal(n.midi,before[i][2]+(n.finger===changed?delta:0));assert.equal(n.midi,{G:55,D:62,A:69,E:76}[n.string]+intervals[n.finger]);
   assert.deepEqual(n.key,keyForShape(n.string,pattern));
   const svg=renderSingle(n),accidental=n.name.includes('♯')?'sharp':n.name.includes('♭')?'flat':null;
   assert(svg.includes(`aria-label="${n.name}、${n.beats}拍"`));assert.deepEqual([...svg.matchAll(/data-accidental="(.*?)"/g)].map(m=>m[1]),accidental?[accidental]:[]);
  }
  assert.doesNotMatch(renderScore(ns,{},null),/NaN|undefined/);
  for(const string of ['G','D','A','E'])assert.deepEqual(makeExercise('reading55',{problem,pattern,string}),ns,'弦の保存値で問題を移調しない');
 }
});
test('問題1の音名は選んだ形で変わる',()=>{
 for(const [pattern,names] of [['23',['レ','ファ♯','ソ','ソ','ファ♯','ミ','レ','ファ♯','ソ','ミ','ミ','レ']],['12',['レ','ファ','ソ','ソ','ファ','ミ','レ','ファ','ソ','ミ','ミ','レ']],['34',['レ','ファ♯','ソ♯','ソ♯','ファ♯','ミ','レ','ファ♯','ソ♯','ミ','ミ','レ']]]){
  assert.deepEqual(makeExercise('reading55',{problem:1,pattern}).map(n=>n.name),names);console.log(`問題1・形${pattern}: ${names.join('・')}`);
 }
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
});
test('新しい音階はすべて長音階。イ長調2octで下2弦と上2弦を切り替え',()=>{
 const cases=[['scale12','C1',60,12,4],['scale12','G2',55,24,8],['scale34','A1',57,12,4],['scale34','E1',64,12,4],['scale34','A2',57,24,8]];
 for(const [type,scale,root,span,count] of cases){const ns=makeExercise(type,{scale}),ps=pitches(ns);assert.equal(ps[0],root);assert.equal(ps.at(-1),root);assert.equal(Math.max(...ps),root+span);assert.equal(bars(ns),count);barBeats(ns);assert.ok(ps.every(p=>[0,2,4,5,7,9,11].includes((p-root)%12)));}
 const a2=makeExercise('scale34',{scale:'A2'});for(const n of a2)assert.equal(n.pattern,['G','D'].includes(n.string)?'34':'23');assert.equal(a2.at(-1).beats,4);
});
test('6組往復と形の比較は引き続き6小節',()=>{
 for(const string of Object.keys(STRINGS)){
  for(const type of ['pairs23','pairs12','pairs34','compare']){const ns=makeExercise(type,{string});assert.equal(bars(ns),6);barBeats(ns);}
 }
});
test('94番は36小節すべてを8段に分けても欠落せず、全弦・3形で使える',()=>{
 for(const string of Object.keys(STRINGS))for(const pattern of ['12','23','34']){
  const whole=makeExercise('application94',{string,pattern,row:'all'}),parts=Array.from({length:8},(_,i)=>makeExercise('application94',{string,pattern,row:i+1})).flat();
  assert.equal(bars(whole),36);assert.deepEqual(pitches(parts),pitches(whole));barBeats(whole);
 }
});
test('追加全課題の全音符・指・譜面の数値に未定義なし',()=>{
 assert.equal(LESSONS.length,40);
 for(const lesson of LESSONS)for(const string of Object.keys(STRINGS)){
  const ns=makeExercise(lesson.type,{string});assert.ok(!/NaN|undefined/.test(renderScore(ns,{},null)));
 }
});
test('やり方・選択・演奏の楽譜に小節番号のtextがなく、読み上げ用の小節位置は残る',async()=>{
 const check=html=>{
  const scores=[...html.matchAll(/<svg\b[^>]*class="(?:score-bar|score-system)"[^>]*>[\s\S]*?<\/svg>/g)];
  for(const [svg] of scores){
   const body=svg.replace(/<g\b[^>]*data-role="time-signature"[^>]*>[\s\S]*?<\/g>/g,'').replace(/<text\b[^>]*data-role="finger"[^>]*>[\s\S]*?<\/text>/g,'');
   const barNumbers=[...body.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].filter(m=>/^\d+$/.test(m[1].replace(/<[^>]*>/g,'').trim()));
   assert.equal(barNumbers.length,0);assert.match(svg,/aria-label="[^"]*小節(?:目)?"/);
  }
  return scores.length;
 };
 for(const lesson of LESSONS){
  const app=appHarness();app.api.enterLesson(lesson.id);check(app.node('#app').innerHTML);app.api.navigate('setup');assert(check(app.node('#app').innerHTML)>0);
  app.api.setOptions({mic:false,mode:'wait'});await app.api.startPractice();assert(check(app.node('#practiceScore').innerHTML)>0);
  for(const n of makeExercise(lesson.type)){const current=app.node('#noteScore').innerHTML;assert.equal(check(current),1);assert(current.includes(`aria-label="${n.bar+1}小節目"`));app.api.advanceNote();}
 }
});
test('YIN: 全形の実目標Hzと上下オクターブを44.1/48kHzで取り違えない',()=>{
 for(const rate of [44100,48000])for(const string of Object.keys(STRINGS))for(const pattern of ['23','12','34',...(string==='A'?['34low']:[])])for(let finger=0;finger<=4;finger++)for(const octave of [.5,1,2]){
  const n=makeNote(string,finger,1,{pattern,key:keyForShape(string,pattern)}),hz=targetForNote(n).targetHz*octave,detector=new PitchDetector(rate),wave=Float32Array.from({length:4096},(_,i)=>.008*(Math.sin(2*Math.PI*hz*i/rate)+.4*Math.sin(4*Math.PI*hz*i/rate))),result=detector.detect(wave,'high');
  assert(result.frequency,`${rate} ${string} ${pattern} ${finger} ×${octave}`);assert(Math.abs(centsBetween(result.frequency,hz))<5,`${hz} → ${result.frequency}`);
 }
});
test('合格音は固定のding-dongをsineでcue経路へ、正しい音1秒は倍音の多い音で別経路、完了音は控えめ、途中停止後の残響期限',()=>{
 const audio=new AudioEngine(),oscillators=[],gains=[];
 audio.ctx={currentTime:10,createOscillator(){const o={frequency:{},connect(){},disconnect(){},setPeriodicWave(w){this.wave=w;},start(t){this.startAt=t;},stop(t){this.stopAt=t;}};oscillators.push(o);return o;},createGain(){const g={peak:0,gain:{setValueAtTime(){},linearRampToValueAtTime(v){g.peak=Math.max(g.peak,v);}},connect(d){g.dest=d;},disconnect(){}};gains.push(g);return g;}};audio.master={};audio.cue={};audio.bright={};
 audio.success();assert.equal(oscillators.length,2);assert.equal(gains.length,2);assert.deepEqual(oscillators.map(o=>[o.frequency.value,o.type]),[[988,'sine'],[1319,'sine']]);
 for(const [i,start,stop] of [[0,10,10.16],[1,10.12,10.47]]){
  assert.equal(gains[i].dest,audio.cue);assert.equal(gains[i].peak,AUDIO_CUES.success.volume);assert(Math.abs(oscillators[i].startAt-start)<1e-9);assert(Math.abs(oscillators[i].stopAt-stop)<1e-9);
 }
 assert(Math.abs(audio.silentUntil-10.8)<1e-9);
 audio.ctx.currentTime=10.05;audio.stop();assert(Math.abs(audio.silentUntil-10.4)<1e-9);
 audio.correction(442);assert.equal(oscillators.at(-1).frequency.value,442);assert.equal(oscillators.at(-1).wave,audio.bright);assert.equal(gains.at(-1).dest,audio.cue);assert.equal(gains.at(-1).peak,AUDIO_CUES.correction.volume);assert(Math.abs(oscillators.at(-1).stopAt-11.07)<1e-9);assert.equal(AUDIO_CUES.correction.duration,1);
 // 以前の正しい音は .9 × 主音量.18 の三角波。少なくとも4倍の振幅にする。
 assert(AUDIO_CUES.correction.volume>=4*.9*.18);
 audio.complete();assert.deepEqual(oscillators.slice(-2).map(o=>[o.frequency.value,o.type]),[[660,'sine'],[990,'sine']]);assert(gains.slice(-2).every(g=>g.dest===audio.master&&g.peak===AUDIO_CUES.complete.volume&&g.peak<.65));
});
test('実際のメーターは整数表示、別音では音名と修正方向だけ、次の入力で表示を戻す',async()=>{
 const app=appHarness();app.api.enterLesson('fingers');await app.api.startPractice();let time=0;
 for(const [offset,label,direction,message] of [[12.2,'+12¢','高い','高い'],[-4.6,'−5¢','ちょうど','ちょうど'],[.2,'0¢','ちょうど','ちょうど'],[-.2,'0¢','ちょうど','ちょうど'],[-900,'','','ドに聞こえる・高くして'],[900,'','','ファ♯に聞こえる・低くして'],[12,'+12¢','高い','高い']]){
  time+=.07;app.api.setTime(time);app.api.setReading({frequency:442*2**(offset/1200),rms:.02,confidence:.99});app.api.observeMic(time*1000);
  // 状態表示をチップに集約したため、メーターの読み上げもチップ見出しに合わせる。
  assert.equal(app.node('#pitchCents').textContent,label);assert.equal(app.node('#pitchDirection').textContent,direction);assert.equal(app.node('#micFeedback').textContent,message);assert.equal(app.node('#pitchMeter').attributes['aria-valuetext'],app.node('.mic-chip-title').textContent);assert.equal(Number(app.node('#pitchMeter').attributes['aria-valuenow']),Math.max(-50,Math.min(50,offset)));assert.equal(app.node('#pitchNeedle').hidden,false);
 }
 app.api.setReading({frequency:null,rms:0,confidence:0});app.api.observeMic((time+.07)*1000);assert.equal(app.node('#pitchCents').textContent,'— ¢');assert.equal(app.node('#pitchNeedle').hidden,true);
});
test('画面検査スクリプトは構文が正しく、新章・子一覧・偽マイクの検査を含む',async()=>{
 for(const file of ['validation/check-natural-layout.mjs','validation/check-ui.mjs']){const source=await fs.readFile(file,'utf8');new vm.Script('(async()=>{'+source.replace(/^import .*?;\s*$/gm,'')+'})()');assert(source.includes('addList'));assert(source.includes('varietyList'));assert(source.includes('34low'));}
 for(const file of ['validation/check-deployment.mjs','validation/check-playing.mjs']){const source=await fs.readFile(file,'utf8');new vm.Script('(async()=>{'+source.replace(/^import .*?;\s*$/gm,'').replaceAll('import.meta','moduleMeta')+'})()');}
 const ui=await fs.readFile('validation/check-ui.mjs','utf8');for(const text of ['fakePitch','568','pitchMeter','指を1本ずつ確認する','色々な練習','練習する型','①〜⑧を通す','safe-area-inset-','reading55 all 19 problems and three shapes','chapter 07','connect69'])assert(ui.includes(text));
});
test('safe areaはヘッダーと各画面に入り、演奏の100svh内に余白を含む',async()=>{
 const css=await fs.readFile('dist/style.css','utf8'),html=await fs.readFile('dist/index.html','utf8');assert(html.includes('viewport-fit=cover'));assert(css.includes('*{box-sizing:border-box}'));
 for(const selector of ['.app-header','.performance-viewport']){
  const blocks=[...css.matchAll(new RegExp(selector.replaceAll('.','\\.')+'\\{([^}]+)\\}','g'))].map(m=>m[1]);assert(blocks.length>=3);
  for(const block of blocks){
   if(block.includes('padding:')){const padding=block.match(/(?:^|;)padding:([^;]+)/)[1];for(const edge of selector==='.app-header'?['top','right','left']:['top','right','bottom','left'])assert(padding.includes(`env(safe-area-inset-${edge},0px)`));}
   for(const edge of ['top','right','bottom','left'])if(block.includes('padding-'+edge+':')&&!(selector==='.app-header'&&edge==='bottom'))assert(block.match(new RegExp('padding-'+edge+':([^;]+)'))[1].includes(`env(safe-area-inset-${edge},0px)`));
  }
 }
 const workspace=css.match(/\.workspace\{([^}]+)\}/)[1],player=css.match(/\.performance-viewport\{([^}]+)\}/)[1];for(const edge of ['right','bottom','left'])assert(workspace.includes(`env(safe-area-inset-${edge},0px)`));assert(player.includes('height:100svh;'));assert(player.includes('box-sizing:border-box;'));assert(!/height:calc\(100svh\s*\+/.test(player));
});
test('サービスワーカーは新アプリだけを保存・読込・旧キャッシュ削除し、他アプリを保全する',async()=>{
 const source=await fs.readFile('dist/sw.js','utf8'),listeners={},opened=[],deleted=[],scope='https://example.test/violin-shodan/',request={method:'GET',url:scope+'index.html'};
 const preserved=['genshirube-v1-20261015b','genshirube-v1-old','other-app','violin-shodanx-old'],stale=['violin-shodan-v1-20261015a','violin-shodan-v1-old','violin-shodan-v0'],data=new Map([...preserved,...stale].map(name=>[name,new Map([[request.url,name]])]));let claimed=false,files;
 const context=vm.createContext({self:{registration:{scope},clients:{claim(){claimed=true;}},addEventListener(name,fn){listeners[name]=fn;}},caches:{async keys(){return [...data.keys()];},async open(name){assert.match(name,/^violin-shodan-/);opened.push(name);if(!data.has(name))data.set(name,new Map());return {async addAll(paths){files=Array.from(paths);data.get(name).set(request.url,'new app');},async match(req){return data.get(name).get(req.url);},async put(req,value){data.get(name).set(req.url,value);}};},async delete(name){deleted.push(name);return data.delete(name);}},async fetch(){throw new Error('offline');}});
 vm.runInContext(source,context);let pending;listeners.install({waitUntil(p){pending=p;}});await pending;const current=opened[0];assert.match(current,/^violin-shodan-/);assert(!stale.includes(current));assert(files.includes('./index.html'));
 listeners.activate({waitUntil(p){pending=p;}});await pending;assert.equal(claimed,true);assert.deepEqual(deleted.sort(),stale.sort());assert(data.has(current));
 listeners.fetch({request,respondWith(p){pending=p;}});assert.equal(await pending,'new app');assert(opened.every(name=>name===current));
 for(const name of preserved)assert.deepEqual([...data.get(name)],[[request.url,name]]);assert.deepEqual([...data.keys()].sort(),[...preserved,current].sort());
 for(const req of [{method:'GET',url:'https://example.test/genshirube/index.html'},{method:'POST',url:request.url}])listeners.fetch({request:req,respondWith(){assert.fail('別アプリの通信やPOSTを処理しない');}});
});
const micRange=targetForNote(makeNote('A',0)),micVoice=(cents=0,rms=.02)=>({frequency:micRange.targetHz*2**(cents/1200),rms,confidence:.99}),micQuiet={rms:0,frequency:null,confidence:0};
function correctedJudge(level='high'){const g=new MicJudge();for(let t=0;t<=640;t+=80)assert.equal(g.observe(micVoice(20),micRange,t,level),null);assert.equal(g.observe(micVoice(20),micRange,660,level),'wrong');return g;}
test('(a) 入力欠落180ms以内: 信頼度不足1フレームを挟んでも320msで合格',()=>{
 assert.equal(GAP_MS,180);for(const missing of [{...micVoice(),confidence:.1},micQuiet,{...micVoice(),frequency:null}]){const g=new MicJudge();for(const t of [0,80,160,240])assert.equal(g.observe(t===160?missing:micVoice(),micRange,t),null);assert.equal(g.observe(micVoice(),micRange,320),'correct');}
 const g=new MicJudge();g.observe(micVoice(),micRange,0);g.observe(micQuiet,micRange,181);for(const t of [240,320,400,480])assert.equal(g.observe(micVoice(),micRange,t),null);assert.equal(g.observe(micVoice(),micRange,560),'correct');
});
test('(b) success後は大きなrmsのままsoundEnd+tailでlistening',()=>{
 const g=new MicJudge();for(const t of [0,80,160,240,320])g.observe(micVoice(),micRange,t);const end=g.blockedUntil;g.observe(micVoice(0,.08),micRange,end-1);assert.equal(g.state,'tail');assert.equal(g.observe(micVoice(0,.08),micRange,end),null);assert.equal(g.state,'listening');
});
test('(c) correction後700msで復帰・同じ外れ音は再発せずsuccess可能・30¢か切れ目で再装填',()=>{
 assert.equal(RESUME_MAX_MS,700);for(const release of ['pitch','invalid','quiet','halfRms']){
  const g=correctedJudge(),end=g.blockedUntil;for(let t=720;t<end+700;t+=20)assert.equal(g.observe(micVoice(20),micRange,t),null);assert.equal(g.observe(micVoice(20),micRange,end+700),null);assert.equal(g.state,'listening');assert(g.correctionGuard);
  for(let t=end+720;t<=end+2720;t+=80){assert.equal(g.observe(micVoice(20),micRange,t),null);assert.equal(g.state,'listening');}
  const at=end+2800,r=release==='pitch'?micVoice(50):release==='invalid'?{...micVoice(20),confidence:.1}:release==='halfRms'?micVoice(20,.009):micQuiet;
  assert.equal(g.observe(r,micRange,at),null);assert.equal(g.correctionGuard,null);let wrong=false;for(let t=at+80;t<=at+1120;t+=80)if(g.observe(micVoice(release==='pitch'?50:20),micRange,t)==='wrong')wrong=true;assert(wrong,release);
 }
 const g=correctedJudge(),end=g.blockedUntil+700;g.observe(micVoice(20),micRange,end);for(const t of [end+80,end+160,end+240,end+320])assert.equal(g.observe(micVoice(),micRange,t),null);assert.equal(g.observe(micVoice(),micRange,end+400),'correct');
 const ref=new MicJudge();ref.observe(micVoice(20),micRange,0);ref.block('reference',0);ref.observe(micVoice(20),micRange,ref.blockedUntil+700);assert.equal(ref.state,'listening');assert.equal(ref.correctionGuard,null);
});
test('(d) correction後に弓を止めると残響後120msで戻る・相対rmsも静かと扱う',()=>{
 assert.equal(QUIET_MS,120);for(const rms of [0,.006]){const g=correctedJudge(),end=g.blockedUntil;g.observe({...micQuiet,rms},micRange,end);g.observe({...micQuiet,rms},micRange,end+119);assert.equal(g.state,'awaitSilence');g.observe({...micQuiet,rms},micRange,end+120);assert.equal(g.state,'listening');assert.equal(g.correctionGuard,null);}
});
test('(e) 補正直前rms0.02・最高感度rms0.002雑音10秒でも1.5秒以内にlistening・永久停止なし',()=>{
 const g=correctedJudge('ultra'),start=g.cueStart;let resumed=null;for(let t=start+10;t<=start+10000;t+=10){assert.equal(g.observe({rms:.002,frequency:null,confidence:0},micRange,t,'ultra'),null);if(g.state==='listening'&&resumed===null)resumed=t;}assert(resumed-start<=1500);assert.equal(g.state,'listening');
 // 直前も0.002なら静かの閾値は0.0007。契約の700ms上限が優先し、全待ち時間は2050ms。
 const low=new MicJudge();for(const t of [0,80,160,240,320,400,480,560,640,660])low.observe(micVoice(20,.002),micRange,t,'ultra');const deadline=low.blockedUntil+700;for(let t=low.cueStart+10;t<deadline;t+=10)low.observe({rms:.002,frequency:null,confidence:0},micRange,t,'ultra');assert.notEqual(low.state,'listening');low.observe({rms:.002,frequency:null,confidence:0},micRange,deadline,'ultra');assert.equal(low.state,'listening');assert.equal(deadline-low.cueStart,2050);
});
test('(f) 同じ目標±1¢は切れ目なしで再合格しない・半分未満のrmsか無効入力で解除',()=>{
 const early=new MicJudge();for(const t of [0,80,160,240,320])early.observe(micVoice(),micRange,t);early.observe(micQuiet,micRange,400);assert.equal(early.repeatGuard,null);early.observe(micVoice(),micRange,1120);for(const t of [1200,1280,1360,1440])assert.equal(early.observe(micVoice(),micRange,t),null);assert.equal(early.observe(micVoice(),micRange,1520),'correct');
 for(const gap of [micQuiet,{...micVoice(),confidence:.1},micVoice(0,.009)]){const g=new MicJudge();for(const t of [0,80,160,240])g.observe(micVoice(),micRange,t);assert.equal(g.observe(micVoice(),micRange,320),'correct');const next={...micRange,targetHz:micRange.targetHz*2**(.5/1200)};g.nextNote();for(let t=400;t<=4000;t+=80)assert.equal(g.observe(micVoice(),next,t),null);assert.equal(g.state,'listening');g.observe(gap,next,4080);const first=gap.frequency&&gap.confidence>=.72?4080:4160;for(let t=4160;t<first+320;t+=80)assert.equal(g.observe(micVoice(),next,t),null);assert.equal(g.observe(micVoice(),next,first+320),'correct');}
});
const statusInput={judgeState:'listening',cueKind:null,rms:.02,soundPresent:true,validPitch:true,ctxState:'running',micHealth:'live',phase:'playing',pausedReason:null,nowMs:0,cueStartMs:0,cueEndMs:1000};
test('(g1) MicStatusModel優先順位: 全軸の全組合せと全13状態',()=>{
 const seen=new Set();for(const ctxState of ['running','suspended','interrupted','off'])for(const micHealth of ['off','live','muted','ended'])for(const phase of ['starting','playing','paused'])for(const pausedReason of ['paused','hidden'])for(const judgeState of ['listening','correction','reference','success','tail','awaitSilence'])for(const input of [{rms:0,soundPresent:false,validPitch:false},{rms:.0001,soundPresent:false,validPitch:false},{rms:.02,soundPresent:true,validPitch:false},{rms:.02,soundPresent:true,validPitch:true}]){
  const model=new MicStatusModel(),base={...statusInput,ctxState,micHealth,phase,pausedReason,judgeState,...input};seen.add(model.update(base).key);const view=model.update({...base,nowMs:2500});
  // hearingはNO_INPUT_RMSではなく、呼び出し側の感度別soundPresentで決まる。
  const expected=ctxState!=='running'?'audioStopped':micHealth==='ended'?'micEnded':micHealth==='muted'?'micMuted':phase==='paused'?pausedReason:phase==='starting'?'starting':['correction','reference','success'].includes(judgeState)?judgeState:judgeState!=='listening'?'resuming':input.rms===0?'noInput':input.soundPresent?'hearing':'listening';
  assert.equal(view.key,expected,JSON.stringify(base));assert.equal(view.tone,MIC_VIEW[expected].tone);seen.add(view.key);
 }assert.deepEqual([...seen].sort(),Object.keys(MIC_VIEW).sort());
});
test('(g2) MicStatusModelちらつき: 60ms交互入力で表示変更400msに1回以下・300ms保持と即時復帰',()=>{
 const model=new MicStatusModel();model.update({...statusInput,rms:0,soundPresent:false,validPitch:false});let old='listening',lastChange=-Infinity;
 for(let t=60;t<6000;t+=60){const valid=t%120===0,key=model.update({...statusInput,nowMs:t,rms:valid?.02:0,soundPresent:valid,validPitch:valid}).key;if(key!==old){assert(t-lastChange>=400);lastChange=t;old=key;}}assert.equal(old,'listening');
 for(let t=6000;t<=6420;t+=60)model.update({...statusInput,nowMs:t});assert.equal(model.key,'hearing');
 const short=new MicStatusModel();short.update({...statusInput,judgeState:'success'});assert.equal(short.update({...statusInput,judgeState:'tail',nowMs:100}).key,'success');assert.equal(short.update({...statusInput,judgeState:'tail',nowMs:300}).key,'resuming');assert.equal(short.update({...statusInput,nowMs:301}).key,'hearing');assert.equal(short.update({...statusInput,ctxState:'suspended',nowMs:302}).key,'audioStopped');
});
test('(g3) MicStatusModel凍ったctx時刻でもnowMsでnoInput・audioStopped、無音2秒はlistening限定',()=>{
 assert.equal(NO_INPUT_RMS,1e-5);assert.equal(NO_INPUT_MS,2000);const m=new MicStatusModel(),input={...statusInput,rms:0,soundPresent:false,validPitch:false,ctxTime:0};m.update(input);assert.equal(m.update({...input,nowMs:1999}).key,'listening');assert.equal(m.update({...input,nowMs:2000}).key,'noInput');assert.equal(m.update({...input,ctxState:'suspended',nowMs:2001}).key,'audioStopped');
 for(const extra of [{phase:'paused'},{judgeState:'awaitSilence'},{micHealth:'muted'}]){const m=new MicStatusModel();m.update({...input,...extra});assert.notEqual(m.update({...input,...extra,nowMs:10000}).key,'noInput');}
 const interrupted=new MicStatusModel();assert.equal(interrupted.update({...input,ctxState:'interrupted'}).key,'audioStopped');
});
test('(g4) MicStatusModel busy残量はsuccess・correction・referenceからresumingまで単調減少',()=>{
 for(const kind of ['success','correction','reference']){const m=new MicStatusModel(),soundEnd=AUDIO_CUES[kind].duration*1000,end=soundEnd+350+(kind==='success'?0:700);let previous=1;for(let t=0;t<=end;t+=10){const v=m.update({...statusInput,judgeState:t<soundEnd?kind:'awaitSilence',cueKind:kind,cueEndMs:soundEnd,nowMs:t});assert(v.progress>=0&&v.progress<=1);assert(v.progress<=previous);previous=v.progress;}assert.equal(previous,0);assert.equal(m.update({...statusInput,nowMs:end+1}).progress,null);}
});
test('correction理由: block時の低め・高めを保持し、方向なしはずれと表示',()=>{
 for(const [cents,direction,word,other] of [[-20,'low','低め','高め'],[20,'high','高め','低め']]){
  const g=new MicJudge();for(let t=0;t<=640;t+=80)g.observe(micVoice(cents),micRange,t);assert.equal(g.observe(micVoice(cents),micRange,660),'wrong');assert.equal(g.cueDirection,direction);g.nextNote();g.observe(micVoice(-cents),micRange,700);assert.equal(g.cueDirection,direction);
  const v=new MicStatusModel().update({...statusInput,judgeState:g.state,cueDirection:g.cueDirection});assert.equal(v.reason,`音程が${word}でした。鳴り終わると自動で再開`);assert(!v.reason.includes(other));g.block('reference',800);assert.equal(g.cueDirection,null);g.reset();assert.equal(g.cueDirection,null);
 }
 const g=new MicJudge();g.block('correction',0);assert.equal(g.cueDirection,null);assert.equal(new MicStatusModel().update({...statusInput,judgeState:g.state,cueDirection:g.cueDirection}).reason,'音程がずれました。鳴り終わると自動で再開');
});
test('hearingはsoundPresent: 感度未満の雑音はlistening、音程不明は聞き取り中・400ms保持',()=>{
 for(const {minRms} of Object.values(MIC_LEVELS)){
  const m=new MicStatusModel(),quiet={...statusInput,rms:minRms*.99,soundPresent:false,validPitch:false};for(const nowMs of [0,400,2000,10000]){const v=m.update({...quiet,nowMs});assert.equal(v.key,'listening');assert.equal(v.reason,'弾いてください');}
  const sound={...quiet,rms:minRms,soundPresent:true};assert.equal(m.update({...sound,nowMs:10001}).key,'listening');assert.equal(m.update({...sound,nowMs:10400}).key,'listening');const v=m.update({...sound,nowMs:10401});assert.equal(v.key,'hearing');assert.equal(v.reason,'音程を聞き取っています');assert.equal(m.update({...sound,validPitch:true,nowMs:10402}).reason,'');assert.equal(m.update({...quiet,nowMs:10500}).key,'hearing');const back=m.update({...quiet,nowMs:10900});assert.equal(back.key,'listening');assert.equal(back.reason,'弾いてください');
 }
 assert.equal(new MicStatusModel().update({...statusInput,soundPresent:false}).key,'listening');
});
test('cutCue: 再生を今止めてtail350msから復帰、種別・方向・再装填条件を保つ・終了後は変更なし',()=>{
 for(const kind of ['success','correction','reference']){
  const g=kind==='correction'?correctedJudge():new MicJudge();if(kind!=='correction'){g.observe(micVoice(20),micRange,0);g.block(kind,0);}const start=g.cueStart,at=start+100,oldEnd=g.soundEnd,direction=g.cueDirection,repeat=g.repeatGuard;
  g.cutCue(at);assert.equal(g.state,'tail');assert.equal(g.cueKind,kind);assert.equal(g.cueStart,start);assert.equal(g.cueDirection,direction);assert.equal(g.repeatGuard,repeat);assert.equal(g.soundEnd,at);assert.equal(g.blockedUntil,at+350);assert.equal(g.quietSince,null);assert(g.soundEnd<oldEnd);g.cutCue(at+1);assert.equal(g.soundEnd,at);
  g.observe(micVoice(20),micRange,at+349);assert.equal(g.state,'tail');g.observe(micVoice(20),micRange,at+350);assert.equal(g.state,kind==='success'?'listening':'awaitSilence');if(kind!=='success'){g.observe(micVoice(20),micRange,at+1050);assert.equal(g.state,'listening');assert.equal(!!g.correctionGuard,kind==='correction');}
  const snapshot=JSON.stringify(g);g.cutCue(at+2000);assert.equal(JSON.stringify(g),snapshot);
 }
 const idle=new MicJudge(),snapshot=JSON.stringify(idle);idle.cutCue(0);assert.equal(JSON.stringify(idle),snapshot);const early=correctedJudge(),at=early.cueStart+100;early.cutCue(at);early.observe(micQuiet,micRange,at+350);early.observe(micQuiet,micRange,at+470);assert.equal(early.state,'listening');assert.equal(early.correctionGuard,null);
});
test('AudioEngine状態通知とensureRunning、Microphone health通知・restart・古いtrackの隔離',async()=>{
 const engine=(await fs.readFile('dist/engine.mjs','utf8')).replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,''),tracks=[],states=[],health=[],session={};let resumes=0;
 const context=vm.createContext({Float32Array,etFreq:()=>442,centsBetween,window:{AudioContext:class{constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=48000;this.destination={};}createGain(){return {gain:{value:0},connect(){}};}createPeriodicWave(){return {};}async resume(){resumes++;this.state='running';this.onstatechange?.();}createMediaStreamSource(){return {connect(){},disconnect(){}};}createAnalyser(){return {disconnect(){}};}}},navigator:{audioSession:session,mediaDevices:{async getUserMedia(){const t={readyState:'live',muted:false,events:{},addEventListener(n,f){this.events[n]=f;},stop(){this.readyState='ended';}};tracks.push(t);return {getTracks:()=>[t],getAudioTracks:()=>[t]};}}}});
 vm.runInContext(engine+';globalThis.subject={audio:new AudioEngine(),Microphone};',context);const {audio,Microphone:Mic}=context.subject;audio.onstate=s=>states.push(s);assert.equal(audio.state,'off');assert.equal(await audio.ensureRunning(),false);await audio.init();assert.deepEqual(states,['running']);assert.equal(resumes,1);await audio.ensureRunning();assert.equal(resumes,1);audio.ctx.state='interrupted';audio.ctx.onstatechange();assert.equal(await audio.ensureRunning(),true);assert.deepEqual(states,['running','interrupted','running']);
 const m=new Mic(audio);m.onhealth=s=>health.push(s);assert.equal(m.health,'off');await m.start();assert.equal(m.health,'live');assert.equal(session.type,'play-and-record');tracks[0].muted=true;tracks[0].events.mute();assert.equal(m.health,'muted');tracks[0].muted=false;tracks[0].events.unmute();tracks[0].readyState='ended';tracks[0].events.ended();assert.equal(m.health,'ended');await m.restart();assert.equal(m.health,'live');const count=health.length;tracks[0].events.ended();assert.equal(health.length,count);m.stop();assert.equal(m.health,'off');assert.equal(session.type,'playback');assert.deepEqual(health,['live','muted','live','ended','off','live','off']);
});
test('共有チップ描画: 見出しだけlive通知・差分更新・残量・操作ボタン',()=>{
 // 短文化しても操作文は残し、理由を24字以内に収める。
 for(const [key,view] of Object.entries(MIC_VIEW))assert(view.reason.length<=24,key+' reason length');
 assert.equal(MIC_VIEW.micEnded.reason,'タップでつなぎ直せます');assert.equal(MIC_VIEW.noInput.reason,'許可と接続を確かめてください');
 const html=micPanelHTML();assert.match(html,/id="micStatus".*aria-live="polite"/);assert.match(html,/mic-chip-reason" aria-live="off"/);assert.match(html,/data-action="micRecover"/);
 const nodes=new Map();let writes=0;const root={querySelector(selector){if(!nodes.has(selector)){const el={dataset:{},style:{},hidden:false};Object.defineProperty(el,'textContent',{get(){return this.text||'';},set(v){writes++;this.text=v;}});nodes.set(selector,el);}return nodes.get(selector);}};
 const v={key:'audioStopped',...MIC_VIEW.audioStopped,progress:null};paintMicStatus(root,v);assert.equal(root.querySelector('#micStatus').dataset.tone,'stopped');assert.equal(root.querySelector('.mic-chip-action').hidden,false);const count=writes;paintMicStatus(root,v);assert.equal(writes,count);paintMicStatus(root,{key:'resuming',...MIC_VIEW.resuming,progress:.4});assert.equal(root.querySelector('.mic-chip-progress>span').style.width,'40%');assert.equal(root.querySelector('.mic-chip-action').hidden,true);
});
