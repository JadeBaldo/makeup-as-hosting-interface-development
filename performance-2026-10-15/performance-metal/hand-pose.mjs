const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
function angle(a,b,c){
 const u=[a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0)],v=[c.x-b.x,c.y-b.y,(c.z||0)-(b.z||0)];
 const den=Math.hypot(...u)*Math.hypot(...v);if(!den)return 0;
 return Math.acos(Math.max(-1,Math.min(1,u.reduce((sum,x,i)=>sum+x*v[i],0)/den)))*180/Math.PI;
}
function finger(hand,mcp){
 const [a,b,c,d]=hand.slice(mcp,mcp+4),bend=angle(a,b,c),tipBend=angle(b,c,d);
 const reach=distance(a,d)/Math.max(.00001,distance(a,b));
 if(bend>=155&&tipBend>=150&&reach>=1.65)return 'extended';
 if(bend<=130&&reach<1.55)return 'folded';
 return 'ambiguous';
}
export function classifyHandPose(hand){
 if(!hand||hand.length<21||hand.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return 'unknown';
 const [index,middle,ring,pinky]=[5,9,13,17].map(mcp=>finger(hand,mcp));
 // Check index extension first: it must never become a fist navigation signal.
 if(index==='extended'&&[middle,ring,pinky].every(p=>p==='folded'))return 'pointing';
 if([index,middle,ring,pinky].every(p=>p==='extended'))return 'open';
 if([index,middle,ring,pinky].every(p=>p==='folded'))return 'closed';
 if(index==='extended'&&middle==='extended'&&ring==='folded'&&pinky==='folded')return 'neutral';
 return 'unknown';
}

// Navigation requires the entire hand to be outside a padded face rectangle.
export function handAwayFromFace(points,frame){
 if(!frame||!points?.length)return false;
 const local=points.map(p=>frame.local(p));
 const xs=local.map(p=>p.x),ys=local.map(p=>p.y),margin=.15;
 return Math.max(...xs)<-margin||Math.min(...xs)>1+margin||Math.max(...ys)<-margin||Math.min(...ys)>1+margin;
}
