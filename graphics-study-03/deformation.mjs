import * as THREE from 'three';
import {buildSurfaceStudy} from './topology.mjs';
import {TraceField,clamp} from './trace-field.mjs';
import {performanceCycle,BURST_AT,END_AT} from './performance-cycle.mjs';
export function createLetterStudy(geometry){
 const topology=buildSurfaceStudy(geometry,{spacing:3.4}),front=topology.surface,shell=topology.shell;
 const rest=topology.vertices.map(v=>v.clone()),normals=topology.normals.map(v=>v.clone());
 const field=new TraceField(rest,p=>topology.contains(p));
 const depth=new Float32Array(rest.length),lateral=new Float32Array(rest.length),slump=new Float32Array(rest.length),positions=rest.map(p=>p.clone());
 const frontIds=front.userData.masterIds;
 const edges=new Map(),idx=front.index.array;
 for(let i=0;i<idx.length;i+=3)for(let j=0;j<3;j++){const a=idx[i+j],b=idx[i+(j+1)%3],k=a<b?`${a}:${b}`:`${b}:${a}`;const e=edges.get(k);if(e)e.count++;else edges.set(k,{a,b,count:1});}
 const boundary=[...edges.values()].filter(e=>e.count===1),frontVectors=frontIds.map(id=>rest[id]);
 const edgeDistance=frontVectors.map(p=>Math.min(...boundary.map(({a,b})=>{const u=frontVectors[a],v=frontVectors[b],dx=v.x-u.x,dy=v.y-u.y,t=clamp(((p.x-u.x)*dx+(p.y-u.y)*dy)/(dx*dx+dy*dy||1));return Math.hypot(p.x-u.x-dx*t,p.y-u.y-dy*t);}))); 
 // A filled container from the first frame. Core and wall share deformed XY
 // geometry, so the luminous liquid cannot escape the glyph's counter/outline.
 const bodyMaterial=new THREE.MeshPhysicalMaterial({color:'#29129d',roughness:.14,metalness:.38,transmission:.28,thickness:1.6,ior:1.36,attenuationColor:'#6886ff',attenuationDistance:22,clearcoat:1,clearcoatRoughness:.035,envMapIntensity:1.45});
 const liquidMaterial=new THREE.MeshPhysicalMaterial({color:'#00a9ce',emissive:'#007da6',emissiveIntensity:.95,roughness:.14,metalness:.08,clearcoat:1,clearcoatRoughness:.06});
 // Fine wet relief from the first frame, without changing the letter outline.
 bodyMaterial.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWetRest;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWetRest=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWetRest;').replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   {
    float wetRelief=.13*sin(vWetRest.x*.32+vWetRest.y*.22+sin(vWetRest.y*.14)*1.5);
    vec3 wetU=dFdx(-vViewPosition),wetV=dFdy(-vViewPosition),wetR=cross(wetV,normal),wetS=cross(normal,wetU);float wetDet=dot(wetU,wetR);
    normal=normalize(normal-sign(wetDet)*(dFdx(wetRelief)*wetR+dFdy(wetRelief)*wetS)/max(abs(wetDet),.0001));
   }
  `);
 };bodyMaterial.customProgramCacheKey=()=> 'wet-container-03';
 liquidMaterial.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLiquidRest;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLiquidRest=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vLiquidRest;').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float denseGel=.64+.36*sin(vLiquidRest.y*.052+sin(vLiquidRest.x*.047)*1.8);
   totalEmissiveRadiance*=denseGel;
  `);
 };liquidMaterial.customProgramCacheKey=()=> 'dense-liquid-core-03';
 const group=new THREE.Group(),solid=[new THREE.Mesh(front,bodyMaterial),new THREE.Mesh(shell,bodyMaterial)];
 const core=[front,shell].map(g=>{const inside=g.clone();inside.userData.masterIds=[...g.userData.masterIds];return new THREE.Mesh(inside,liquidMaterial);});group.add(...core,...solid);
 const skins=new Map();let softness=1,gloss=.85,glow=.7,ruptureTiming=4,lastTime=-1,lastRevision=-1,lastSoft=-1,performanceMode=false;
 function makeSkin(mark){
  const ids=[],map=new Map(),indices=[];
  for(let i=0;i<idx.length;i+=3){const face=[idx[i],idx[i+1],idx[i+2]];for(const j of face){if(!map.has(j)){map.set(j,ids.length);ids.push(j);}indices.push(map.get(j));}}
  const g=new THREE.BufferGeometry(),base=new Float32Array(ids.length*3),xy=new Float32Array(ids.length*2),weight=new Float32Array(ids.length);
  ids.forEach((j,i)=>{const p=rest[frontIds[j]];p.toArray(base,i*3);xy[i*2]=p.x;xy[i*2+1]=p.y;weight[i]=mark.mask[frontIds[j]];});
  g.setAttribute('position',new THREE.BufferAttribute(base.slice(),3));g.setAttribute('restXY',new THREE.BufferAttribute(xy,2));g.setAttribute('weight',new THREE.BufferAttribute(weight,1));g.setIndex(indices);g.userData.rest=base;
  const rupture={value:0},foldStrength={value:.35},wound={value:new THREE.Vector2(mark.wound.x,mark.wound.y)},phase={value:mark.id*.91};
  const material=new THREE.MeshPhysicalMaterial({color:new THREE.Color().setHSL(.50+((mark.id+24)%24)*.008,.98,.36),emissive:'#007bda',emissiveIntensity:.10,roughness:.10,metalness:.24,clearcoat:1,clearcoatRoughness:.025,transmission:.22,thickness:2.5,ior:1.36,envMapIntensity:1.7,side:THREE.DoubleSide,transparent:true,depthWrite:false});
  material.onBeforeCompile=s=>{
   Object.assign(s.uniforms,{rupture,wound,phase,foldStrength});
   s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 restXY; attribute float weight; varying vec2 vRest; varying float vWeight;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRest=restXY;vWeight=weight;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vRest; varying float vWeight; uniform float rupture; uniform float foldStrength; uniform vec2 wound; uniform float phase;').replace('#include <color_fragment>',`#include <color_fragment>
    if(vWeight<.008)discard;
    vec2 q=vRest-wound;float a=.5+phase*.2;q=mat2(cos(a),-sin(a),sin(a),cos(a))*q;
    float slit=abs(q.y-.3*sin(q.x*.7)),tip=1.-smoothstep(2.5,5.,abs(q.x));
    if(slit<rupture*.55*tip)discard;
    float rim=(1.-smoothstep(.5,1.3,slit))*tip*rupture;
    diffuseColor.rgb=mix(vec3(.015,.002,.18),diffuseColor.rgb,smoothstep(.02,.35,vWeight));
    diffuseColor.a*=smoothstep(.008,.18,vWeight);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.045,.001,.095),rim*.8);
   `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    {
    float creaseRelief=sin(vRest.x*.85+vRest.y*.57+sin(vRest.y*.2)*1.8+phase)*.28*foldStrength*vWeight;
     vec3 creaseU=dFdx(-vViewPosition),creaseV=dFdy(-vViewPosition),creaseR=cross(creaseV,normal),creaseS=cross(normal,creaseU);float creaseDet=dot(creaseU,creaseR);
     normal=normalize(normal-sign(creaseDet)*(dFdx(creaseRelief)*creaseR+dFdy(creaseRelief)*creaseS)/max(abs(creaseDet),.0001));
    }
   `);
  };material.customProgramCacheKey=()=> 'trace-skin-03';
  const mesh=new THREE.Mesh(g,material);mesh.renderOrder=mark.id;group.add(mesh);
  const skin={mesh,ids,rupture,wound,phase,foldStrength};skins.set(mark.id,skin);return skin;
 }
 function removeSkin(s){group.remove(s.mesh);s.mesh.geometry.dispose();s.mesh.material.dispose();}
 function update(time,{scrub=false}={}){
  const cycle=performanceCycle(field.nextId?time:0);
  const t=performanceMode?Math.min(time,END_AT):Math.min(time,field.settledAt),dirty=t!==lastTime||field.revision!==lastRevision||softness!==lastSoft;
  const events=field.events(time,{scrub});if(!dirty)return {...summary(time),events};
  depth.fill(0);lateral.fill(0);slump.fill(0);
  const marks=field.marks;
  for(const [id,skin] of skins)if(!marks.some(m=>m.id===id)){removeSkin(skin);skins.delete(id);}
  for(const m of marks){const s=field.state(m,t),live=s.growth*(1-s.collapse),sag=s.collapse;
   for(const i of m.affected){const w=m.mask[i],p=rest[i];const travel=p.x*m.flowX[i]+p.y*m.flowY[i];const varied=.82+.18*Math.sin(p.x*.10+p.y*.16);const delayed=Math.sin((t-m.born)*1.1-travel*.13)*.8*softness*live;depth[i]=Math.min(12,depth[i]+w*(live*9*varied+delayed+sag*.5));lateral[i]=Math.min(5,lateral[i]+w*(live*3.8*varied+sag*1.1));slump[i]=Math.min(4,slump[i]+w*(sag*2.8+live*1.4*softness));}
  }
  for(let i=0;i<rest.length;i++){const p=rest[i],n=normals[i],zFalloff=clamp((p.z-topology.frontZ+14)/14);
   const whole=performanceMode?cycle.pressure:0,empty=performanceMode?cycle.empty:0;
   const heavyWave=Math.sin(time*.12-p.y*.04-p.x*.023)*whole*(1-empty)*softness;
   const folded=Math.sin(p.x*.21+p.y*.13+Math.sin(p.y*.09)*2)*empty;
   const paint=field.marks[0],w=paint?.mask[i]||0,flowX=paint?.flowX[i]||0,flowY=paint?.flowY[i]||0,flowLength=Math.hypot(flowX,flowY)||1,fx=flowX/flowLength,fy=flowY/flowLength;
   const x=p.x+n.x*(lateral[i]+whole*2.8*(1-empty))+fx*w*2.6*(1-empty);
   const y=p.y+n.y*lateral[i]-slump[i]-whole*2+heavyWave*1.2+fy*w*3.2*(1-empty);
   const z=p.z+n.z*(depth[i]+whole*6+heavyWave)*zFalloff;
   // Empty skin loses height but keeps broad, rounded folds; no return to rest.
   positions[i].set(x,y*(1-empty*.68)+folded*2.4,z*(1-empty*.85)+folded*1.8);
  }
  for(const g of [front,shell]){g.userData.masterIds.forEach((id,i)=>positions[id].toArray(g.attributes.position.array,i*3));g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();}
  // Inset all surfaces along their own rest normal, including vertical walls.
  // A Z-only inset leaves coincident sidewalls and causes depth flicker.
  for(const mesh of core){mesh.visible=!performanceMode||cycle.empty<.95;const g=mesh.geometry;g.userData.masterIds.forEach((id,i)=>{const p=positions[id],n=normals[id];g.attributes.position.setXYZ(i,p.x-n.x*.8,p.y-n.y*.8,p.z-n.z*.8);});g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();}
  for(const m of marks){let skin=skins.get(m.id);if(!skin){if(skin)removeSkin(skin);skin=makeSkin(m);}
   const s=field.state(m,t),age=Math.max(0,t-m.born),live=s.growth*(1-s.collapse);
   const weights=skin.mesh.geometry.attributes.weight;skin.ids.forEach((j,i)=>weights.setX(i,m.mask[frontIds[j]]));weights.needsUpdate=true;
   skin.rupture.value=s.rupture;skin.wound.value.set(m.wound.x,m.wound.y);
   skin.foldStrength.value=.35+.65*Math.max(s.growth,s.collapse);
   skin.mesh.material.roughness=.065+(1-gloss)*.24;skin.mesh.material.envMapIntensity=.6+gloss*1.6;
   skin.mesh.material.emissiveIntensity=glow*.07;
   for(let i=0;i<skin.ids.length;i++){const j=skin.ids[i],id=frontIds[j],p=rest[id],base=positions[id],w=m.mask[id],taper=.15+.85*Math.min(1,edgeDistance[j]/3.4);
    // Spatial phase delay plus damped recoil: heavy gel yields without noisy motion.
    const flow=m.flowX[id]*p.x+m.flowY[id]*p.y;
    const lag=age*.55-flow*.10-p.y*.014;
    const wobble=(Math.sin(lag*2.3)+.28*Math.sin(lag*3.1))*.8*softness*live;
    const crease=Math.pow(.5+.5*Math.sin(p.x*.25+p.y*.19+flow*.10+Math.sin(p.y*.17)+m.id*.8),2);
    const recoil=Math.sin((age-m.threshold)*9)*Math.exp(-Math.max(0,age-m.threshold)*2)*s.rupture*(1-s.collapse);
    // Most volume is in the letter body; this skin adds a thin compliant cap.
    const height=w*taper*(live*(2.0+wobble*.65+crease*.85)+s.collapse*(.2+1.5*crease))*(performanceMode?1-cycle.empty*.5:1);
    const shift=w*softness*live*Math.sin(lag*1.1)*.25;
    skin.mesh.geometry.attributes.position.setXYZ(i,base.x+shift*taper,base.y-w*s.collapse*.7*taper,base.z+.075+(m.id<0?0:m.id%32)*.012+height+Math.max(-.035,recoil*.6*w));
   }
   const g=skin.mesh.geometry;g.attributes.position.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
  }
  lastTime=t;lastRevision=field.revision;lastSoft=softness;return {...summary(time),events};
 }
 function summary(time){const states=field.marks.map(m=>({id:m.id,...field.state(m,time)})),spent=states[0]?.stage==='residue';return {marks:field.nextId,active:spent?0:field.nextId,residues:spent?field.nextId:0,stage:states[0]?.stage||'ready',states};}
 function reset(){for(const s of skins.values())removeSkin(s);skins.clear();field.reset();lastTime=-1;update(0);}
 function pick(ray){group.updateMatrixWorld(true);const hit=ray.intersectObjects([...skins.values()].map(s=>s.mesh).concat(solid),false).find(h=>{const p=topology.restPoint(h);return p&&topology.contains(p);});return hit?topology.restPoint(hit):null;}
 return {group,field,front,shell,skins,core,bodyMaterial,liquidMaterial,edgeDistance,rest,normals,frontZ:topology.frontZ,trace:(p,t)=>performanceMode&&t>=BURST_AT?false:field.trace(p,t,performanceMode?Math.max(.001,BURST_AT-t):ruptureTiming),lift:()=>field.lift(),setPerformanceMode(v){performanceMode=v;lastRevision=-1;},update,reset,pick,setSoftness(v){softness=clamp(v);},setGloss(v){gloss=clamp(v);bodyMaterial.roughness=.04+(1-gloss)*.25;bodyMaterial.envMapIntensity=.7+gloss*1.5;lastRevision=-1;},setGlow(v){glow=clamp(v);liquidMaterial.emissiveIntensity=glow*1.4;for(const skin of skins.values())skin.mesh.material.emissiveIntensity=glow*.07;},setRuptureTiming(v){ruptureTiming=clamp(v,2,8);},dispose(){reset();topology.dispose();for(const mesh of core)mesh.geometry.dispose();bodyMaterial.dispose();liquidMaterial.dispose();}};
}
