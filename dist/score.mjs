import {STRINGS} from './content.mjs';
import {CLEF_PATH,SHARP_PATH,FLAT_PATH,NATURAL_PATH,NOTEHEAD_PATH,WHOLE_PATH,HALF_PATH,FLAG_UP_PATH,FLAG_DOWN_PATH,REST_WHOLE_PATH,REST_HALF_PATH,REST_QUARTER_PATH,REST_EIGHTH_PATH} from './glyphs.mjs';

export function escapeHTML(value){return String(value).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));}
const STAFF_SPACE=11;
const svgNumber=value=>String(Math.round(value*1000)/1000);
const pitchY=(bottom,step)=>bottom-step*STAFF_SPACE/2;
function glyph(path,x,y,color,role){return `<path data-role="${role}" d="${path}" transform="translate(${svgNumber(x)} ${svgNumber(y)}) scale(${STAFF_SPACE})" fill="${color}"/>`;}
// ふよみと同じ基準。ト音記号のGの中心を、下から2本目のG4の線に置く。
function clef(x,bottom){return glyph(CLEF_PATH,x,pitchY(bottom,2),'#263d38','clef');}
export function noteGlyph(note,x,bottom,settings={}){
 if(note.rest){
  const rests={4:[REST_WHOLE_PATH,1.128,6],2:[REST_HALF_PATH,1.128,4],1:[REST_QUARTER_PATH,1.08,4],.5:[REST_EIGHTH_PATH,.988,4]};
  const [path,width,step]=rests[note.beats]||rests[1];
  return glyph(path,x-width*STAFF_SPACE/2,pitchY(bottom,step),'#263d38','rest');
 }
 const tones=note.chord||[note],head=note.beats===4?WHOLE_PATH:note.beats===2?HALF_PATH:NOTEHEAD_PATH;
 const headWidth=note.beats===4?1.688:1.18,left=x-headWidth*STAFF_SPACE/2;
 const colorFor=n=>settings.colors===false?'#263d38':STRINGS[n.string].color;
 let out='';const ledgers=new Set();
 for(const n of tones){for(let step=-2;step>=n.step;step-=2)ledgers.add(step);for(let step=10;step<=n.step;step+=2)ledgers.add(step);}
 for(const step of ledgers){const y=pitchY(bottom,step),halfWidth=Math.max(.96,headWidth/2+.35)*STAFF_SPACE;out+=`<path data-role="ledger-line" data-step="${step}" d="M${svgNumber(x-halfWidth)} ${y}H${svgNumber(x+halfWidth)}" fill="none" stroke="#5a6660" stroke-width="${STAFF_SPACE/8}" stroke-linecap="round"/>`;}
 for(const n of tones){
  const y=pitchY(bottom,n.step),color=colorFor(n);
  const accidental=n.accidental||(n.name.includes('♯')?'sharp':n.name.includes('♭')?'flat':null);
  if(accidental)out+=`<g data-accidental="${accidental}">${glyph({sharp:SHARP_PATH,flat:FLAT_PATH,natural:NATURAL_PATH}[accidental],x-1.72*STAFF_SPACE,y,color,'accidental')}</g>`;
  out+=glyph(head,left,y,color,'notehead');
 }
 if(note.beats<4){
  const up=(Math.min(...tones.map(n=>n.step))+Math.max(...tones.map(n=>n.step)))/2<4;
  const ys=tones.map(n=>pitchY(bottom,n.step)),anchor=up?Math.max(...ys):Math.min(...ys);
  const stemX=left+(up?1.18:0)*STAFF_SPACE,start=anchor+(up?-.168:.168)*STAFF_SPACE;
  const end=(up?Math.min(...ys):Math.max(...ys))+(up?-3.5:3.5)*STAFF_SPACE,color=colorFor(tones[0]);
  out+=`<path data-role="stem" d="M${svgNumber(stemX)} ${svgNumber(start)}V${svgNumber(end)}" fill="none" stroke="${color}" stroke-width="${.13*STAFF_SPACE}"/>`;
  if(note.beats===.5)out+=glyph(up?FLAG_UP_PATH:FLAG_DOWN_PATH,stemX-.065*STAFF_SPACE,end+(up?-.04:.132)*STAFF_SPACE,color,'flag');
 }
 if(settings.fingers!==false){
  const top=Math.min(bottom-4*STAFF_SPACE,...tones.map(n=>pitchY(bottom,n.step)-STAFF_SPACE*.5));
  const y=top-.52*STAFF_SPACE;
  out+=`<text data-role="finger" x="${x}" y="${svgNumber(y)}" text-anchor="middle" font-size="${.95*STAFF_SPACE}" font-weight="700">${tones.map((n,i)=>`<tspan fill="${colorFor(n)}">${i?' · ':''}${n.finger}</tspan>`).join('')}</text>`;
 }
 return out;
}
export function staffLines(width,bottom=96){return Array.from({length:5},(_,i)=>`<path data-role="staff-line" d="M12 ${bottom-i*STAFF_SPACE}H${width-12}" stroke="#a1aaa3" stroke-width="${STAFF_SPACE/8}"/>`).join('');}
export function renderSingle(note,settings={}){
 return `<svg class="single-score" viewBox="0 0 310 170" role="img" aria-label="${escapeHTML(note.rest?'休符':note.chord?.map(n=>n.name).join('と')||note.name)}、${note.beats}拍">${staffLines(310,114)}${clef(23,114)}${noteGlyph(note,177,114,settings)}${settings.names!==false?`<text x="177" y="160" text-anchor="middle" font-size="13" fill="#65746d">${escapeHTML(note.rest?'休み':note.chord?.map(n=>n.name).join(' ＋ ')||note.name)}</text>`:''}</svg>`;
}
export function renderScore(notes,settings={},group=0){
 const visible=group===null?notes:notes.filter(n=>n.bar>=group*4&&n.bar<group*4+4),bars=[...new Set(visible.map(n=>n.bar))];
 return bars.map(bar=>{
  const ns=visible.filter(n=>n.bar===bar),meter=ns[0].meter||4,width=Math.max(350,ns.length*49+96),left=76,space=(width-left-24)/Math.max(meter,ns.reduce((s,n)=>s+n.beats,0));
  const noteX=n=>left+(n.start%meter)*space+13;
  // 選択の背景を先に描き、五線・加線・音符をその上に保つ。
  let body=ns.map(n=>`<rect data-score-index="${n.index}" class="note-highlight" x="${noteX(n)-21}" y="19" width="43" height="120" rx="12" fill="transparent"/>`).join('');
  body+=staffLines(width)+clef(14,96)+`<text x="12" y="159" font-size="12" fill="#8b9189">${bar+1}</text>`;
  if(bar===0)body+=`<g data-role="time-signature" fill="#263d38" text-anchor="middle" font-family="serif" font-weight="700" font-size="24"><text x="52" y="73">${meter}</text><text x="52" y="95">4</text></g>`;
  const accidentals=new Map();
  for(const n of ns){const x=noteX(n);
   const decorate=tone=>{const alteration=tone.alteration??(tone.name.includes('♯')?1:0),previous=accidentals.get(tone.step)||0;accidentals.set(tone.step,alteration);return {...tone,accidental:alteration===1?'sharp':alteration===-1?'flat':previous!==0?'natural':null};};
   const printed=n.rest?n:n.chord?{...n,chord:n.chord.map(decorate)}:decorate(n);
   body+=`<g data-score-index="${n.index}">${noteGlyph(printed,x,96,settings)}${settings.names!==false?`<text x="${x}" y="159" font-size="12" fill="#69756e" text-anchor="middle">${escapeHTML(n.rest?'休':n.chord?.map(z=>z.string).join('+')||n.string)}</text>`:''}</g>`;
  }
  body+=`<path d="M${width-12} 52V96" stroke="#66746d" stroke-width="1.2"/>`;
  return `<svg class="score-bar" viewBox="0 0 ${width} 174" role="img" aria-label="${bar+1}小節目">${body}</svg>`;
 }).join('');
}

// 連続した五線に複数小節を組む。字形・音高・加線は従来の共通描画を使う。
export function renderSystems(notes,settings={},barsPerSystem=3,layout={}){
 const bars=[...new Set(notes.map(n=>n.bar))],systems=[];
 // プレビューは、加線・下向きの符幹に必要な余白だけを残す。
 const namesY=layout.compact?Math.max(118,...notes.filter(n=>!n.rest).map(n=>{
  const tones=n.chord||[n],steps=tones.map(t=>t.step);
  let low=Math.max(...steps.map(step=>pitchY(90,step)));
  if(n.beats<4&&(Math.min(...steps)+Math.max(...steps))/2>=4)low+=3.5*STAFF_SPACE;
  return low+18;
 })):136;
 const viewTop=layout.compact?7:0,viewHeight=namesY+10-viewTop;
 // 低い音の加線が増えても縦に間延びしない、横長の組段にする。
 const minimumWidth=Math.max(layout.minWidth||0,layout.compact?Math.ceil(viewHeight*3.1):0);
 for(let start=0;start<bars.length;start+=barsPerSystem){
  const group=bars.slice(start,start+barsPerSystem),bottom=90;
  const plans=group.map(bar=>({bar,ns:notes.filter(n=>n.bar===bar)}));
  // 少ない音でも五線を横幅まで使う。字形の縦横比は変えず、小節の余白を広げる。
  const naturalWidths=plans.map(plan=>Math.max(82,plan.ns.length*34+16));
  const extra=Math.max(0,minimumWidth-86-naturalWidths.reduce((a,b)=>a+b,0))/plans.length;
  let cursor=72;
  for(const [i,plan] of plans.entries()){plan.x=cursor;plan.width=naturalWidths[i]+extra;cursor+=plan.width;}
  const width=cursor+14;let backgrounds='',music='';
  for(const plan of plans){const {bar,ns,x,width:bw}=plan,meter=ns[0].meter||4,accidentals=new Map();
   const noteX=n=>ns.length===1?x+bw/2:x+20+(n.start-ns[0].start)*(bw-32)/Math.max(ns.reduce((s,n)=>s+n.beats,0),meter);
   music+=`<text x="${x+5}" y="19" font-size="10" fill="#697384">${bar+1}</text>`;
   for(const n of ns){const nx=noteX(n);
    backgrounds+=`<rect data-score-index="${n.index}" class="note-highlight" x="${nx-15}" y="23" width="30" height="99" rx="5" fill="transparent"/>`;
    const decorate=t=>{const a=t.alteration??(t.name.includes('♯')?1:t.name.includes('♭')?-1:0),prev=accidentals.get(t.step)||0;accidentals.set(t.step,a);return {...t,accidental:a===1?'sharp':a===-1?'flat':prev!==0?'natural':null};};
    const printed=n.rest?n:n.chord?{...n,chord:n.chord.map(decorate)}:decorate(n);
    music+=`<g data-score-index="${n.index}">${noteGlyph(printed,nx,bottom,settings)}${settings.names!==false?`<text x="${nx}" y="${namesY}" text-anchor="middle" font-size="10" fill="#697384">${escapeHTML(n.rest?'休':n.chord?.map(z=>z.string).join('+')||n.string)}</text>`:''}</g>`;
   }
   music+=`<path data-role="barline" d="M${x+bw} 46V90" stroke="#657083" stroke-width="1.2"/>`;
  }
  const meter=plans[0].ns[0].meter||4;
  systems.push({width,label:`${group[0]+1}から${group.at(-1)+1}小節`,body:`${backgrounds}${staffLines(width,bottom)}${clef(17,bottom)}${start===0?`<g data-role="time-signature" text-anchor="middle" font-family="serif" font-weight="700" font-size="23" fill="#202839"><text x="54" y="68">${meter}</text><text x="54" y="90">4</text></g>`:''}${music}`});
 }
 const widest=Math.max(...systems.map(s=>s.width));
 return systems.map(s=>`<svg class="score-system" viewBox="0 ${viewTop} ${svgNumber(widest)} ${svgNumber(viewHeight)}" role="img" aria-label="${s.label}">${s.body}</svg>`).join('');
}
