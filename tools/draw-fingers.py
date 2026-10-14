from pathlib import Path
import subprocess,json
root=Path('/Users/ngmt.mtk/genshirube-20261014'); f=root/'design/finger-patterns.astradraw'; cli='/Users/ngmt.mtk/.local/bin/astra-draw'
def run(*args):
 r=subprocess.run([cli,*map(str,args)],capture_output=True,text=True,check=True); return json.loads(r.stdout)
def apply(ops,label):
 d=run('inspect',f)['summary']; req={'documentID':d['id'],'expectedRevision':d['revision'],'requestId':label,'label':label,'operations':ops}; p=root/'design'/f'{label}.json';p.write_text(json.dumps(req));return run('apply',f,'--input',p)
def shape(x,w=44):return [['M',x+13,24],['L',x+w-13,24],['Q',x+w,24,x+w,37],['L',x+w,62],['Q',x+w,75,x+w-13,75],['L',x+13,75],['Q',x,75,x,62],['L',x,37],['Q',x,24,x+13,24],['Z']]
if __name__=='__main__':
 ops=[]
 for i,x in enumerate([26,102,146,222]):
  ops.append({'op':'add','node':{'id':f'finger{i+1}','kind':'path','path':shape(x),'fill':'#FFFFFF','stroke':'#536073','strokeWidth':1.4}})
  ops.append({'op':'add','node':{'id':f'number{i+1}','kind':'text','text':str(i+1),'font':'Helvetica-Bold','fontSize':27,'frame':{'x':x+14,'y':32,'width':30,'height':36},'fill':'#202839'}})
 apply(ops,'01-layout')
 print(run('render',f,'-o',root/'design/01-layout.png'))
