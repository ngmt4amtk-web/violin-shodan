import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,STRINGS,makeExercise,makeNote,READING} from './dist/content.mjs';
import {frequencyFor,centsFrom,PitchDetector,StablePitchGate} from './dist/engine.mjs';
import {renderScore,renderSingle} from './dist/score.mjs';

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
 assert.deepEqual(makeExercise('open',{mode:'step'}).map(n=>n.beats),[4,2,1,.5]);
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
 assert.deepEqual(makeExercise('order').map(n=>n.finger),[0,1,2,3,1,2,3,4,0,1,2,1,1,2,3,2]);
});
test('3音階の音程とスラー。0/4を選んでも音高は変わらない',()=>{
 for(const scale of ['GD','DA','AE']){
  const a=makeExercise('scale',{scale,fourth:'0'}),b=makeExercise('scale',{scale,fourth:'4'});
  assert.deepEqual(a.map(n=>n.midi),b.map(n=>n.midi));assert.equal(a.at(-1).end,32);
  assert.deepEqual(a.slice(0,8).map(n=>n.midi-a[0].midi),[0,2,4,5,7,9,11,12]);
  assert.deepEqual(a.slice(8).map(n=>n.midi),a.slice(0,8).reverse().map(n=>n.midi));
  assert.equal(a.filter(n=>n.slurStart).length,8);
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
 const g=new StablePitchGate();for(let t=0;t<1000;t+=60)assert.equal(g.observe({frequency:frequencyFor(70)},69,t),false);
 for(let t=0;t<1000;t+=60)assert.equal(g.observe({frequency:frequencyFor(81)},69,t),false);
});
test('正音320msで通過、無音でリセット、フレーム中断もリセット',()=>{
 const g=new StablePitchGate(),r={frequency:440};for(const t of [0,60,120,180,240,300])assert.equal(g.observe(r,69,t),false);assert.equal(g.observe(r,69,360),true);
 assert.equal(g.observe({frequency:null},69,400),false);assert.equal(g.observe(r,69,460),false);assert.equal(g.observe(r,69,800),false);
});
test('SVG: すべての譜面・指/色/音名なしでもNaNなし',()=>{
 for(const l of LESSONS){const ns=makeExercise(l.type);for(const prefs of [{},{colors:false,fingers:false,names:false}])for(let group=0;group<=Math.floor(ns.at(-1).bar/4);group++){
  const svg=renderScore(ns,prefs,group);assert.ok(!/NaN|undefined/.test(svg));assert.ok(svg.includes('<svg'));
 }for(const n of ns)assert.ok(!/NaN|undefined/.test(renderSingle(n,{})));}
});
