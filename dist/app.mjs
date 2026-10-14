import {STRINGS,LESSONS,PATTERNS,makeExercise,noteTitle,instructionFor} from './content.mjs';
import {AudioEngine,Microphone,StablePitchGate,centsFrom,MIC_LEVELS} from './engine.mjs';
import {escapeHTML,renderScore,renderSystems} from './score.mjs';
import {BRAVURA_LICENSE} from './glyphs.mjs';

const ICONS={home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',book:'<path d="M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3zM12 6v15"/>',chart:'<path d="M4 20V10m8 10V4m8 16v-7M2 22h20"/>',settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',back:'<path d="m14 5-7 7 7 7"/>',play:'<path d="m8 4 12 8-12 8z"/>',pause:'<path d="M8 4v16M16 4v16"/>',sound:'<path d="M3 9h4l5-5v16l-5-5H3zM16 8q5 4 0 8m3-11q8 7 0 14"/>',check:'<path d="m5 12 4 4L20 5"/>',spark:'<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8z"/>',mic:'<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'};
const icon=name=>`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.book}</svg>`;
const $=sel=>document.querySelector(sel);
const KEY='genshirube-v1';
let storageAvailable=true;
function readStored(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{storageAvailable=false;return {};}}
const stored=readStored();
let preferences={colors:stored.preferences?.colors!==false,fingers:stored.preferences?.fingers!==false,names:stored.preferences?.names!==false,reference:stored.preferences?.reference!==false,click:stored.preferences?.click!==false,sensitivity:stored.preferences?.sensitivity in MIC_LEVELS?stored.preferences.sensitivity:'high',bpm:Math.min(180,Math.max(40,Number(stored.preferences?.bpm)||60))};
let view='home',lesson=null,options={},notes=[],practice=null,raf=0,sessionToken=0,previewTimer=0,toastTimer=0,wakeLock=null;
const audio=new AudioEngine(),mic=new Microphone(audio),pitchGate=new StablePitchGate();
function save(){try{localStorage.setItem(KEY,JSON.stringify({preferences}));storageAvailable=true;}catch{storageAvailable=false;toast('このブラウザでは設定を保存できません。');}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
const CHAPTERS=['開放弦と弓の動き','2と3をくっつける','はじめの音階','楽譜を読んで弾く','1と2をくっつける','指の形を切り替える','3と4をくっつける','音階を広げる','応用練習'];
const CHAPTER_SUB=['音の長さ・移弦・休符','左手の基本と指の準備','ト長調・ニ長調・イ長調','4小節を読む19の課題','指の往復・置いたまま弾く','2つの形・つなぐ練習・音階','新しい間隔・8分音符','イ長調・ホ長調・2オクターヴ','弦・段・3つの形を選ぶ'];
let chapter=null,settingsReturn='home';
function shell(body,performance=false){
 document.body.dataset.view=view;
 $('#app').innerHTML=`${performance?'':`<header class="app-header"><button class="brand" data-nav="home" aria-label="弦しるべ 教材一覧"><span class="brand-mark" aria-hidden="true">弦</span><span>弦しるべ<small>VIOLIN PRACTICE</small></span></button><button class="quiet" data-action="settings" aria-label="設定">${icon('settings')}<span>設定</span></button></header>`}<main id="main" class="${performance?'performance-main':'workspace'}">${body}</main><div class="offline-note" ${navigator.onLine?'hidden':''}>オフライン · 保存済みの教材を使用</div>`;
}
function focusHeading(){requestAnimationFrame(()=>{const h=$('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}});}
function navigate(next){cleanup();view=next;render();window.scrollTo(0,0);focusHeading();}
function render(){if(view==='home')renderHome();else if(view==='intro')renderIntro();else if(view==='settings')renderSettings();else if(view==='setup')renderSetup();}
function lessonHeader(stage){return `<div class="lesson-toolbar"><button class="quiet" data-action="${stage===1?'chapters':'intro'}">${icon('back')}${stage===1?'教材一覧':'やり方'}</button><ol class="stage-nav" aria-label="練習の流れ"><li ${stage===1?'aria-current="step"':''}>1 やり方</li><li ${stage===2?'aria-current="step"':''}>2 選ぶ</li><li>3 弾く</li></ol></div><div class="lesson-heading"><p class="eyebrow">${CHAPTERS[lesson.unit]}${lesson.page?' · p.'+lesson.page:''}</p><h1>${lesson.title}</h1></div>`;}
function renderHome(){
 const list=chapter===null?CHAPTERS.map((name,i)=>`<button class="chapter-row" data-chapter="${i}"><span class="index">${String(i+1).padStart(2,'0')}</span><span><strong>${name}</strong><small>${CHAPTER_SUB[i]}</small></span><span class="chevron">›</span></button>`).join(''):LESSONS.filter(l=>l.unit===chapter).map(l=>`<button class="lesson-row" data-lesson="${l.id}"><span><strong>${l.title}</strong><small>${l.sub}</small></span><span class="chevron">›</span></button>`).join('');
 shell(`<section class="library"><div class="library-heading">${chapter===null?'<p class="eyebrow">開放弦から、3つの指の形へ</p><h1>何を練習しよう？</h1><p class="muted">まずは、練習したい章をひとつ。</p>':`<button class="quiet" data-action="allChapters">${icon('back')}すべての章</button><h1>${CHAPTERS[chapter]}</h1><p class="muted">${CHAPTER_SUB[chapter]}</p>`}</div><div class="${chapter===null?'chapter-list':'lesson-list'}">${list}</div><footer class="library-foot"><span>9章 · 24の練習</span><span>記録を気にせず、何度でも。</span></footer></section>`);
}
function enterLesson(id){cleanup();lesson=LESSONS.find(l=>l.id===id);if(!lesson)return;chapter=lesson.unit;view='intro';options={string:'A',rhythm:'whole',mode:lesson.unit>0?'wait':'continuous',pair:'DA',height:'all',problem:1,row:'1',resolvedRow:1,pattern:'23',variant:'standard',scale:lesson.type==='scale12'?'C1':lesson.type==='scale34'?'A1':'GD',fourth:'4',bpm:preferences.bpm,mic:lesson.unit>0};notes=makeExercise(lesson.type,options);renderIntro();window.scrollTo(0,0);focusHeading();}
function patternDiagram(pattern,compact=false){const p=pattern==='34low'?'34':pattern,pair=p.split('').join('と');return `<div class="pattern-diagram ${compact?'compact':''}" data-pattern="${pattern}"><img src="./assets/pattern-${p}.svg" width="300" height="104" alt="1・2・3・4のうち、${pair}が隣り合う図"><div><strong>${pair}<span>をくっつける</span></strong>${compact?'':`<p>${pattern==='34low'?'A線の別の並び · 1も半音低く':'つながった2本は半音、ほかは全音'}</p>`}</div></div>`;}
function setupSteps(){
 if(options.string==='A'&&options.variant==='flat'&&['fingers34','pairs34','eighth34'].includes(lesson.type))return ['A線だけの並びです。0はラ、1はシ♭、2はド、3はレ、4はミ♭。','3と4が半音で近づき、1と2、2と3は全音あきます。開放弦と1の間も半音です。','標準の形より1〜4をそれぞれ半音低く置きます。4はE線の開放弦より半音低い音です。'];return lesson.steps;
}
function renderIntro(){
 const patterns=[...new Set(notes.filter(n=>!n.rest).map(n=>n.pattern))],steps=setupSteps();
 shell(`<section class="lesson-page intro-page">${lessonHeader(1)}<div class="intro-grid"><div class="intro-visual">${lesson.unit>0?patterns.map(p=>patternDiagram(p)).join(''):`<div class="intro-staff">${renderScore(notes.filter(n=>n.bar===0),preferences,null)}</div><p>${lesson.type==='heights'?'G → G＋D → D → D＋A → A → A＋E → E':'0は開放弦。左手は押さえません。'}</p>`}</div><div class="intro-copy"><h2>この練習のやり方</h2><ol class="instruction-list">${steps.slice(0,3).map(s=>`<li>${s}</li>`).join('')}</ol>${steps.length>3?`<details><summary>もう少し詳しく</summary>${steps.slice(3).map(s=>`<p>${s}</p>`).join('')}</details>`:''}</div></div><div class="page-action"><p>次に、弦や練習する段を選びます。</p><button class="primary" data-action="setup">練習を選ぶ ${icon('arrow')}</button></div></section>`);
}
function choices(field,values){return `<div class="segmented">${values.map(([v,label])=>`<button class="choice ${String(options[field])===String(v)?'selected':''}" data-option="${field}" data-value="${v}" aria-pressed="${String(options[field])===String(v)}">${label}</button>`).join('')}</div>`;}
function selectOption(field,label,values){return `<label class="select-field"><span>${field==='row'?'段':label}</span><select data-select-option="${field}" aria-label="${label}">${values.map(([v,l])=>`<option value="${v}" ${String(options[field])===String(v)?'selected':''}>${l}</option>`).join('')}</select></label>`;}
function stringChoices(random=false){return `<div class="segmented strings">${Object.entries(STRINGS).map(([s,d])=>`<button class="choice string-choice ${options.string===s?'selected':''}" style="--string-color:${preferences.colors?d.color:'#202839'};--string-soft:${preferences.colors?d.soft:'#eef0f5'}" data-option="string" data-value="${s}" aria-pressed="${options.string===s}"><b>${s}</b><span>${d.name}</span></button>`).join('')}${random?`<button class="choice ${options.string==='random'?'selected':''}" data-option="string" data-value="random" aria-pressed="${options.string==='random'}">ランダム</button>`:''}</div>`;}
function field(label,body){return `<fieldset class="field"><legend>${label}</legend>${body}</fieldset>`;}
function pickRow(){const count=lesson.type==='keep12'?6:8;options.resolvedRow=(Number(options.resolvedRow||1)+Math.floor(Math.random()*(count-1)))%count+1;}
function exerciseControls(){
 const t=lesson.type;let fields='';
 if(t==='open')fields=field('弦',stringChoices(true))+selectOption('mode','練習の長さ',[['continuous','4小節を通して弾く'],['step','音の長さを1つずつ体験']])+(options.mode==='step'?'<p class="helper">全音符 → 2分音符 → 4分音符 → 8分音符</p>':selectOption('rhythm','音符',[['whole','全音符 · 4拍'],['half','2分音符 · 2拍'],['quarter','4分音符 · 1拍'],['eighth','8分音符 · 半拍'],['random','ランダム']]));
 else if(t==='heights')fields=selectOption('height','弓の高さ',[['all','7段階を往復'],['1','G'],['2','G＋D'],['3','D'],['4','D＋A'],['5','A'],['6','A＋E'],['7','E']]);
 else if(t==='cross')fields=field('2本の弦',choices('pair',[['GD','G・D'],['DA','D・A'],['AE','A・E']]));
 else if(['reading','reading55'].includes(t))fields=selectOption('problem','問題',Array.from({length:t==='reading'?8:19},(_,i)=>[i+1,`その${i+1}${t==='reading55'?' · p.'+(i<5?72:i<12?73:74):''}`]));
 else if(t==='scale')fields=selectOption('scale','音階',[['GD','ト長調 · G線とD線'],['DA','ニ長調 · D線とA線'],['AE','イ長調 · A線とE線']])+selectOption('fourth','弦の境目',[['4','低い弦の4の指'],['0','高い弦の開放弦']]);
 else if(t==='scale12')fields=selectOption('scale','音階',[['C1','ハ長調 · 1オクターヴ'],['G2','ト長調 · 2オクターヴ']]);
 else if(t==='scale34')fields=selectOption('scale','音階',[['A1','イ長調 · 1オクターヴ'],['E1','ホ長調 · 1オクターヴ'],['A2','イ長調 · 2オクターヴ']]);
 else if(t!=='connect69')fields=field('弦',stringChoices());
 if(t==='application94')fields+=field('指の形',choices('pattern',[['23','2と3'],['12','1と2'],['34','3と4']]));
 if(['fingers34','pairs34','eighth34'].includes(t)&&options.string==='A')fields+=selectOption('variant','A線の並び',[['standard','ラ・シ・ド♯・レ♯・ミ'],['flat','ラ・シ♭・ド・レ・ミ♭']]);
 if(['keep12','application94'].includes(t)){const count=t==='keep12'?6:8;fields+=selectOption('row','練習する段',[...Array.from({length:count},(_,i)=>[i+1,`${i+1}段目`]),['random','ランダム'],...(t==='application94'?[['all','全8段を通す']]:[])]);if(options.row==='random')fields+=`<div class="random-row"><span>今回は ${options.resolvedRow}段目</span><button class="quiet" data-action="anotherRow">別の段へ ↻</button></div>`;}
 return fields;
}
function renderSetup(){
 notes=makeExercise(lesson.type,options);const left=lesson.unit>0,canMic=left||lesson.type==='reading',bars=notes.at(-1).bar+1,preview=notes.filter(n=>n.bar<6),cut=bars>6;
 shell(`<section class="lesson-page setup-page">${lessonHeader(2)}<div class="setup-grid"><div class="exercise-column"><div class="exercise-controls">${exerciseControls()}</div><section class="score-preview" aria-label="選んだ練習の楽譜"><div class="section-line"><h2>${cut?'はじめの6小節':'この練習の楽譜'}</h2><span>${bars}小節</span></div><div class="compact-score">${renderSystems(preview,preferences,Math.ceil(Math.min(bars,6)/2))}</div>${cut?`<button class="quiet full-score-link" data-action="fullScore">全${bars}小節を見る ${icon('arrow')}</button>`:''}</section></div><div class="start-column">${left?field('進め方',choices('mode',[['wait','1音ずつ'],['continuous','テンポで通す']])):''}<div class="audio-options"><div class="tempo-field"><label for="tempoNumber">テンポ</label><div><button class="quiet tempo-step" data-action="slower" aria-label="テンポを5下げる">−</button><input id="tempoNumber" type="number" min="40" max="180" value="${options.bpm}" aria-label="テンポ"><span>BPM</span><button class="quiet tempo-step" data-action="faster" aria-label="テンポを5上げる">＋</button></div><input type="range" id="tempo" min="40" max="180" value="${options.bpm}" aria-label="テンポを調整"></div>${canMic?`<label class="mic-toggle"><span>マイク</span><input type="checkbox" data-mic ${options.mic?'checked':''}></label>`:''}</div>${['reading','reading55'].includes(lesson.type)?'<div class="preview-timer"><span id="previewClock">先に楽譜を眺めよう</span><button class="quiet" data-action="previewTimer">30秒はかる</button></div>':''}<div id="startError" role="alert"></div><button class="primary start-button" data-action="start">${icon('play')}4拍数えて、はじめる</button><p class="start-hint">${options.mode==='wait'?'合った音で次へ。マイクなしなら手送り。':'選んだテンポで、最後まで進みます。'}</p></div></div></section>`);
}
function renderPractice(){
 const p=practice;
 shell(`<section class="performance-viewport" id="performanceViewport"><header class="practice-top"><button class="icon-button" data-action="exitPractice" aria-label="練習選択へ戻る">${icon('back')}</button><div class="practice-title"><h1>${lesson.title}</h1><p>${options.bpm} BPM · ${isWaiting()?'1音ずつ':isOneByOne()?'長さを体験':'テンポで通す'}</p></div><span id="sessionProgress"></span></header><div class="progress"><span id="sessionBar"></span></div><div class="performance-body"><section class="music-panel" id="currentNote"><div class="playing-head"><span id="phaseLabel">準備中</span><span id="barLabel"></span></div><div class="current-and-next"><div class="now-label"><strong id="noteHeading"></strong><span id="stringLabel"></span></div><div class="next-label"><small>次は</small><strong id="nextNote"></strong><span id="nextHint"></span></div></div><div class="score-stage"><div id="noteScore"></div><div id="countdownArea" class="countdown-area" hidden><span>準備</span><strong id="countNumber">1</strong><span>／ 4</span></div></div><div class="timing-row"><div id="durationCopy" class="duration-copy"></div><div class="beat-track" id="beatTrack">${[1,2,3,4].map(b=>`<span class="beat" data-beat="${b}">${b}</span>`).join('')}</div></div><div class="note-progress"><span id="noteProgress"></span></div></section><section class="guidance-panel"><div id="livePattern"></div><p id="coachText" aria-live="polite"></p>${options.mic?'<div class="mic-status"><div class="mic-bar" role="meter" aria-label="マイクの音量" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="micLevel"></span></div><p id="micFeedback" role="status">音を待っています</p></div>':'<p class="listening-label">お手本と、自分の音を聴き比べよう。</p>'}</section></div><footer class="performance-footer"><div class="practice-controls"><button class="secondary" data-action="pause" id="pauseBtn">${icon('pause')}一時停止</button><button class="secondary" data-action="reference" id="referenceBtn">${icon('sound')}お手本</button><button class="primary" data-action="next" id="nextBtn" ${isWaiting()?'':'hidden'}>${options.mic?'次へ':'次の音へ'}${icon('arrow')}</button><button class="primary" data-action="nextStep" id="nextStepBtn" hidden>次の長さへ ${icon('arrow')}</button></div><div class="below-hint"><span>${options.mic?'単音の高さの目安を表示':'採点せず、自分のペースで'}</span><a href="#fullScore">全体の楽譜 ↓</a></div></footer></section><section class="full-score-section" id="fullScore"><div class="section-line"><h2>楽譜を見ながら</h2><span id="scorePageLabel"></span></div><div id="practiceScore"></div><a class="quiet" href="#performanceViewport">演奏画面へ ↑</a></section>`,true);
 updateNote(true);if(p.phase==='starting'){for(const id of ['pauseBtn','referenceBtn','nextBtn'])$('#'+id).disabled=true;}
}
function finishPractice(){cleanup();view='finish';shell(`<section class="finish-page"><div class="finish-mark">${icon('check')}</div><p class="eyebrow">${lesson.title}</p><h1>最後まで、弾けました。</h1><p>同じ練習を繰り返しても、<br>弦や指の形を変えても。</p><button class="primary" data-action="repeat">${icon('play')}もう一度弾く</button><button class="secondary" data-action="setup">弦・段を変える</button><button class="quiet" data-nav="home">教材一覧へ</button></section>`);window.scrollTo(0,0);focusHeading();}
function settingToggle(key,title,description){return `<label class="toggle-row"><span><strong>${title}</strong><small>${description}</small></span><input type="checkbox" data-pref="${key}" ${preferences[key]?'checked':''}></label>`;}
function renderSettings(){shell(`<section class="settings-page"><button class="quiet" data-action="closeSettings">${icon('back')}戻る</button><h1>練習しやすく整える</h1><section><h2>楽譜のヒント</h2>${settingToggle('colors','弦の色','G 青 · D オレンジ · A 赤 · E 緑')}${settingToggle('fingers','指番号','0は開放弦、1〜4は左手の指')}${settingToggle('names','音名・弦名','五線の下のヒントと現在の音名')}</section><section><h2>音とマイク</h2>${settingToggle('reference','お手本の自動再生','マイク使用中は止まります')}${settingToggle('click','拍のクリック','マイク使用中は開始の4拍のみ')}<label class="select-field"><span>マイク感度</span><select id="sensitivity">${[['normal','ふつう'],['high','高め'],['ultra','とても高め']].map(([v,l])=>`<option value="${v}" ${preferences.sensitivity===v?'selected':''}>${l}</option>`).join('')}</select></label></section><details><summary>このアプリについて</summary><p>弦しるべは、開放弦から3つの指の形までを練習するWebアプリです。教本の指定課題を24メニューにまとめました。調号は音ごとの♯・♭で表示します。</p><p>練習履歴は保存しません。音声は端末内で処理し、録音・送信しません。表示と音の設定だけを保存します。</p><p>お手本は合成音です。マイクが見るのは単音の高さの目安で、指の形や姿勢、音色、和音のバランスは判定しません。</p><p>既存版とは別のURL・設定保存領域で動作します。</p><details><summary>楽譜の字形・ライセンス</summary><p>以前の「ふよみ」と同じBravura 1.204の輪郭です。</p><pre>${escapeHTML(BRAVURA_LICENSE)}</pre></details></details>${!storageAvailable?'<p class="error">この環境では設定を保存できません。</p>':''}</section>`);}
function showFullScore(){const dialog=document.createElement('dialog');dialog.className='score-dialog';dialog.innerHTML=`<header><h2>全${notes.at(-1).bar+1}小節の楽譜</h2><button class="quiet" data-action="closeDialog">閉じる ${icon('close')}</button></header><div>${renderSystems(notes,preferences,3)}</div>`;document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();}
async function requestWake(){try{wakeLock=await navigator.wakeLock?.request('screen');}catch{}}
function cleanup(){sessionToken++;cancelAnimationFrame(raf);clearInterval(previewTimer);audio.stop();mic.stop();wakeLock?.release().catch(()=>{});wakeLock=null;practice=null;}
function isWaiting(){return lesson.unit>0&&options.mode==='wait';}
function isOneByOne(){return lesson.type==='open'&&options.mode==='step';}
async function startPractice(){
 clearInterval(previewTimer);const token=++sessionToken;audio.stop();mic.stop();view='practice';
 practice={phase:'starting',index:0,group:-1,baseTime:0,startIndex:0,queue:[],cue:0,acceptedAt:null,hold:null,lastMicAt:0,feedback:'',count:null};
 preferences.bpm=options.bpm;save();renderPractice();window.scrollTo(0,0);
 try{await audio.init();if(token!==sessionToken)return;if(options.mic){const active=await mic.start();if(!active||token!==sessionToken)return;}if(token!==sessionToken)return;await requestWake();if(token!==sessionToken)return;beginTransport(0);}catch(e){if(token!==sessionToken)return;cleanup();view='setup';renderSetup();$('#startError').innerHTML=`<p class="error">${escapeHTML(e.name==='NotAllowedError'?'マイクの許可が得られませんでした。ブラウザの設定で許可するか、マイクなしで進めてください。':e.message)}</p><button class="secondary" data-action="startNoMic">マイクなしで始める</button>`;$('#startError').scrollIntoView({block:'center'});}
}
function beginTransport(index){
 const p=practice;if(!p)return;p.phase='countdown';p.index=index;p.startIndex=index;p.baseTime=audio.time+.12;p.queue=[];p.cue=0;p.count=null;p.acceptedAt=null;p.hold=null;pitchGate.reset();
 const spb=60/options.bpm;for(let i=0;i<4;i++)p.queue.push({at:p.baseTime+i*spb,type:'click',accent:i===0});
 p.musicTime=p.baseTime+4*spb;
 if(!isWaiting()){
  const events=isOneByOne()?[notes[index]]:notes.slice(index),offset=notes[index].start;
  if(preferences.click&&!options.mic){const end=isOneByOne()?notes[index].beats:notes.at(-1).end-offset;for(let b=0;b<end;b++)p.queue.push({at:p.musicTime+b*spb,type:'click',accent:(offset+b)%(notes[0].meter||4)===0});}
  if(preferences.reference&&!options.mic)for(const n of events)if(!n.rest)p.queue.push({at:p.musicTime+(n.start-offset)*spb,type:'note',n});
 }
 p.queue.sort((a,b)=>a.at-b.at);$('#pauseBtn').disabled=false;$('#referenceBtn').disabled=false;$('#nextBtn').disabled=false;$('#pauseBtn').innerHTML=icon('pause')+'一時停止';$('#nextStepBtn').hidden=true;$('#nextBtn').hidden=!isWaiting();updateNote(true);cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function tick(){
 const p=practice;if(!p||!['countdown','playing','stepDone'].includes(p.phase))return;
 const now=audio.time,spb=60/options.bpm;
 while(p.cue<p.queue.length&&p.queue[p.cue].at<now+.12){const cue=p.queue[p.cue++];if(cue.at<now-.15)continue;if(cue.type==='click')audio.click(Math.max(now,cue.at),cue.accent);else playNote(cue.n,Math.max(now,cue.at),cue.n.beats*spb*.94);}
 if(now<p.musicTime){
  const count=Math.min(4,Math.max(1,Math.floor((now-p.baseTime)/spb)+1));if(count!==p.count){p.count=count;$('#countNumber').textContent=count;$('#phaseLabel').textContent='4つ数えたら、はじめよう';$('#countdownArea').hidden=false;$('#noteScore').classList.add('counting');$('#durationCopy').hidden=true;$('#referenceBtn').disabled=true;$('#nextBtn').disabled=true;setBeat(count);}
 }else{
  if(p.phase==='countdown'){p.phase='playing';$('#countdownArea').hidden=true;$('#noteScore').classList.remove('counting');$('#durationCopy').hidden=false;$('#referenceBtn').disabled=false;$('#nextBtn').disabled=false;pitchGate.reset();p.hold=now;updateNote(true);}
  if(p.phase==='playing'){
   let elapsed=isWaiting()?now-p.hold:(now-p.musicTime)/spb;
   if(!isWaiting()){
    const position=elapsed+notes[p.startIndex].start,end=isOneByOne()?notes[p.startIndex].end:notes.at(-1).end;
    if(position>=end){if(isOneByOne()&&p.index<notes.length-1){p.phase='stepDone';audio.stop();$('#phaseLabel').textContent='ひとつ、体験できた';$('#coachText').textContent='準備ができたら、次の音の長さへ。';$('#nextStepBtn').hidden=false;$('#pauseBtn').disabled=true;$('#noteProgress').style.width='100%';}else{finishPractice();return;}}
    else{const index=notes.findIndex(n=>position>=n.start&&position<n.end);if(index>=0&&index!==p.index){p.index=index;p.acceptedAt=null;pitchGate.reset();updateNote(true);}const n=notes[p.index],progress=Math.min(1,(position-n.start)/n.beats);$('#noteProgress').style.width=`${progress*100}%`;setBeat(Math.floor(position)%(n.meter||4)+1);$('#durationCopy').innerHTML=`<strong>${Math.max(0,Math.ceil((n.end-position)*2)/2)}</strong>拍 ${n.rest?'休もう':'音を続けよう'}`;}
   }else{
    const n=notes[p.index];if(n.rest){$('#noteProgress').style.width=`${Math.min(1,elapsed/(n.beats*spb))*100}%`;if(elapsed>=n.beats*spb){advanceNote();return;}}
    else if(p.acceptedAt!==null&&now-p.acceptedAt>.5){advanceNote();return;}
   }
   if(options.mic&&now-p.lastMicAt>.06){p.lastMicAt=now;observeMic(now);}
  }
 }
 if(practice===p)raf=requestAnimationFrame(tick);
}
function setBeat(beat){document.querySelectorAll('[data-beat]').forEach(el=>{el.classList.toggle('on',Number(el.dataset.beat)===beat);el.hidden=practice?.phase==='playing'&&Number(el.dataset.beat)>(notes[0].meter||4);});}
function playNote(n,at=audio.time,duration=.6){if(n.rest)return;const voices=n.chord||[n];voices.forEach(x=>audio.tone(x.midi,duration,at,.65/Math.sqrt(voices.length)));}
function updateNote(force=false){
 const p=practice;if(!p)return;const n=notes[p.index],next=notes[p.index+1],color=n.rest?'#7c8977':preferences.colors?STRINGS[n.string].color:'#263d38',soft=n.rest?'#edf0e5':preferences.colors?STRINGS[n.string].soft:'#edf0e5';
 $('#currentNote').style.setProperty('--note-color',color);$('#currentNote').style.setProperty('--note-soft',soft);
 $('#noteHeading').textContent=n.rest?'休符':n.chord?.length>1?n.chord.map(x=>x.string).join('＋')+'線':n.string+'線'+(preferences.names?'・'+n.name:'');
 $('#stringLabel').textContent=n.rest?'休符':n.finger===0?(n.chord?.length>1?'2本の開放弦を一緒に':'開放弦'):(preferences.fingers?n.finger+' の指':'押さえて弾く');
 $('#noteScore').className='current-score';$('#noteScore').innerHTML=renderScore(notes.filter(z=>z.bar===n.bar),preferences,Math.floor(n.bar/4));$('#durationCopy').innerHTML=isWaiting()&&!n.rest?(options.mic?'音が合うまで、自分のペースで':'弾けたら「次の音へ」'):`<strong>${n.beats===.5?'½':n.beats}</strong>拍 ${n.rest?'休もう':'音を続けよう'}`;
 $('#coachText').textContent=instructionFor(n,notes[p.index-1],lesson.type);$('#livePattern').innerHTML=lesson.unit>0&&!n.rest?patternDiagram(n.pattern,true):'<span class="open-string-hint">'+(n.rest?'次の音の準備を':'左手は押さえない')+'</span>';$('#nextNote').textContent=next?(next.rest?'休み':next.chord?.length>1?next.chord.map(z=>z.string).join('＋'):(preferences.names?next.name:next.string+'線')):'おしまい';$('#nextHint').textContent=next?(next.rest?'弓を止めて、次の準備。':next.string+'線 · '+(preferences.fingers?next.finger+'の指 · ':'')+next.beats+'拍'):'最後の音を、ていねいに。';
 $('#sessionProgress').textContent=`${p.index+1} / ${notes.length}`;$('#sessionBar').style.width=`${p.index/notes.length*100}%`;$('#phaseLabel').textContent=n.rest?'音を止めよう':isWaiting()?'この音を、弾いてみよう':'いま弾く音';$('#barLabel').textContent=`${n.bar+1} 小節目`;$('#noteProgress').style.width='0%';
 const group=Math.floor(n.bar/4);if(group!==p.group||force){p.group=group;$('#practiceScore').innerHTML=renderSystems(notes,preferences,3);$('#scorePageLabel').textContent=`全${notes.at(-1).bar+1}小節 · 今 ${n.bar+1}小節目`;}
 document.querySelectorAll('[data-score-index]').forEach(el=>{el.classList.toggle('active',Number(el.dataset.scoreIndex)===p.index);el.classList.toggle('passed',Number(el.dataset.scoreIndex)<p.index);});
 if($('#micFeedback')){$('#micFeedback').textContent=n.rest?'休符では、音を止めよう。':'音を待っています';$('#micFeedback').classList.remove('ok');p.feedback='';}
 if(isWaiting())setBeat(0);
}
function observeMic(now){
 const p=practice,n=notes[p.index],r=mic.read(preferences.sensitivity),level=Math.min(100,r.rms*3000);
 $('#micLevel').style.width=`${level}%`;$('.mic-bar').setAttribute('aria-valuenow',Math.round(level));
 if(now<audio.silentUntil||now<p.musicTime+.15){pitchGate.reset();feedback('お手本のあと、あなたの音を待っています');return;}
 if(lesson.unit===0){feedback(r.rms>MIC_LEVELS[preferences.sensitivity].minRms?(n.rest?'音が入っています。休符で止めてみよう。':'音を受け取っています'):(n.rest?'休みの静けさを保とう。':'音を待っています'));return;}
 if(n.rest){pitchGate.reset();return;}if(p.acceptedAt!==null)return;
 if(!r.frequency){pitchGate.reset();feedback(r.rms>MIC_LEVELS[preferences.sensitivity].minRms?'音を受け取りました。少し長く弾いてみよう。':'音を待っています');return;}
 const cents=centsFrom(r.frequency,n.midi);
 if(pitchGate.observe(r,n.midi,now*1000)){feedback('いいね。この音に近づけた！',true);if(isWaiting()){p.acceptedAt=now;audio.success();$('#noteProgress').style.width='100%';}}
 else if(Math.abs(cents)<=45)feedback('そのまま、少し音を続けよう。');
 else feedback(n.finger===0?'開放弦の高さを、お手本で確かめよう。':cents>0?'少し低い音を探してみよう。':'少し高い音を探してみよう。');
}
function feedback(message,ok=false){if(practice?.feedback===message)return;practice.feedback=message;$('#micFeedback').textContent=message;$('#micFeedback').classList.toggle('ok',ok);}
function advanceNote(){
 const p=practice;if(!p||p.phase!=='playing'||!isWaiting())return;
 if(p.index>=notes.length-1){finishPractice();return;}p.index++;p.hold=audio.time;p.acceptedAt=null;pitchGate.reset();updateNote(true);cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function pausePractice(){
 const p=practice;if(!p||p.phase==='paused'||p.phase==='starting')return;p.phase='paused';audio.stop();mic.stop();cancelAnimationFrame(raf);pitchGate.reset();wakeLock?.release().catch(()=>{});wakeLock=null;$('#countdownArea').hidden=true;$('#noteScore').classList.remove('counting');$('#durationCopy').hidden=false;$('#phaseLabel').textContent='一時停止';$('#coachText').textContent='再開すると4つ数えて、今の音から始めます。';$('#pauseBtn').innerHTML=icon('play')+'再開する';$('#nextBtn').disabled=true;$('#referenceBtn').disabled=true;$('#nextStepBtn').disabled=true;
}
async function resumePractice(){const p=practice;if(!p||p.phase!=='paused')return;const token=++sessionToken;$('#pauseBtn').disabled=true;try{await audio.init();if(token!==sessionToken)return;if(options.mic){const ok=await mic.start();if(!ok||token!==sessionToken)return;}await requestWake();if(token!==sessionToken)return;$('#nextStepBtn').disabled=false;beginTransport(p.index);}catch(e){if(token!==sessionToken)return;$('#pauseBtn').disabled=false;toast('再開できませんでした。マイクの許可を確認してください。');}}
function previewCount(){clearInterval(previewTimer);let seconds=30;const update=()=>{const el=$('#previewClock');if(!el){clearInterval(previewTimer);return;}el.textContent=seconds>0?`楽譜を見る時間：あと ${seconds} 秒`:'準備できたら「練習をはじめる」を押そう。';if(seconds<=0)clearInterval(previewTimer);seconds--;};update();previewTimer=setInterval(update,1000);}

function rerenderKeepingFocus(el){const selector=el.dataset.option?`[data-option="${el.dataset.option}"][data-value="${el.dataset.value}"]`:el.dataset.selectOption?`[data-select-option="${el.dataset.selectOption}"]`:el.hasAttribute('data-mic')?'[data-mic]':null;renderSetup();if(selector)$(selector)?.focus({preventScroll:true});}
document.addEventListener('click',async event=>{
 const el=event.target.closest('button');if(!el||el.disabled)return;
 if(el.dataset.nav){navigate(el.dataset.nav);return;}
 if(el.hasAttribute('data-chapter')){chapter=Number(el.dataset.chapter);renderHome();window.scrollTo(0,0);focusHeading();return;}
 if(el.dataset.lesson){enterLesson(el.dataset.lesson);return;}
 if(el.dataset.option){clearInterval(previewTimer);options[el.dataset.option]=el.dataset.value;if(el.dataset.option==='mode'&&el.dataset.value==='continuous')options.mic=false;rerenderKeepingFocus(el);return;}
 switch(el.dataset.action){
  case 'allChapters':chapter=null;navigate('home');break;
  case 'chapters':navigate('home');break;
  case 'intro':navigate('intro');break;
  case 'setup':navigate('setup');break;
  case 'settings':settingsReturn=view==='practice'?'setup':view; navigate('settings');break;
  case 'closeSettings':navigate(['home','intro','setup'].includes(settingsReturn)?settingsReturn:'home');break;
  case 'start':await startPractice();break;
  case 'startNoMic':options.mic=false;await startPractice();break;
  case 'pause':if(practice?.phase==='paused')await resumePractice();else pausePractice();break;
  case 'next':advanceNote();break;
  case 'nextStep':if(practice?.phase==='stepDone'){audio.stop();beginTransport(practice.index+1);}break;
  case 'reference':if(practice?.phase==='playing'){pitchGate.reset();playNote(notes[practice.index],audio.time,.8);if($('#micFeedback'))feedback('お手本を聴いてから、弾いてみよう。');}break;
  case 'exitPractice':navigate('setup');break;
  case 'repeat':await startPractice();break;
  case 'previewTimer':previewCount();break;
  case 'anotherRow':pickRow();renderSetup();break;
  case 'slower':case 'faster':options.bpm=Math.min(180,Math.max(40,options.bpm+(el.dataset.action==='faster'?5:-5)));$('#tempo').value=options.bpm;$('#tempoNumber').value=options.bpm;break;
  case 'fullScore':showFullScore();break;
  case 'closeDialog':el.closest('dialog')?.close();break;
 }
});
document.addEventListener('input',event=>{if(['tempo','tempoNumber'].includes(event.target.id)){const value=Number(event.target.value);if(Number.isFinite(value)&&value>=40&&value<=180){options.bpm=value;$('#tempo').value=value;$('#tempoNumber').value=value;}}});
document.addEventListener('change',event=>{const el=event.target;
 if(el.id==='tempoNumber'){options.bpm=Math.round(Math.min(180,Math.max(40,Number(el.value)||60)));el.value=options.bpm;$('#tempo').value=options.bpm;}
 else if(el.dataset.selectOption){clearInterval(previewTimer);options[el.dataset.selectOption]=el.value;if(el.dataset.selectOption==='row'&&el.value==='random')pickRow();if(el.dataset.selectOption==='mode'&&el.value==='continuous')options.mic=false;rerenderKeepingFocus(el);}
 else if(el.dataset.pref){preferences[el.dataset.pref]=el.checked;save();}
 else if(el.id==='sensitivity'){preferences.sensitivity=el.value;save();}
 else if(el.hasAttribute('data-mic')){options.mic=el.checked;rerenderKeepingFocus(el);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&practice&&['playing','countdown','stepDone'].includes(practice.phase))pausePractice();});
window.addEventListener('pagehide',cleanup);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&practice)pausePractice();});
for(const event of ['online','offline'])window.addEventListener(event,()=>{const el=$('.offline-note');if(el)el.hidden=navigator.onLine;});
renderHome();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
