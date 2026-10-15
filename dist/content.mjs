import {READING55,ROWS64,APPLICATION94,EXTRA_SCALES,CONNECT69} from './repertoire.mjs';
import {keyForShape,tonalKey,mod12,spelledFifthsFromC,STANDARD_FIFTHS} from './intonation.mjs';
// 教材データ。原譜を視認して転記。追加課題はここへ登録する。
export const STRINGS = {
 G:{name:'ソ',midi:55,color:'#347ab4',soft:'#e7f0f9',notes:['ソ','ラ','シ','ド','レ'],steps:[-5,-4,-3,-2,-1]},
 D:{name:'レ',midi:62,color:'#c57624',soft:'#fff0dd',notes:['レ','ミ','ファ♯','ソ','ラ'],steps:[-1,0,1,2,3]},
 A:{name:'ラ',midi:69,color:'#c45454',soft:'#fcebea',notes:['ラ','シ','ド♯','レ','ミ'],steps:[3,4,5,6,7]},
 E:{name:'ミ',midi:76,color:'#318260',soft:'#e6f3eb',notes:['ミ','ファ♯','ソ♯','ラ','シ'],steps:[7,8,9,10,11]}
};
export const INTERVALS=[0,2,4,5,7];
export const PATTERNS={
 '23':{label:'2と3がくっつく形',intervals:INTERVALS},
 '12':{label:'1と2がくっつく形',intervals:[0,2,3,5,7]},
 '34':{label:'3と4がくっつく形',intervals:[0,2,4,6,7]},
 '34low':{label:'A線・シ♭とミ♭の形',intervals:[0,1,3,5,6]}
};
const LETTERS=['ド','レ','ミ','ファ','ソ','ラ','シ'],NATURAL=[0,2,4,5,7,9,11];
export function makeNote(string='A',finger=0,beats=1,extra={}) {
 const s=STRINGS[string]; if(!s||finger<0||finger>4)throw new Error('Invalid note');
 const pattern=extra.pattern||'23',shape=PATTERNS[pattern];
 if(!shape||(pattern==='34low'&&string!=='A'))throw new Error('Invalid finger pattern');
 const step=s.steps[finger],diatonic=4*7+2+step,letter=(diatonic%7+7)%7;
 const midi=s.midi+shape.intervals[finger],natural=(Math.floor(diatonic/7)+1)*12+NATURAL[letter],alteration=midi-natural;
 return {string,finger,beats,midi,name:LETTERS[letter]+(alteration===1?'♯':alteration===-1?'♭':''),step,letter,pattern,alteration,...extra};
}
export const makeRest=beats=>({rest:true,beats,name:'休み'});
export const CHAPTERS=['開放弦','2と3をくっつける','はじめての音階','1と2をくっつける','3と4をくっつける','音階','指の形を切り替える','楽譜を読んで弾く・応用'];
export const CHAPTER_SUB=['音の長さ・移弦・休符','2と3の半音を覚える','ト長調・ニ長調・イ長調','1と2の半音を覚える','3と4の半音を覚える','ハ長調・ト長調・イ長調・ホ長調','動かす指を確かめる','19の問題・指の順番'];
export const COMMON_MENU=[['fingers','この形をつかむ','0から4へ上って戻る'],['add','指を1本ずつ確認する','2・3・4の指を選んで確かめる'],['variety','色々な練習','指を離す・往復する動きを練習する']];
export const VARIETY_MENU=[['place','4本の指を置いて、離していく','4本を置いてから4・3・2・1と離す'],['pairs','全パターンの動きを練習する','1〜4の指を2本ずつ組み合わせて往復する'],['keep','形を保って続ける','7つの型から選んで続けて弾く'],['pivot','開放弦を軸に往復する','開放弦と1〜4の指を交互に弾く'],['triples','3音ずつ上り下り','隣り合う3音で上り下りする']];
export const FORM_LABELS=['①','②','③','④','⑤','⑥','⑦','⑧'];
const COMMON_IDS={'23':['fingers','add2','add3','add4','place','pairs23','keep23','pivot23','triples23'],'12':['fingers12','add2_12','add3_12','add4_12','place12','pairs12','keep12','pivot12','triples12'],'34':['fingers34','add2_34','add3_34','add4_34','place34','pairs34','keep34','pivot34','triples34']};
const COMMON_EXERCISES=['fingers','add2','add3','add4','place','pairs','keep','pivot','triples'];
const COMMON_PAGES={fingers:30,add2:34,add3:34,add4:34,place:36,fingers12:80,pairs12:82,keep12:91,fingers34:115};
const ADD_SUB={add2:'0・1・2を弾き、2と1を往復する',add3:'1・2・3を弾き、3と2を往復する',add4:'2・3・4を弾き、4から1へ下る'};
function commonLessons(pattern,unit){return COMMON_IDS[pattern].map((id,i)=>{const exercise=COMMON_EXERCISES[i],menu=exercise.startsWith('add')?'add':exercise==='fingers'?'fingers':'variety',item=[...COMMON_MENU,...VARIETY_MENU].find(x=>x[0]===exercise),title=menu==='add'?exercise.slice(-1)+'の指を足す':item[1],sub=menu==='add'?ADD_SUB[exercise]:item[2];return {id,type:id,exercise,menu,unit,pattern,title,sub,page:COMMON_PAGES[id]??null,steps:commonSteps(exercise,pattern)};});}
export function commonSteps(exercise,pattern){
 const shape=PATTERNS[pattern],pair=pattern==='34low'?'3と4':pattern.split('').join('と'),gap=f=>shape.intervals[f]-shape.intervals[f-1]===1?'半音':'全音';
 const intro=pattern==='34low'?'A線のラ・シ♭・ド・レ・ミ♭です。開放弦と1も半音です。':pair+'の間は半音、ほかの隣り合う指は全音です。';
 const copy={fingers:['0は開放弦、1は人差し指、2は中指、3は薬指、4は小指です。',intro,'0から4へ一つずつ上り、戻ります。音符ごとに弓を返します。'],add2:[`0・1・2から始めます。1と2の間は${gap(2)}です。`,'2と1を行き来し、1へ戻ったとき同じ高さになるか聴きます。',intro],add3:[`1・2・3から始めます。2と3の間は${gap(3)}です。`,'3を上げるときも、2の場所を保ちます。',intro],add4:[`2・3・4から始めます。3と4の間は${gap(4)}です。`,'4を上げたあとも、2と3の場所を保ちます。',intro],place:['最初に1・2・3・4を一つずつ弾き、音を確かめます。','1を弾き、休符で2・3・4をまとめて置きます。4を鳴らし、4・3・2・1と下ります。',intro],pairs:['1・2、1・3、1・4、2・3、2・4、3・4の6組を弾きます。','後半は4・3、4・2、4・1、3・2、3・1、2・1と戻ります。',intro],keep:['①〜⑦から選ぶか、ランダムで1つの型を選びます。①〜⑥は各5小節、⑦は4小節です。',intro,'①〜⑥は4分音符で進み、最後の開放弦を4拍伸ばします。⑦は0・1・2・3、1・2・3・4、0・1・2・1、1・2・3・2と弾きます。'],pivot:['0・1・0・2、0・3・0・4、0・4・0・3、0・2・0・1と4分音符で弾きます。','指を離して開放弦へ戻り、次の指を置きます。最後は開放弦を4拍伸ばします。',intro],triples:['0・1・2・1、1・2・3・2、2・3・4・3と上ります。','4・3・2・3、3・2・1・2、2・1・0・1と下り、最後は開放弦を4拍伸ばします。',intro]};
 return copy[exercise];
}
export const LESSONS=[
 {id:'open',unit:0,title:'はじめての開放弦',sub:'1本の弦で、音の長さを感じよう',page:null,type:'open',steps:['左手の指は押さえず、選んだ弦に弓を置きます。','全音符は4拍、2分音符は2拍、4分音符は1拍、8分音符は半拍です。','テンポで通すときは4拍数えて始めます。1音ずつはすぐに始まり、マイクなしでは手送りです。']},
 {id:'heights',unit:0,title:'7つの弓の高さ',sub:'1本と2本の弦を鳴らす',page:9,type:'heights',steps:['G、G＋D、D、D＋A、A、A＋E、Eの順にたどり、戻ります。','2本のところは同時に鳴らします。同じくらいの大きさになる高さを探します。','和音はマイクで判定できないため、お手本を聴いて手送りかテンポで練習します。']},
 {id:'cross',unit:0,title:'休みの間に次の弦へ',sub:'音を止めて、弓の高さを用意する',page:14,type:'cross',steps:['1つ弾いたら1拍休み、次の弦に弓を用意します。','G・D、D・A、A・Eから選べます。各段を2回弾きます。','休符では音を止め、次の音を拍に合わせて始めます。']},
 {id:'reading',unit:0,title:'読んで弾く・8つの問題',sub:'長さと弦を楽譜から読む',page:'25–26',type:'reading',steps:['まず譜面を30秒ながめ、弦の移動と音の長さ、休符を確かめます。','テンポで通すときは、4拍のカウントのあと4小節を弾きます。','マイクでは、表示した音の高さが合格範囲に入ると次へ進みます。音色や姿勢は判定しません。']},
 ...commonLessons('23',1),
 {id:'scale',unit:2,title:'2本の弦で、はじめての音階',sub:'ト長調・ニ長調・イ長調を選ぶ',page:'41–43',type:'scale',steps:['低い弦の開放弦から、隣の高い弦の3の指まで上り、同じ道を下ります。','ト長調はG・D、ニ長調はD・A、イ長調はA・Eを使います。','どちらの弦でも2と3を近づけます。各ページ上2段の音階を、1音ずつ弓を返して練習します。']},
 ...commonLessons('12',3),...commonLessons('34',4),
 {id:'scale12',unit:5,title:'ハ長調・ト長調',sub:'弦によって変わる半音の場所',page:97,type:'scale12',steps:['ハ長調1オクターヴか、ト長調2オクターヴを選びます。','ハ長調ではD・A線の1と2を近づけます。ト長調ではG・D線が2と3、A・E線が1と2です。','上りと下りを同じ指の場所でたどります。']},
 {id:'scale34',unit:5,title:'1の指から始める音階',sub:'イ長調・ホ長調・2オクターヴ',page:121,type:'scale34',steps:['イ長調1オクターヴはG・D線、ホ長調1オクターヴはD・A線を使い、3と4を近づけます。','イ長調2オクターヴでは、G・D線は3と4、A・E線は2と3の形へ切り替えます。','どれも1の指から始まります。譜面の4は開放弦に替えずに弾きます。']},
 {id:'switch2',unit:6,title:'2の指の場所を切り替える',sub:'2と3の形と1と2の形',page:'93–94',type:'switch2',steps:['はじめの2小節は2と3を近づけ、次の2小節は1と2を近づけます。','後半は同じ小節の中でも2の指の音が変わります。♯・♭・♮を見て弾き分けます。','1・3・4の場所を保ち、2だけを半音動かします。どの弦でも8小節です。']},
 {id:'connect69',unit:6,title:'4本の弦をつなぐ',sub:'弦を替える前に次の形を用意',page:96,type:'connect69',steps:['E・A線は1と2が近い形、D・G線は2と3が近い形です。','2分音符でE線からG線へ移り、最後はG線の3を4拍伸ばします。','次の弦の2の指の場所を確かめます。']},
 {id:'compare',unit:6,title:'変わる指と変わらない指',sub:'同じ弦で3つの形を比べる',page:120,type:'compare',steps:['2と3、1と2、3と4の形の順に、1・2・3・4と上って戻ります。','2と3から1と2へは2を下げます。1と2から3と4へは2と3を上げます。1と4は同じ場所です。','各2小節ずつ、合計6小節です。']},
 {id:'switch3',unit:6,title:'3の指を上げ下げする',sub:'2と3の形と3と4の形',page:null,type:'switch3',steps:['はじめの2小節は2と3、次の2小節は3と4を近づけます。','後半は小節の中で形を替えます。3だけを半音動かします。','1・2・4の場所は同じです。4本の弦から選び、8小節を練習します。']},
 {id:'switch23',unit:6,title:'2と3を一緒に動かす',sub:'1と2の形と3と4の形',page:null,type:'switch23',steps:['はじめの2小節は1と2、次の2小節は3と4を近づけます。','後半は小節の中で形を替え、2と3を一緒に半音動かします。','1と4の場所は同じです。4本の弦から選び、8小節を練習します。']},
 {id:'reading55',unit:7,title:'読んで弾く・19の問題',sub:'選んだ4小節を楽譜から弾く',page:'72–74',type:'reading55',steps:['その1〜19から練習する問題を選びます。','まず30秒ながめ、弦・指・音の長さを確かめます。どれも4小節です。','音は問題ごとに決まっています。指番号4の音は開放弦に替えずに弾きます。']},
 {id:'application94',unit:7,title:'指の順番を自在に',sub:'弦と指の形を選ぶ94番の応用',page:124,type:'application94',steps:['G・D・A・E線と、2と3・1と2・3と4の形を選べます。','①〜⑧から1つの型を選びます。①〜⑧を通すと36小節です。指の順番とリズムは教本のまま、選んだ形で音を作ります。','音符ごとに弓を返します。反復記号は自動反復せず、選んだ範囲を一回弾きます。']}
];
export function chapterItems(unit){const ls=LESSONS.filter(l=>l.unit===unit);if(![1,3,4].includes(unit))return ls;return COMMON_MENU.map(([menu,title,sub])=>menu==='fingers'?ls.find(l=>l.menu===menu):{id:menu+'-'+unit,menu,title,sub,children:ls.filter(l=>l.menu===menu)});}
export function lessonPage(lesson,opts={}){if(lesson.pattern==='34'&&opts.string==='A'&&opts.variant==='flat')return null;if(lesson.exercise==='keep'&&(opts.row==='random'?opts.resolvedRow:opts.row)==7)return lesson.pattern==='23'?40:null;if(lesson.type==='application94'&&opts.pattern!=='12')return null;return lesson.page;}
const choose=(value,values,fallback)=>values.includes(String(value))?String(value):fallback;
export function normalizeOptions(lesson,raw={},bpm=60){
 raw=raw&&typeof raw==='object'?raw:{};const t=lesson.type,exercise=lesson.exercise||t,count=exercise==='keep'?7:8,scale=t==='scale12'?['C1','G2']:t==='scale34'?['A1','E1','A2']:['GD','DA','AE'];
 const opts={string:choose(raw.string,['G','D','A','E',...(t==='open'?['random']:[])],'A'),rhythm:choose(raw.rhythm,['whole','half','quarter','eighth','random'],'whole'),mode:choose(raw.mode,['continuous','wait'],raw.mode==='step'?'wait':lesson.unit>0?'wait':'continuous'),pair:choose(raw.pair,['GD','DA','AE'],'DA'),height:choose(raw.height,['all','1','2','3','4','5','6','7'],'all'),problem:choose(raw.problem,Array.from({length:t==='reading55'?19:8},(_,i)=>String(i+1)),'1'),row:choose(raw.row,[...Array.from({length:count},(_,i)=>String(i+1)),'random',...(t==='application94'?['all']:[])],'1'),resolvedRow:Number(choose(raw.resolvedRow,Array.from({length:count},(_,i)=>String(i+1)),'1')),pattern:choose(raw.pattern,['23','12','34'],'23'),variant:choose(raw.variant,['standard','flat'],'standard'),scale:choose(raw.scale,scale,scale[0]),fourth:choose(raw.fourth,['0','4'],'4'),bpm:Number.isFinite(Number(raw.bpm))&&Number(raw.bpm)>=40&&Number(raw.bpm)<=180?Math.round(Number(raw.bpm)):bpm,mic:typeof raw.mic==='boolean'?raw.mic:lesson.unit>0};
 if(t==='heights')opts.mic=false;if(opts.mic)opts.mode='wait';return opts;
}
function readingKey(ns){const played=ns.filter(n=>!n.rest),last=played.at(-1),candidates=[tonalKey(mod12(last.midi)),...Array.from({length:12},(_,pc)=>tonalKey(pc)).sort((a,b)=>Math.abs(a.tonicFifthsFromA+3)-Math.abs(b.tonicFifthsFromA+3))];return candidates.find(k=>played.every(n=>[0,2,4,5,7,9,11].includes(mod12(n.midi-k.tonicPitchClass))&&spelledFifthsFromC(n.letter,n.midi)-3===k.tonicFifthsFromA+STANDARD_FIFTHS[mod12(n.midi-k.tonicPitchClass)]))||tonalKey(0);}
// p25–26。 [弦,拍数]。nullは休符。
export const READING=[
 [['A',1],['A',1],['A',1],['A',1],['A',2],['A',2],['A',1],['A',1],['A',2],['A',4]],
 [['D',2],['D',2],['D',1],['D',1],['D',1],[null,1],['D',2],['D',1],['D',1],['D',4]],
 [['A',1],['A',1],['D',1],['D',1],['A',2],['D',2],['D',1],['D',1],['A',1],['A',1],['D',4]],
 [['A',2],['E',2],['E',1],['E',1],['A',1],['A',1],['A',1],[null,1],['E',1],[null,1],['A',4]],
 [['D',1],['D',.5],['D',.5],['D',1],['D',1],['G',1],['G',1],['G',1],['G',1],['D',2],['G',2],['G',4]],
 [['G',2],['D',1],['D',1],['A',2],['D',2],['G',1],['G',1],['D',1],['D',1],['A',4]],
 [['D',1],['A',1],['E',2],['E',1],['A',1],['D',2],['D',1],['D',1],['A',1],['A',1],['E',4]],
 [['G',1],['D',1],['A',1],['E',1],['E',2],[null,2],['E',1],['A',1],['D',1],['G',1],['G',4]]
];
export function makeExercise(type,opts={},random=Math.random){
 const lesson=LESSONS.find(l=>l.id===type)||LESSONS[0],id=lesson.id,raw=opts;opts=normalizeOptions(lesson,opts);type=lesson.exercise||id;
 if(opts.row==='random'&&!(Number.isInteger(Number(raw?.resolvedRow))&&Number(raw?.resolvedRow)>=1&&Number(raw?.resolvedRow)<=(type==='keep'?7:8)))opts.resolvedRow=Math.floor(random()*(type==='keep'?7:8))+1;
 const string=Object.hasOwn(STRINGS,opts.string)?opts.string:'A';
 const pattern=lesson.pattern==='34'&&string==='A'&&opts.variant==='flat'?'34low':lesson.pattern||(type==='application94'?opts.pattern:'23');
 const n=(f,b=1,extra={})=>makeNote(string,f,b,{pattern,...extra});
 const decode=data=>data.map(([s,f,b,p='23'])=>s?makeNote(s,f,b,{pattern:p}):makeRest(b));
 let notes=[];
 if(type==='open'){
   const duration={whole:4,half:2,quarter:1,eighth:.5}[opts.rhythm]||4;
   const strings=Object.keys(STRINGS);const pick=()=>opts.string==='random'?strings[Math.floor(random()*4)]:string;
   let beat=0;while(beat<16){const remaining=4-beat%4,candidates=[4,2,1,.5].filter(b=>b<=remaining),b=opts.rhythm==='random'?candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))]:duration;
    if(b===.5){notes.push(makeNote(pick(),0,.5),makeNote(pick(),0,.5));beat++;}else{notes.push(makeNote(pick(),0,b));beat+=b;}}
 } else if(type==='heights'){
   const positions=[['G'],['G','D'],['D'],['D','A'],['A'],['A','E'],['E']];
   const order=opts.height&&opts.height!=='all'?[Number(opts.height)-1]:[0,1,2,3,4,5,6,6,5,4,3,2,1,0];
   notes=order.map(i=>({...makeNote(positions[i][0],0,4),chord:positions[i].map(s=>makeNote(s,0,4)),height:i+1}));
 } else if(type==='cross'){
   const pair=opts.pair||'DA',seq=[pair[0],pair[1],pair[1],pair[0],pair[0],pair[1],pair[1],pair[0]];
   notes=[...seq,...seq].flatMap(s=>[makeNote(s,0,1),makeRest(1)]);
 } else if(type==='reading') notes=READING[Math.min(7,Math.max(0,Number(opts.problem||1)-1))].map(([s,b])=>s?makeNote(s,0,b):makeRest(b));
 else if(type==='reading55')notes=decode(READING55[Math.min(18,Math.max(0,Number(opts.problem||1)-1))]);
 else if(type==='fingers')notes=[0,1,2,3,4,3,2,1,0].map(f=>n(f,4));
 else if(type==='pairs')notes=[1,2,1,3,1,4,2,3,2,4,3,4,4,3,4,2,4,1,3,2,3,1,2,1].map(f=>n(f));
 else if(type==='keep'){
  const row=opts.row==='random'?opts.resolvedRow:Number(opts.row);
  notes=row===7?[0,1,2,3,1,2,3,4,0,1,2,1,1,2,3,2].map(f=>n(f)):ROWS64[row-1].map(([,f,b])=>n(f,b));
 }
 else if(type==='switch2'){
  for(const p of ['23','12'])notes.push(...[0,1,2,3,3,2,1,0].map(f=>n(f,1,{pattern:p})));
  notes.push(...[[1,'23'],[2,'23'],[1,'12'],[2,'12'],[2,'23'],[2,'12'],[2,'23'],[2,'12'],[1,'23'],[2,'23'],[3,'12'],[2,'12']].map(([f,p])=>n(f,1,{pattern:p})),n(1,2,{pattern:'12'}),n(0,2,{pattern:'12'}));
 }
 else if(['switch3','switch23'].includes(type)){
  const [a,b]=type==='switch3'?['23','34']:['12','34'];
  for(const p of [a,b])notes.push(...[0,1,2,3,4,3,2,1].map(f=>n(f,1,{pattern:p})));
  const seq=type==='switch3'?[[2,a],[3,a],[2,b],[3,b],[3,a],[3,b],[3,a],[3,b],[4,a],[3,a],[4,b],[3,b],[2,a],[3,a],[2,b],[3,b]]:[[2,a],[3,a],[2,b],[3,b],[3,a],[2,a],[3,b],[2,b],[1,a],[2,a],[3,b],[4,b],[4,a],[3,a],[2,b],[1,b]];
  notes.push(...seq.map(([f,p])=>n(f,1,{pattern:p})));
 }
 else if(type==='connect69')notes=decode(CONNECT69);
 else if(type==='scale12')notes=decode(EXTRA_SCALES[opts.scale==='G2'?'G2':'C1']);
 else if(type==='pivot')notes=[...[0,1,0,2,0,3,0,4,0,4,0,3,0,2,0,1].map(f=>n(f)),n(0,4)];
 else if(type==='triples')notes=[...[0,1,2,1,1,2,3,2,2,3,4,3,4,3,2,3,3,2,1,2,2,1,0,1].map(f=>n(f)),n(0,4)];
 else if(type==='compare')notes=['23','12','34'].flatMap(p=>[1,2,3,4,4,3,2,1].map(f=>n(f,1,{pattern:p})));
 else if(type==='scale34'){
  if(opts.scale==='A2')notes=decode(EXTRA_SCALES.A2);
  else {const pair=opts.scale==='E1'?'DA':'GD',up=[...pair].flatMap(s=>[1,2,3,4].map(f=>makeNote(s,f,1,{pattern:'34'})));notes=[...up,...up.slice().reverse()];}
 }
 else if(type==='application94'){
  const starts=[0,5,9,14,18,23,27,32,36];
  const row=opts.row==='random'?(Number(opts.resolvedRow)||Math.floor(random()*8)+1):Number(opts.row)||1;
  const selected=opts.row==='all'?APPLICATION94:APPLICATION94.slice(starts[Math.min(7,Math.max(0,row-1))]*4,starts[Math.min(8,Math.max(1,row))]*4);
  notes=selected.map(([,f,b])=>n(f,b));
 }
 else if(type==='add2')notes=[0,1,2,1,2,1,2,1,2,1,0].map((f,i)=>n(f,i===10?2:1));
 else if(type==='add3')notes=[1,2,3,2,3,2,3,2,3,2,1].map((f,i)=>n(f,i===10?2:1));
 else if(type==='add4')notes=[2,3,4,3,4,3,2,1,4,3,2,1].map(f=>n(f));
 else if(type==='place')notes=[n(1),makeRest(1),n(4,2),n(4),n(3),n(2),n(1)];
 else if(type==='scale'){
   const pair=opts.scale||'DA',low=pair[0],high=pair[1];
   const bridge=opts.fourth==='4'?makeNote(low,4,2):makeNote(high,0,2);
   const ascending=[...Array.from({length:4},(_,f)=>makeNote(low,f,2)),bridge,...[1,2,3].map(f=>makeNote(high,f,2))];
   notes=[...ascending,...ascending.slice().reverse()];
 }
 if(!notes.length)throw new Error('Unknown exercise: '+type);
 const key=type==='scale'?tonalKey({GD:7,DA:2,AE:9}[opts.scale]):type==='scale12'?tonalKey(opts.scale==='G2'?7:0):type==='scale34'?tonalKey(opts.scale==='E1'?4:9):type==='reading55'?readingKey(notes):null;
 return withTimeline(notes.map(x=>x.rest?x:{...x,key:key||keyForShape(x.string,x.pattern)}));
}
export function withTimeline(notes){const meter=4;let at=0;return notes.map((n,i)=>{const value={...n,index:i,start:at,end:at+n.beats,bar:Math.floor(at/meter),meter};at+=n.beats;return value;});}
export function noteTitle(n){return n.rest?'休み':n.chord&&n.chord.length>1?n.chord.map(x=>x.string).join('＋')+'線':n.string+'線・'+n.name;}
export function instructionFor(n,previous,type){
 type=LESSONS.find(l=>l.id===type)?.exercise||type;
 if(n.rest)return type==='place'?'弓を止めて、2・3・4をまとめて置こう。':`音を止めて、${n.beats}拍休もう。`;
 if(n.chord?.length===2)return '2本を一緒に。同じくらいの大きさで。';
 if(type==='open')return `${n.beats===.5?'半':n.beats}拍ぶん、弓を動かそう。`;
 if(n.finger===0)return '指を離して、開放弦を弾こう。';
 const pattern=n.pattern||'23',shape=PATTERNS[pattern];
 if(previous&&previous.string===n.string&&previous.finger===n.finger&&previous.midi!==n.midi)return `${n.finger}の指を半音${n.midi>previous.midi?'上げて':'下げて'}、${n.name}へ。`;
 const prefix='';
 if(n.finger===1)return prefix+(pattern==='34low'?'開放弦のラから半音上の、シ♭へ。':'1の指。同じ場所へ、戻ろう。');
 const close=shape.intervals[n.finger]-shape.intervals[n.finger-1]===1;
 return prefix+(close?`${n.finger}の指を、${n.finger-1}のすぐ隣に。`:`${n.finger-1}から全音あけて、${n.finger}の指を置こう。`);
}
