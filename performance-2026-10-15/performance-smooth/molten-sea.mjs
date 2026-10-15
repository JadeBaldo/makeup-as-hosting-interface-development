import * as THREE from './vendor/three/three.module.js';
export function createMoltenSea(scene){
 const uniforms={uFlow:{value:0},uCoverage:{value:0},uOrigin:{value:new THREE.Vector2()},uFace:{value:new THREE.Vector4()},uView:{value:new THREE.Vector2()},uPixels:{value:1},uAngle:{value:0},uClear:{value:0}};
 const material=new THREE.MeshPhysicalMaterial({color:'#ffffff',metalness:.35,roughness:.17,clearcoat:.55,transparent:true,depthWrite:false,envMapIntensity:1.1,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uFlow; varying vec2 vSea;');
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
 float sa=position.x*8.0+position.y*2.0+uFlow*.7;
 float sb=position.y*7.0-position.x*3.0-uFlow*.5;
 float sc=position.x*5.0-position.y*6.0+uFlow*.35;
 float sx=.36*cos(sa)+.09*sin(sb)+.125*cos(sc);
 float sy=.09*cos(sa)-.21*sin(sb)-.15*cos(sc);
 objectNormal=normalize(vec3(-sx,-sy,1.0));`);
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vSea=position.xy;
 transformed.z=.045*sin(position.x*8.0+position.y*2.0+uFlow*.7)+.03*cos(position.y*7.0-position.x*3.0-uFlow*.5)+.025*sin(position.x*5.0-position.y*6.0+uFlow*.35);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float uFlow; uniform float uCoverage; uniform vec2 uOrigin; uniform vec4 uFace; uniform vec2 uView; uniform float uPixels; uniform float uAngle; uniform float uClear; varying vec2 vSea;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float basin=sin(vSea.x*9.0+cos(vSea.y*7.0+uFlow*.08)*1.6)+.7*cos(vSea.y*11.0-vSea.x*3.0-uFlow*.1);
 float liquidMetal=0.0;
 float pigment=.5+.5*sin(vSea.x*6.0-vSea.y*8.0+uFlow*.13);
 vec3 gel=mix(vec3(.019,.0004,.073),vec3(.24,.001,.085),pigment);
 diffuseColor.rgb=mix(gel,vec3(.40,.61,.90),liquidMetal);
 float distanceFromTitle=length((vSea-uOrigin)*vec2(1.0,1.15));
 float edgeRipple=.035*sin(vSea.x*19.0+uFlow*.19)*sin(vSea.y*17.0-uFlow*.15);
 float front=mix(-.12,1.75,uCoverage);
 diffuseColor.a*=1.0-smoothstep(front-.065,front+.065,distanceFromTitle+edgeRipple);
 vec2 faceOffset=vec2(gl_FragCoord.x/uPixels,uView.y-gl_FragCoord.y/uPixels)-uFace.xy;
 float ca=cos(uAngle),sa=sin(uAngle);
 vec2 faceLocal=vec2(ca*faceOffset.x+sa*faceOffset.y,-sa*faceOffset.x+ca*faceOffset.y);
 vec2 faceEdge=abs(faceLocal)-uFace.zw*.64;
 diffuseColor.a*=mix(1.0,smoothstep(-12.0,18.0,max(faceEdge.x,faceEdge.y)),uClear);
 if(diffuseColor.a<.001)discard;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.15,.22,liquidMetal);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(.12,1.0,liquidMetal);');
 };
 const geometry=new THREE.PlaneGeometry(1,1,96,72),mesh=new THREE.Mesh(geometry,material);mesh.name='Full-frame purple slime';mesh.renderOrder=20;mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);
 return {mesh,material,uniforms,faceCutout(face,width,height,pixels){uniforms.uView.value.set(width,height);uniforms.uPixels.value=pixels;uniforms.uClear.value=face?1:0;if(face){uniforms.uFace.value.set(face.x,face.y,face.width,face.height);uniforms.uAngle.value=face.angle;}},fit(camera){mesh.position.set(camera.position.x,camera.position.y,1.25);mesh.scale.set((camera.right-camera.left)*1.06,(camera.top-camera.bottom)*1.06,1);},update(time,coverage,origin){if(origin)uniforms.uOrigin.value.set(origin.x,origin.y);uniforms.uFlow.value=time;uniforms.uCoverage.value=coverage;mesh.visible=coverage>.0001;}};
}
