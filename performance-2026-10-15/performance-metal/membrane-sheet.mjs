import {TextGeometry} from './vendor/three/examples/jsm/geometries/TextGeometry.js';
import {localReaction} from './local-reaction.mjs?v=layer-sequence-22';
import * as THREE from './vendor/three/three.module.js';

export function createMembraneSheet(scene){
 const geometry=new THREE.PlaneGeometry(1,1,96,136),rest=geometry.attributes.position.array.slice();
 const pressure=new Float32Array(rest.length/3),born=new Float32Array(pressure.length).fill(-1);
 const reaction=new THREE.BufferAttribute(new Float32Array(pressure.length),1);geometry.setAttribute('aSlime',reaction);const purple=new THREE.BufferAttribute(new Float32Array(pressure.length).fill(1),1);geometry.setAttribute('aPurple',purple);
 const uniforms={uView:{value:new THREE.Vector2(1,1)},uPixels:{value:1},uFace:{value:new THREE.Vector4()},uAngle:{value:0},uClear:{value:0}};
 const material=new THREE.MeshPhysicalMaterial({color:'#858fae',metalness:.82,roughness:.24,clearcoat:.65,side:THREE.DoubleSide,transparent:true,opacity:1,depthWrite:true});
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aSlime; attribute float aPurple; varying float vSlime; varying float vPurple;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSlime=aSlime;vPurple=aPurple;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 varying float vSlime; varying float vPurple; uniform vec2 uView; uniform float uPixels; uniform vec4 uFace; uniform float uAngle; uniform float uClear;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.36,.20,.49),vPurple);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.19,.002,.23),smoothstep(.12,.7,vSlime));
 vec2 screen=vec2(gl_FragCoord.x/uPixels,uView.y-gl_FragCoord.y/uPixels);
 vec2 offset=screen-uFace.xy;
 float c=cos(uAngle),s=sin(uAngle);
 vec2 local=vec2(c*offset.x+s*offset.y,-s*offset.x+c*offset.y);
 vec2 edge=abs(local)-uFace.zw*.64;
 float outside=smoothstep(-12.0,18.0,max(edge.x,edge.y));
 diffuseColor.a*=mix(1.0,outside,uClear);
 if(diffuseColor.a<.001)discard;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.24,.12,vSlime);').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(.95,.12,vSlime);');
 };
 const mesh=new THREE.Mesh(geometry,material);mesh.position.z=-70;mesh.frustumCulled=false;scene.add(mesh);
 const relief=[];let previous=null,time=0;
 const wave=(x,y)=>3*Math.sin(x*13+time*.8)+2*Math.sin(y*17-time*.63);
 return {
  setText(title,subtitle,font){
   for(const item of relief){mesh.remove(item.mesh);item.mesh.geometry.dispose();}relief.length=0;
   for(const edge of [1,-1])for(const [text,y,size] of [[title.replace(/\n/g,' '),edge*.405,.052],[subtitle,edge*.345,.025]]){
    if(!text)continue;
    const g=new TextGeometry(text,{font,size,depth:.006,curveSegments:6,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2});
    g.computeBoundingBox();const b=g.boundingBox,fit=Math.min(1,.88/(b.max.x-b.min.x||1));
    g.scale(fit,fit,1000);g.computeBoundingBox();g.translate(-(g.boundingBox.min.x+g.boundingBox.max.x)/2,y,6);
    g.setAttribute('aSlime',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count),1));g.setAttribute('aPurple',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(1),1));
    const m=new THREE.Mesh(g,material);mesh.add(m);relief.push({mesh:m,rest:g.attributes.position.array.slice()});
   }
  },
  clear(){pressure.fill(0);born.fill(-1);previous=null;time=0;},
  lift(){previous=null;},
  trace(point,width,height,dt,faceLocal=false,radius=9){
   mesh.updateMatrixWorld(true);
   const local=mesh.worldToLocal(new THREE.Vector3((point.screenX??point.x*width)-width/2,height/2-(point.screenY??point.y*height),mesh.position.z));
   const x=faceLocal?(point.x-.5)*mesh.scale.x*.94:local.x*mesh.scale.x,y=faceLocal?(.5-point.y)*mesh.scale.y*.94:local.y*mesh.scale.y;
   const a=previous&&Math.hypot(x-previous.x,y-previous.y)<Math.max(width,height)*.2?previous:{x,y},dx=x-a.x,dy=y-a.y;
   const ridgeWidth=Math.max(10,radius*1.8);
   for(let i=0;i<pressure.length;i++){
    const px=rest[i*3]*mesh.scale.x,py=rest[i*3+1]*mesh.scale.y;
    const t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/(dx*dx+dy*dy||1)));
    const d=Math.hypot(px-a.x-t*dx,py-a.y-t*dy);
    if(d<ridgeWidth*2.5){const dose=Math.exp(-d*d/(ridgeWidth*ridgeWidth))*dt*16;pressure[i]=Math.min(8,pressure[i]+dose);if(born[i]<0&&pressure[i]>.01)born[i]=time;}
   }
   previous={x,y};
  },
  update(dt,width,height,face,pixels,visible=true,size=1,globalState={}){
   time+=dt;mesh.visible=visible;
   // Approximate four-centimetre margins using CSS pixels; physical size varies by display.
   const margin=Math.min(151,Math.min(width,height)*.12);
   const sheetWidth=Math.min(width-24,(width-2*margin)*size),sheetHeight=Math.min(height-24,(height-2*margin)*size);
   mesh.scale.set(sheetWidth,sheetHeight,1);
   mesh.position.set(face?Math.max(-margin*.35,Math.min(margin*.35,face.x-width/2)):0,face?Math.max(-margin*.35,Math.min(margin*.35,height/2-face.y)):0,-70);
   mesh.rotation.set(face?face.pitch||0:0,face?face.yaw||0:0,face?-face.angle:0);
   uniforms.uView.value.set(width,height);uniforms.uPixels.value=pixels;uniforms.uClear.value=face?1:0;
   if(face){uniforms.uFace.value.set(face.x,face.y,face.width,face.height);uniforms.uAngle.value=face.angle;}
   const p=geometry.attributes.position;
   for(let i=0;i<pressure.length;i++){
    const state=localReaction(born[i]<0?-1:time-born[i],pressure[i]);
    reaction.array[i]=Math.max(state.slime*(1-state.plate),globalState.melt||0);purple.array[i]=state.purple*(1-state.plate);
    const x=rest[i*3],y=rest[i*3+1];
    p.array[i*3+2]=wave(x,y)+state.inflate*65+state.flow*12*Math.sin(y*28-time*2.8+x*10);
   }
   for(const item of relief){const g=item.mesh.geometry,attr=g.attributes.position;
    for(let j=0;j<attr.count;j++){const x=item.rest[j*3],y=item.rest[j*3+1],ix=Math.max(0,Math.min(96,Math.round((x+.5)*96))),iy=Math.max(0,Math.min(136,Math.round((.5-y)*136))),id=iy*97+ix;
     attr.array[j*3+2]=item.rest[j*3+2]+wave(x,y)+localReaction(born[id]<0?-1:time-born[id],pressure[id]).inflate*65;
     g.attributes.aSlime.array[j]=reaction.array[id];g.attributes.aPurple.array[j]=purple.array[id];}
    attr.needsUpdate=true;g.attributes.aSlime.needsUpdate=true;g.attributes.aPurple.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
   }
   p.needsUpdate=true;reaction.needsUpdate=true;purple.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  },
  get stats(){return {width:mesh.scale.x,height:mesh.scale.y,reliefMeshes:relief.length,rotation:[mesh.rotation.x,mesh.rotation.y,mesh.rotation.z],vertices:pressure.length};},
  dispose(){for(const item of relief)item.mesh.geometry.dispose();scene.remove(mesh);geometry.dispose();material.dispose();}
 };
}
