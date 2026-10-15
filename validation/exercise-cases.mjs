import {LESSONS} from '../dist/content.mjs';
export function exerciseCases(){
 const cases=[];for(const l of LESSONS){
  const t=l.type,strings=['G','D','A','E'];
  if(t==='reading'||t==='reading55'){for(let problem=1;problem<=(t==='reading'?8:19);problem++)cases.push([l,{problem}]);continue;}
  if(['scale','scale12','scale34'].includes(t)){for(const scale of t==='scale'?['GD','DA','AE']:t==='scale12'?['C1','G2']:['A1','E1','A2'])for(const fourth of ['0','4'])cases.push([l,{scale,fourth}]);continue;}
  if(t==='heights'){for(const height of ['all','1','2','3','4','5','6','7'])cases.push([l,{height}]);continue;}
  if(t==='cross'){for(const pair of ['GD','DA','AE'])cases.push([l,{pair}]);continue;}
  for(const string of strings){
   const rows=l.exercise==='keep'?['1','2','3','4','5','6','random']:t==='application94'?['1','2','3','4','5','6','7','8','all','random']:['1'];
   for(const row of rows)for(const pattern of t==='application94'?['23','12','34']:['23'])for(const variant of l.pattern==='34'&&string==='A'?['standard','flat']:['standard'])for(const rhythm of t==='open'?['whole','half','quarter','eighth','random']:['whole'])cases.push([l,{string,row,pattern,variant,rhythm,resolvedRow:row==='random'?(l.exercise==='keep'?6:8):1}]);
  }
 }
 return cases;
}
