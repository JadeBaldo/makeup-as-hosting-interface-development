import assert from 'node:assert/strict';
import {faceFrame} from './face-space.mjs';
import {smoothFace,titleFaceTransform,headTurn} from './face-motion.mjs';
import {letterRotation,LETTER_ROTATION_SECONDS} from './letter-motion.mjs';
const frame=faceFrame({x:600,y:350,width:300,height:400,angle:.2,yaw:.1,pitch:.05});
const target=faceFrame({x:650,y:380,width:360,height:440,angle:.3,yaw:.2,pitch:.1});
const smooth=smoothFace(frame,target,.1);assert(smooth.x>frame.x&&smooth.x<target.x);assert(smooth.yaw>.1&&smooth.yaw<.2);
const p={x:.49,y:.68};const local=smooth.local(smooth.screen(p));assert(Math.hypot(local.x-p.x,local.y-p.y)<1e-9);
const layout={width:180,height:80},a=titleFaceTransform(frame,1200,800,3,layout),b=titleFaceTransform(target,1200,800,3,layout);
assert.notEqual(a.x,b.x);assert.notEqual(a.scale,b.scale);assert.equal(a.zRotation,-frame.angle);assert.equal(a.yRotation,.1);
const edge=titleFaceTransform(faceFrame({...target,x:1200,y:0}),1200,800,3,layout);assert(edge.x+(layout.width+60)*edge.scale/2<=600);assert(edge.y+(layout.height+60)*edge.scale/2<=400);
const roll=Math.PI/4,rolled=titleFaceTransform(faceFrame({...target,x:0,y:0,angle:roll}),1200,800,3,layout);
const projectedY=((layout.width+60)*Math.sin(roll)+(layout.height+60)*Math.cos(roll))*rolled.scale/2;assert(rolled.y+projectedY<=400);
for(let index=0;index<20;index++){
 const start=letterRotation(123,index),end=letterRotation(123+LETTER_ROTATION_SECONDS,index);
 assert(Math.abs(end.y-start.y-2*Math.PI)<1e-10);assert.equal(start.x,0);assert.equal(start.z,0);
 assert.notEqual(letterRotation(123,index+1).y,start.y);
}
assert(Math.abs(letterRotation(360,0).y-2*Math.PI)<1e-10);
const landmarks=Array.from({length:478},()=>({x:.5,y:.5,z:0}));landmarks[234]={x:.2,y:.5,z:-.1};landmarks[454]={x:.8,y:.5,z:.1};landmarks[10]={x:.5,y:.1,z:0};landmarks[152]={x:.5,y:.9,z:.05};assert(headTurn(landmarks).yaw>0);
console.log('PASS: smooth shared face frame, title position/scale/roll/turn, composition bounds and full six-minute phased turns');
