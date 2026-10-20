import {STRINGS,LESSONS,PATTERNS,CHAPTERS,CHAPTER_SUB,FORM_LABELS,chapterItems,commonSteps,lessonPage,normalizeOptions,makeExercise,noteTitle,instructionFor,melodyKeyLabel,melodyAllowsFlat} from './content.mjs';
import {MELODIES} from './repertoire.mjs';
import {AudioEngine,Microphone,MicJudge,AUDIO_CUES,transportStart,MIC_LEVELS} from './engine.mjs';
import {DIFFICULTIES,targetForNote,pitchFeedback} from './intonation.mjs';
import {normalizeStored} from './settings.mjs';
import {escapeHTML,renderScore,renderSystems} from './score.mjs';
import {MicStatusModel,micPanelHTML,paintMicStatus} from './mic-status.mjs';
import {BRAVURA_LICENSE} from './glyphs.mjs';

const ICONS={home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',book:'<path d="M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3zM12 6v15"/>',chart:'<path d="M4 20V10m8 10V4m8 16v-7M2 22h20"/>',settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',back:'<path d="m14 5-7 7 7 7"/>',play:'<path d="m8 4 12 8-12 8z"/>',pause:'<path d="M8 4v16M16 4v16"/>',sound:'<path d="M3 9h4l5-5v16l-5-5H3zM16 8q5 4 0 8m3-11q8 7 0 14"/>',check:'<path d="m5 12 4 4L20 5"/>',spark:'<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8z"/>',mic:'<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'};
const icon=name=>`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.book}</svg>`;
const $=sel=>document.querySelector(sel);
const KEY='violin-shodan-v1';
let storageAvailable=true;
function readStored(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{storageAvailable=false;return {};}}
const stored=normalizeStored(readStored());
let preferences=stored.preferences;
let view='home',lesson=null,options={},notes=[],practice=null,raf=0,sessionToken=0,previewTimer=0,toastTimer=0,wakeLock=null;
const audio=new AudioEngine(),mic=new Microphone(audio),judge=new MicJudge(),micStatus=new MicStatusModel();
function save(){try{localStorage.setItem(KEY,JSON.stringify({preferences,lessonId:lesson?.id||stored.lessonId,options:lesson?options:stored.options}));storageAvailable=true;}catch{storageAvailable=false;toast('このブラウザでは設定を保存できません。');}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
let chapter=null,settingsReturn='home';
function shell(body,performance=false){
 document.body.dataset.view=view;
 $('#app').innerHTML=`${performance?'':`<header class="app-header"><button class="brand" data-nav="home" aria-label="バイオリン初段 教材一覧"><span class="brand-mark" aria-hidden="true">弦</span><span>バイオリン初段<small>VIOLIN PRACTICE</small></span></button><button class="quiet" data-action="settings" aria-label="設定">${icon('settings')}<span>設定</span></button></header>`}<main id="main" class="${performance?'performance-main':'workspace'}">${body}</main><div class="offline-note" ${navigator.onLine?'hidden':''}>オフライン · 保存済みの教材を使用</div>`;
}
function focusHeading(){requestAnimationFrame(()=>{const h=$('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}});}
function navigate(next){cleanup();view=next;render();window.scrollTo(0,0);focusHeading();}
function render(){if(view==='home')renderHome();else if(['addList','varietyList','melodyList'].includes(view))renderSubList(view==='addList'?'add':view==='varietyList'?'variety':'melody');else if(view==='intro')renderIntro();else if(view==='settings')renderSettings();else if(view==='setup')renderSetup();}
function lessonListAction(l=lesson){return l.menu==='add'?'addList':l.menu==='variety'?'varietyList':l.menu==='melody'?'melodyList':'chapters';}
function lessonListLabel(){return lesson.menu==='add'?'指の一覧':lesson.menu==='variety'?'色々な練習':lesson.menu==='melody'?'隣の弦でも形を保つ':'章の一覧';}
function lessonHeader(stage){return `<div class="lesson-toolbar"><button class="quiet" data-action="${stage===1?lessonListAction():'intro'}">${icon('back')}${stage===1?lessonListLabel():'やり方'}</button><ol class="stage-nav" aria-label="練習の流れ"><li ${stage===1?'aria-current="step"':''}>1 やり方</li><li ${stage===2?'aria-current="step"':''}>2 選ぶ</li><li>3 弾く</li></ol></div><div class="lesson-heading"><p class="eyebrow">${CHAPTERS[lesson.unit]}${lessonPage(lesson,options)?' · p.'+lessonPage(lesson,options):''}</p><h1>${lesson.title}</h1></div>`;}
function renderHome(){
 const list=chapter===null?CHAPTERS.map((name,i)=>`<button class="chapter-row" data-chapter="${i}"><span class="index">${String(i+1).padStart(2,'0')}</span><span><strong>${name}</strong><small>${CHAPTER_SUB[i]}</small></span><span class="chevron">›</span></button>`).join(''):chapterItems(chapter).map(l=>`<button class="lesson-row" ${l.children?'data-action="'+lessonListAction(l)+'"':'data-lesson="'+l.id+'"'}><span><strong>${l.title}</strong><small>${l.sub}</small></span><span class="chevron">›</span></button>`).join('');
 shell(`<section class="library"><div class="library-heading">${chapter===null?'<p class="eyebrow">開放弦から、3つの指の形へ</p><h1>何を練習しよう？</h1><p class="muted">まずは、練習したい章をひとつ。</p>':`<button class="quiet" data-action="allChapters">${icon('back')}すべての章</button><h1>${CHAPTERS[chapter]}</h1><p class="muted">${CHAPTER_SUB[chapter]}</p>`}</div><div class="${chapter===null?'chapter-list':'lesson-list'}">${list}</div><footer class="library-foot"><span>8章 · ${LESSONS.length}の練習</span><span>記録を気にせず、何度でも。</span></footer></section>`);
}
function renderSubList(menu){const group=chapterItems(chapter).find(l=>l.children&&l.menu===menu);if(!group){view='home';renderHome();return;}shell(`<section class="library"><div class="library-heading"><button class="quiet" data-action="chapters">${icon('back')}章の一覧</button><p class="eyebrow">${CHAPTERS[chapter]}</p><h1>${group.title}</h1></div><div class="lesson-list">${group.children.map(l=>`<button class="lesson-row" data-lesson="${l.id}"><span><strong>${l.title}</strong><small>${l.sub}</small></span><span class="chevron">›</span></button>`).join('')}</div></section>`);}
function enterLesson(id){cleanup();lesson=LESSONS.find(l=>l.id===id)||LESSONS[0];chapter=lesson.unit;view='intro';const last=normalizeStored(readStored());options=normalizeOptions(lesson,last.lessonId===lesson.id?last.options:{},preferences.bpm);notes=makeExercise(lesson.type,options);save();renderIntro();window.scrollTo(0,0);focusHeading();}
function patternDiagram(pattern,compact=false){const p=pattern==='34low'?'34':pattern,pair=p.split('').join('と');const caption=pattern==='34low'?(lesson?.melodyId?'開放弦と1、3と4が半音':'A線の別の並び · 1も半音低く'):'つながった2本は半音、ほかは全音';return `<div class="pattern-diagram ${compact?'compact':''}" data-pattern="${pattern}"><img src="./assets/pattern-${p}.svg" width="300" height="104" alt="1・2・3・4のうち、${pair}が隣り合う図"><div><strong>${pair}<span>をくっつける</span></strong>${compact?'':`<p>${caption}</p>`}</div></div>`;}
function setupSteps(){return lesson.exercise?commonSteps(lesson.exercise,notes.find(n=>!n.rest).pattern):lesson.steps;}
function renderIntro(){
 const choosePattern=['reading55','application94'].includes(lesson.type),patterns=choosePattern?['23','12','34']:[...new Set(notes.filter(n=>!n.rest).map(n=>n.pattern))],steps=setupSteps();
 shell(`<section class="lesson-page intro-page">${lessonHeader(1)}<div class="intro-grid"><div class="intro-visual ${choosePattern?'pattern-options':''}">${choosePattern?'<h2>くっつける指は、次の画面で選べます</h2>':''}${lesson.unit>0?patterns.map(p=>patternDiagram(p)).join(''):`<div class="intro-staff">${renderScore(notes.filter(n=>n.bar===0),preferences,null)}</div><p>${lesson.type==='heights'?'G → G＋D → D → D＋A → A → A＋E → E':'0は開放弦。左手は押さえません。'}</p>`}</div><div class="intro-copy"><h2>この練習のやり方</h2><ol class="instruction-list">${steps.slice(0,3).map(s=>`<li>${s}</li>`).join('')}</ol>${steps.length>3?`<details><summary>もう少し詳しく</summary>${steps.slice(3).map(s=>`<p>${s}</p>`).join('')}</details>`:''}</div></div><div class="page-action"><p>${choosePattern?(lesson.type==='reading55'?'次に、問題と指の形を選びます。':'次に、弦・型・指の形を選びます。'):lesson.exercise==='keep'?'次に、弦と練習する型を選びます。':'次に、練習の内容を選びます。'}</p><button class="primary" data-action="setup">練習を選ぶ ${icon('arrow')}</button></div></section>`);
}
function choices(field,values){return `<div class="segmented">${values.map(([v,label,ariaLabel])=>`<button class="choice ${String(options[field])===String(v)?'selected':''}" data-option="${field}" data-value="${v}" aria-pressed="${String(options[field])===String(v)}"${ariaLabel?` aria-label="${escapeHTML(ariaLabel)}"`:''}>${label}</button>`).join('')}</div>`;}
function selectOption(field,label,values){return `<label class="select-field"><span>${label}</span><select data-select-option="${field}" aria-label="${label}">${values.map(([v,l])=>`<option value="${v}" ${String(options[field])===String(v)?'selected':''}>${l}</option>`).join('')}</select></label>`;}
function stringChoices(random=false){return `<div class="segmented strings">${Object.entries(STRINGS).map(([s,d])=>`<button class="choice string-choice ${options.string===s?'selected':''}" style="--string-color:${preferences.colors?d.color:'#202839'};--string-soft:${preferences.colors?d.soft:'#eef0f5'}" data-option="string" data-value="${s}" aria-pressed="${options.string===s}"><b>${s}</b><span>${d.name}</span></button>`).join('')}${random?`<button class="choice ${options.string==='random'?'selected':''}" data-option="string" data-value="random" aria-pressed="${options.string==='random'}">ランダム</button>`:''}</div>`;}
function field(label,body){return `<div class="field" role="group" aria-label="${escapeHTML(label)}"><span class="field-title">${label}</span>${body}</div>`;}
function pickRow(another=false){const count=lesson.exercise==='keep'?7:8;options.resolvedRow=another?(Number(options.resolvedRow||1)+Math.floor(Math.random()*(count-1)))%count+1:Math.floor(Math.random()*count)+1;}
function exerciseControls(){
 const t=lesson.type;let fields='';
 if(lesson.melodyId){const melody=MELODIES.find(m=>m.id===lesson.melodyId),name=melodyKeyLabel(melody,options);fields=field('2本の弦',choices('pair',[['GD','G・D'],['DA','D・A'],['AE','A・E']]))+(name?`<small class="melody-key">${escapeHTML(name)}</small>`:'');if(melodyAllowsFlat(melody)&&options.pair==='AE')fields+=selectOption('variant','並び',[['standard','いつもの形'],['flat','シ♭とミ♭の形']]);}
 else if(t==='open')fields=field('弦',stringChoices(true))+selectOption('rhythm','音符',[['whole','全音符 · 4拍'],['half','2分音符 · 2拍'],['quarter','4分音符 · 1拍'],['eighth','8分音符 · 半拍'],['random','ランダム']]);
 else if(t==='heights')fields=selectOption('height','弓の高さ',[['all','7段階を往復'],['1','G'],['2','G＋D'],['3','D'],['4','D＋A'],['5','A'],['6','A＋E'],['7','E']]);
 else if(t==='cross')fields=field('2本の弦',choices('pair',[['GD','G・D'],['DA','D・A'],['AE','A・E']]));
 else if(['reading','reading55'].includes(t))fields=selectOption('problem','問題',Array.from({length:t==='reading'?8:19},(_,i)=>[i+1,`その${i+1}`]));
 else if(t==='scale')fields=selectOption('scale','音階',[['GD','ト長調 · G線とD線'],['DA','ニ長調 · D線とA線'],['AE','イ長調 · A線とE線']])+selectOption('fourth','弦の境目',[['4','低い弦の4の指'],['0','高い弦の開放弦']]);
 else if(t==='scale12')fields=selectOption('scale','音階',[['C1','ハ長調 · 1オクターヴ'],['G2','ト長調 · 2オクターヴ']]);
 else if(t==='scale34')fields=selectOption('scale','音階',[['A1','イ長調 · 1オクターヴ'],['E1','ホ長調 · 1オクターヴ'],['A2','イ長調 · 2オクターヴ']]);
 else fields=field('弦',stringChoices());
 if(['reading55','application94'].includes(t))fields+=field('指の形',choices('pattern',['23','12','34'].map(p=>[p,p.split('').join('と'),PATTERNS[p].label])));
 if(lesson.pattern==='34'&&options.string==='A')fields+=selectOption('variant','A線の並び',[['standard','ラ・シ・ド♯・レ♯・ミ'],['flat','ラ・シ♭・ド・レ・ミ♭']]);
 if(lesson.exercise==='keep'||t==='application94'){const count=lesson.exercise==='keep'?7:8;fields+=selectOption('row','練習する型',[...Array.from({length:count},(_,i)=>[i+1,FORM_LABELS[i]]),['random','ランダム'],...(t==='application94'?[['all','①〜⑧を通す']]:[])]);if(options.row==='random')fields+=`<div class="random-row"><span>今回は ${FORM_LABELS[options.resolvedRow-1]}</span><button class="quiet" data-action="anotherRow">別の型へ ↻</button></div>`;}
 return fields;
}
function renderSetup(){
 options=normalizeOptions(lesson,options,preferences.bpm);notes=makeExercise(lesson.type,options);save();const canMic=lesson.type!=='heights',bars=notes.at(-1).bar+1,preview=notes.filter(n=>n.bar<6),cut=bars>6;
 shell(`<section class="lesson-page setup-page${lesson.type==='reading55'?' reading55-setup':''}">${lessonHeader(2)}<div class="setup-grid"><div class="exercise-column"><div class="exercise-controls">${exerciseControls()}</div><section class="score-preview" aria-label="選んだ練習の楽譜"><div class="section-line"><h2>${cut?'はじめの6小節':'この練習の楽譜'}</h2></div><div class="compact-score">${renderSystems(preview,preferences,Math.ceil(Math.min(bars,6)/2),{minWidth:380,compact:true})}</div>${cut?`<button class="quiet full-score-link" data-action="fullScore">全${bars}小節を見る ${icon('arrow')}</button>`:''}</section></div><div class="start-column">${field('進め方',choices('mode',[['wait','1音ずつ'],['continuous','テンポで通す']]))}<div class="audio-options"><div class="tempo-field"><label for="tempoNumber">テンポ</label><div><button class="quiet tempo-step" data-action="slower" aria-label="テンポを5下げる">−</button><input id="tempoNumber" type="number" min="40" max="180" value="${options.bpm}" aria-label="テンポ"><span>BPM</span><button class="quiet tempo-step" data-action="faster" aria-label="テンポを5上げる">＋</button></div><input type="range" id="tempo" min="40" max="180" value="${options.bpm}" aria-label="テンポを調整"></div>${canMic?`<label class="mic-toggle"><span>マイク</span><input type="checkbox" data-mic ${options.mic?'checked':''}></label>`:''}</div>${['reading','reading55'].includes(lesson.type)?'<div class="preview-timer"><span id="previewClock">先に楽譜を眺めよう</span><button class="quiet" data-action="previewTimer">30秒はかる</button></div>':''}<div id="startError" role="alert"></div><button class="primary start-button" data-action="start">${icon('play')}${isWaiting()?'練習をはじめる':'4拍数えて、はじめる'}</button><p class="start-hint">${isWaiting()?'すぐ最初の音を待ちます。マイクなしなら手送り。':'選んだテンポで、最後まで進みます。'}</p></div></div></section>`);
}
function renderPractice(){
 const p=practice;
 shell(`<section class="performance-viewport ${options.mic?'with-mic':''}" id="performanceViewport"><header class="practice-top"><button class="icon-button" data-action="exitPractice" aria-label="準備画面へ戻る">${icon('back')}</button><div class="practice-title"><h1>${lesson.title}</h1><p>${options.bpm} BPM（四分音符） · ${isWaiting()?'1音ずつ':'テンポで通す'}</p></div><span id="sessionProgress"></span></header><div class="progress"><span id="sessionBar"></span></div><div class="performance-body"><section class="music-panel" id="currentNote"><div class="playing-head"><span id="phaseLabel">準備中</span><span id="barLabel"></span></div><div class="current-and-next"><div class="now-label"><strong id="noteHeading"></strong><span id="stringLabel"></span></div><div class="next-label"><small>次は</small><strong id="nextNote"></strong><span id="nextHint"></span></div></div><div class="score-stage"><div id="noteScore"></div><div id="countdownArea" class="countdown-area" hidden><span>準備</span><strong id="countNumber">1</strong><span>／ 4</span></div></div><div class="timing-row"><div id="durationCopy" class="duration-copy"></div><div class="beat-track" id="beatTrack">${[1,2,3,4].map(b=>`<span class="beat" data-beat="${b}">${b}</span>`).join('')}</div></div><div class="note-progress"><span id="noteProgress"></span></div></section><section class="guidance-panel"><div id="livePattern"></div><p id="coachText" aria-live="polite"></p>${options.mic?renderMeter():'<p class="listening-label">お手本と、自分の音を聴き比べよう。</p>'}</section></div><footer class="performance-footer"><div class="practice-controls"><button class="secondary" data-action="pause" id="pauseBtn">${icon('pause')}一時停止</button><button class="secondary" data-action="reference" id="referenceBtn">${icon('sound')}お手本</button><button class="primary" data-action="next" id="nextBtn" ${isWaiting()?'':'hidden'}>${options.mic?'手送り':'次の音へ'}${icon('arrow')}</button></div><div class="below-hint"><span>${options.mic?'A='+preferences.a4+' · ±'+DIFFICULTIES[preferences.difficulty]+'¢':'マイクなし・手送りかテンポ'}</span><a href="#fullScore">全体の楽譜 ↓</a></div></footer></section><section class="full-score-section" id="fullScore"><div class="section-line"><h2>楽譜を見ながら</h2><span id="scorePageLabel"></span></div><div id="practiceScore"></div><a class="quiet" href="#performanceViewport">演奏画面へ ↑</a></section>`,true);
 updateNote(true);paintMic();if(p.phase==='starting'){$('#phaseLabel').textContent=options.mic?'マイクを準備しています':'準備中';for(const id of ['pauseBtn','referenceBtn','nextBtn'])$('#'+id).disabled=true;}
}
function finishPractice(){const completed=options.mic&&notes.filter(n=>!n.rest).every(n=>practice.passed.has(n.index));cleanup();if(completed)audio.complete();view='finish';shell(`<section class="finish-page"><div class="finish-mark">${icon('check')}</div><p class="eyebrow">${lesson.title}</p><h1>${completed?'すべての音が合いました。':'最後まで進みました。'}</h1><p>同じ練習を繰り返すか、<br>弦や指の形を変えられます。</p><button class="primary" data-action="repeat">${icon('play')}もう一度弾く</button><button class="secondary" data-action="setup">練習を選ぶ</button><button class="quiet" data-action="${lessonListAction()}">${lessonListLabel()}へ</button></section>`);window.scrollTo(0,0);focusHeading();}
function settingToggle(key,title,description){return `<label class="toggle-row"><span><strong>${title}</strong><small>${description}</small></span><input type="checkbox" data-pref="${key}" ${preferences[key]?'checked':''}></label>`;}
function renderSettings(){shell(`<section class="settings-page"><button class="quiet" data-action="closeSettings">${icon('back')}戻る</button><h1>設定</h1><section><h2>楽譜のヒント</h2>${settingToggle('colors','弦の色','G 青 · D オレンジ · A 赤 · E 緑')}${settingToggle('fingers','指番号','0は開放弦、1〜4は左手の指')}${settingToggle('names','音名・弦名','五線の下のヒントと現在の音名')}</section><section><h2>音とマイク</h2>${settingToggle('reference','お手本の自動再生','マイク使用中は止まります')}${settingToggle('click','拍のクリック','テンポで通すときだけ鳴ります')}${settingToggle('correctTone','合ったときの音','合ったら、その音の高さを短く鳴らします')}${settingToggle('correctionTone','外れたときの正しい音','外れた音が続くと、正しい高さを1秒鳴らします')}<label class="select-field"><span>マイク感度</span><select id="sensitivity">${[['normal','ふつう'],['high','高め'],['ultra','とても高め']].map(([v,l])=>`<option value="${v}" ${preferences.sensitivity===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="select-field"><span>合格範囲</span><select id="difficulty">${[['easy','緩め · ±15¢'],['normal','普通 · ±8¢'],['strict','厳しめ · ±5¢']].map(([v,l])=>`<option value="${v}" ${preferences.difficulty===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="select-field"><span>基準のラ</span><select id="a4">${[442,440].map(v=>`<option value="${v}" ${preferences.a4===v?'selected':''}>A=${v} Hz</option>`).join('')}</select></label><p class="helper">セントは半音を100に分けた単位です。中央の目標に合わせます。</p></section><details><summary>このアプリについて</summary><p>バイオリン初段は、開放弦から3つの指の形までを練習するWebアプリです。8章で、同じ指順を3つの形で練習します。調号は音ごとの♯・♭で表示します。</p><p>練習履歴は保存しません。音声は端末内で処理し、録音・送信しません。最後に選んだ練習と、表示・音の設定だけを保存します。</p><p>マイクは単音の音程を判定します。合うとその音の高さを短く、範囲外で音が落ち着くと正しい高さを1秒鳴らします。どちらも設定で止められます。音が鳴ったあとは、いったん弓を止めてから弾き直します。姿勢・音色・和音は判定しません。お手本は合成音です。</p><p>既存版とは別のURL・設定保存領域で動作します。</p><details><summary>楽譜の字形・ライセンス</summary><p>以前の「ふよみ」と同じBravura 1.204の輪郭です。</p><pre>${escapeHTML(BRAVURA_LICENSE)}</pre></details></details>${!storageAvailable?'<p class="error">この環境では設定を保存できません。</p>':''}</section>`);}
function showFullScore(){const dialog=document.createElement('dialog');dialog.className='score-dialog';dialog.innerHTML=`<header><h2>全${notes.at(-1).bar+1}小節の楽譜</h2><button class="quiet" data-action="closeDialog">閉じる ${icon('close')}</button></header><div>${renderSystems(notes,preferences,3)}</div>`;document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();}
async function requestWake(){try{wakeLock=await navigator.wakeLock?.request('screen');}catch{}}
function cleanup(){sessionToken++;cancelAnimationFrame(raf);clearInterval(previewTimer);audio.stop();mic.stop();wakeLock?.release().catch(()=>{});wakeLock=null;practice=null;}
function isWaiting(){return options.mic||options.mode==='wait';}
async function startPractice(){
 clearInterval(previewTimer);const token=++sessionToken;audio.stop();mic.stop();view='practice';
 judge.reset();micStatus.reset();if(options.mic&&audio.silentUntil>audio.time)judge.block('success',performance.now(),0);practice={passed:new Set(),phase:'starting',index:0,group:-1,baseTime:0,startIndex:0,queue:[],cue:0,acceptedAt:null,hold:null,lastMicAt:-Infinity,lastEnsureAt:-Infinity,recovering:false,recoveryFailed:false,reading:null,pausedReason:null,feedback:'',count:null};
 preferences.bpm=options.bpm;save();renderPractice();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);window.scrollTo(0,0);
 try{await audio.init();if(token!==sessionToken)return;if(options.mic){const active=await mic.start();if(token!==sessionToken)return;if(!active)throw new Error('マイクを開始できませんでした。');}if(token!==sessionToken)return;await requestWake();if(token!==sessionToken)return;beginTransport(0);}catch(e){if(token!==sessionToken)return;cleanup();view='setup';renderSetup();$('#startError').innerHTML=`<p class="error">${escapeHTML(e.name==='NotAllowedError'?'マイクの許可が得られませんでした。ブラウザの設定で許可するか、マイクなしで進めてください。':e.message)}</p><button class="secondary" data-action="startNoMic">マイクなしで始める</button>`;$('#startError').scrollIntoView({block:'center'});}
}
function beginTransport(index){
 const p=practice;if(!p)return;const plan=transportStart(options.mode,options.mic);p.phase=plan.phase;p.pausedReason=null;p.index=index;p.startIndex=index;p.baseTime=audio.time+(plan.counts ? .12 : 0);p.queue=[];p.cue=0;p.count=null;p.acceptedAt=null;judge.nextNote();
 const spb=60/options.bpm;for(let i=0;i<plan.counts;i++)p.queue.push({at:p.baseTime+i*spb,type:'click',accent:i===0});
 p.musicTime=p.baseTime+plan.counts*spb;p.hold=p.musicTime;
 if(!isWaiting()){
  const events=notes.slice(index),offset=notes[index].start;
  if(preferences.click&&!options.mic)for(let b=0;b<notes.at(-1).end-offset;b++)p.queue.push({at:p.musicTime+b*spb,type:'click',accent:(offset+b)%4===0});
  if(preferences.reference&&!options.mic)for(const n of events)if(!n.rest)p.queue.push({at:p.musicTime+(n.start-offset)*spb,type:'note',n});
 }
 p.queue.sort((a,b)=>a.at-b.at);$('#performanceViewport').dataset.phase=p.phase;$('#pauseBtn').disabled=false;$('#referenceBtn').disabled=false;$('#nextBtn').disabled=false;$('#pauseBtn').innerHTML=icon('pause')+'一時停止';$('#nextBtn').hidden=!isWaiting();updateNote(true);cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function tick(){
 const p=practice;if(!p)return;
 const nowMs=performance.now();if(options.mic){paintMic(nowMs);if(audio.ctx&&audio.state!=='running'&&nowMs-p.lastEnsureAt>=1000){p.lastEnsureAt=nowMs;void audio.ensureRunning();}}
 if(!['countdown','playing'].includes(p.phase)||(options.mic&&audio.state!=='running')){if(options.mic)raf=requestAnimationFrame(tick);return;}
 const now=audio.time,spb=60/options.bpm;
 while(p.cue<p.queue.length&&p.queue[p.cue].at<now+.12){const cue=p.queue[p.cue++];if(cue.at<now-.15)continue;if(cue.type==='click')audio.click(Math.max(now,cue.at),cue.accent);else playNote(cue.n,Math.max(now,cue.at),cue.n.beats*spb*.94);}
 if(now<p.musicTime){
  const count=Math.min(4,Math.max(1,Math.floor((now-p.baseTime)/spb)+1));if(count!==p.count){p.count=count;$('#countNumber').textContent=count;$('#phaseLabel').textContent='4つ数えたら、はじめよう';$('#countdownArea').hidden=false;$('#noteScore').classList.add('counting');$('#durationCopy').hidden=true;$('#referenceBtn').disabled=true;$('#nextBtn').disabled=true;setBeat(count);}
 }else{
  if(p.phase==='countdown'){p.phase='playing';$('#performanceViewport').dataset.phase='playing';$('#countdownArea').hidden=true;$('#noteScore').classList.remove('counting');$('#durationCopy').hidden=false;$('#referenceBtn').disabled=false;$('#nextBtn').disabled=false;judge.nextNote();p.hold=now;updateNote(true);}
  if(p.phase==='playing'){
   let elapsed=isWaiting()?now-p.hold:(now-p.musicTime)/spb;
   if(!isWaiting()){
    const position=elapsed+notes[p.startIndex].start,end=notes.at(-1).end;
    if(position>=end){finishPractice();return;}
    else{const index=notes.findIndex(n=>position>=n.start&&position<n.end);if(index>=0&&index!==p.index){p.index=index;p.acceptedAt=null;judge.nextNote();updateNote(true);}const n=notes[p.index],progress=Math.min(1,(position-n.start)/n.beats);$('#noteProgress').style.width=`${progress*100}%`;setBeat(Math.floor(position)%(n.meter||4)+1);$('#durationCopy').innerHTML=`<strong>${Math.max(0,Math.ceil((n.end-position)*2)/2)}</strong>拍 ${n.rest?'休もう':'音を続けよう'}`;}
   }else{
    const n=notes[p.index];if(n.rest){$('#noteProgress').style.width=`${Math.min(1,elapsed/(n.beats*spb))*100}%`;if(elapsed>=n.beats*spb){advanceNote();return;}}
    else if(p.acceptedAt!==null&&now-p.acceptedAt>.5){advanceNote();return;}
   }
   if(options.mic&&nowMs-p.lastMicAt>=60){p.lastMicAt=nowMs;observeMic(nowMs);}
  }
 }
 if(practice===p)raf=requestAnimationFrame(tick);
}
function setBeat(beat){document.querySelectorAll('[data-beat]').forEach(el=>{el.classList.toggle('on',Number(el.dataset.beat)===beat);el.hidden=practice?.phase==='playing'&&Number(el.dataset.beat)>(notes[0].meter||4);});}
function playNote(n,at=audio.time,duration=AUDIO_CUES.reference.duration){if(n.rest)return;const voices=n.chord||[n];voices.forEach(x=>audio.toneHz(targetForNote(x,preferences).targetHz,duration,at,AUDIO_CUES.reference.volume/Math.sqrt(voices.length)));}
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
 if($('#micFeedback')){feedback(options.mic?(n.rest?'休符では音を止めます':''):(n.rest?'休符では、音を止めよう。':'音を待っています'));}
 if(isWaiting())setBeat(Math.floor(n.start)%4+1);if(options.mic){updateMeter(null,n);paintMic();}
}
function renderMeter(){return micPanelHTML();}
function updateMeter(reading,n,muted=false){
 const range=targetForNote(n,preferences),meter=$('#pitchMeter');if(!meter)return;
 const low=range?.lowCents??-DIFFICULTIES[preferences.difficulty],high=range?.highCents??DIFFICULTIES[preferences.difficulty];$('#pitchBand').style.left=(50+low)+'%';$('#pitchBand').style.width=(high-low)+'%';meter.dataset.low=low;meter.dataset.high=high;
 $('.pitch-meter').dataset.muted=String(muted);const valid=range&&reading?.frequency&&!muted;
 $('#pitchNeedle').hidden=!valid;
 if(!valid){$('#pitchDirection').textContent='';$('#pitchCents').textContent='— ¢';meter.dataset.direction='';feedback(n.rest?'休符では音を止めます':'');return;}
 const value=pitchFeedback(reading.frequency,n,range,preferences.a4);
 $('#pitchNeedle').style.left=(50+value.position)+'%';$('#pitchDirection').textContent=value.centsText?value.direction:'';$('#pitchCents').textContent=value.centsText;meter.setAttribute('aria-valuenow',value.position.toFixed(1));meter.dataset.direction=value.direction;feedback(value.text);return value;
}
function paintMic(nowMs=performance.now()){
 const p=practice;if(!p||!options.mic)return;const r=p.reading||{rms:0,frequency:null,confidence:0},cfg=MIC_LEVELS[preferences.sensitivity];
 p.micView=micStatus.update({judgeState:judge.state,cueKind:judge.cueKind,cueDirection:judge.cueDirection,rms:r.rms,soundPresent:r.rms>=cfg.minRms,validPitch:!!r.frequency&&r.rms>=cfg.minRms&&r.confidence>=cfg.confidence,ctxState:audio.ctx?audio.state:'running',micHealth:p.recoveryFailed?'ended':mic.health,phase:p.phase,pausedReason:p.pausedReason,nowMs,cueStartMs:judge.cueStart,cueEndMs:judge.soundEnd});paintMicStatus(document,p.micView);$('#pitchMeter').setAttribute('aria-valuetext',p.micView.title);
 $('#nextBtn').disabled=p.phase!=='playing';$('#referenceBtn').disabled=p.phase!=='playing'||nowMs<judge.soundEnd;const muted=p.micView.tone!=='live';$('.pitch-meter').dataset.muted=String(muted);if(muted){feedback(notes[p.index]?.rest?'休符では音を止めます':'');$('#pitchNeedle').hidden=true;$('#pitchDirection').textContent='';$('#pitchCents').textContent='— ¢';}
}
async function recoverMic(){
 const p=practice;if(!p||!options.mic)return;await audio.ensureRunning();if(practice!==p||p.recovering||!['playing','countdown'].includes(p.phase))return;
 if(p.recoveryFailed||['ended','off'].includes(mic.health)||p.micView?.key==='noInput'){p.recovering=true;try{const active=await mic.restart();if(practice===p){if(!active)throw new Error('マイクを開始できませんでした。');p.recoveryFailed=false;p.reading=null;micStatus.reset();judge.nextNote();}}catch(e){if(practice===p){p.recoveryFailed=true;toast(e.message);}}finally{p.recovering=false;}}
 if(practice===p)paintMic();
}
function observeMic(nowMs=performance.now()){
 const p=practice;if(!p||p.phase!=='playing')return;const n=notes[p.index],r=mic.read(preferences.sensitivity),level=Math.min(100,r.rms*3000);p.reading=r;
 $('#micLevel').style.width=`${level}%`;$('.mic-bar').setAttribute('aria-valuenow',Math.round(level));
 if(audio.state!=='running'||mic.health!=='live'){paintMic(nowMs);return;}
 if(n.rest){if(judge.state!=='listening')judge.observe(r,null,nowMs,preferences.sensitivity);judge.nextNote();$('#performanceViewport').dataset.micState=judge.state;updateMeter(null,n);feedback('休符では音を止めます');paintMic(nowMs);return;}
 const range=targetForNote(n,preferences),result=judge.observe(r,range,nowMs,preferences.sensitivity,{correct:preferences.correctTone,correction:preferences.correctionTone});
 $('#performanceViewport').dataset.micState=judge.state;$('#nextBtn').disabled=false;$('#referenceBtn').disabled=nowMs<judge.soundEnd;
 if(result==='correct'){updateMeter(r,n);p.passed.add(n.index);p.acceptedAt=audio.time;if(preferences.correctTone)audio.success();feedback('ちょうど。次の音へ進みます',true);$('#noteProgress').style.width='100%';}
 else if(result==='wrong'){updateMeter(r,n);audio.correction(range.targetHz);}
 else{const valid=r.rms>=MIC_LEVELS[preferences.sensitivity].minRms&&r.confidence>=MIC_LEVELS[preferences.sensitivity].confidence;if(p.acceptedAt===null||!r.frequency||!valid)updateMeter(valid?r:null,n,judge.state!=='listening');}
 paintMic(nowMs);
}
function feedback(message,ok=false){if(practice?.feedback===message)return;practice.feedback=message;$('#micFeedback').textContent=message;$('#micFeedback').classList.toggle('ok',ok);}
function advanceNote(){
 const p=practice;if(!p||p.phase!=='playing'||!isWaiting())return;
 audio.stop();if(options.mic)judge.cutCue(performance.now());
 if(p.index>=notes.length-1){finishPractice();return;}p.index++;p.hold=audio.time;p.acceptedAt=null;judge.nextNote();updateNote(true);cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function pausePractice(reason='paused'){
 const p=practice;if(!p||p.phase==='paused'||p.phase==='starting')return;p.phase='paused';p.pausedReason=reason;$('#performanceViewport').dataset.phase='paused';audio.stop();mic.stop();cancelAnimationFrame(raf);judge.nextNote();wakeLock?.release().catch(()=>{});wakeLock=null;$('#countdownArea').hidden=true;$('#noteScore').classList.remove('counting');$('#durationCopy').hidden=false;$('#phaseLabel').textContent='一時停止';$('#coachText').textContent=isWaiting()?'再開すると、すぐ今の音から始めます。':'再開すると、4拍数えて今の音から始めます。';$('#pauseBtn').innerHTML=icon('play')+'再開する';$('#nextBtn').disabled=true;$('#referenceBtn').disabled=true;paintMic();raf=requestAnimationFrame(tick);
}
async function resumePractice(){const p=practice;if(!p||p.phase!=='paused')return;const token=++sessionToken;$('#pauseBtn').disabled=true;try{await audio.init();if(token!==sessionToken)return;if(options.mic){const ok=await mic.start();if(token!==sessionToken)return;if(!ok)throw new Error('マイクを開始できませんでした。');}await requestWake();if(token!==sessionToken)return;beginTransport(p.index);}catch(e){if(token!==sessionToken)return;$('#pauseBtn').disabled=false;toast('再開できませんでした。マイクの許可を確認してください。');}}
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
  case 'addList':case 'varietyList':case 'melodyList':navigate(el.dataset.action);break;
  case 'intro':navigate('intro');break;
  case 'setup':navigate('setup');break;
  case 'settings':settingsReturn=view==='practice'?'setup':view; navigate('settings');break;
  case 'closeSettings':navigate(['home','addList','varietyList','melodyList','intro','setup'].includes(settingsReturn)?settingsReturn:'home');break;
  case 'start':await startPractice();break;
  case 'startNoMic':options.mic=false;await startPractice();break;
  case 'pause':if(practice?.phase==='paused')await resumePractice();else pausePractice();break;
  case 'next':advanceNote();break;
  case 'micRecover':await recoverMic();break;
  case 'reference':if(practice?.phase==='playing'&&!notes[practice.index].rest&&(!options.mic||performance.now()>=judge.soundEnd)){if(options.mic)judge.block('reference',performance.now());else judge.nextNote();playNote(notes[practice.index]);if(options.mic){$('#referenceBtn').disabled=true;paintMic();}}break;
  case 'exitPractice':navigate('setup');break;
  case 'repeat':await startPractice();break;
  case 'previewTimer':previewCount();break;
  case 'anotherRow':pickRow(true);renderSetup();break;
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
 else if(el.id==='difficulty'){preferences.difficulty=el.value;save();}
 else if(el.id==='a4'){preferences.a4=Number(el.value);save();}
 else if(el.hasAttribute('data-mic')){options.mic=el.checked;if(options.mic)options.mode='wait';rerenderKeepingFocus(el);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&practice&&['playing','countdown'].includes(practice.phase))pausePractice('hidden');else if(!document.hidden&&practice)void audio.ensureRunning();});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{if(practice)void recoverMic();});
window.addEventListener('pagehide',cleanup);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&practice)pausePractice();});
for(const event of ['online','offline'])window.addEventListener(event,()=>{const el=$('.offline-note');if(el)el.hidden=navigator.onLine;});
renderHome();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
