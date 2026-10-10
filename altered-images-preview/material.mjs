import * as THREE from 'three';
// Vertex colours carry saturated base text and local stroke/growth colours.
// Opacity affects only painted/swollen vertices; unpainted text stays opaque.
export function createTitleMaterial(){
 const growthOpacity={value:.92};
 const material=new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,metalness:.65,roughness:.10,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:2.5,transparent:true,opacity:1});
 material.onBeforeCompile=shader=>{
  shader.uniforms.growthOpacity=growthOpacity;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float growthWeight;\nvarying float vGrowthWeight;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGrowthWeight = growthWeight;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float growthOpacity;\nvarying float vGrowthWeight;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= mix(1.0, growthOpacity, vGrowthWeight);');
 };
 material.customProgramCacheKey=()=> 'local-growth-opacity-v1';
 return {material,update({opacity}){growthOpacity.value=opacity;},dispose(){material.dispose();}};
}
