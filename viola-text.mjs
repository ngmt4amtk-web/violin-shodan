import {IS_VIOLA} from './instrument.mjs';
// 画面に出す文言を、ビオラ版だけ5度下・ハ音記号向けに置き換える。2026-11-02 追加。
// バイオリン用の元の固定文だけへ一度当てる。最終HTML、label、n.name、変換済みの調名には当てない。
// 下の VIOLA_TEXT_PAIRS がそのまま「何を置き換えたか」の一覧。あとから人が読んで確かめる。
// 並びは長い語が先（「A線のラ・シ♭・…」を「A線」より先に、「変ロ長調」を「ロ長調」より先に当てる）。
// 1回の正規表現で同時に置換するので、「ハ長調→ヘ長調」の結果がさらに「ヘ長調→変ロ長調」へ進むことはない。
export const VIOLA_TEXT_PAIRS=[
 // 弦名（内部名ではなく表示名の対応。内部の G・D・A・E は変えない）
 ['G線','C線'],
 ['D線','G線'],
 ['A線','D線'],
 ['E線','A線'],
 // 調名（5度下）長調
 ['変ロ長調','変ホ長調'],
 ['変ホ長調','変イ長調'],
 ['ハ長調','ヘ長調'],
 ['ト長調','ハ長調'],
 ['ニ長調','ト長調'],
 ['イ長調','ニ長調'],
 ['ホ長調','イ長調'],
 ['ロ長調','ホ長調'],
 ['ヘ長調','変ロ長調'],
 // 調名（5度下）短調。同じ規則
 ['変ロ短調','変ホ短調'],
 ['変ホ短調','変イ短調'],
 ['ハ短調','ヘ短調'],
 ['ト短調','ハ短調'],
 ['ニ短調','ト短調'],
 ['イ短調','ニ短調'],
 ['ホ短調','イ短調'],
 ['ロ短調','ホ短調'],
 ['ヘ短調','変ロ短調'],
 // 楽器・記号
 ['バイオリン','ビオラ'],
 ['ト音記号','ハ音記号'],
 ['VIOLIN','VIOLA'],
 // 音名を含む文。音名は5度下（ド→ファ、レ→ソ、ミ→ラ、ファ→シ♭、ソ→ド、ラ→レ、シ→ミ）だが、
 // 「レッスン」のような語を壊さないため、文まるごとで対応する。
 ['A線のラ・シ♭・ド・レ・ミ♭です。','D線のレ・ミ♭・ファ・ソ・ラ♭です。'],
 ['ミ・ファ♯・ソ♯・ラ♯・シ','ラ・シ・ド♯・レ♯・ミ'],
 ['ミ・ファ・ソ・ラ・シ♭','ラ・シ♭・ド・レ・ミ♭'],
 ['ラ・シ・ド♯・レ♯・ミ','レ・ミ・ファ♯・ソ♯・ラ'],
 ['ラ・シ♭・ド・レ・ミ♭','レ・ミ♭・ファ・ソ・ラ♭'],
 ['シ♭とミ♭の形','ミ♭とラ♭の形'],
 ['G・D、D・A、A・Eから、使う2本を選びます。','C・G、G・D、D・Aから、使う2本を選びます。'],
 ['A線・シ♭とミ♭の形','D線・ミ♭とラ♭の形'],
 ['G、G＋D、D、D＋A、A、A＋E、Eの順にたどり、戻ります。','C、C＋G、G、G＋D、D、D＋A、Aの順にたどり、戻ります。'],
 ['G → G＋D → D → D＋A → A → A＋E → E','C → C＋G → G → G＋D → D → D＋A → A'],
 ['G・D、D・A、A・Eから選べます。各段を2回弾きます。','C・G、G・D、D・Aから選べます。各段を2回弾きます。'],
 ['ト長調はG・D、ニ長調はD・A、イ長調はA・Eを使います。','ハ長調はC・G、ト長調はG・D、ニ長調はD・Aを使います。'],
 ['ハ長調ではD・A線の1と2を近づけます。ト長調ではG・D線が2と3、A・E線が1と2です。','ヘ長調ではG・D線の1と2を近づけます。ハ長調ではC・G線が2と3、D・A線が1と2です。'],
 ['イ長調1オクターヴはG・D線、ホ長調1オクターヴはD・A線を使い、3と4を近づけます。','ニ長調1オクターヴはC・G線、イ長調1オクターヴはG・D線を使い、3と4を近づけます。'],
 ['イ長調2オクターヴでは、G・D線は3と4、A・E線は2と3の形へ切り替えます。','ニ長調2オクターヴでは、C・G線は3と4、D・A線は2と3の形へ切り替えます。'],
 ['G・D・A・E線と、2と3・1と2・3と4の形を選べます。','C・G・D・A線と、2と3・1と2・3と4の形を選べます。'],
 ['G 青 · D オレンジ · A 赤 · E 緑','C 茶 · G 青 · D オレンジ · A 赤'],
];
const escapeRegExp=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const byLength=[...VIOLA_TEXT_PAIRS].sort((a,b)=>b[0].length-a[0].length);
const TABLE=new Map(byLength);
const REPLACE=new RegExp(byLength.map(([from])=>escapeRegExp(from)).join('|'),'g');
const swap=text=>text.replace(REPLACE,match=>TABLE.get(match)??match);
const ARIA=/\baria-label=("([^"]*)"|'([^']*)')/g;
function convertTag(tag){
 return tag.replace(ARIA,(whole,quoted,double,single)=>{
  const quote=quoted[0],value=double??single;
  return `aria-label=${quote}${swap(value)}${quote}`;
 });
}
function convertSegment(segment){
 return segment.replace(/<[^>]*>|[^<]+/g,piece=>piece[0]==='<'&&/^<[a-zA-Z]/.test(piece)?convertTag(piece):piece[0]==='<'?piece:swap(piece));
}
// タグの外の文字と aria-label の値だけを置き換える。svg 要素の中はそのまま残す。
export function violaText(text){
 const html=String(text??'');
 if(!IS_VIOLA)return html;
 const svg=/<svg\b[\s\S]*?<\/svg>/gi;
 let out='',cursor=0,match;
 while((match=svg.exec(html))){out+=convertSegment(html.slice(cursor,match.index))+match[0];cursor=match.index+match[0].length;}
 return out+convertSegment(html.slice(cursor));
}
