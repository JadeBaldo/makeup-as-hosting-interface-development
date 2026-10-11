export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function distance(p,a,b){const x=b.x-a.x,y=b.y-a.y,d=x*x+y*y,t=d?clamp(((p.x-a.x)*x+(p.y-a.y)*y)/d):0;return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);}
export function lifecycle(age,threshold=4){
 const long=threshold>30,initial=Math.min(1.1,threshold*.35);
 const growth=long?.62*smooth(age/2.2)+.38*smooth(age/threshold):smooth(age/initial);
 const rupture=smooth((age-threshold)/.22),collapse=smooth((age-threshold)/1.65);
 return {growth,rupture,collapse,stage:age<0?'waiting':age<(long?2.2:initial)?'inflating':age<threshold?'wobbling':age<threshold+.3?'rupturing':age<threshold+1.65?'collapsing':'residue'};
}
// Fixed-size shared surface: strokes accumulate material state, not mesh objects.
export class TraceField{
 constructor(rest,contains,{radius=7}={}){Object.assign(this,{rest,contains,radius});this.marks=[];this.current=null;this.revision=0;this.reason='';this.nextId=0;}
 trace(p,time,threshold=4){
  if(!this.contains(p)){this.lift();return false;}
  if(!this.marks.length)this.marks.push({id:0,born:time,threshold,mask:new Float32Array(this.rest.length),dose:new Float32Array(this.rest.length),flowX:new Float32Array(this.rest.length),flowY:new Float32Array(this.rest.length),affected:new Set(),segments:[{}],previous:null,emitted:false,wound:{...p}});
  const m=this.marks[0];if(time>=m.born+m.threshold){this.reason='Cycle complete ? replay or clear';return false;}
  const fresh=!this.current;if(fresh){this.nextId++;this.current=m;}
  let a=m.previous||p;
  const length=Math.hypot(p.x-a.x,p.y-a.y),steps=Math.ceil(length/.7);
  for(let j=1;j<steps;j++)if(!this.contains({x:a.x+(p.x-a.x)*j/steps,y:a.y+(p.y-a.y)*j/steps})){a=p;break;}
  // Dose follows distance, so dense pointer sampling does not multiply pressure.
  const amount=fresh?.35:Math.min(1,Math.hypot(p.x-a.x,p.y-a.y)/this.radius)*.4;
  const dx=p.x-a.x,dy=p.y-a.y,n=Math.hypot(dx,dy)||1;
  for(let i=0;i<this.rest.length;i++){const w=smooth(1-distance(this.rest[i],a,p)/this.radius);if(w>.001){if(length>.01){const blend=Math.min(.65,w*amount*2);m.flowX[i]+=(dx/n-m.flowX[i])*blend;m.flowY[i]+=(dy/n-m.flowY[i])*blend;}m.dose[i]=Math.min(8,m.dose[i]+w*amount);m.mask[i]=1-Math.exp(-m.dose[i]);m.affected.add(i);}}
  m.previous={...p};m.wound={...p};this.revision++;this.reason='';return true;
 }
 lift(){if(this.current)this.current.previous=null;this.current=null;}
 reset(){this.marks.length=0;this.current=null;this.revision++;this.reason='';this.nextId=0;}
 state(mark,time){return lifecycle(Math.max(0,time-mark.born),mark.threshold);}
 events(time,{scrub=false}={}){const events=[];for(const m of this.marks)if(time>=m.born+m.threshold&&!m.emitted){m.emitted=true;if(!scrub&&time<m.born+m.threshold+1)events.push({id:m.id,...m.wound});}return events;}
 get settledAt(){return this.marks.length?this.marks[0].born+this.marks[0].threshold+1.65:0;}
}
