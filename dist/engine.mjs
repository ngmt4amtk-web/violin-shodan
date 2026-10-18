import {etFreq,centsBetween} from './intonation.mjs';
export const frequencyFor=(midi,a4=442)=>etFreq(midi,a4);
export const centsFrom=(frequency,midi,a4=442)=>centsBetween(frequency,frequencyFor(midi,a4));
// 音量の感度と音程の許容幅は分離。半音違いを合格にしない。
export const MIC_LEVELS={normal:{minRms:.003,confidence:.8},high:{minRms:.001,confidence:.72},ultra:{minRms:.0005,confidence:.65}};
export class PitchDetector{
 constructor(rate){this.rate=rate/2;this.x=new Float32Array(2048);this.maxTau=Math.ceil(this.rate/85);this.diff=new Float32Array(this.maxTau+2);}
 detect(input,level='high'){
  const cfg=MIC_LEVELS[level]||MIC_LEVELS.high,x=this.x,size=Math.min(x.length,Math.floor(input.length/2));let mean=0;
  for(let i=0;i<size;i++){x[i]=(input[2*i]+input[2*i+1])/2;mean+=x[i];}mean/=size;
  let power=0;for(let i=0;i<size;i++){x[i]-=mean;power+=x[i]*x[i];}
  const rms=Math.sqrt(power/size);if(rms<cfg.minRms)return {rms,frequency:null,confidence:0};
  const d=this.diff,n=size-this.maxTau-1;let sum=0;d[0]=1;
  for(let t=1;t<=this.maxTau+1;t++){let v=0;for(let i=0;i<n;i++){const delta=x[i]-x[i+t];v+=delta*delta;}sum+=v;d[t]=sum?v*t/sum:1;}
  let best=-1;const min=Math.floor(this.rate/2400);
  for(let t=min;t<=this.maxTau;t++)if(d[t]<=d[t-1]&&d[t]<d[t+1]){if(best<0||d[t]<d[best])best=t;if(d[t]<.15){best=t;break;}}
  if(best<0||1-d[best]<cfg.confidence)return {rms,frequency:null,confidence:0};
  const interpolate=t=>{const den=2*(2*d[t]-d[t-1]-d[t+1]),shift=den?(d[t+1]-d[t-1])/den:0;return t+Math.max(-1,Math.min(1,shift));};
  let period=interpolate(best);const multiple=Math.min(4,Math.floor((this.maxTau-2)/period));
  // 高音の短い周期では1標本の丸め誤差が大きい。最初の周期を保ち、2〜4周期先で補間する。
  if(multiple>=2){const center=Math.round(period*multiple);let refined=center;for(let t=Math.max(2,center-2);t<=Math.min(this.maxTau,center+2);t++)if(d[t]<d[refined])refined=t;if(d[refined]<d[best]+.05)period=interpolate(refined)/multiple;}
  return {rms,frequency:this.rate/period,confidence:1-d[best]};
 }
}
export class StablePitchGate{
 constructor(){this.reset();}
 reset(){this.since=null;this.last=null;}
 observe(reading,range,ms){
  const ok=reading.frequency&&reading.frequency>=range.loHz-1e-9&&reading.frequency<=range.hiHz+1e-9;
  if(!ok){this.reset();return false;}
  if(this.last===null||ms-this.last>180)this.since=ms;
  this.last=ms;return ms-this.since>=320;
 }
}
// 再生時間・残響・無音を別状態にする。無音は残響が終わってから180ms必要。
// success・correctionは倍音の多い音で別経路から鳴らす（マイク使用中のスマホでも聞こえる大きさ）。volumeはその経路での最大振幅。
export const AUDIO_CUES={reference:{duration:.8,volume:.65},correction:{duration:1,volume:.85},success:{duration:.45,volume:.6},complete:{duration:.54,volume:.25},tail:.35,silenceMs:180};
export class MicJudge{
 constructor(){this.gate=new StablePitchGate();this.reset();}
 reset(){this.state='listening';this.soundEnd=0;this.blockedUntil=0;this.quietSince=null;this.nextNote();}
 nextNote(){this.gate.reset();this.samples=[];this.last=null;}
 block(kind,ms,duration=AUDIO_CUES[kind]?.duration??0){this.state=kind;this.soundEnd=ms+duration*1000;this.blockedUntil=this.soundEnd+AUDIO_CUES.tail*1000;this.quietSince=null;this.nextNote();}
 observe(reading,range,ms,level='high',sounds={}){
  const cfg=MIC_LEVELS[level]||MIC_LEVELS.high,quiet=reading.rms<cfg.minRms;
  if(this.state!=='listening'){
   if(ms<this.soundEnd)return null;
   if(ms<this.blockedUntil){this.state='tail';return null;}
   this.state='awaitSilence';
   if(quiet){if(this.quietSince===null)this.quietSince=ms;if(ms-this.quietSince>=AUDIO_CUES.silenceMs){this.state='listening';this.nextNote();}}else this.quietSince=null;
   return null;
  }
  if(quiet||!reading.frequency||reading.confidence<cfg.confidence){this.nextNote();return null;}
  if(this.last!==null&&ms-this.last>180)this.nextNote();this.last=ms;
  if(this.gate.observe(reading,range,ms)){this.block('success',ms,sounds.correct===false?0:AUDIO_CUES.success.duration);return 'correct';}
  const cents=centsBetween(reading.frequency,range.targetHz);
  if(cents>=range.lowCents&&cents<=range.highCents){this.samples=[];return null;}
  this.samples.push({ms,cents});while(this.samples.length>1&&this.samples[1].ms<=ms-650)this.samples.shift();
  const values=this.samples.map(x=>x.cents),stable=Math.max(...values)-Math.min(...values)<=12,sameSide=values.every(c=>c<range.lowCents)||values.every(c=>c>range.highCents);
  if(stable&&sameSide&&ms-this.samples[0].ms>=650){if(sounds.correction===false){this.samples=[];return null;}this.block('correction',ms);return 'wrong';}
  return null;
 }
}
export function transportStart(mode,mic){const counts=!mic&&mode==='continuous'?4:0;return {phase:counts?'countdown':'playing',counts};}
export class AudioEngine{
 constructor(){this.ctx=null;this.nodes=new Set();this.silentUntil=0;}
 async init(){if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error('このブラウザは音の再生に対応していません。SafariまたはChromeで開いてください。');try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.18;this.master.connect(this.ctx.destination);this.cue=this.ctx.createGain();this.cue.gain.value=1;this.cue.connect(this.ctx.destination);this.bright=this.ctx.createPeriodicWave(new Float32Array(8),new Float32Array([0,1,.7,.45,.3,.2,.12,.08]));}await this.ctx.resume();return this.ctx;}
 get time(){return this.ctx?.currentTime||0;}
 tone(midi,duration=.5,at=this.time,volume=.6){return this.toneHz(frequencyFor(midi),duration,at,volume);}
 toneHz(frequency,duration=.5,at=this.time,volume=.6,wave='triangle'){
  if(!this.ctx)return;
  const o=this.ctx.createOscillator(),g=this.ctx.createGain(),bright=wave==='bright'&&this.bright,cue=wave==='bright'||wave==='chime';if(bright)o.setPeriodicWave(this.bright);else o.type=wave==='bright'?'sawtooth':wave==='chime'?'sine':wave;o.frequency.value=frequency;
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.025);g.gain.setValueAtTime(volume,at+Math.max(.03,duration-.05));g.gain.linearRampToValueAtTime(0,at+duration);
  o.connect(g);g.connect(cue?this.cue:this.master);o.start(at);o.stop(at+duration+.02);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};
  this.silentUntil=Math.max(this.silentUntil,at+duration+AUDIO_CUES.tail);
 }
 click(at=this.time,accent=false){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=accent?1200:880;o.type='sine';g.gain.setValueAtTime(.35,at);g.gain.exponentialRampToValueAtTime(.001,at+.055);o.connect(g);g.connect(this.master);o.start(at);o.stop(at+.065);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};}
 success(){const c=AUDIO_CUES.success,t=this.time;this.toneHz(988,.14,t,c.volume,'chime');this.toneHz(1319,c.duration-.12,t+.12,c.volume,'chime');}
 complete(){const c=AUDIO_CUES.complete;this.toneHz(660,.18,this.time,c.volume,'sine');this.toneHz(990,.4,this.time+.14,c.volume,'sine');}
 correction(frequency){this.toneHz(frequency,AUDIO_CUES.correction.duration,this.time,AUDIO_CUES.correction.volume,'bright');}
 stop(){const active=this.nodes.size>0;for(const o of this.nodes){try{o.stop();}catch{}}this.nodes.clear();this.silentUntil=active?this.time+AUDIO_CUES.tail:Math.min(this.silentUntil,this.time+AUDIO_CUES.tail);}
 async close(){this.stop();if(this.ctx){await this.ctx.close();this.ctx=null;}}
}
export class Microphone{
 constructor(audio){this.audio=audio;this.stream=null;this.generation=0;}
 async start(){const gen=++this.generation;if(!navigator.mediaDevices?.getUserMedia)throw new Error('マイクはHTTPSのページ、またはこのMacのlocalhostで使えます。');
  try{if(navigator.audioSession)navigator.audioSession.type='play-and-record';}catch{}
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:true}});}catch(e){try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}throw e;}
  if(gen!==this.generation){stream.getTracks().forEach(t=>t.stop());return false;}
  this.stream=stream;this.source=this.audio.ctx.createMediaStreamSource(stream);this.analyser=this.audio.ctx.createAnalyser();this.analyser.fftSize=4096;this.source.connect(this.analyser);this.buffer=new Float32Array(4096);this.detector=new PitchDetector(this.audio.ctx.sampleRate);return true;
 }
 read(level){if(!this.analyser)return {rms:0,frequency:null,confidence:0};this.analyser.getFloatTimeDomainData(this.buffer);return this.detector.detect(this.buffer,level);}
 stop(){this.generation++;try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}this.stream?.getTracks().forEach(t=>t.stop());this.source?.disconnect();this.analyser?.disconnect();this.stream=null;this.source=null;this.analyser=null;}
}
