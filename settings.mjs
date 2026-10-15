import {LESSONS,normalizeOptions} from './content.mjs';
import {DIFFICULTIES} from './intonation.mjs';
export function normalizeStored(value){
 const data=value&&typeof value==='object'?value:{},p=data.preferences&&typeof data.preferences==='object'?data.preferences:{},preferences={};
 for(const k of ['colors','fingers','names','reference','click'])preferences[k]=typeof p[k]==='boolean'?p[k]:true;
 preferences.sensitivity=['normal','high','ultra'].includes(p.sensitivity)?p.sensitivity:'high';
 preferences.bpm=Number.isFinite(Number(p.bpm))&&Number(p.bpm)>=40&&Number(p.bpm)<=180?Math.round(Number(p.bpm)):60;
 preferences.a4=[440,442].includes(p.a4)?p.a4:442;preferences.difficulty=Object.hasOwn(DIFFICULTIES,p.difficulty)?p.difficulty:'normal';
 const id=typeof data.lessonId==='string'?data.lessonId:typeof data.lesson==='string'?data.lesson:data.lesson?.id,lesson=LESSONS.find(l=>l.id===id)||LESSONS[0];
 return {preferences,lessonId:lesson.id,options:normalizeOptions(lesson,data.options,preferences.bpm)};
}
