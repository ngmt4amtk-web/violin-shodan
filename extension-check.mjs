import test from 'node:test';
import assert from 'node:assert/strict';
import {makeExercise,makeNote,instructionFor,STRINGS,LESSONS} from './dist/content.mjs';
import {renderScore} from './dist/score.mjs';
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
test('3と4の8分音符は2拍子3小節、6組往復と形の比較は6小節',()=>{
 for(const string of Object.keys(STRINGS)){
  const ns=makeExercise('eighth34',{string});assert.equal(bars(ns),3);barBeats(ns);assert.equal(ns.at(-1).rest,true);assert.ok(renderScore(ns).includes('>2</text>'));
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
 assert.equal(LESSONS.length,24);
 for(const lesson of LESSONS)for(const string of Object.keys(STRINGS)){
  const ns=makeExercise(lesson.type,{string});assert.ok(!/NaN|undefined/.test(renderScore(ns,{},null)));
 }
});
