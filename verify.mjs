import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,STRINGS,makeExercise,makeNote,READING,CHAPTERS,CHAPTER_SUB,COMMON_MENU,VARIETY_MENU,chapterItems,lessonPage,commonSteps,normalizeOptions,PATTERNS} from './dist/content.mjs';
import {frequencyFor,centsFrom,PitchDetector,StablePitchGate,MicJudge,AudioEngine,AUDIO_CUES,transportStart} from './dist/engine.mjs';
import {renderScore,renderSingle,renderSystems} from './dist/score.mjs';
import {normalizeStored} from './dist/settings.mjs';
import {ROWS64,APPLICATION94} from './dist/repertoire.mjs';
import {DIFFICULTIES,etFreq,ratioCents,centsBetween,FIFTH_DEVIATION,spelledFifthsFromC,tonalKey,keyForShape,keyName,targetDegreeInfo,intervalCentsFromET,intonationTargets,openStringOffset,openStringTargetHz,drillGetRange,targetForNote,pitchFeedback,detectedName} from './dist/intonation.mjs';
import fs from 'node:fs/promises';
import {exerciseCases} from './validation/exercise-cases.mjs';
import {appHarness} from './validation/app-harness.mjs';

test('現在音の背景は五線・加線・音符を覆わない順序で描く',()=>{
 const svg=renderScore(makeExercise('open',{string:'G',rhythm:'quarter'}));
 for(const bar of svg.split('</svg>').filter(Boolean)){
  const lastHighlight=bar.lastIndexOf('class="note-highlight"');
  assert.ok(lastHighlight<bar.indexOf('data-role="staff-line"'));
  assert.ok(lastHighlight<bar.indexOf('data-role="ledger-line"'));
  assert.ok(lastHighlight<bar.indexOf('data-role="notehead"'));
  assert.equal((bar.match(/data-role="staff-line"/g)||[]).length,5);
 }
});

test('4弦の0〜4が、全音・全音・半音・全音になる',()=>{
 for(const s of Object.keys(STRINGS)){const ns=[0,1,2,3,4].map(f=>makeNote(s,f));assert.deepEqual(ns.slice(1).map((n,i)=>n.midi-ns[i].midi),[2,2,1,2]);}
 assert.equal(makeNote('G',0).midi,55);assert.equal(makeNote('E',4).midi,83);
 for(const [a,b] of [['G','D'],['D','A'],['A','E']])assert.equal(makeNote(a,4).midi,makeNote(b,0).midi);
});
test('すべての課題が生成でき、イベントは隙間も重なりもない',()=>{
 for(const l of LESSONS)for(const s of Object.keys(STRINGS)){
  const ns=makeExercise(l.type,{string:s});assert.ok(ns.length>0);
  ns.forEach((n,i)=>{assert.ok(n.beats>0);assert.equal(n.end,n.start+n.beats);if(i)assert.equal(n.start,ns[i-1].end);});
 }
});
test('全音符・2分・4分・8分とランダムが正確に4小節になる',()=>{
 for(const rhythm of ['whole','half','quarter','eighth','random'])for(let i=0;i<40;i++){
  const ns=makeExercise('open',{string:'random',rhythm});assert.equal(ns.at(-1).end,16);
  for(let b=0;b<4;b++)assert.equal(ns.filter(n=>n.bar===b).reduce((s,n)=>s+n.beats,0),4);
 }
 assert.equal(makeExercise('open',{mode:'step'}).at(-1).end,16);
});
test('7段階は往復14音・二重音は隣接弦だけ・原譜の頂点を反復',()=>{
 const ns=makeExercise('heights');assert.equal(ns.length,14);assert.equal(ns.at(-1).end,56);
 assert.deepEqual(ns.map(n=>n.chord.map(x=>x.string).join('')),['G','GD','D','DA','A','AE','E','E','AE','A','DA','D','GD','G']);
 for(let i=1;i<=7;i++)assert.equal(makeExercise('heights',{height:i}).length,1);
});
test('p14は休符を挟み、各段2回。各ペアの8小節',()=>{
 for(const pair of ['GD','DA','AE']){const ns=makeExercise('cross',{pair});assert.equal(ns.at(-1).end,32);assert.equal(ns.filter(n=>n.rest).length,16);assert.equal(ns.filter(n=>!n.rest).map(n=>n.string).join(''),(pair[0]+pair[1]+pair[1]+pair[0]+pair[0]+pair[1]+pair[1]+pair[0]).repeat(2));}
});
test('p25–26の8題が4小節。音符・休符の原譜パターン',()=>{
 assert.equal(READING.length,8);for(let p=1;p<=8;p++)assert.equal(makeExercise('reading',{problem:p}).at(-1).end,16);
 assert.deepEqual(makeExercise('reading',{problem:1}).map(n=>n.beats),[1,1,1,1,2,2,1,1,2,4]);
 assert.equal(makeExercise('reading',{problem:2}).filter(n=>n.rest).length,1);
 assert.deepEqual(makeExercise('reading',{problem:5}).map(n=>n.beats),[1,.5,.5,1,1,1,1,1,1,2,2,4]);
 assert.equal(makeExercise('reading',{problem:8}).find(n=>n.rest).beats,2);
});
test('p34は3小節、p36は2小節、p40上段は4小節',()=>{
 for(const type of ['add2','add3','add4'])assert.equal(makeExercise(type).at(-1).end,12);
 assert.deepEqual(makeExercise('add2').map(n=>n.finger),[0,1,2,1,2,1,2,1,2,1,0]);
 assert.deepEqual(makeExercise('add3').map(n=>n.finger),[1,2,3,2,3,2,3,2,3,2,1]);
 assert.deepEqual(makeExercise('add4').map(n=>n.finger),[2,3,4,3,4,3,2,1,4,3,2,1]);
 assert.equal(makeExercise('place').at(-1).end,8);assert.equal(makeExercise('place')[1].rest,true);
 assert.deepEqual(makeExercise('keep23',{row:'7'}).map(n=>n.finger),[0,1,2,3,1,2,3,4,0,1,2,1,1,2,3,2]);
});
test('3音階の音程。0/4を選んでも音高は変わらない',()=>{
 for(const scale of ['GD','DA','AE']){
  const a=makeExercise('scale',{scale,fourth:'0'}),b=makeExercise('scale',{scale,fourth:'4'});
  assert.deepEqual(a.map(n=>n.midi),b.map(n=>n.midi));assert.equal(a.at(-1).end,32);
  assert.deepEqual(a.slice(0,8).map(n=>n.midi-a[0].midi),[0,2,4,5,7,9,11,12]);
  assert.deepEqual(a.slice(8).map(n=>n.midi),a.slice(0,8).reverse().map(n=>n.midi));
  assert.equal(a.filter(n=>n.slurStart||n.slurEnd).length,0);
 }
});
test('YIN: 全弦0〜4・低音量・倍音混合を44.1/48kHzで検出',()=>{
 for(const rate of [44100,48000]){const detector=new PitchDetector(rate);for(const s of Object.keys(STRINGS))for(let f=0;f<=4;f++){
  const midi=makeNote(s,f).midi,freq=frequencyFor(midi),input=Float32Array.from({length:4096},(_,i)=>.006*(Math.sin(2*Math.PI*freq*i/rate)+.4*Math.sin(4*Math.PI*freq*i/rate)));
  const r=detector.detect(input,'high');assert.ok(r.frequency,`${rate} ${s}${f}`);assert.ok(Math.abs(centsFrom(r.frequency,midi))<8,`${rate} ${s}${f}: ${r.frequency}`);
 }}
});
test('無音・ノイズ・半音違い・オクターブ違いを合格にしない',()=>{
 const det=new PitchDetector(48000);assert.equal(det.detect(new Float32Array(4096)).frequency,null);
 let seed=9;const noise=Float32Array.from({length:4096},()=>{seed=(seed*1664525+1013904223)>>>0;return (seed/2**32-.5)*.02;});assert.equal(det.detect(noise).frequency,null);
 const g=new StablePitchGate();for(let t=0;t<1000;t+=60)assert.equal(g.observe({frequency:frequencyFor(70)},drillGetRange(69),t),false);
 for(let t=0;t<1000;t+=60)assert.equal(g.observe({frequency:frequencyFor(81)},drillGetRange(69),t),false);
});
test('正音320msで通過、無音でリセット、フレーム中断もリセット',()=>{
 const g=new StablePitchGate(),r={frequency:442},range=drillGetRange(69);for(const t of [0,60,120,180,240,300])assert.equal(g.observe(r,range,t),false);assert.equal(g.observe(r,range,360),true);
 assert.equal(g.observe({frequency:null},range,400),false);assert.equal(g.observe(r,range,460),false);assert.equal(g.observe(r,range,800),false);
});
test('SVG: すべての譜面・指/色/音名なしでもNaNなし',()=>{
 for(const l of LESSONS){const ns=makeExercise(l.type);for(const prefs of [{},{colors:false,fingers:false,names:false}])for(let group=0;group<=Math.floor(ns.at(-1).bar/4);group++){
  const svg=renderScore(ns,prefs,group);assert.ok(!/NaN|undefined/.test(svg));assert.ok(svg.includes('<svg'));
 }for(const n of ns)assert.ok(!/NaN|undefined/.test(renderSingle(n,{})));}
});

const near=(actual,expected,tolerance=.002)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected} (±${tolerance})`);
test('開放弦ランダム1000種: 4拍、8分は整数拍から2個、全音符は小節頭',()=>{
 let wholes=0,eighths=0;for(let seed=1;seed<=1000;seed++){let state=seed;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/2**32;};const ns=makeExercise('open',{rhythm:'random',string:'random'},random);
  for(let b=0;b<4;b++)assert.equal(ns.filter(n=>n.bar===b).reduce((sum,n)=>sum+n.beats,0),4);
  for(let i=0;i<ns.length;i++){const n=ns[i];assert(n.end<=(n.bar+1)*4);if(n.beats===4){wholes++;assert.equal(n.start%4,0);}if(n.beats===.5){eighths++;assert.equal(n.start%1,0);assert.equal(ns[i+1]?.beats,.5);assert.equal(ns[i+1].start,n.start+.5);assert.equal(ns[i+1].bar,n.bar);i++;}}
 }assert(wholes>0);assert(eighths>0);
});
test('全課題・全弦・全形・全型・問題・音階で4/4、各小節4拍、スラー0',()=>{
 const cases=exerciseCases();assert(cases.length>300);
 for(const [l,o] of cases){const ns=makeExercise(l.type,o,()=>.37);for(let b=0;b<=ns.at(-1).bar;b++)assert.equal(ns.filter(n=>n.bar===b).reduce((sum,n)=>sum+n.beats,0),4,l.id+JSON.stringify(o));for(const n of ns){assert.equal(n.meter,4);assert(n.end<=(n.bar+1)*4);assert(!n.slurStart&&!n.slurEnd);}assert(!renderSystems(ns,{},3).includes('data-role="slur"'));}
});
test('8章の構成・共通3行・2つの子一覧・廃止した課題だけを削除',()=>{
 assert.deepEqual(CHAPTERS,['開放弦','2と3をくっつける','はじめての音階','1と2をくっつける','3と4をくっつける','音階','指の形を切り替える','楽譜を読んで弾く・応用']);
 for(const [unit,ids] of [[0,['open','heights','cross','reading']],[2,['scale']],[5,['scale12','scale34']],[6,['switch2','compare','switch3','switch23']],[7,['reading55','application94']]])assert.deepEqual(chapterItems(unit).map(l=>l.id),ids);
 for(const unit of [1,3,4]){const items=chapterItems(unit);assert.deepEqual(items.map(l=>l.title),COMMON_MENU.map(x=>x[1]));assert.deepEqual(items[1].children.map(l=>l.title),['2の指を足す','3の指を足す','4の指を足す']);assert.deepEqual(items.map(l=>l.title),['この形をつかむ','指を1本ずつ確認する','色々な練習']);assert.deepEqual(items[2].children.map(l=>l.title),['4本の指を置いて、離していく','全パターンの動きを練習する','形を保って続ける','開放弦を軸に往復する','3音ずつ上り下り']);assert.deepEqual(items[2].children.map(l=>l.title),VARIETY_MENU.map(x=>x[1]));assert.equal(items.filter(l=>l.children).length,2);}
 const old=['open','heights','cross','reading','fingers','add2','add3','add4','place','scale','reading55','fingers12','pairs12','keep12','switch2','scale12','fingers34','pairs34','compare','scale34','application94'];for(const id of old)assert(LESSONS.some(l=>l.id===id));assert.equal(new Set(LESSONS.map(l=>l.id)).size,40);assert(!LESSONS.some(l=>l.id==='connect69'));
});
test('共通メニューは指順とリズムを保ち、音と半音説明だけを形に合わせる',()=>{
 const golden={fingers:[0,1,2,3,4,3,2,1,0].map(f=>[f,4]),add2:[0,1,2,1,2,1,2,1,2,1,0].map((f,i)=>[f,i===10?2:1]),add3:[1,2,3,2,3,2,3,2,3,2,1].map((f,i)=>[f,i===10?2:1]),add4:[2,3,4,3,4,3,2,1,4,3,2,1].map(f=>[f,1]),place:[[1,1],['rest',1],[4,2],[4,1],[3,1],[2,1],[1,1]],pairs:[1,2,1,3,1,4,2,3,2,4,3,4,4,3,4,2,4,1,3,2,3,1,2,1].map(f=>[f,1]),pivot:[...[0,1,0,2,0,3,0,4,0,4,0,3,0,2,0,1].map(f=>[f,1]),[0,4]],triples:[...[0,1,2,1,1,2,3,2,2,3,4,3,4,3,2,3,3,2,1,2,2,1,0,1].map(f=>[f,1]),[0,4]]};
 for(const [l,o] of exerciseCases().filter(([l])=>l.exercise)){const ns=makeExercise(l.id,o),shape=l.pattern==='34'&&o.string==='A'&&o.variant==='flat'?'34low':l.pattern;
  const expected=golden[l.exercise]||((o.row==='random'?o.resolvedRow:Number(o.row))===7?[0,1,2,3,1,2,3,4,0,1,2,1,1,2,3,2].map(f=>[f,1]):ROWS64[(o.row==='random'?o.resolvedRow:Number(o.row))-1].map(([,f,b])=>[f,b]));assert.deepEqual(ns.map(n=>[n.rest?'rest':n.finger,n.beats]),expected);
  for(const n of ns.filter(n=>!n.rest)){assert.equal(n.pattern,shape);assert.equal(n.midi,STRINGS[o.string].midi+PATTERNS[shape].intervals[n.finger]);}
  if(l.exercise.startsWith('add')){const f=Number(l.exercise.at(-1)),gap=PATTERNS[shape].intervals[f]-PATTERNS[shape].intervals[f-1]===1?'半音':'全音';assert(commonSteps(l.exercise,shape).join('').includes(`${f-1}と${f}の間は${gap}`));}
 }
 for(const id of ['pairs23','pairs34','keep23','keep34','add2_12','add3_34','pivot23','triples34','switch3','switch23'])assert.equal(LESSONS.find(l=>l.id===id).page,null);
 for(const l of LESSONS.filter(l=>l.pattern==='34'))assert.equal(lessonPage(l,{string:'A',variant:'flat'}),null);
});
test('新規切替は前半2小節ずつ・後半の全小節で切替、動く指だけ半音',()=>{
 for(const string of Object.keys(STRINGS))for(const [type,shapes,changed] of [['switch3',['23','34'],[3]],['switch23',['12','34'],[2,3]]]){
  const ns=makeExercise(type,{string});assert.equal(ns.at(-1).end,32);for(let b=0;b<4;b++)assert(ns.filter(n=>n.bar===b).every(n=>n.pattern===shapes[Math.floor(b/2)]));for(let b=4;b<8;b++)assert.equal(new Set(ns.filter(n=>n.bar===b).map(n=>n.pattern)).size,2);
  for(let finger=0;finger<=4;finger++)assert.equal(makeNote(string,finger,1,{pattern:shapes[1]}).midi-makeNote(string,finger,1,{pattern:shapes[0]}).midi,changed.includes(finger)?1:0);
 }
});
test('Answer Tuner IntonationMathTests: 全12音程・コンマ・三全音の独立数値',()=>{
 near(ratioCents(81/80),21.506,.001);near(ratioCents(531441/524288),23.460,.001);near(FIFTH_DEVIATION,1.9550008654,1e-9);
 const pyth=[0,-9.775,3.910,-5.865,7.820,-1.955,11.730,1.955,-7.820,5.865,-3.910,9.775],ji=[0,11.731,3.910,15.641,-13.686,-1.955,-9.776,1.955,13.686,-15.641,17.596,-11.731];
 for(let s=0;s<12;s++){const c=intervalCentsFromET(s);near(c.pyth,pyth[s]);near(c.ji,ji[s]);near(Math.abs(c.pyth-c.ji),[0,2,5,7].includes(s)?0:21.506);}
 const dim=intervalCentsFromET(6,true);near(dim.pyth,-11.730);near(dim.ji,9.776);near(Math.abs(intervalCentsFromET(6).ji-dim.ji),19.553,.01);
 near(etFreq(55),196.889,.001);near(etFreq(62),295,.01);near(etFreq(76),662.252,.1);near(etFreq(69),442,1e-9);
 for(const [f,c] of [[442,0],[884,1200],[221,-1200]])near(centsBetween(f,442),c,1e-9);
});
test('Answer Tuner 開放弦4本・3モード、A=442/440、3段階の合格範囲',()=>{
 for(const [i,expected] of [196.444444,294.666667,442,663].entries()){
  near(openStringTargetHz(i),expected,.001);near(openStringOffset(i),[-3.910,-1.955,0,1.955][i]);near(openStringOffset(i,'pianoAccompany'),0,1e-9);near(openStringOffset(i,'stringEnsemble'),[4,2,0,-2][i],1e-9);
  near(openStringTargetHz(i,442,'pianoAccompany'),etFreq([55,62,69,76][i]),1e-9);near(openStringTargetHz(i,440)/openStringTargetHz(i,442),440/442,1e-12);
 }
 assert.deepEqual(DIFFICULTIES,{easy:15,normal:8,strict:5});
 for(const [l,o] of exerciseCases())for(const n of makeExercise(l.id,o).filter(n=>!n.rest))for(const difficulty of ['easy','normal','strict']){const r=targetForNote(n,{difficulty}),r440=targetForNote(n,{difficulty,a4:440});near(r.lowCents,-DIFFICULTIES[difficulty],1e-8);near(r.highCents,DIFFICULTIES[difficulty],1e-8);near(r440.targetHz/r.targetHz,440/442,1e-12);near(centsBetween(r.loHz,r.targetHz),-DIFFICULTIES[difficulty],1e-8);near(centsBetween(r.hiHz,r.targetHz),DIFFICULTIES[difficulty],1e-8);}
});
test('Answer Tuner 調性の数値: DのVI度21.506¢、CのE、♭主音、短調下行',()=>{
 const d=tonalKey(2),c=tonalKey(0),eb=tonalKey(3),am=tonalKey(9,'melodicMinor');
 for(const [midi,key,pyth,ji] of [[64,d,1.955,1.955],[66,d,5.865,-15.641],[69,d,0,0],[71,d,3.910,-17.596],[64,c,1.955,-19.551],[72,c,-5.865,-5.865],[63,eb,-11.730,-11.730],[67,eb,-3.910,-25.416],[78,am,5.865,-15.641],[67,am,-3.910,17.596]]){const t=intonationTargets(midi,{key});near(t.pyth,pyth);near(t.ji,ji);}
 const melodic=drillGetRange(64,{key:c}),harmonic=drillGetRange(64,{key:c,context:'harmonic'});near(melodic.lo,-6.045);near(melodic.hi,9.955);near(harmonic.lo,-27.551);near(harmonic.hi,-11.551);
 const vi=intonationTargets(71,{key:d});near(vi.pyth-vi.ji,21.506,.01);
 for(const midi of [65,67,77,79])assert.deepEqual(intonationTargets(midi,{key:am}),intonationTargets(midi,{key:tonalKey(9,'naturalMinor')}));assert.deepEqual(targetDegreeInfo(65,am),{degree:5,semitones:8});assert.equal(targetDegreeInfo(63,am),null);
 near(intonationTargets(63,{key:eb,mode:'stringEnsemble'}).pyth,12);near(intonationTargets(67,{key:eb,mode:'stringEnsemble'}).pyth,19.820);near(intonationTargets(66,{key:d,mode:'pianoAccompany'}).pyth,7.820);near(intonationTargets(66,{key:d,mode:'pianoAccompany'}).ji,-13.686);
 for(const a4 of [415,440,442,466]){near(etFreq(69,a4),a4,1e-9);near(openStringTargetHz(2,a4),a4,1e-9);near(drillGetRange(66,{key:d,a4}).pyth,5.865);}
 assert.equal(tonalKey(3).tonicFifthsFromA,-6);assert.equal(tonalKey(3,'major',6).tonicFifthsFromA,6);assert.equal(tonalKey(8).tonicFifthsFromA,-7);assert.equal(tonalKey(1,'naturalMinor').tonicFifthsFromA,4);assert.equal(tonalKey(8,'harmonicMinor').tonicFifthsFromA,5);
});
test('Answer Tuner 綴り分岐・調性なし・全64綴りの目標・0.1¢以内',()=>{
 for(const [midi,letter,pyth,ji] of [[68,4,9.775,-11.731],[68,5,-13.685,7.821],[66,4,-17.595,-15.641],[66,3,5.865,-15.641],[56,4,9.775,7.821],[56,5,-13.685,7.821]]){const t=intonationTargets(midi,{spelledLetterIdx:letter,useSpelledPyth:true});near(t.pyth,pyth);near(t.ji,ji);}
 const rep=intonationTargets(80),detected=intonationTargets(80,{spelledLetterIdx:5}),chosen=intonationTargets(80,{spelledLetterIdx:5,useSpelledPyth:true});near(rep.pyth,9.775);near(detected.pyth,rep.pyth,1e-9);near(chosen.pyth-rep.pyth,-23.460,.01);
 assert.equal(spelledFifthsFromC(4,68),8);assert.equal(spelledFifthsFromC(5,68),-4);assert.equal(spelledFifthsFromC(0,62),14);assert.equal(spelledFifthsFromC(3,69),null);
 let count=0;for(let midi=55;midi<=91;midi++)for(let letter=0;letter<7;letter++){const f=spelledFifthsFromC(letter,midi),natural=[0,2,4,5,7,9,11][letter],acc=((midi-natural+6)%12+12)%12-6;if(Math.abs(acc)>1)continue;count++;near(intonationTargets(midi,{spelledLetterIdx:letter,useSpelledPyth:true}).pyth,(f-3)*1.9550008654,1e-6);}assert.equal(count,64);
 const noContext=drillGetRange(66,{context:null});near(noContext.lo,-23.641);near(noContext.hi,13.865);
});
test('課題の調が旋律目標を変えないことを全音で照合・正しい調を付与',()=>{
 for(const [l,o] of exerciseCases())for(const n of makeExercise(l.id,o).filter(n=>!n.rest))near(targetForNote(n).targetCents,(spelledFifthsFromC(n.letter,n.midi)-3)*FIFTH_DEVIATION,1e-8);
 for(const string of ['G','D','A','E'])for(const pattern of ['23','12','34'])assert.equal(keyForShape(string,pattern).tonicPitchClass,(STRINGS[string].midi+({23:0,12:3,34:7}[pattern]))%12);
 assert.equal(keyForShape('A','34low').tonicPitchClass,10);
 for(const [id,scale,key] of [['scale','DA',2],['scale12','C1',0],['scale12','G2',7],['scale34','A1',9],['scale34','E1',4]])assert(makeExercise(id,{scale}).every(n=>n.key.tonicPitchClass===key));
 for(let problem=1;problem<=19;problem++)for(const pattern of ['23','12','34'])for(const n of makeExercise('reading55',{problem,pattern}))assert.deepEqual(n.key,keyForShape(n.string,pattern));
});
const voiced=(hz,cents=0)=>({frequency:hz*2**(cents/1200),rms:.02,confidence:.99}),quiet={frequency:null,rms:0,confidence:0};
test('誤答→正しい音1秒→残響350ms→無音180ms→再開。毎回鳴る',()=>{
 const gate=new MicJudge(),range=drillGetRange(69),bad=voiced(range.targetHz,20);let wrongAt;
 for(let t=0;t<=720;t+=60){const event=gate.observe(bad,range,t);if(event==='wrong'){wrongAt=t;break;}assert.equal(event,null);}assert.equal(wrongAt,660);assert.equal(gate.state,'correction');
 for(let t=720;t<1660;t+=60){assert.equal(gate.observe(voiced(range.targetHz),range,t),null);assert.equal(gate.state,'correction');}
 assert.equal(gate.observe(quiet,range,1660),null);assert.equal(gate.state,'tail');assert.equal(gate.observe(quiet,range,2009),null);assert.equal(gate.state,'tail');
 assert.equal(gate.observe(bad,range,2010),null);assert.equal(gate.state,'awaitSilence');for(let t=2070;t<3000;t+=60)assert.equal(gate.observe(bad,range,t),null);
 for(const t of [3000,3060,3120,3180])assert.equal(gate.observe(quiet,range,t),null);assert.equal(gate.state,'listening');
 for(let t=3240;t<3900;t+=60)assert.equal(gate.observe(bad,range,t),null);assert.equal(gate.observe(bad,range,3900),'wrong');
 assert.equal(AUDIO_CUES.correction.duration,1);assert(AUDIO_CUES.correction.volume>AUDIO_CUES.reference.volume);
});
test('成功音・正しい音・お手本・完了音の再生中と残響中は正誤を出さない',()=>{
 for(const kind of ['success','correction','reference','complete'])for(const offset of [0,25,100,1200]){
  const gate=new MicJudge(),r=drillGetRange(81),duration=AUDIO_CUES[kind].duration;gate.block(kind,0);gate.nextNote();
  for(let t=0;t<(duration+.35)*1000;t+=30)assert.equal(gate.observe(voiced(r.targetHz,offset),r,t),null,kind);
  const end=(duration+.35)*1000;gate.observe(quiet,r,end);gate.observe(quiet,r,end+180);assert.equal(gate.state,'listening');
 }
 const gate=new MicJudge(),r=drillGetRange(81);gate.block('success',0);for(let t=0;t<3000;t+=60)assert.equal(gate.observe(voiced(880),r,t),null);assert.equal(gate.state,'awaitSilence');
 const next=new MicJudge(),r2=drillGetRange(88);next.block('success',0);for(let t=0;t<3000;t+=60)assert.equal(next.observe(voiced(1320),r2,t),null);
});
test('高さを探る揺れ・低信頼度・無音・中断は誤答にしない、合格は320ms',()=>{
 const r=drillGetRange(69);for(const mode of ['wobble','confidence','silence','gaps']){const g=new MicJudge();for(let t=0;t<5000;t+=60){const reading=mode==='silence'?quiet:mode==='confidence'?{...voiced(r.targetHz,25),confidence:.2}:voiced(r.targetHz,mode==='wobble'?30+20*Math.sin(t/140):25);assert.equal(g.observe(reading,r,mode==='gaps'?t*5:t),null,mode);}}
 const g=new MicJudge();for(const t of [0,60,120,180,240,300])assert.equal(g.observe(voiced(r.targetHz),r,t),null);assert.equal(g.observe(voiced(r.targetHz),r,360),'correct');
});
test('音程表示: 符号・高低・帯・±50¢頭打ち・別の音名に音域を付けない',()=>{
 const n=makeExercise('fingers')[2],r=targetForNote(n);for(const [offset,word] of [[0,'ちょうど'],[7.9,'ちょうど'],[8.1,'高い'],[-8.1,'低い'],[150,'高い'],[-150,'低い']]){const f=pitchFeedback(r.targetHz*2**(offset/1200),n,r);near(f.cents,offset,1e-8);assert.equal(f.direction,word);near(f.position,Math.max(-50,Math.min(50,offset)),1e-8);}
 const f=pitchFeedback(etFreq(72),n,r);assert.equal(f.text,'ドに聞こえる・高くして');assert(!/[0-9]/.test(f.text));assert.equal(detectedName(etFreq(61),442,tonalKey(1)),'レ♭');assert.equal(detectedName(etFreq(61)),'ド♯');
});
test('セント表示は符号つき整数・0は無符号、別の音では数値を出さない',()=>{
 const n=makeNote('A',0);for(const a4 of [440,442]){const r=targetForNote(n,{a4});
  for(const [offset,label] of [[12.2,'+12¢'],[-4.6,'−5¢'],[0,'0¢'],[.49,'0¢'],[-.49,'0¢'],[.51,'+1¢'],[-.51,'−1¢'],[49.9,'+50¢'],[-49.9,'−50¢'],[50.1,''],[-50.1,''],[100,''],[-100,''],[900,''],[-900,''],[1200,''],[-1200,'']]){
   const f=pitchFeedback(r.targetHz*2**(offset/1200),n,r,a4);assert.equal(f.centsText,label,`${a4} ${offset}¢`);near(f.cents,offset,1e-8);near(f.position,Math.max(-50,Math.min(50,offset)),1e-8);
   if(!label){assert.match(f.text,/に聞こえる・(高くして|低くして)$/);assert(!/[0-9¢]/.test(f.text));}
  }
 }
 for(const [string,offset,label] of [['G',51,'+51¢'],['E',-51,'−51¢']]){const note=makeNote(string,0),r=targetForNote(note),f=pitchFeedback(r.targetHz*2**(offset/1200),note,r);assert.equal(f.centsText,label);assert.equal(f.text,f.direction);}
});
test('古いID・無効な保存値を正規化し、実際の初期化も落ちない',()=>{
 for(const value of [null,[],42,'old',{preferences:null},{lessonId:'deleted',options:{height:99,problem:'x',pattern:'toString',row:-1,scale:'removed',string:'__proto__',mode:'old',variant:'x'},preferences:{difficulty:'toString',a4:0,bpm:'bad',sensitivity:'constructor'}},{lesson:'eighth34',options:{string:'D',variant:'flat',mode:'step',mic:true}},{lessonId:'application94',options:{row:'random',resolvedRow:99,pattern:'old'},preferences:{difficulty:'strict',a4:440}}]){
  const stored=normalizeStored(value);assert.doesNotThrow(()=>makeExercise(stored.lessonId,stored.options));const app=appHarness(JSON.stringify(value));assert.equal(app.api.state().view,'home');app.api.enterLesson(stored.lessonId);assert(app.node('#app').innerHTML.includes('やり方'));
 }
 assert.doesNotThrow(()=>appHarness('{broken'));const defaults=normalizeStored({preferences:{difficulty:'wrong',a4:441,bpm:-3}}).preferences;assert.equal(defaults.difficulty,'normal');assert.equal(defaults.a4,442);assert.equal(defaults.bpm,60);
});
test('廃止IDと古い型の保存値は既定へ戻り、初期化・選択・再保存できる',()=>{
 for(const id of ['eighth23','eighth12','eighth34','order','order12','order34','connect69'])for(const identity of [{lessonId:id},{lesson:id},{lesson:{id}}]){
  const value={...identity,options:{string:'G',row:'6段目',resolvedRow:6,mode:'step',variant:'flat'},preferences:{a4:440,difficulty:'strict'}},stored=normalizeStored(value);
  assert.equal(stored.lessonId,'open');assert.deepEqual(stored.options,normalizeOptions(LESSONS[0]));assert.equal(stored.preferences.a4,440);assert.equal(stored.preferences.difficulty,'strict');
  const app=appHarness(JSON.stringify(value));assert.equal(app.api.state().view,'home');app.api.enterLesson(stored.lessonId);app.api.navigate('setup');assert.equal(JSON.parse(app.storage.get('violin-shodan-v1')).options.row,'1');
 }
 for(const id of ['keep23','keep12','keep34','application94'])for(const row of ['1段目','6段目','第2段','全8段','段',0,9,-1,1.5,{},null,...(id==='application94'?[]:[8,'all'])]){
  const value={lessonId:id,options:{row,resolvedRow:'2段目'}},stored=normalizeStored(value);assert.equal(stored.options.row,'1');assert.equal(stored.options.resolvedRow,1);
  const app=appHarness(JSON.stringify(value));app.api.enterLesson(id);app.api.navigate('setup');assert.equal(app.api.state().options.row,'1');assert.deepEqual(makeExercise(id,stored.options),makeExercise(id));assert.equal(JSON.parse(app.storage.get('violin-shodan-v1')).options.row,'1');
 }
 for(const id of ['keep23','keep12','keep34'])for(let row=1;row<=6;row++)assert.equal(normalizeStored({lessonId:id,options:{row}}).options.row,String(row));
});
test('全一覧の説明は空でなく重複せず、廃止項目と旧選択文言を表示しない',async()=>{
 const check=items=>{assert(items.every(l=>typeof l.sub==='string'&&l.sub.length));assert.equal(new Set(items.map(l=>l.sub)).size,items.length);for(const l of items)if(l.children)check(l.children);};
 check(CHAPTER_SUB.map(sub=>({sub})));for(let unit=0;unit<CHAPTERS.length;unit++)check(chapterItems(unit));
 for(const l of LESSONS){assert(!/^(eighth|order)/.test(l.id));assert(!['8分音符で確かめる','指の順番を変えてみる'].includes(l.title));if(l.exercise)assert(!Object.values(PATTERNS).some(p=>l.sub.includes(p.label)));
  const app=appHarness();app.api.enterLesson(l.id);assert.doesNotMatch(app.node('#app').innerHTML,/段目|練習する段/);app.api.navigate('setup');assert.doesNotMatch(app.node('#app').innerHTML,/段目|練習する段/);
 }
 for(const name of ['content.mjs','app.mjs','index.html'])assert.doesNotMatch(await fs.readFile('dist/'+name,'utf8'),/段目|練習する段|8分音符で確かめる|指の順番を変えてみる/);
});
test('型の表示は①〜⑦/⑧・ランダム・94番だけ通し、選択と再抽選も全型を扱う',async()=>{
 for(const id of ['keep23','keep12','keep34','application94']){
  const app=appHarness(),count=id==='application94'?8:7,labels=['①','②','③','④','⑤','⑥','⑦','⑧'].slice(0,count);app.api.enterLesson(id);app.api.navigate('setup');
  const html=app.node('#app').innerHTML,select=html.match(/<select data-select-option="row"[^>]*>([\s\S]*?)<\/select>/)[1];
  assert(html.includes('<span>練習する型</span>'));assert(html.includes('aria-label="練習する型"'));assert.deepEqual([...select.matchAll(/<option[^>]*>(.*?)<\/option>/g)].map(m=>m[1]),[...labels,'ランダム',...(count===8?['①〜⑧を通す']:[])]);
  for(let row=1;row<=count;row++){
   await app.change({dataset:{selectOption:'row'},value:String(row)});assert.equal(app.api.state().options.row,String(row));assert.equal(JSON.parse(app.storage.get('violin-shodan-v1')).options.row,String(row));
   app.api.setOptions({row:'random',resolvedRow:row===1?count:row-1});app.api.setRandom(0);await app.click({action:'anotherRow'});assert.equal(app.api.state().options.resolvedRow,row);assert(app.node('#app').innerHTML.includes('今回は '+labels[row-1]));assert.doesNotMatch(app.node('#app').innerHTML,/段目|練習する段/);
   app.api.setRandom((row-.5)/count);await app.change({dataset:{selectOption:'row'},value:'random'});assert.equal(app.api.state().options.resolvedRow,row);
   assert.deepEqual(makeExercise(id,{row:'random'},()=>(row-.5)/count),makeExercise(id,{row}));
  }
 }
});
test('①〜⑥は64番、⑦は旧指順の全16音、94番は全音とリズムを保持',()=>{
 const oldOrder=[0,1,2,3,1,2,3,4,0,1,2,1,1,2,3,2].map(f=>[f,1]);
 for(const id of ['keep23','keep12','keep34'])for(const string of Object.keys(STRINGS))for(const variant of id==='keep34'&&string==='A'?['standard','flat']:['standard']){
  for(let row=1;row<=7;row++){
   const ns=makeExercise(id,{string,variant,row}),expected=row===7?oldOrder:ROWS64[row-1].map(([,f,b])=>[f,b]);assert.deepEqual(ns.map(n=>[n.finger,n.beats]),expected);assert.equal(ns.at(-1).end,row===7?16:20);
   assert(ns.every(n=>n.string===string));if(variant==='flat')assert(ns.every(n=>n.pattern==='34low'));assert.deepEqual(makeExercise(id,{string,variant,row:'random',resolvedRow:row}),ns);
  }
 }
 for(const string of Object.keys(STRINGS))for(const pattern of ['23','12','34']){
  const opts={string,pattern},whole=makeExercise('application94',{...opts,row:'all'}),parts=Array.from({length:8},(_,i)=>makeExercise('application94',{...opts,row:i+1})).flat();
  assert.deepEqual(whole.map(n=>[n.finger,n.beats]),APPLICATION94.map(([,f,b])=>[f,b]));assert.deepEqual(parts.map(n=>[n.finger,n.beats,n.midi]),whole.map(n=>[n.finger,n.beats,n.midi]));
 }
 assert.equal(lessonPage(LESSONS.find(l=>l.id==='keep23'),{row:'7'}),40);assert.equal(lessonPage(LESSONS.find(l=>l.id==='keep12'),{row:'7'}),null);
});
test('3章の両サブ一覧から練習へ進み、設定・演奏・完了から元の一覧へ戻れる',async()=>{
 for(const unit of [1,3,4]){
  const app=appHarness();await app.click({chapter:String(unit)});
  for(const [menu,action,count] of [['add','addList',3],['variety','varietyList',5]]){
   await app.click({action});assert.equal(app.api.state().view,action);assert.equal((app.node('#app').innerHTML.match(/class="lesson-row"/g)||[]).length,count);
   await app.click({action:'settings'});await app.click({action:'closeSettings'});assert.equal(app.api.state().view,action);
   for(const l of chapterItems(unit).find(l=>l.menu===menu).children){
    await app.click({lesson:l.id});assert(app.node('#app').innerHTML.includes(`data-action="${action}"`));await app.click({action:'setup'});app.api.setOptions({mic:false,mode:'wait'});await app.click({action:'start'});await app.click({action:'exitPractice'});await app.click({action:'intro'});await app.click({action});assert.equal(app.api.state().view,action);
    await app.click({lesson:l.id});await app.click({action:'setup'});app.api.setOptions({mic:false,mode:'wait'});await app.click({action:'start'});for(const n of makeExercise(l.id))app.api.advanceNote();assert.equal(app.api.state().view,'finish');assert(app.node('#app').innerHTML.includes(`data-action="${action}"`));await app.click({action});assert.equal(app.api.state().view,action);
   }
   await app.click({action:'chapters'});assert.equal(app.api.state().chapter,unit);assert.equal(app.api.state().view,'home');assert.equal((app.node('#app').innerHTML.match(/class="lesson-row"/g)||[]).length,3);
  }
 }
});
test('新アプリの設定だけを読み書きし、旧キーは読み込みも削除もしない',async()=>{
 const old=JSON.stringify({lessonId:'fingers34',options:{string:'G'},preferences:{a4:440,difficulty:'strict'}}),storage=new Map([['genshirube-v1',old],['another-app','keep']]),app=appHarness(undefined,storage);
 assert.equal(app.api.state().preferences.a4,442);assert.equal(app.api.state().preferences.difficulty,'normal');app.api.enterLesson('open');app.api.renderSetup();
 await app.change({id:'a4',dataset:{},value:'440'});await app.change({id:'difficulty',dataset:{},value:'strict'});
 const saved=JSON.parse(storage.get('violin-shodan-v1'));assert.equal(saved.lessonId,'open');assert.equal(saved.preferences.a4,440);assert.equal(saved.preferences.difficulty,'strict');
 const reloaded=appHarness(undefined,storage);assert.equal(reloaded.api.state().preferences.a4,440);assert.equal(reloaded.api.state().preferences.difficulty,'strict');reloaded.api.enterLesson('open');
 assert.equal(storage.get('genshirube-v1'),old);assert.equal(storage.get('another-app'),'keep');assert.equal(storage.size,3);
 for(const [method,key] of [...app.storageAccess,...reloaded.storageAccess]){assert.equal(key,'violin-shodan-v1');assert(['get','set'].includes(method));}
});
test('実際の開始/再開: 1音ずつ・マイクは直ちにplaying、テンポは毎回4カウント後に現在音へ',async()=>{
 for(const bpm of [60,180])for(const [mode,mic,counts] of [['wait',false,0],['wait',true,0],['continuous',true,0],['continuous',false,4]]){
  const app=appHarness(JSON.stringify({preferences:{click:false,reference:false}})),spb=60/bpm;app.api.enterLesson('fingers');app.api.setOptions({mode,mic,bpm});
  const checkStart=index=>{
   const state=app.api.state(),musicTime=state.musicTime,clicksBefore=state.clicks.length;assert.equal(state.phase,counts?'countdown':'playing');assert.equal(state.index,index);assert.equal(state.queue.filter(c=>c.type==='click').length,counts);
   for(let count=1;count<=counts;count++){
    app.api.setTime(musicTime-(5-count)*spb+.001);app.api.tick();assert.equal(app.api.state().phase,'countdown');assert.equal(app.api.state().index,index);assert.equal(app.node('#performanceViewport').dataset.phase,'countdown');assert.equal(app.node('#countNumber').textContent,count);assert.equal(app.node('#countdownArea').hidden,false);assert.equal(app.node('#nextBtn').disabled,true);assert.equal(app.node('#referenceBtn').disabled,true);
   }
   if(counts){app.api.setTime(musicTime-.001);app.api.tick();assert.equal(app.api.state().phase,'countdown');assert.equal(app.api.state().clicks.length-clicksBefore,4);for(let i=0;i<4;i++){const [at,accent]=app.api.state().clicks[clicksBefore+i];near(at,musicTime-(4-i)*spb+.001,1e-8);assert.equal(accent,i===0);}}
   app.api.setTime(musicTime+.001);app.api.tick();assert.equal(app.api.state().phase,'playing');assert.equal(app.api.state().index,index);if(counts)assert.equal(app.node('#countdownArea').hidden,true);
  };
  assert.deepEqual(transportStart(mode,mic),{phase:counts?'countdown':'playing',counts});await app.api.startPractice();checkStart(0);
  if(counts){app.api.setTime(app.api.state().musicTime+makeExercise('fingers')[1].start*spb+.001);app.api.tick();}else app.api.advanceNote();assert.equal(app.api.state().index,1);
  app.api.pausePractice();assert.equal(app.api.state().phase,'paused');assert.equal(app.node('#coachText').textContent,counts?'再開すると、4拍数えて今の音から始めます。':'再開すると、すぐ今の音から始めます。');app.api.setTime(30);await app.api.resumePractice();checkStart(1);
 }
 const app=appHarness();app.api.enterLesson('fingers');app.api.setOptions({mode:'continuous',mic:false});await app.change({dataset:{},hasAttribute:k=>k==='data-mic',checked:true});assert.equal(app.api.state().options.mode,'wait');
});
test('実際のマイク経路: 誤答の参照Hz、同じ音、正答の成功音、次音への回り込み抑止',async()=>{
 const app=appHarness();app.api.enterLesson('fingers');await app.api.startPractice();const target=442;app.api.setReading(voiced(target,20));for(let i=1;i<=13;i++){app.api.setTime(i*.07);app.api.tick();}
 assert.equal(app.api.state().index,0);const sounds=app.api.state().sounds;assert(sounds.some(s=>s[0]===target&&s[1]===1&&s[3]===.9));
 app.api.setReading(voiced(target));for(let i=14;i<=40;i++){app.api.setTime(i*.07);app.api.tick();}assert.equal(app.api.state().index,0);
 app.api.setReading(quiet);for(let i=41;i<=45;i++){app.api.setTime(i*.07);app.api.tick();}app.api.setReading(voiced(target));for(let i=46;i<=65;i++){app.api.setTime(i*.07);app.api.tick();}
 assert.equal(app.api.state().index,1);assert(sounds.some(s=>s[0]===880));assert(sounds.some(s=>s[0]===1320));app.api.setReading(voiced(880));for(let i=66;i<=100;i++){app.api.setTime(i*.07);app.api.tick();}assert.equal(app.api.state().index,1);
});
test('実際の章・子一覧・戻る・設定保存・全音合格時だけ完了音',async()=>{
 const app=appHarness();await app.click({chapter:'1'});assert(!app.node('#app').innerHTML.includes('data-lesson="add2"'));await app.click({action:'addList'});assert(app.node('#app').innerHTML.includes('data-lesson="add2"'));await app.click({action:'chapters'});assert.equal(app.api.state().chapter,1);
 await app.change({id:'difficulty',dataset:{},value:'strict'});await app.change({id:'a4',dataset:{},value:'440'});assert.equal(JSON.parse(app.storage.get('violin-shodan-v1')).preferences.a4,440);
 app.api.enterLesson('open');app.api.setOptions({mic:true,mode:'wait'});await app.api.startPractice();for(let i=0;i<4;i++)app.api.advanceNote();assert.equal(app.api.state().view,'finish');assert.equal(app.api.state().sounds.length,0);
 const all=appHarness();all.api.enterLesson('open');all.api.setOptions({mic:true,mode:'wait'});await all.api.startPractice();let time=0;for(let n=0;n<4;n++){all.api.setReading(quiet);for(let i=0;i<12;i++){time+=.07;all.api.setTime(time);all.api.tick();}all.api.setReading(voiced(442));for(let i=0;i<14;i++){time+=.07;all.api.setTime(time);all.api.tick();}}
 assert.equal(all.api.state().view,'finish');assert(all.api.state().sounds.some(s=>s[0]===1320&&s[1]===.65&&s[3]===.65));
});
test('保存済み目標表の照合・Bravura字形と新規モジュールのキャッシュ',async()=>{
 const rows=[];for(const string of Object.keys(STRINGS))for(const pattern of ['23','12','34','34low'])for(let finger=0;finger<=4;finger++){
  if(pattern==='34low'&&string!=='A'){rows.push({string,pattern,finger,available:false,reason:'34lowはA線限定'});continue;}
  const note=makeNote(string,finger,1,{pattern,key:keyForShape(string,pattern)}),r=targetForNote(note);rows.push({string,pattern,finger,name:note.name,key:keyName(note.key),centsFromET:r.targetCents,hz442:r.targetHz});
 }
 const text=JSON.stringify({referenceA:442,context:'melodic',rows},null,2)+'\n';assert.equal(await fs.readFile('validation/intonation-targets.json','utf8'),text);
 const sw=await fs.readFile('dist/sw.js','utf8');assert(sw.includes('violin-shodan-v1-20261016a'));for(const name of ['intonation','settings'])assert(sw.includes(name+'.mjs'));assert(!(await fs.readFile('dist/score.mjs','utf8')).includes('slur'));assert((await fs.readFile('dist/glyphs.mjs','utf8')).includes('Bravura'));
 assert((await fs.readFile('DESIGN.md','utf8')).includes('## 2026-10-15 改修'));const readme=await fs.readFile('README.md','utf8');for(const row of rows.filter(r=>r.available!==false))assert(readme.includes(`| ${row.finger} | ${row.name} | ${row.centsFromET>=0?'+':''}${row.centsFromET.toFixed(3)} | ${row.hz442.toFixed(3)} |`));
});
test('小さな小節数だけをDOMから除き、見出し・全譜ボタン・説明を保つ',async()=>{
 for(const l of LESSONS){
  const app=appHarness();app.api.enterLesson(l.id);app.api.navigate('setup');const ns=makeExercise(l.id),bars=ns.at(-1).bar+1,setup=app.node('#app').innerHTML;
  assert(setup.includes(`<div class="section-line"><h2>${bars>6?'はじめの6小節':'この練習の楽譜'}</h2></div>`));assert.doesNotMatch(setup,/barLabel|scorePageLabel|>\d+\s*小節(?:目)?</);
  if(bars>6)assert(setup.includes(`>全${bars}小節を見る `));
  app.api.setOptions({mic:false,mode:'wait'});await app.api.startPractice();app.api.advanceNote();const play=app.node('#app').innerHTML;
  assert.doesNotMatch(play,/barLabel|scorePageLabel|>\d+\s*小節(?:目)?<|>全\d+小節 · 今/);assert(play.includes('<div class="section-line"><h2>楽譜を見ながら</h2></div>'));assert(play.includes('全体の楽譜 ↓'));
 }
 const app=appHarness();app.api.enterLesson('reading55');assert(app.node('#app').innerHTML.includes('どれも4小節です。'));
 for(const file of ['app.mjs','index.html'])assert.doesNotMatch(await fs.readFile('dist/'+file,'utf8'),/barLabel|scorePageLabel/);
});
test('19問はページ・弦選択なし、94番と同じ3つの形を選んで保存できる',async()=>{
 const labels=['2と3がくっつく形','1と2がくっつく形','3と4がくっつく形'];
 const reading=LESSONS.find(l=>l.id==='reading55');assert.equal(reading.page,null);assert.equal(lessonPage(reading),null);
 for(const id of ['reading55','application94']){
  const app=appHarness();app.api.enterLesson(id);const intro=app.node('#app').innerHTML;assert.equal((intro.match(/class="pattern-diagram /g)||[]).length,3);
  if(id==='reading55'){assert.doesNotMatch(intro,/p\.|音は問題ごとに決まっています/);assert(intro.includes('形を選べます'));assert(intro.includes('次に、問題と指の形を選びます。'));}
  app.api.navigate('setup');assert.equal(app.api.state().options.pattern,'23');
  assert.deepEqual([...app.node('#app').innerHTML.matchAll(/<button[^>]+data-option="pattern"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),labels);
  for(const pattern of ['23','12','34']){
   await app.click({option:'pattern',value:pattern});assert.equal(app.api.state().options.pattern,pattern);const saved=JSON.parse(app.storage.get('violin-shodan-v1'));assert.equal(saved.options.pattern,pattern);
   const reloaded=appHarness(JSON.stringify(saved));reloaded.api.enterLesson(id);assert.equal(reloaded.api.state().options.pattern,pattern);
   if(id==='reading55'){
    const html=app.node('#app').innerHTML;assert.doesNotMatch(html,/p\.|data-option="string"|data-select-option="string"/);assert.equal(lessonPage(reading,{pattern}),null);
    const select=html.match(/<select data-select-option="problem"[^>]*>([\s\S]*?)<\/select>/)[1];assert.deepEqual([...select.matchAll(/<option[^>]*>(.*?)<\/option>/g)].map(m=>m[1]),Array.from({length:19},(_,i)=>'その'+(i+1)));
   }
  }
 }
});
test('19問の全形で選択から演奏へ音名・図・楽譜・マイク目標が連動',async()=>{
 for(const pattern of ['23','12','34']){
  const app=appHarness();app.api.enterLesson('reading55');app.api.navigate('setup');await app.click({option:'pattern',value:pattern});
  for(let problem=1;problem<=19;problem++){
   await app.click({action:'setup'});await app.change({dataset:{selectOption:'problem'},value:String(problem)});const ns=makeExercise('reading55',{problem,pattern});await app.api.startPractice();
   assert.equal(app.node('#practiceScore').innerHTML,renderSystems(ns,{},3));
   for(const n of ns){
    assert.equal(app.node('#noteHeading').textContent,`${n.string}線・${n.name}`);assert(app.node('#livePattern').innerHTML.includes(`data-pattern="${pattern}"`));assert.equal(app.node('#noteScore').innerHTML,renderScore(ns.filter(x=>x.bar===n.bar),{},Math.floor(n.bar/4)));
    app.api.setReading(voiced(targetForNote(n).targetHz));app.api.observeMic((n.index+1)*.07);assert.equal(app.node('#pitchCents').textContent,'0¢');assert.equal(app.node('#pitchDirection').textContent,'ちょうど');app.api.advanceNote();
   }
   assert.equal(app.api.state().view,'finish');
  }
 }
});
