export let BUILD_SECONDS=360,LOCAL_SECONDS=24,SCORE_SECONDS=432;
export const HOLD_SECONDS=12,RETURN_SECONDS=60;
export function setBuildMinutes(minutes){
 const value=Number(minutes);
 if(!Number.isFinite(value))return;
 BUILD_SECONDS=Math.max(0,Math.min(6,value))*60;
 LOCAL_SECONDS=BUILD_SECONDS/15||24;
 SCORE_SECONDS=BUILD_SECONDS+HOLD_SECONDS+RETURN_SECONDS;
}
const clamp=v=>Math.max(0,Math.min(1,v));
export const ease=v=>{const t=clamp(v);return t*t*(3-2*t);};
export function scoreState(seconds){
 const time=((Math.max(0,seconds)%SCORE_SECONDS)+SCORE_SECONDS)%SCORE_SECONDS;
 const returning=time>=BUILD_SECONDS+HOLD_SECONDS,finished=time>=BUILD_SECONDS;
 const phase=(time%LOCAL_SECONDS)/LOCAL_SECONDS,index=Math.floor(time/LOCAL_SECONDS);
 let progress,front=-.1,layer=false,stage;
 if(phase<.5){progress=(index===0?0:1)+(index===0?3:2)*ease(phase/.5);stage=phase<.28?'pressure / opening':'slime exposure';}
 else if(phase<.75){progress=3;front=1.08*ease((phase-.5)/.25);layer=true;stage='slime reveals new metal';}
 else{progress=3-2*ease((phase-.75)/.25);front=1.08;layer=true;stage='new metal seals';}
 const returnProgress=returning?ease((time-BUILD_SECONDS-HOLD_SECONDS)/RETURN_SECONDS):0;
 const growth=finished?3.3-2.3*returnProgress:1+2.3*Math.pow(clamp(time/BUILD_SECONDS),3.2);
 const flood=finished?returning?1-ease((time-BUILD_SECONDS-HOLD_SECONDS)/RETURN_SECONDS):1:ease((time-BUILD_SECONDS*285/360)/(BUILD_SECONDS*75/360));
 return {time,phase,cycle:index+1,progress:finished?0:progress,front:finished?-.1:front,layer:finished?false:layer,growth,flood,melt:finished?1-returnProgress:ease((time-BUILD_SECONDS*2/3)/(BUILD_SECONDS/3)),reforming:returning,stage:finished?returning?'return to R':'full-frame molten sea':stage};
}
