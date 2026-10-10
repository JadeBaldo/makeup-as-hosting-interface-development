export const SLIDE_SECONDS=180;
export const TITLES = [
 {title:'ALTERED IMAGES',subtitle:'VOL. VII'},
 {title:'CINEWAVE',subtitle:'Selected Moving Image'},
 {title:'AUTOJEKTOR',subtitle:''},
 {title:'JOSÉ MACABRA',subtitle:''},
 {title:'ARVIN DOLA &\nIRENE GAUMÉ',subtitle:'O Ghost'},
 {title:'IMMERSIVE BEATS',subtitle:'Parry Videotapes'}
];
export const regionAt=(x,y)=>Math.min(2,Math.max(0,Math.floor(y*3)))*2+Math.min(1,Math.max(0,Math.floor(x*2)));
export class PerformanceState {
 constructor(){this.index=0;this.auto=true;this.gestureArmed=false;this.gestureAge=0;this.lastPose='unknown';this.reset();}
 reset(){this.elapsed=0;this.paintTime=0;this.activity=Array(6).fill(0);this.visible=false;this.region=2;this.stroke={x:.5,y:.5};this.hue=Math.random();}
 advance(direction=1){this.index=(this.index+direction+6)%6;this.reset();}
 gesture(pose,dt){
  if(pose!==this.lastPose){this.gestureAge=0;this.lastPose=pose;}else this.gestureAge+=dt;
  if(pose==='open'&&this.gestureAge>=.35)this.gestureArmed=true;
  if(pose==='closed'&&this.gestureAge>=.35&&this.gestureArmed){this.gestureArmed=false;this.advance();return true;}return false;
 }
 tick(dt,trace,wallDt=dt){
  if(this.auto){this.elapsed+=wallDt;if(this.elapsed>=SLIDE_SECONDS){this.advance();return;}}
  if(!trace)return;
  this.visible=true;this.region=trace.region;this.stroke={x:trace.x,y:trace.y};this.paintTime+=dt;
  this.activity=this.activity.map((a,i)=>Math.min(1,a+dt*(i===trace.region?.12:.009)));
 }
}
