// A face-local 2D coordinate system. Points remain attached as the face moves,
// changes size or rolls. This is a frontal-face approximation, not a 3D skin mesh.
export function faceSpace(oval,eyeA,eyeB){
 let dx=eyeB.x-eyeA.x,dy=eyeB.y-eyeA.y;if(dx<0){dx=-dx;dy=-dy;}
 const length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length,vx=-uy,vy=ux;
 const xs=oval.map(p=>p.x*ux+p.y*uy),ys=oval.map(p=>p.x*vx+p.y*vy);
 const left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left||1,height=Math.max(...ys)-top||1;
 const cx=left+width/2,cy=top+height/2;
 return faceFrame({x:cx*ux+cy*vx,y:cx*uy+cy*vy,width,height,angle:Math.atan2(uy,ux)});
}
export function faceFrame({x,y,width,height,angle,yaw=0,pitch=0}){
 const ux=Math.cos(angle),uy=Math.sin(angle),vx=-uy,vy=ux;
 return {x,y,width,height,angle,yaw,pitch,
  local(p){const dx=p.x-x,dy=p.y-y;return {x:.5+(dx*ux+dy*uy)/width,y:.5+(dx*vx+dy*vy)/height};},
  screen(p){const dx=(p.x-.5)*width,dy=(p.y-.5)*height;return {x:x+dx*ux+dy*vx,y:y+dx*uy+dy*vy};}
 };
}
