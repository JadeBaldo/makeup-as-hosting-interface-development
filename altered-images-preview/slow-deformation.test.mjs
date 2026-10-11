import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const THREE=await import('./vendor/three/three.module.js');
const {FontLoader}=await import('./vendor/three/examples/jsm/loaders/FontLoader.js');
const {createDeformingTitle}=await import('./deforming-title.mjs');
const font=new FontLoader().parse(JSON.parse(readFileSync(new URL('./vendor/three/examples/fonts/gentilis_bold.typeface.json',import.meta.url))));
const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
const material=new THREE.MeshBasicMaterial(),title=createDeformingTitle(root,scene,material);
title.build([{text:'B',size:52}],font);
const letter=title.letters[0],bounds=letter.bounds,size=bounds.getSize(new THREE.Vector3());
const point={x:(letter.study.center.x-bounds.min.x)/size.x,y:(bounds.max.y-letter.study.center.y)/size.y};
const base=letter.study.surface.attributes.position.array.slice();
let elapsed=0,late;
for(const seconds of [1,60,180,300,330,360]){
 title.traceStroke(point,9,seconds-elapsed);elapsed=seconds;
 const saved=letter.study.snapshot(),peak=Math.max(...saved.dose);
 assert(peak<=seconds*8/360+.001,'dose must respect the six-minute upper bound');
 if(seconds<=180)assert.equal(title.detachedCount,0,'no premature rupture');
 if(seconds===330)late=letter.study.surface.attributes.position.array.slice();
}
const end=letter.study.surface.attributes.position.array.slice();
assert(end.some((v,i)=>Math.abs(v-late[i])>.001),'shape keeps changing during the final thirty seconds');
assert(end.some((v,i)=>Math.abs(v-base[i])>.1),'actual glyph geometry changes');
assert(letter.study.snapshot().mask.some(v=>v===0),'a small stroke leaves part of the glyph untouched');
title.lift();title.fall(1);assert.deepEqual(letter.study.surface.attributes.position.array,end,'lifting freezes slow deformation');
title.dispose();material.dispose();
console.log('PASS: local brush, six-minute dose bound, no early rupture, late shape changes and lift freeze');
