import {clamp,smooth} from './trace-field.mjs';
export const CYCLE_SECONDS=360;
export const BURST_AT=CYCLE_SECONDS;
export const END_AT=372;
export function performanceCycle(time){
 const t=Math.max(0,time),pressure=smooth(t/BURST_AT),crowding=smooth((t-190)/170),empty=smooth((t-BURST_AT)/2.2),fall=clamp((t-362.2)/9.8);
 const impact=fall>=.76?Math.sin((fall-.76)*28)*Math.exp(-(fall-.76)*18)*.025:0;
 return {pressure,crowding,empty,fall,drop:clamp((fall/.76)**2-impact),stage:t<190?'pressurising':t<BURST_AT?'crowding':t<362.2?'bursting':t<END_AT?'falling':'carcass',finished:t>=END_AT};
}
