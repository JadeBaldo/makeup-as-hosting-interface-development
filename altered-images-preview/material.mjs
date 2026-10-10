import * as THREE from 'three';
// Replace this module to introduce custom shaders. update() receives only accumulated
// painting time, never wall time: lifting the finger freezes material evolution.
export function createTitleMaterial(){
 const material=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:.82,roughness:.09,clearcoat:1,clearcoatRoughness:.035,transmission:0,envMapIntensity:3,transparent:false,opacity:1});
 const growthMaterial=material.clone();
 growthMaterial.metalness=.58;
 growthMaterial.roughness=.075;
 growthMaterial.transparent=true;
 growthMaterial.opacity=.92;
 growthMaterial.depthWrite=false;
 growthMaterial.side=THREE.FrontSide;
 return {material,growthMaterial,update({titleHue,strokeHue,paintTime,opacity,activity,stroke,activeRegion}){
  const blend=Math.min(.88,paintTime/65);
  material.color.copy(new THREE.Color().setHSL(titleHue,.32,.72)).lerp(new THREE.Color().setHSL(strokeHue,.48,.60),blend);
  growthMaterial.color.copy(material.color);
  growthMaterial.opacity=opacity;
 },dispose(){material.dispose();growthMaterial.dispose();}};
}
