import {READING55,ROWS64,APPLICATION94,EXTRA_SCALES,CONNECT69} from './repertoire.mjs';
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
 return {string,finger,beats,midi,name:LETTERS[letter]+(alteration===1?'♯':alteration===-1?'♭':''),step,pattern,alteration,...extra};
}
export const makeRest=beats=>({rest:true,beats,name:'休み'});
export const LESSONS=[
 {id:'open',unit:0,title:'はじめての開放弦',sub:'1本の弦で、音の長さを感じよう',tag:'まずはここから',page:null,type:'open',minutes:'1分',steps:['左手の指は押さえず、選んだ弦に弓を置きます。','全音符は4拍、2分音符は2拍、4分音符は1拍、8分音符は半拍です。','4つのカウントが鳴ったら、お手本と一緒に弾きます。音が変わるごとに弓を返しましょう。'],check:'音の終わりまで、弓を止めずに使えた？'},
 {id:'heights',unit:0,title:'7つの弓の高さ',sub:'1本と2本。その間の高さを探そう',tag:'移弦',page:9,type:'heights',minutes:'1分',steps:['G、G＋D、D、D＋A、A、A＋E、Eの順にたどり、戻ります。','2本のところは同時に鳴らします。2本が同じくらいの大きさになる高さを探します。','弦を移るときは、弓を止めて高さを替えてから次へ。慣れたら止まる時間を短くします。'],check:'2本が同じくらいの大きさで鳴った？'},
 {id:'cross',unit:0,title:'休みの間に、次の弦へ',sub:'音を止めて、弓の高さを用意する',tag:'休符と移弦',page:14,type:'cross',minutes:'40秒',steps:['1つ弾いたら、1拍休みます。休みの間に次の弦へ弓を用意します。','G・D、D・A、A・Eから選べます。各段を2回弾きます。','休符では音を止め、次の音を拍に合わせて始めます。'],check:'休符は静かで、次の音を拍に合わせて始められた？'},
 {id:'reading',unit:0,title:'読んで弾く・8つの問題',sub:'長さと弦を、楽譜から読んでみよう',tag:'まとめ',page:'25–26',type:'reading',minutes:'1分',steps:['まず譜面を30秒ながめ、弦の移動と音の長さ、休符を確かめます。','4拍のカウントのあと、4小節を通して弾きます。','マイクは音が出たかを見る補助です。弦の正しさや音程の採点はしません。'],check:'休符も数えながら、4小節を止まらず弾けた？'},
 {id:'fingers',unit:1,title:'2と3を、くっつける',sub:'音名より先に、指の関係をつかもう',tag:'左手の入口',page:30,type:'fingers',minutes:'2分',steps:['1は人差し指、2は中指、3は薬指、4は小指。0は何も押さえない開放弦です。','隣り合う指の音程には、半音と全音があります。全音は半音2つ分です。今回は2と3だけを近づけます。','1と2、3と4の間はあけます。どの弦でも、この指の間隔の並びは同じです。','マイクを使うと、表示された音に近い音が続いたところで次へ進みます。'],check:'上りも下りも、2と3を近づけたまま戻れた？'},
 {id:'add2',unit:1,title:'2の指を足す',sub:'1から全音あけて、2を置く',tag:'指を一つずつ',page:34,type:'add2',minutes:'1分',steps:['まず0、1、2と置いてみます。1と2の間は全音あけます。','2と1を行き来し、1へ戻ったとき同じ高さになるか聴きます。','教本のA線の練習を、4本の弦から選べるようにしています。'],check:'戻るたびに、1の音を同じ場所で出せた？'},
 {id:'add3',unit:1,title:'3の指を足す',sub:'2のすぐ隣に、3を置く',tag:'半音',page:34,type:'add3',minutes:'1分',steps:['1、2、3と弾きます。2と3の間は半音です。','3を上げるときも、2の場所を保ちます。','2と3を行き来して、近い間隔を確かめます。'],check:'3を上げたとき、2の場所を保てた？'},
 {id:'add4',unit:1,title:'4の指を足す',sub:'2と3を保ったまま、小指へ',tag:'小指',page:34,type:'add4',minutes:'1分',steps:['2、3、4と弾きます。3と4の間は全音です。','G・D・A線では、4の音は隣の高い弦の開放弦と同じ高さです。','4を置いても、2と3の間が広がらないようにします。'],check:'4を使ったあとも、2と3が近いままだった？'},
 {id:'place',unit:1,title:'まとめて置いて、下る',sub:'休符で準備。4・3・2・1と離そう',tag:'指の準備',page:36,type:'place',minutes:'1分',steps:['最初に1・2・3・4を一つずつ弾き、音を確かめておきます。','練習では1を弾き、休符で弓を止めます。1を軽く残し、2・3・4をまとめて置きます。置くときは音を出しません。','4を鳴らし、次の小節で4・3・2・1と下ります。まとめて置くことを、強く握ることにしません。'],check:'最後の1が、最初の1と同じ高さに戻った？'},
 {id:'order',unit:1,title:'指の順番を変えてみる',sub:'同じ形のまま、違う順番で弾く',tag:'組み合わせ',page:40,type:'order',minutes:'1分',steps:['0・1・2・3、1・2・3・4、0・1・2・1、1・2・3・2と弾きます。','音符ごとに弓を返します。2と3の半音を保ちましょう。','教本の上段の補助練習を、全弦へ広げています。'],check:'4を使ったあとも、1や2の音に戻れた？'},
 {id:'scale',unit:2,title:'2本の弦で、はじめての音階',sub:'ト長調・ニ長調・イ長調を選ぼう',tag:'音階',page:'41–43',type:'scale',minutes:'1分',steps:['低い弦の開放弦から、隣の高い弦の3の指まで上り、同じ道を下ります。','ト長調はG・D、ニ長調はD・A、イ長調はA・Eを使います。','どちらの弦でも2と3を近づけます。今回は各ページ上2段の音階を練習します。','最初は1音ずつ弓を返しても大丈夫。慣れたらスラー（弓を返さずつなげる印）の2音を一弓で弾きます。'],check:'弦が変わっても、2と3の間隔を保てた？'},
 {id:'reading55',unit:3,title:'読んで弾く・19の問題',sub:'選んだ4小節を、楽譜から弾いてみよう',tag:'譜読み',page:'72–74',type:'reading55',steps:['教本の「その1〜19」から、練習する問題を一つ選びます。','まず30秒ながめ、弦・指・音の長さを確かめます。どの問題も4小節です。','曲の音は問題ごとに決まっています。指番号4の音は、開放弦に替えずに弾いてみましょう。']},
 {id:'fingers12',unit:4,title:'1と2を、くっつける',sub:'2の指を下げて、新しい半音へ',tag:'新しい形',page:80,type:'fingers12',pattern:'12',steps:['1と2の間が半音になるように近づけます。2と3、3と4は全音あけます。','前の「2と3」の形から、2だけを半音下げます。1・3・4の場所は同じです。','弦を選び、0から4へ一つずつ上り、戻ります。譜面とお手本で音の違いを確かめましょう。']},
 {id:'pairs12',unit:4,title:'6組の指を、往復する',sub:'1と2の間隔を保って、指を行き来',tag:'組み合わせ',page:82,type:'pairs12',pattern:'12',steps:['1・2、1・3、1・4、2・3、2・4、3・4の6組を弾きます。','後半は4・3、4・2、4・1、3・2、3・1、2・1と戻ります。','離れた指へ移るときも、1と2が近い形を覚えておきます。']},
 {id:'keep12',unit:4,title:'形を保って、続ける',sub:'64番の6段から、一つを選ぼう',tag:'6段から選択',page:91,type:'keep12',pattern:'12',steps:['1〜6段から選ぶか、ランダムで一段を選びます。一段は5小節です。','1と2の半音を保ち、4分音符を同じ弓の量で弾きます。最後は開放弦を4拍伸ばします。','G・D・A・E線で同じ指の順番を練習できます。まずは1音ずつ弓を返して弾きましょう。']},
 {id:'switch2',unit:5,title:'2の指の場所を、切り替える',sub:'2と3の形から、1と2の形へ',tag:'形の切り替え',page:'93–94',type:'switch2',steps:['はじめの2小節は2と3を近づけ、次の2小節は1と2を近づけます。','後半は同じ小節の中でも2の指の音が変わります。♯・♭・♮を見て弾き分けます。','1と3の場所は保ち、2の指だけを移します。どの弦でも8小節を練習します。']},
 {id:'connect69',unit:5,title:'4本の弦を、つなぐ',sub:'弦を替える前に、次の形を用意',tag:'69番',page:96,type:'connect69',steps:['E・A線は1と2が近い形、D・G線は2と3が近い形です。','2分音符で、E線からG線へ順に移ります。最後はG線の3の指で4拍伸ばします。','次の弦に移る前に、次の2の指がどこにあるか確かめましょう。']},
 {id:'scale12',unit:5,title:'ハ長調・ト長調の音階',sub:'弦によって変わる、半音の場所',tag:'音階',page:97,type:'scale12',steps:['ハ長調1オクターヴか、ト長調2オクターヴを選びます。','ハ長調ではD・A線の1と2を近づけます。ト長調ではG・D線が2と3、A・E線が1と2です。','上りと下りを、同じ指の場所でたどります。音名と指の形を見ながら弾きましょう。']},
 {id:'fingers34',unit:6,title:'3と4を、くっつける',sub:'3の指を上げて、小指のすぐ隣へ',tag:'新しい形',page:115,type:'fingers34',pattern:'34',steps:['標準の形では、3と4の間が半音です。1と2、2と3は全音あけます。','2と3の形から、3だけを半音上げます。1・2・4の場所は同じです。','弦を選び、0から4へ上って戻ります。A線では別の並び「ラ・シ♭・ド・レ・ミ♭」も選べます。']},
 {id:'pairs34',unit:6,title:'3と4の形で、6組を往復',sub:'覚えた指の順番を、新しい形で',tag:'組み合わせ',page:'82・115',type:'pairs34',pattern:'34',steps:['82ページの6組往復を、3と4が近い形でも練習します。','前半は1・2、1・3、1・4、2・3、2・4、3・4。後半は反対向きに戻ります。','離れた指へ跳んだあとも、3と4の近い間隔を保ちます。']},
 {id:'eighth34',unit:6,title:'半弓で、3と4を確かめる',sub:'短い上り下りを、8分音符で',tag:'86番',page:116,type:'eighth34',pattern:'34',steps:['2拍子の3小節です。1拍に2音ずつ、0・1・2・3、4・3・2・1と弾きます。','最後に開放弦を1拍弾き、1拍休みます。音符ごとに弓を返します。','標準の形では4の音を目印に、3をすぐ隣へ近づけます。']},
 {id:'compare',unit:6,title:'変わる指と、変わらない指',sub:'同じ弦で、3つの形を比べよう',tag:'補助練習',page:120,type:'compare',steps:['2と3、1と2、3と4の形の順に、1・2・3・4と上って戻ります。','最初の形から1と2の形へは2を下げ、3と4の形へは3を上げます。1と4は同じ場所です。','各2小節ずつ、合計6小節。画面の指の形も、音に合わせて変わります。']},
 {id:'scale34',unit:7,title:'1の指から始める、音階',sub:'イ長調・ホ長調、そして2オクターヴへ',tag:'89〜91番',page:121,type:'scale34',steps:['イ長調1オクターヴはG・D線、ホ長調1オクターヴはD・A線を使い、3と4を近づけます。','イ長調2オクターヴでは、G・D線は3と4、A・E線は2と3の形へ切り替えます。','どれも1の指から始まります。譜面の4の指は開放弦に替えず、同じ形で戻りましょう。']},
 {id:'application94',unit:8,title:'指の順番を、自在に',sub:'弦と指の形を選ぶ、94番の応用',tag:'応用練習',page:124,type:'application94',steps:['教本94番の36小節を、紙面の8段から一つずつ選べます。「全体」で通して練習もできます。','G・D・A・E線と、2と3・1と2・3と4の形を選びます。音の並びは教本の指の順番を使います。','まずは1音ずつ弓を返し、等しい4分音符で弾きます。反復記号は自動反復せず、選んだ範囲を一回弾きます。']}
];
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
 const string=opts.string in STRINGS?opts.string:'A';
 const pattern=type.endsWith('12')?'12':type.endsWith('34')?(string==='A'&&opts.variant==='flat'?'34low':'34'):type==='application94'?(opts.pattern||'23'):'23';
 const n=(f,b=1,extra={})=>makeNote(string,f,b,{pattern,...extra});
 const decode=data=>data.map(([s,f,b,p='23'])=>s?makeNote(s,f,b,{pattern:p}):makeRest(b));
 let notes=[];
 if(type==='open'){
   const duration={whole:4,half:2,quarter:1,eighth:.5}[opts.rhythm]||4;
   const strings=Object.keys(STRINGS);const pick=()=>opts.string==='random'?strings[Math.floor(random()*4)]:string;
   if(opts.mode==='step') notes=[4,2,1,.5].map(b=>makeNote(pick(),0,b));
   else {let beat=0;while(beat<16){let b=opts.rhythm==='random'?[4,2,1,.5][Math.floor(random()*4)]:duration; b=Math.min(b,4-beat%4);notes.push(makeNote(pick(),0,b));beat+=b;}}
 } else if(type==='heights'){
   const positions=[['G'],['G','D'],['D'],['D','A'],['A'],['A','E'],['E']];
   const order=opts.height&&opts.height!=='all'?[Number(opts.height)-1]:[0,1,2,3,4,5,6,6,5,4,3,2,1,0];
   notes=order.map(i=>({...makeNote(positions[i][0],0,4),chord:positions[i].map(s=>makeNote(s,0,4)),height:i+1}));
 } else if(type==='cross'){
   const pair=opts.pair||'DA',seq=[pair[0],pair[1],pair[1],pair[0],pair[0],pair[1],pair[1],pair[0]];
   notes=[...seq,...seq].flatMap(s=>[makeNote(s,0,1),makeRest(1)]);
 } else if(type==='reading') notes=READING[Math.min(7,Math.max(0,Number(opts.problem||1)-1))].map(([s,b])=>s?makeNote(s,0,b):makeRest(b));
 else if(type==='reading55')notes=decode(READING55[Math.min(18,Math.max(0,Number(opts.problem||1)-1))]);
 else if(['fingers','fingers12','fingers34'].includes(type))notes=[0,1,2,3,4,3,2,1,0].map(f=>n(f,4));
 else if(['pairs12','pairs34'].includes(type))notes=[1,2,1,3,1,4,2,3,2,4,3,4,4,3,4,2,4,1,3,2,3,1,2,1].map(f=>n(f));
 else if(type==='keep12'){
  const row=opts.row==='random'?(Number(opts.resolvedRow)||Math.floor(random()*6)+1):Number(opts.row)||1;
  notes=ROWS64[Math.min(5,Math.max(0,row-1))].map(([,f,b])=>n(f,b));
 }
 else if(type==='switch2'){
  for(const p of ['23','12'])notes.push(...[0,1,2,3,3,2,1,0].map(f=>n(f,1,{pattern:p})));
  notes.push(...[[1,'23'],[2,'23'],[1,'12'],[2,'12'],[2,'23'],[2,'12'],[2,'23'],[2,'12'],[1,'23'],[2,'23'],[3,'12'],[2,'12']].map(([f,p])=>n(f,1,{pattern:p})),n(1,2,{pattern:'12'}),n(0,2,{pattern:'12'}));
 }
 else if(type==='connect69')notes=decode(CONNECT69);
 else if(type==='scale12')notes=decode(EXTRA_SCALES[opts.scale==='G2'?'G2':'C1']);
 else if(type==='eighth34')notes=[...[0,1,2,3,4,3,2,1].map(f=>n(f,.5)),n(0),makeRest(1)];
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
 else if(type==='order')notes=[0,1,2,3,1,2,3,4,0,1,2,1,1,2,3,2].map(f=>n(f));
 else if(type==='scale'){
   const pair=opts.scale||'DA',low=pair[0],high=pair[1];
   const bridge=opts.fourth==='4'?makeNote(low,4,2):makeNote(high,0,2);
   const ascending=[...Array.from({length:4},(_,f)=>makeNote(low,f,2)),bridge,...[1,2,3].map(f=>makeNote(high,f,2))];
   notes=[...ascending,...ascending.slice().reverse()].map((x,i)=>({...x,slurStart:i%2===0,slurEnd:i%2===1}));
 }
 if(!notes.length)throw new Error('Unknown exercise: '+type);
 return withTimeline(notes,type==='eighth34'?2:4);
}
export function withTimeline(notes,meter=4){let at=0;return notes.map((n,i)=>{const value={...n,index:i,start:at,end:at+n.beats,bar:Math.floor(at/meter),meter};at+=n.beats;return value;});}
export function noteTitle(n){return n.rest?'休み':n.chord&&n.chord.length>1?n.chord.map(x=>x.string).join('＋')+'線':n.string+'線・'+n.name;}
export function instructionFor(n,previous,type){
 if(n.rest)return type==='place'?'弓を止めて、2・3・4をまとめて置こう。':type==='eighth34'?'音を止めて、1拍休もう。':'音を止めて、次の弦を用意しよう。';
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
