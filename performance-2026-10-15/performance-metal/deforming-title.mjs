import * as THREE from './vendor/three/three.module.js';
import {TextGeometry} from './vendor/three/examples/jsm/geometries/TextGeometry.js';
import {buildLocalMetal,layerMaterials} from './local-metal.mjs?v=layer-sequence-22';
import {createMoltenSea} from './molten-sea.mjs?v=sheet-relief-23';
import {scoreState,SCORE_SECONDS} from './score.mjs';
import {letterRotation} from './letter-motion.mjs?v=local-y-11';
import {DEFORMATION_CONFIG} from './deformation-config.mjs?v=section-timer-07';

export function createDeformingTitle(root,scene,material){
 const layers=layerMaterials(),sea=createMoltenSea(scene);let scoreTime=0,scoreStarted=false;
 const letters=[],pickMeshes=[],drops=[],dropGeometry=new THREE.SphereGeometry(1,12,8);
 let active=null,extent=1,colours=['#143dff','#bb005d','#ff168e'],strokePrevious=null;
 const layoutBounds=new THREE.Box3(),strokeStudies=new Set();
 function removeDrop(drop){scene.remove(drop.mesh);drop.mesh.material.dispose();}
 function clear(){scoreTime=0;scoreStarted=false;sea.update(0,0);for(const letter of letters){root.remove(letter.pivot);letter.study.dispose();}letters.length=0;pickMeshes.length=0;active=null;strokePrevious=null;strokeStudies.clear();for(const drop of drops)removeDrop(drop);drops.length=0;}
 function fit(rows,font){
  clear();let y=0;
  for(const row of rows){let pen=0;const rowLetters=[];
   for(const character of row.text){const glyph=font.data.glyphs[character]||font.data.glyphs['?'];const advance=(glyph?.ha||font.data.resolution*.4)/font.data.resolution*row.size;
    if(character.trim()){
     const geometry=new TextGeometry(character,{font,size:row.size,depth:row.size*.22,curveSegments:8,bevelEnabled:true,bevelThickness:row.size*.025,bevelSize:row.size*.02,bevelSegments:4});
     geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new THREE.Vector3());geometry.translate(-center.x,-center.y,-center.z);
     const study=buildLocalMetal(geometry,{spacing:3});geometry.dispose();study.setColours(...colours);study.setExtent(extent);
     const pivot=new THREE.Group();pivot.position.set(pen+center.x,y+center.y,0);const meshes=[study.surface,study.shell].map(g=>new THREE.Mesh(g,layers.silver));
     for(const mesh of meshes){mesh.userData.study=study;mesh.userData.letter=pivot;pivot.add(mesh);pickMeshes.push(mesh);}
     const inner=new THREE.Mesh(study.inner,layers.slime),fresh=new THREE.Mesh(study.fresh,layers.fresh);pivot.add(inner,fresh);const localDrops=[0,1].map(()=>{const m=new THREE.Mesh(dropGeometry,layers.slime);m.visible=false;pivot.add(m);return m;});
     root.add(pivot);const letter={pivot,study,index:letters.length,localDrops,bounds:study.surface.boundingBox.clone().union(study.shell.boundingBox)};letters.push(letter);rowLetters.push(letter);
    }pen+=advance;
   }
   for(const letter of rowLetters)letter.pivot.position.x-=pen/2;
   y-=row.size*1.25;
  }
  root.updateMatrixWorld(true);const bounds=new THREE.Box3();
  for(const letter of letters){const box=letter.study.surface.boundingBox.clone().union(letter.study.shell.boundingBox);box.translate(letter.pivot.position);bounds.union(box);}
  const center=bounds.getCenter(new THREE.Vector3());for(const letter of letters)letter.pivot.position.y-=center.y;
  layoutBounds.copy(bounds);layoutBounds.min.y-=center.y;layoutBounds.max.y-=center.y;
  return bounds.getSize(new THREE.Vector3());
 }
 return {
  build:fit,clear,
  snapshot(){return letters.map(letter=>letter.study.snapshot());},
  restore(saved){if(saved?.length===letters.length)saved.forEach((field,i)=>letters[i].study.restore(field));},
  animate(seconds){for(const letter of letters){const r=letterRotation(seconds,letter.index);letter.pivot.rotation.set(r.x,r.y,r.z);}},
  setColours(text,stroke,growth){colours=[text,stroke,growth];for(const letter of letters)letter.study.setColours(...colours);},
  setExtent(value){extent=value;for(const letter of letters)letter.study.setExtent(value);},
  lift(){active?.lift();active=null;for(const study of strokeStudies)study.lift();strokeStudies.clear();strokePrevious=null;},
  traceStroke(point,radius,dt){
   if(!letters.length)return false;
   const size=layoutBounds.getSize(new THREE.Vector3());
   const mapped={x:layoutBounds.min.x+point.x*size.x,y:layoutBounds.max.y-point.y*size.y};
   const width=Math.max(DEFORMATION_CONFIG.minimumRadius,Math.min(DEFORMATION_CONFIG.maximumRadius,radius*Math.sqrt((size.x/640)*(size.y/480))*DEFORMATION_CONFIG.brushMultiplier));
   const impact=dt*DEFORMATION_CONFIG.doseRate;
   const previous=strokePrevious||mapped,next=new Set();
   for(const letter of letters){
    const local=p=>new THREE.Vector3(p.x-letter.pivot.position.x,p.y-letter.pivot.position.y,letter.study.frontZ);
    const a=local(previous),b=local(mapped),box=letter.bounds;
    // The face stroke paints a fixed material map, independent of glyph rotation
    // and the fingertip's screen position. Include segments crossing a glyph.
    if(Math.max(a.x,b.x)+width<box.min.x||Math.min(a.x,b.x)-width>box.max.x||Math.max(a.y,b.y)+width<box.min.y||Math.min(a.y,b.y)-width>box.max.y){letter.study.lift();continue;}
    if(!strokeStudies.has(letter.study))letter.study.trace(a,width,true);
    letter.study.trace(b,width,true);next.add(letter.study);if(letter.study.localStats.marked)scoreStarted=true;
    for(const event of letter.study.step(impact,b,{spread:width*width})){
     const mesh=new THREE.Mesh(dropGeometry,new THREE.MeshPhysicalMaterial({color:colours[2],roughness:.12,metalness:.45,clearcoat:1,envMapIntensity:2}));
     mesh.position.copy(letter.pivot.localToWorld(new THREE.Vector3(event.x,event.y,event.z)));
     const scale=letter.pivot.getWorldScale(new THREE.Vector3()).length()/Math.sqrt(3);mesh.scale.set(scale*.7,scale*1.4,scale*.55);scene.add(mesh);
     if(drops.length>=90)removeDrop(drops.shift());drops.push({mesh,age:0,vy:scale*3,vx:Math.sin(event.x*3)*scale*3,scale});
    }
   }
   strokeStudies.clear();for(const study of next)strokeStudies.add(study);strokePrevious=mapped;return next.size>0;
  },
  trace(raycaster,width,dt,{worldWidth=false}={}){const intersection=raycaster.intersectObjects(pickMeshes,false)[0];if(!intersection){this.lift();return false;}
   const study=intersection.object.userData.study,point=study.restPoint(intersection);if(!point){this.lift();return false;}
   if(worldWidth){const scale=intersection.object.getWorldScale(new THREE.Vector3());width/=Math.max(.0001,Math.sqrt(Math.abs(scale.x*scale.y)));}
   if(active!==study){this.lift();active=study;}study.trace(point,width,true);scoreStarted=true;
   for(const event of study.step(dt,point)){
    const mesh=new THREE.Mesh(dropGeometry,new THREE.MeshPhysicalMaterial({color:colours[2],roughness:.12,metalness:.45,clearcoat:1,envMapIntensity:2}));
    mesh.position.copy(intersection.object.localToWorld(new THREE.Vector3(event.x,event.y,event.z)));
    const scale=intersection.object.getWorldScale(new THREE.Vector3()).length()/Math.sqrt(3);mesh.scale.set(scale*.7,scale*1.4,scale*.55);scene.add(mesh);
    if(drops.length>=90)removeDrop(drops.shift());drops.push({mesh,age:0,vy:scale*3,vx:Math.sin(event.x*3)*scale*3,scale});
   }return true;
  },
  get score(){return scoreStarted?scoreState(scoreTime):{time:0,melt:0,flood:0,reforming:false};},
  get growth(){return scoreStarted?scoreState(scoreTime).growth:1;},
  renderSea(camera,face=null,width=1,height=1,pixels=1){sea.faceCutout(face,width,height,pixels);sea.fit(camera);sea.mesh.position.z=3000;sea.mesh.scale.z=1000;const origin=root.getWorldPosition(new THREE.Vector3()).project(camera);sea.update(scoreTime,scoreStarted?scoreState(scoreTime).flood:0,{x:origin.x*.5,y:origin.y*.5});},
  inspect(seconds){scoreStarted=true;scoreTime=Math.max(0,seconds)%SCORE_SECONDS;},
  get metalStats(){return {scoreTime,scoreStarted,letters:letters.map(l=>l.study.localStats),sea:scoreStarted?scoreState(scoreTime).flood:0};},
  fall(dt){if(scoreStarted)scoreTime=scoreTime+dt;for(const l of letters){const state=l.study.advance(dt,scoreStarted?scoreState(scoreTime):{});l.localDrops.forEach((m,j)=>{const reveal=Math.max(0,(state.max-.33)/.6);m.visible=reveal>.01;if(state.point){m.position.copy(state.point);m.position.x+=(j?1.2:-.5);m.position.y-=reveal*(j?2.3:4);m.position.z+=1;m.scale.set(.7*reveal,1.8*reveal,.65*reveal);}});}for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.age+=dt;d.vy-=40*d.scale*dt;d.mesh.position.x+=d.vx*dt;d.mesh.position.y+=d.vy*dt;d.mesh.rotation.z+=dt*.7;if(d.age>3){removeDrop(d);drops.splice(i,1);}}},
  get letters(){return letters;},get detachedCount(){return drops.length;},
  dispose(){clear();dropGeometry.dispose();for(const m of Object.values(layers))m.dispose();scene.remove(sea.mesh);sea.mesh.geometry.dispose();sea.material.dispose();}
 };
}
