import assert from 'node:assert/strict';import {mkdirSync,writeFileSync} from 'node:fs';
const tabs=await(await fetch('http://127.0.0.1:9230/json')).json();const tab=tabs.find(t=>t.type==='page');assert(tab);
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let id=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',{width:1100,height:1050,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:'http://127.0.0.1:8772/blender/review.html'});
await evaluate('new Promise((r,j)=>{let n=0;const f=()=>{const v=document.querySelector("video");if(v?.readyState>=2)return r(true);if(n++>150)return j(Error("Video load failed"));setTimeout(f,100)};f()})');
assert.equal(await evaluate('document.querySelector("video").duration'),18);
await evaluate('document.querySelector("video").muted=true;document.querySelector("video").play()');
await evaluate('new Promise(r=>setTimeout(r,400))');assert(await evaluate('document.querySelector("video").currentTime')>0);
await evaluate('document.querySelector("video").pause()');const frozen=await evaluate('document.querySelector("video").currentTime');await evaluate('new Promise(r=>setTimeout(r,200))');assert.equal(await evaluate('document.querySelector("video").currentTime'),frozen);
mkdirSync(new URL('./output/browser-review/',import.meta.url),{recursive:true});
for(const t of [3,10.8,14,17.5]){
 await evaluate(`new Promise(r=>{const v=document.querySelector('video');v.addEventListener('seeked',()=>r(true),{once:true});v.currentTime=${t}})`);
 const bounds=await evaluate('(()=>{const r=document.querySelector("video").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()');
 const shot=await call('Page.captureScreenshot',{format:'png',clip:bounds});writeFileSync(new URL(`./output/browser-review/at-${t}.png`,import.meta.url),Buffer.from(shot.data,'base64'));
}
await evaluate('document.querySelector("video").currentTime=0');assert.equal(errors.length,0);
const report={duration:18,frames:216,previewFPS:12,checks:['H264 video loads','play advances','pause freezes','seek stages','loop enabled','restart'],errors,notVerified:['Live fluid simulation','Browser integration of the 3D effect','Jade visual approval']};assert(await evaluate('document.querySelector("video").loop'));
writeFileSync(new URL('./output/browser-review/results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));ws.close();
