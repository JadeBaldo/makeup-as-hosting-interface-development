import * as THREE from './vendor/three/three.module.js';
import {GRAPHICS_CONFIG} from './graphics-config.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createTaperedTubeGeometry(points,radius){const config=GRAPHICS_CONFIG.renderer,curve=new THREE.CatmullRomCurve3(points,false,'centripetal',.35),segments=Math.min(config.maxTrailPoints*config.tubeCurveSegmentsPerPoint,Math.max(24,points.length*config.tubeCurveSegmentsPerPoint)),radial=config.tubeRadialSegments,frames=curve.computeFrenetFrames(segments,false),positions=[],indices=[];for(let i=0;i<=segments;i++){const t=i/segments,center=curve.getPointAt(t),edge=Math.min(t,1-t)/config.taperFraction,s=clamp(edge,0,1),taper=s*s*(3-2*s);for(let j=0;j<=radial;j++){const angle=j/radial*Math.PI*2,normal=frames.normals[i],binormal=frames.binormals[i],ringRadius=radius*Math.max(.015,taper),x=center.x+ringRadius*(Math.cos(angle)*normal.x+Math.sin(angle)*binormal.x),y=center.y+ringRadius*(Math.cos(angle)*normal.y+Math.sin(angle)*binormal.y),z=center.z+ringRadius*(Math.cos(angle)*normal.z+Math.sin(angle)*binormal.z);positions.push(x,y,z);if(i<segments&&j<radial){const a=i*(radial+1)+j,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);}}}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;}

// The tube builder and lacquer parameters come from the uploaded prototype.
export function createStrokeRenderer(scene){
 const root=new THREE.Group();scene.add(root);const strokes=[];let active=null,currentHue=null;
 const l=GRAPHICS_CONFIG.lacquer;
 const material=new THREE.MeshPhysicalMaterial({color:l.front,emissive:l.emissive,emissiveIntensity:l.emissiveIntensity,roughness:l.roughness,metalness:l.metalness,clearcoat:l.tubeClearcoat,clearcoatRoughness:l.clearcoatRoughness});
 const echoMaterial=new THREE.MeshPhysicalMaterial({color:l.side,emissive:l.emissive,emissiveIntensity:.12,roughness:.34,metalness:.12,clearcoat:.72,transparent:true,opacity:GRAPHICS_CONFIG.echo.face.opacity,depthWrite:false});
 function disposeStroke(s){root.remove(s.group);s.geometry?.dispose();s.material.dispose();}
 function start(radius){const s={points:[],distance:0,radius,group:new THREE.Group(),geometry:null,material:material.clone()};if(currentHue!==null)s.material.color.setHSL(currentHue,.72,.56);strokes.push(s);root.add(s.group);if(strokes.length>192)disposeStroke(strokes.shift());return s;}
 function rebuild(s){s.geometry?.dispose();s.group.clear();s.geometry=s.points.length===1?new THREE.SphereGeometry(s.radius,20,14):createTaperedTubeGeometry(s.points,s.radius);
  const mesh=new THREE.Mesh(s.geometry,s.material);if(s.points.length===1)mesh.position.copy(s.points[0]);s.group.add(mesh);
  const echo=new THREE.Mesh(s.geometry,echoMaterial);echo.position.copy(mesh.position).add(new THREE.Vector3(6,-4,-7));s.group.add(echo);
 }
 return {
  add(point,{radius=9,depth=34}={}){
   const x=(point.x-.5)*640,y=(.5-point.y)*480;
   if(!active)active=start(radius);
   const previous=active.points.at(-1),distance=previous?Math.hypot(x-previous.x,y-previous.y):0;
   if(previous&&distance<1.5)return;
   if(previous&&distance>120){active=start(radius);}
   if(active.points.length>=GRAPHICS_CONFIG.renderer.maxTrailPoints){const last=active.points.at(-1).clone(),travel=active.distance;active=start(radius);active.points.push(last);active.distance=travel;}
   active.distance+=distance;const phase=active.distance*.018,z=Math.sin(phase)*depth+Math.sin(phase*.31)*depth*.28;
   active.points.push(new THREE.Vector3(x,y,z));rebuild(active);
  },
  finish(){active=null;},
  clear(){for(const s of strokes)disposeStroke(s);strokes.length=0;active=null;},
  colour(hue){if(hue!==currentHue)active=null;currentHue=hue;},
  follow(frame,width,height,webcam){
   root.visible=!webcam||!!frame;if(!root.visible)return;
   const center=webcam?frame.screen({x:.5,y:.5}):{x:width/2,y:height/2};
   const a=webcam?frame.screen({x:0,y:0}):{x:0,y:0},b=webcam?frame.screen({x:1,y:0}):{x:width,y:0},c=webcam?frame.screen({x:0,y:1}):{x:0,y:height};
   const sx=Math.hypot(b.x-a.x,b.y-a.y)/640,sy=Math.hypot(c.x-a.x,c.y-a.y)/480;
   root.position.set(center.x-width/2,height/2-center.y,60);root.rotation.z=webcam?-frame.angle:0;root.scale.set(sx,sy,Math.sqrt(sx*sy));
  },
  get count(){return strokes.length;},
  dispose(){this.clear();material.dispose();echoMaterial.dispose();scene.remove(root);}
 };
}
