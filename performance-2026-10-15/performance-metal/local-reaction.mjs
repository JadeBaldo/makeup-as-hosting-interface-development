const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
export const STROKE_SECONDS=24;
// Smooth envelopes keep each blister attached while its surface changes.
export function localReaction(age,dose){
 if(age<0||dose<.01)return {inflate:0,cut:0,plate:0,slime:0,flow:0,purple:1};
 const t=((age%STROKE_SECONDS)+STROKE_SECONDS)%STROKE_SECONDS,w=1-Math.exp(-dose);
 const pulse=(rise,peak,fall,end)=>smooth((t-rise)/(peak-rise))*(1-smooth((t-fall)/(end-fall)));
 const first=pulse(0,2.2,3.4,6),second=pulse(6,8.5,11,15),third=pulse(15,17.5,20,24);
 const silverReveal=pulse(2.6,3.6,4.6,6);
 const slimeReveal=pulse(9,10.5,12,15),lastSlime=pulse(18,19.5,21,24);
 const slime=Math.max(slimeReveal,lastSlime);
 const cut=Math.max(silverReveal,slime);
 const replate=Math.max(silverReveal,slimeReveal*smooth((t-12)/2),lastSlime*smooth((t-21)/2));
 return {inflate:w*Math.max(first,second,third),cut:w*cut,plate:w*replate,slime:w*slime,flow:w*slimeReveal,purple:(age<24?1:smooth(t/.8))*(1-smooth((t-2.6)/3.4))};
}
export function faceToLetter(point,bounds){return {x:bounds.min.x+clamp(point.x)*(bounds.max.x-bounds.min.x),y:bounds.max.y-clamp(point.y)*(bounds.max.y-bounds.min.y)};}
