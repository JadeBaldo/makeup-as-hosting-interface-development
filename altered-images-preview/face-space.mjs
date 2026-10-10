// A face-local 2D coordinate system. Points remain attached as the face moves,
// changes size or rolls. This is a frontal-face approximation, not a 3D skin mesh.
export function faceSpace(oval,eyeA,eyeB){
 let dx=eyeB.x-eyeA.x,dy=eyeB.y-eyeA.y;if(dx<0){dx=-dx;dy=-dy;}
 const length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length,vx=-uy,vy=ux;
 const xs=oval.map(p=>p.x*ux+p.y*uy),ys=oval.map(p=>p.x*vx+p.y*vy);
 const left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left||1,height=Math.max(...ys)-top||1;
 return {angle:Math.atan2(uy,ux),
  local(p){return {x:(p.x*ux+p.y*uy-left)/width,y:(p.x*vx+p.y*vy-top)/height};},
  screen(p){const x=left+p.x*width,y=top+p.y*height;return {x:x*ux+y*vx,y:x*uy+y*vy};}
 };
}
