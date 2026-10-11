export const TITLES = [
 {title:'ALTERED IMAGES',subtitle:'VOL. VII'},
 {title:'CINEWAVE',subtitle:'Selected Moving Image'},
 {title:'AUTOJEKTOR',subtitle:''},
 {title:'JOSÉ MACABRA',subtitle:''},
 {title:'ARVIN DOLA &\nIRENE GAUMÉ',subtitle:'O Ghost'},
 {title:'IMMERSIVE BEATS',subtitle:'Parry Videotapes'}
];
export const GESTURE_HOLD_SECONDS=.7;
export const GESTURE_RELEASE_SECONDS=.15;
export const isReleasePose=pose=>['pointing','neutral','released','closed'].includes(pose);
export const isNavigationPose=pose=>pose==='open';
export class PerformanceState {
 constructor(){this.index=0;this.resetGesture();this.reset();}
 reset(){this.paintTime=0;this.stroke={x:.5,y:.5};}
 resetGesture(){this.gestureAge=0;this.lastPose='unknown';this.gestureLocked=false;this.releaseAge=0;}
 advance(direction=1){this.index=(this.index+direction+TITLES.length)%TITLES.length;this.reset();}
 control(trace){return trace?{x:Math.max(0,Math.min(1,trace.x)),y:Math.max(0,Math.min(1,trace.y))}:null;}
 gesture(pose,dt){
  if(!isNavigationPose(pose)){
   this.lastPose='unknown';this.gestureAge=0;this.releaseAge=isReleasePose(pose)?this.releaseAge+dt:0;
   if(this.releaseAge>=GESTURE_RELEASE_SECONDS)this.gestureLocked=false;
   return false;
  }
  this.releaseAge=0;
  if(pose!==this.lastPose){this.lastPose=pose;this.gestureAge=0;}
  this.gestureAge+=dt;
  if(this.gestureLocked||this.gestureAge<GESTURE_HOLD_SECONDS)return false;
  this.gestureLocked=true;this.advance(1);return true;
 }
 get gestureProgress(){return this.gestureLocked?0:Math.min(1,this.gestureAge/GESTURE_HOLD_SECONDS);}
 tick(dt,trace){if(trace){this.stroke=this.control(trace);this.paintTime+=dt;}}
}
