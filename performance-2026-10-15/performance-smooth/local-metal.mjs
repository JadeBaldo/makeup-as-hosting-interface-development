import * as THREE from './vendor/three/three.module.js';
import {buildSurfaceStudy} from './surface-study.mjs';
import {localReaction} from './local-reaction.mjs?v=layer-sequence-22';
export function layerMaterials(){
 const silver=new THREE.MeshPhysicalMaterial({color:'#c1d2e5',metalness:1,roughness:.23,clearcoat:.25,envMapIntensity:2.4}),slime=new THREE.MeshPhysicalMaterial({color:'#53015c',metalness:.16,roughness:.16,clearcoat:.55,side:THREE.DoubleSide,envMapIntensity:1.1}),fresh=silver.clone();fresh.color.set('#c9e9ff');
 function masked(m,attr,comparison){m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>\nattribute float ${attr}; varying float vLocalMask;`).replace('#include <begin_vertex>',`#include <begin_vertex>\nvLocalMask=${attr};`);s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float vLocalMask;').replace('#include <color_fragment>',`#include <color_fragment>\nif(vLocalMask ${comparison})discard;`);};m.customProgramCacheKey=()=>attr+comparison;}
 masked(silver,'aCut','> .33');const shellCompile=silver.onBeforeCompile;silver.onBeforeCompile=s=>{shellCompile(s);s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float aPurple; varying float vPurple;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPurple=aPurple;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float vPurple;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.36,.20,.49),vPurple);');};masked(fresh,'aPlate','< .24');return {silver,slime,fresh};
}
export function buildLocalMetal(geometry,options){
 const topology=buildSurfaceStudy(geometry,options),parts=[topology.surface,topology.shell],count=Math.max(...parts.flatMap(g=>g.userData.masterIds))+1;
 const rest=Array.from({length:count},()=>new THREE.Vector3()),normals=rest.map(()=>new THREE.Vector3());
 for(const g of parts){const p=g.userData.rest,n=g.attributes.normal.array;g.userData.masterIds.forEach((id,i)=>{rest[id].fromArray(p,i*3);normals[id].add(new THREE.Vector3().fromArray(n,i*3));});}
 normals.forEach(n=>n.normalize());const dose=new Float32Array(count),born=new Float32Array(count).fill(-1),pending=new Float32Array(count),cut=new Float32Array(count),plate=new Float32Array(count),purple=new Float32Array(count).fill(1),flow=new Float32Array(count),positions=rest.map(p=>p.clone());let previous=null,clock=0,extent=1,revision=0,lastRender=-1,frames=0,melt=0,reforming=false;
 const inner=topology.surface.clone(),fresh=topology.surface.clone(),bounds=topology.surface.boundingBox.clone(),amplitude=Math.min(15,(bounds.max.y-bounds.min.y)*.32);
 for(const g of parts){g.setAttribute('aCut',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count),1));g.setAttribute('aPurple',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(1),1));}fresh.setAttribute('aPlate',new THREE.BufferAttribute(new Float32Array(fresh.attributes.position.count),1));
 function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
 function render(){
  let max=0,strongest=-1;
  for(let i=0;i<count;i++){const state=localReaction(born[i]<0?-1:clock-born[i],dose[i]),p=rest[i],n=normals[i],amount=Math.max(state.inflate,melt*.8)*amplitude*extent;positions[i].set(p.x+n.x*amount*.35,p.y+n.y*amount*.35,p.z+n.z*amount);cut[i]=p.z>topology.frontZ*.45?Math.max(state.cut,melt):0;purple[i]=state.purple;flow[i]=state.flow;plate[i]=Math.max(state.plate,reforming?4*melt*(1-melt):0);if(p.z>topology.frontZ*.8&&cut[i]>max){max=cut[i];strongest=i;}}
  for(const g of parts){const attr=g.attributes.position,mask=g.attributes.aCut;g.userData.masterIds.forEach((id,i)=>{positions[id].toArray(attr.array,i*3);mask.array[i]=cut[id];g.attributes.aPurple.array[i]=purple[id];});attr.needsUpdate=true;mask.needsUpdate=true;g.attributes.aPurple.needsUpdate=true;if(frames%4===0)g.computeVertexNormals();g.computeBoundingSphere();}
  for(const [g,layer] of [[inner,0],[fresh,1]]){const attr=g.attributes.position;g.userData.masterIds.forEach((id,i)=>{const p=positions[id];attr.array[i*3]=p.x*(layer?.99:.98);attr.array[i*3+1]=p.y*(layer?.99:.98);attr.array[i*3+2]=p.z-(layer?.4:.85)+(layer?0:flow[id]*Math.sin(clock*2.4+p.x*.4+p.y*.3)*amplitude*.22);if(layer)g.attributes.aPlate.array[i]=plate[id];});attr.needsUpdate=true;if(layer)g.attributes.aPlate.needsUpdate=true;if(frames%4===0)g.computeVertexNormals();g.computeBoundingSphere();}
  frames++;lastRender=revision;return {max,point:strongest>=0?positions[strongest]:null};
 }
 render();
 return {...topology,inner,fresh,
  trace(point,width=3,surfaceHit=false){if(!surfaceHit&&!topology.contains(point)){previous=null;return false;}const a=previous||point;for(let i=0;i<count;i++){const d=distance(rest[i],a,point);if(d<width){const v=1-d/width;pending[i]=Math.max(pending[i],v*v*(3-2*v));}}previous={x:point.x,y:point.y};return true;},
  step(dt,point){if(!point||dt<=0)return [];let changed=false;for(let i=0;i<count;i++){if(pending[i]>.001){dose[i]=Math.min(8,dose[i]+pending[i]*dt*125);if(born[i]<0)born[i]=clock;changed=true;}pending[i]=0;}if(changed){revision++;render();}return [];},
  advance(dt,globalState={}){melt=globalState.melt||0;reforming=!!globalState.reforming;clock+=dt;if(!melt&&!dose.some(d=>d>0))return {max:0,point:null};revision++;return render();},
  setExtent(v){if(v!==extent){extent=Math.max(0,v);revision++;render();}},setColours(){},lift(){previous=null;pending.fill(0);},
  reset(){dose.fill(0);born.fill(-1);pending.fill(0);clock=0;previous=null;revision++;render();},
  snapshot(){return {dose:dose.slice(),born:born.slice(),time:clock,mask:Float32Array.from(dose,d=>1-Math.exp(-d)),sites:[]};},restore(s){dose.set(s.dose);born.set(s.born||new Float32Array(count).fill(0));clock=s.time;revision++;render();},
  get localStats(){return {marked:dose.reduce((s,d)=>s+(d>0),0),open:cut.reduce((s,d)=>s+(d>.33),0),newMetal:plate.reduce((s,d)=>s+(d>.24),0),vertices:count,time:clock};},
  dispose(){topology.dispose();inner.dispose();fresh.dispose();}
 };
}
