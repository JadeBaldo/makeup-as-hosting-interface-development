import {faceFrame} from './face-space.mjs?v=face-attached-10';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function smoothFace(previous,target,dt){
 if(!previous)return faceFrame(target);
 const blend=1-Math.exp(-dt*12),out={};
 for(const key of ['x','y','width','height','yaw','pitch'])out[key]=previous[key]+((target[key]||0)-previous[key])*blend;
 const delta=Math.atan2(Math.sin(target.angle-previous.angle),Math.cos(target.angle-previous.angle));
 out.angle=previous.angle+delta*blend;return faceFrame(out);
}
export function headTurn(landmarks){
 const a=landmarks[234],b=landmarks[454],top=landmarks[10],bottom=landmarks[152];
 return {yaw:clamp(Math.atan2((b.z||0)-(a.z||0),Math.abs(b.x-a.x)),-.4,.4),
  pitch:clamp(Math.atan2((bottom.z||0)-(top.z||0),Math.abs(bottom.y-top.y)),-.25,.25)};
}
export function titleFaceTransform(frame,width,height,fit,layout,size=1){
 const angle=frame?frame.angle:0,cos=Math.abs(Math.cos(angle)),sin=Math.abs(Math.sin(angle));
 const footprintX=(layout.width+60)*cos+(layout.height+60)*sin;
 const footprintY=(layout.width+60)*sin+(layout.height+60)*cos;
 const scale=Math.min(fit,(width-32)/footprintX,(height-32)/footprintY,fit*size*(frame?clamp(frame.width/(width*.34),.45,1.4):1));
 const halfX=footprintX*scale/2,halfY=footprintY*scale/2;
 return {x:frame?clamp(frame.x-width/2,-width/2+halfX,width/2-halfX):0,
  y:frame?clamp(height/2-frame.y,-height/2+halfY,height/2-halfY):0,
  scale,xRotation:frame?frame.pitch:0,yRotation:frame?frame.yaw:0,zRotation:frame?-frame.angle:0};
}
