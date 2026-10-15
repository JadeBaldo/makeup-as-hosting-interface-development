import assert from 'node:assert/strict';
import {faceSpace} from './face-space.mjs';
import {PerformanceState} from './state.mjs';
const oval=[{x:0,y:0},{x:200,y:0},{x:200,y:300},{x:0,y:300}];
const transform=p=>{const a=.35;return {x:400+1.4*(p.x*Math.cos(a)-p.y*Math.sin(a)),y:200+1.4*(p.x*Math.sin(a)+p.y*Math.cos(a))};};
const frame=faceSpace(oval.map(transform),transform({x:40,y:80}),transform({x:160,y:80}));
for(const p of [{x:.25,y:1/6},{x:.75,y:.5},{x:.25,y:5/6}]){
 const expected=transform({x:p.x*200,y:p.y*300}),actual=frame.screen(p);
 assert(Math.hypot(actual.x-expected.x,actual.y-expected.y)<1e-9);
 const local=frame.local(actual);assert(Math.hypot(local.x-p.x,local.y-p.y)<1e-9);
}assert(Math.abs(frame.angle-.35)<1e-9);
const controller=new PerformanceState();
for(const shift of [-900,0,1200]){
 const moved=p=>{const q=transform(p);return {x:q.x+shift,y:q.y-300};};
 const tracked=faceSpace(oval.map(moved),moved({x:40,y:80}),moved({x:160,y:80}));
 for(let sample=0;sample<6;sample++){
  const contact=moved({x:(sample%2+.5)*100,y:(Math.floor(sample/2)+.5)*100});
  const local=tracked.local(contact),mapped=controller.control(local);
  assert.equal(controller.index,0,'face position cannot select a title');
  assert(Math.abs(mapped.x-(sample%2+.5)/2)<1e-9&&Math.abs(mapped.y-(Math.floor(sample/2)+.5)/3)<1e-9,'face control stays fixed when the face moves across the screen');
 }
}
console.log('PASS: face-local anchors and marks follow translation, scale and roll');
