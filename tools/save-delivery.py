from pathlib import Path
import sys,io,zipfile,hashlib,json
sys.path.insert(0,'/Users/ngmt.mtk/.local/lib/python')
import icloud_io
root=Path(__file__).resolve().parent.parent;dest=Path('/Users/ngmt.mtk/Shortcuts/codex成果物/2026-10-14_弦しるべ_新UI')
dest.mkdir(parents=True,exist_ok=True)
files=[p for p in (root/'dist').rglob('*') if p.is_file()]
files += [root/p for p in ['README.md','DESIGN.md','DEPLOYMENT.md','build-portable.mjs','verify.mjs','extension-check.mjs','tools/save-delivery.py','tools/make-design-note.py','design/finger-patterns.astradraw','design/component.json','design/measurement.json','design/設計をどう立て直したか.html']]
files += [p for p in (root/'validation').iterdir() if p.is_file() and p.suffix in ['.json','.mjs','.txt']]
stream=io.BytesIO()
with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.writestr(str(p.relative_to(root)),p.read_bytes())
data=stream.getvalue()
with zipfile.ZipFile(io.BytesIO(data)) as z:assert z.testzip() is None
payloads={'弦しるべ.html':(root/'portable/弦しるべ.html').read_bytes(),'弦しるべ_編集用一式.zip':data,'設計をどう立て直したか.html':(root/'design/設計をどう立て直したか.html').read_bytes(),'練習を選ぶ.png':(root/'validation/deployed-setup.png').read_bytes(),'演奏画面.png':(root/'validation/deployed-play.png').read_bytes(),'公開検証.json':(root/'validation/deployment-verification.json').read_bytes()}
entries=[]
for name,raw in payloads.items():
 target=dest/name
 if target.exists():assert target.read_bytes()==raw,'Existing artifact preserved: '+name
 else:target.write_bytes(raw)
 actual=target.read_bytes();assert actual==raw;entries.append({'file':name,'sha256':hashlib.sha256(actual).hexdigest(),'bytes':len(actual)})
report={'url':'https://ngmt4amtk-web.github.io/genshirube/','files':entries,'allReadbacksMatched':True,'zipCrcPassed':True,'iPhoneHardwareTested':False,'iCloudDeviceSyncVerified':False}
(dest/'保存検証.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));assert json.loads((dest/'保存検証.json').read_text())==report
print(json.dumps({'savedTo':str(dest),'files':len(entries),'allReadbacksMatched':True},ensure_ascii=False))
