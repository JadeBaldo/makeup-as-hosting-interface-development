import * as THREE from './vendor/three/three.module.js';
// Legacy 01.4 jet grouping, retained only for its standalone geometry checks.
// The integrated performance does not import this renderer or use face sections.
const regionAt=(x,y)=>Math.min(2,Math.max(0,Math.floor(y*3)))*2+Math.min(1,Math.max(0,Math.floor(x*2)));
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const hash=i=>{const n=Math.sin(i*127.1+31.7)*43758.5453;return n-Math.floor(n);};
// One continuous, closed-ended surface per jet: broad foot, neck and bulb.
// The foot is embedded in the text; the tip never detaches.
export function makeJetGeometry(){
 const segments=28,radial=16,positions=new Float32Array((segments+1)*(radial+1)*3),indices=[];
 for(let i=0;i<segments;i++)for(let j=0;j<radial;j++){const a=i*(radial+1)+j,b=a+radial+1;indices.push(a,a+1,b,b,a+1,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setIndex(indices);g.userData={segments,radial};return g;
}
export function shapeJet(g,{growth,time,seed,extent}){
 const {segments,radial}=g.userData,p=g.attributes.position;
 const size=extent*(.45+.55*growth),length=(5+growth*100)*extent;
 const direction=hash(seed+11)*2-1,phase=seed*2.9+time*.95;
 for(let i=0;i<=segments;i++){
  const t=i/segments,curve=smooth(t),wobble=Math.sin(phase-t*3.5)*growth;
  const cx=(direction*36*growth+8*wobble)*curve*extent;
  const cy=(-growth*48*curve+Math.sin(phase*.73+t*4)*growth*3*curve)*extent;
  // Bulb widens near the tip and closes smoothly; attachment radius stays > 0.
  const foot=3.8*Math.exp(-t*10),neck=4.8,bulb=15*Math.exp(-(((t-.78)/.18)**2));
  const cap=Math.sqrt(Math.max(0,1-((Math.max(0,t-.8))/.2)**2));
  const radius=(foot+neck+bulb)*size*cap;
  for(let j=0;j<=radial;j++){
   const a=j/radial*Math.PI*2,lobe=1+.09*growth*Math.sin(a*3+phase)*Math.sin(Math.PI*t);
   p.setXYZ(i*(radial+1)+j,cx+Math.cos(a)*radius*lobe,cy+Math.sin(a)*radius*lobe,t*length-1.2);
  }
 }p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
}
export function createJets(parent,material){
 const jets=[];let lastTime=0;
 function clear(){for(const j of jets){parent.remove(j.mesh);j.mesh.geometry.dispose();}jets.length=0;lastTime=0;}
 return {
  clear,
  seed(meshes,width,height){
   clear();const candidates=[];let index=0;
   for(const mesh of meshes){const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,idx=mesh.geometry.index;
    for(let k=0;k<(idx?idx.count:p.count);k+=3){const ids=[0,1,2].map(d=>idx?idx.getX(k+d):k+d);
     if(ids.some(i=>n.getZ(i)<.99))continue;
     const a=new THREE.Vector3().fromBufferAttribute(p,ids[0]),b=new THREE.Vector3().fromBufferAttribute(p,ids[1]),c=new THREE.Vector3().fromBufferAttribute(p,ids[2]);
     const area=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).length()/2;if(area<3)continue;
     const point=a.add(b).add(c).multiplyScalar(1/3);candidates.push({point,score:hash(++index)*area,seed:index});
    }
   }
   candidates.sort((a,b)=>b.score-a.score);
   for(const c of candidates){if(jets.length>=22)break;if(jets.some(j=>j.mesh.position.distanceTo(c.point)<15))continue;
    const mesh=new THREE.Mesh(makeJetGeometry(),material);mesh.position.copy(c.point);mesh.visible=false;parent.add(mesh);
    const u=c.point.x/width+.5,v=.5-c.point.y/height;
    jets.push({mesh,u,v,region:regionAt(u,v),pressure:0,seed:c.seed});
   }
  },
  update({paintTime,activity,stroke,activeRegion,extent}){
   const dt=Math.max(0,Math.min(.15,paintTime-lastTime));lastTime=paintTime;
   for(const jet of jets){
    const near=Math.exp(-((jet.u-stroke.x)**2+(jet.v-stroke.y)**2)*12);
    jet.pressure=Math.min(1,jet.pressure+dt*(jet.region===activeRegion?.18+.32*near:.018));
    const growth=smooth(jet.pressure*.85+activity[jet.region]*.35);
    jet.mesh.visible=paintTime>.3&&growth>.002&&extent>0;
    if(jet.mesh.visible)shapeJet(jet.mesh.geometry,{growth,time:paintTime,seed:jet.seed,extent});
   }
  },
  capture(){return {time:lastTime,pressures:jets.map(j=>j.pressure)};},
  restore(saved){lastTime=saved.time;jets.forEach((j,i)=>j.pressure=saved.pressures[i]||0);},
  get count(){return jets.length;}
 };
}
