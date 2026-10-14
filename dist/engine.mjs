export const frequencyFor=midi=>440*2**((midi-69)/12);
export const centsFrom=(frequency,midi)=>frequency>0?1200*Math.log2(frequency/frequencyFor(midi)):Infinity;
// 音量の感度と音程の許容幅は分離。半音違いを合格にしない。
export const MIC_LEVELS={normal:{minRms:.003,confidence:.8},high:{minRms:.001,confidence:.72},ultra:{minRms:.0005,confidence:.65}};
export class PitchDetector{
 constructor(rate){this.rate=rate/2;this.x=new Float32Array(2048);this.maxTau=Math.ceil(this.rate/170);this.diff=new Float32Array(this.maxTau+2);}
 detect(input,level='high'){
  const cfg=MIC_LEVELS[level]||MIC_LEVELS.high,x=this.x,size=Math.min(x.length,Math.floor(input.length/2));let mean=0;
  for(let i=0;i<size;i++){x[i]=(input[2*i]+input[2*i+1])/2;mean+=x[i];}mean/=size;
  let power=0;for(let i=0;i<size;i++){x[i]-=mean;power+=x[i]*x[i];}
  const rms=Math.sqrt(power/size);if(rms<cfg.minRms)return {rms,frequency:null,confidence:0};
  const d=this.diff,n=size-this.maxTau-1;let sum=0;d[0]=1;
  for(let t=1;t<=this.maxTau+1;t++){let v=0;for(let i=0;i<n;i++){const delta=x[i]-x[i+t];v+=delta*delta;}sum+=v;d[t]=sum?v*t/sum:1;}
  let best=-1;const min=Math.floor(this.rate/1200);
  for(let t=min;t<=this.maxTau;t++)if(d[t]<=d[t-1]&&d[t]<d[t+1]){if(best<0||d[t]<d[best])best=t;if(d[t]<.15){best=t;break;}}
  if(best<0||1-d[best]<cfg.confidence)return {rms,frequency:null,confidence:0};
  const den=2*(2*d[best]-d[best-1]-d[best+1]),shift=den?(d[best+1]-d[best-1])/den:0;
  return {rms,frequency:this.rate/(best+Math.max(-1,Math.min(1,shift))),confidence:1-d[best]};
 }
}
export class StablePitchGate{
 constructor(){this.reset();}
 reset(){this.since=null;this.last=null;}
 observe(reading,midi,ms){
  const ok=reading.frequency&&Math.abs(centsFrom(reading.frequency,midi))<=45;
  if(!ok){this.reset();return false;}
  if(this.last===null||ms-this.last>180)this.since=ms;
  this.last=ms;return ms-this.since>=320;
 }
}
export class AudioEngine{
 constructor(){this.ctx=null;this.nodes=new Set();this.silentUntil=0;}
 async init(){if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)throw new Error('このブラウザは音の再生に対応していません。SafariまたはChromeで開いてください。');this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.18;this.master.connect(this.ctx.destination);}await this.ctx.resume();return this.ctx;}
 get time(){return this.ctx?.currentTime||0;}
 tone(midi,duration=.5,at=this.time,volume=.6){
  if(!this.ctx)return;
  const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=frequencyFor(midi);
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.025);g.gain.setValueAtTime(volume,at+Math.max(.03,duration-.05));g.gain.linearRampToValueAtTime(0,at+duration);
  o.connect(g);g.connect(this.master);o.start(at);o.stop(at+duration+.02);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};
  this.silentUntil=Math.max(this.silentUntil,at+duration+.22);
 }
 click(at=this.time,accent=false){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=accent?1200:880;o.type='sine';g.gain.setValueAtTime(.35,at);g.gain.exponentialRampToValueAtTime(.001,at+.055);o.connect(g);g.connect(this.master);o.start(at);o.stop(at+.065);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};}
 success(){this.tone(84,.12,this.time,.2);this.tone(88,.16,this.time+.12,.2);}
 stop(){for(const o of this.nodes){try{o.stop();}catch{}}this.nodes.clear();this.silentUntil=this.time+.25;}
 async close(){this.stop();if(this.ctx){await this.ctx.close();this.ctx=null;}}
}
export class Microphone{
 constructor(audio){this.audio=audio;this.stream=null;this.generation=0;}
 async start(){const gen=++this.generation;if(!navigator.mediaDevices?.getUserMedia)throw new Error('マイクはHTTPSのページ、またはこのMacのlocalhostで使えます。');
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:true}});
  if(gen!==this.generation){stream.getTracks().forEach(t=>t.stop());return false;}
  this.stream=stream;this.source=this.audio.ctx.createMediaStreamSource(stream);this.analyser=this.audio.ctx.createAnalyser();this.analyser.fftSize=4096;this.source.connect(this.analyser);this.buffer=new Float32Array(4096);this.detector=new PitchDetector(this.audio.ctx.sampleRate);return true;
 }
 read(level){if(!this.analyser)return {rms:0,frequency:null,confidence:0};this.analyser.getFloatTimeDomainData(this.buffer);return this.detector.detect(this.buffer,level);}
 stop(){this.generation++;this.stream?.getTracks().forEach(t=>t.stop());this.source?.disconnect();this.analyser?.disconnect();this.stream=null;this.source=null;this.analyser=null;}
}
