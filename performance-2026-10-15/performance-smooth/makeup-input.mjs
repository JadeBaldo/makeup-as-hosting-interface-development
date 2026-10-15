const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function insideFace(point,oval){
 let inside=false;
 for(let i=0,j=oval.length-1;i<oval.length;j=i++){
  const a=oval[i],b=oval[j];
  if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
export function applicationPoint(points,pose,tool,reach=1.1,lateral=0){
 if(points?.length!==21||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))||pose==='open')return null;
 if(tool==='finger'){
  if(pose==='closed')return null;
  // Accept the relaxed index used in application, including two-finger poses.
  if(distance(points[5],points[8])<distance(points[5],points[6])*1.35)return null;
  return points[8];
 }
 const palm=distance(points[5],points[17]);
 if(palm<1||distance(points[4],points[8])>palm*.85)return null;
 // A calibrated hand-relative proxy for a held brush, not brush recognition.
 const dx=points[5].x-points[0].x,dy=points[5].y-points[0].y,length=Math.hypot(dx,dy);
 if(length<1)return null;
 const ux=dx/length,uy=dy/length;
 return {x:(points[4].x+points[8].x)/2+palm*(ux*reach-uy*lateral),y:(points[4].y+points[8].y)/2+palm*(uy*reach+ux*lateral)};
}
export function createMakeupInput(){
 let previous=null,toolBefore=null;
 return {
  reset(){previous=null;toolBefore=null;},
  update({points,pose,tool='finger',reach=1.1,lateral=0,frame,oval,dt=.08}){
   if(tool!==toolBefore){previous=null;toolBefore=tool;}
   const point=frame&&points?applicationPoint(points,pose,tool,reach,lateral):null;
   if(!point||!insideFace(point,oval||[])){previous=null;return {trace:null,point};}
   const local=frame.local(point);
   if(previous&&Math.hypot(local.x-previous.x,local.y-previous.y)>.25){previous=null;return {trace:null,point};}
   const blend=1-Math.exp(-Math.max(0,dt)*18);
   const filtered=previous?{x:previous.x+(local.x-previous.x)*blend,y:previous.y+(local.y-previous.y)*blend}:local;
   const screen=frame.screen(filtered);
   // Never smooth a valid tip outside the actual face oval.
   if(!insideFace(screen,oval)){previous=null;return {trace:null,point};}
   previous=filtered;
   return {point,trace:{...filtered,screenX:screen.x,screenY:screen.y}};
  }
 };
}
