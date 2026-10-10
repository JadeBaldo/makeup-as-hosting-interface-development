// Wall-clock motion, independent of stroke time. Each glyph has its own phase
// and speed; rotations stay subtle so front-facing drawing remains practical.
export function letterRotation(seconds,index=0){
 const phase=index*2.399963,speed=.20+(index%7)*.019;
 return {x:Math.sin(seconds*(speed*.71)+phase*.8)*.035,
  y:Math.sin(seconds*speed+phase)*.14,
  z:Math.sin(seconds*(speed*.53)+phase*1.3)*.018};
}
