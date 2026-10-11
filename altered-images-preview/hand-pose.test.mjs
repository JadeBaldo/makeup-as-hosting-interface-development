import assert from 'node:assert/strict';
import {classifyHandPose,handAwayFromFace} from './hand-pose.mjs';
import {PerformanceState} from './state.mjs';
function hand(fingers){const out=Array.from({length:21},()=>({x:0,y:2,z:0}));
 [5,9,13,17].forEach((mcp,i)=>{const x=i*.8;const coords=fingers[i]==='extended'?[[0,0],[0,-1],[0,-2],[0,-3]]:fingers[i]==='folded'?[[0,0],[0,-1],[.5,-.6],[.1,-.1]]:[[0,0],[0,-1],[.8,-1.7],[1.4,-1.5]];coords.forEach(([dx,y],j)=>out[mcp+j]={x:x+dx,y,z:0});});return out;}
const cases=[['open',['extended','extended','extended','extended']],['closed',['folded','folded','folded','folded']],['pointing',['extended','folded','folded','folded']],['unknown',['ambiguous','folded','folded','folded']],['neutral',['extended','extended','folded','folded']]];
for(const [expected,fingers] of cases){
 const fixture=hand(fingers);assert.equal(classifyHandPose(fixture),expected);
 const moved=fixture.map(p=>({x:4+.6*(p.x*Math.cos(.8)-p.y*Math.sin(.8)),y:3+.6*(p.x*Math.sin(.8)+p.y*Math.cos(.8)),z:0}));assert.equal(classifyHandPose(moved),expected);
}
assert.equal(classifyHandPose(null),'unknown');assert.equal(classifyHandPose([]),'unknown');
const state=new PerformanceState(),hold=(pose,n=10)=>Array.from({length:n},()=>state.gesture(pose,.1)).filter(Boolean).length;
assert.equal(hold('pointing'),0);assert.equal(hold('closed'),0);assert.equal(hold('open'),1);
assert.equal(hold('open',50),0);hold('released',2);assert.equal(hold('open'),1);
const frame={local:p=>p};
assert.equal(handAwayFromFace([{x:.5,y:.5},{x:1.3,y:.5}],frame),false);
assert.equal(handAwayFromFace([{x:1.1,y:.5}],frame),false,'padding keeps nearby palms from navigating');
assert.equal(handAwayFromFace([{x:1.3,y:.2},{x:1.4,y:.8}],frame),true);
assert.equal(handAwayFromFace([{x:-.3,y:.5}],frame),true);
assert.equal(handAwayFromFace([{x:.5,y:-.3}],frame),true);
assert.equal(handAwayFromFace([{x:.5,y:1.3}],frame),true);
assert.equal(handAwayFromFace([{x:2,y:2}],null),false);
console.log('PASS: pose classification, no fist navigation, palm hold and whole-hand distance from face');
