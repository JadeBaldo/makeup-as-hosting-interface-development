import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const THREE=await import('./vendor/three/three.module.js');
const {FontLoader}=await import('./vendor/three/examples/jsm/loaders/FontLoader.js');
const {createDeformingTitle}=await import('./deforming-title.mjs');
const {createTitleMaterial}=await import('./material.mjs');
const {createStrokeRenderer}=await import('./strokes.mjs');
const {letterRotation}=await import('./letter-motion.mjs');
const {TITLES}=await import('./state.mjs');
const font=new FontLoader().parse(JSON.parse(readFileSync(new URL('./vendor/three/examples/fonts/gentilis_bold.typeface.json',import.meta.url))));
const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
const surface=createTitleMaterial(),title=createDeformingTitle(root,scene,surface.material),ink=createStrokeRenderer(scene);
title.build([{text:'BA',size:52}],font);assert.equal(title.letters.length,2);
const letter=title.letters[0],base=letter.study.surface.attributes.position.array.slice(),pivotCenter=letter.pivot.position.clone();
title.animate(0);const rotation=letter.pivot.rotation.clone();title.animate(5);
assert.notEqual(letter.pivot.rotation.y,rotation.y);
assert.notEqual(title.letters[0].pivot.rotation.y,title.letters[1].pivot.rotation.y);
assert.deepEqual(letter.study.surface.attributes.position.array,base,'turning must not advance deformation');
assert.deepEqual(letter.pivot.position,pivotCenter,'turn around own fixed centre, not an orbit');
const camera=new THREE.OrthographicCamera(-150,150,100,-100,.1,1000);camera.position.z=300;camera.updateMatrixWorld(true);
root.updateMatrixWorld(true);const target=letter.pivot.localToWorld(letter.study.center.clone()).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(target.x,target.y),camera);
assert(title.trace(ray,4,2));assert(letter.study.surface.attributes.position.array.some((v,i)=>v!==base[i]));
const frozen=letter.study.surface.attributes.position.array.slice();title.lift();title.animate(10);title.fall(.1);
assert.deepEqual(letter.study.surface.attributes.position.array,frozen,'drawing stops but letter motion continues');
root.scale.setScalar(1.4);root.scale.setScalar(1);assert.deepEqual(letter.study.surface.attributes.position.array,frozen,'refitting a viewport preserves deformation');
root.updateMatrixWorld(true);
const current=letter.pivot.localToWorld(letter.study.center.clone()).project(camera);ray.setFromCamera(new THREE.Vector2(current.x,current.y),camera);
assert(title.trace(ray,6,10));assert(title.detachedCount>0,'rupture must emit independent falling material');
title.lift();const loose=scene.children.find(mesh=>mesh.geometry?.type==='SphereGeometry'),fallStart=loose.position.y;
title.animate(15);title.fall(.5);assert(loose.position.y<fallStart,'detached material falls without drawing');
ink.colour(.52);ink.add({x:.4,y:.5});ink.finish();const colour=scene.children[1].children[0].children[0].material.color.getHexString();
title.build([{text:'B',size:52}],font);
assert.equal(ink.count,1,'new title must preserve accumulated strokes');
assert.equal(scene.children[1].children[0].children[0].material.color.getHexString(),colour);
assert.equal(title.detachedCount,0);
const before=title.letters[0].study.surface.attributes.position.array.slice();title.letters[0].study.step(1,null);assert.deepEqual(title.letters[0].study.surface.attributes.position.array,before);
const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>'};surface.material.onBeforeCompile(shader);surface.update({opacity:.2});
assert.equal(surface.material.opacity,1);assert.equal(shader.uniforms.growthOpacity.value,.2);
assert(shader.fragmentShader.includes('mix(1.0, growthOpacity, vGrowthWeight)'));
for(let i=0;i<30;i++){const a=letterRotation(100,i);assert.equal(a.x,0);assert.equal(a.z,0);assert(Object.values(a).every(Number.isFinite));}
// Exercise all actual programme glyphs, subtitles, accents and disposal.
for(const cue of TITLES){const size=title.build([...cue.title.split('\n').map(text=>({text,size:52})),...(cue.subtitle?[{text:cue.subtitle,size:20}]:[])],font);
 assert(size.x>0&&size.y>0);assert(title.letters.length>0);for(const glyph of title.letters)assert([...glyph.study.surface.attributes.position.array].every(Number.isFinite));
}
// Face strokes address material coordinates, even with the title elsewhere.
title.build([{text:'B',size:52}],font);
const mappedLetter=title.letters[0],bounds=mappedLetter.bounds,size=bounds.getSize(new THREE.Vector3());
const facePoint={x:(mappedLetter.study.center.x-bounds.min.x)/size.x,y:(bounds.max.y-mappedLetter.study.center.y)/size.y};
const originalTrace=mappedLetter.study.trace,samples=[];
mappedLetter.study.trace=(point,width)=>{samples.push({point:point.clone(),width});return true;};
root.position.set(900,-500,0);root.scale.setScalar(2);
title.animate(0);root.updateMatrixWorld(true);assert(title.traceStroke(facePoint,9,.016));title.lift();
title.animate(20);root.updateMatrixWorld(true);assert(title.traceStroke(facePoint,9,.016));title.lift();
assert(samples[0].point.distanceTo(samples.at(-1).point)<1e-6,'face mapping ignores screen placement and letter rotation');
assert(Math.abs(samples[0].width-Math.max(2.2,Math.min(12,13.5*Math.sqrt((size.x/640)*(size.y/480)))))<1e-6,'face strokes have a bounded local influence');
mappedLetter.study.trace=originalTrace;

// Exercise reset controls with real geometry and accumulated stroke meshes.
const {PerformanceState}=await import('./state.mjs');
const {createInteraction}=await import('./interaction.mjs');
const navigationState=new PerformanceState();
const actions=createInteraction(navigationState,{
 resetTitle(){ink.finish();title.lift();title.build([{text:'B',size:52}],font);},
 clearStrokes(){ink.clear();},finishDrawing(){ink.finish();title.lift();},
});
const fresh=title.letters[0].study.surface.attributes.position.array.slice();
const retainedColours=scene.children[1].children.map(stroke=>stroke.children[0].material.color.getHexString());
title.traceStroke(facePoint,9,120);
const changed=title.letters[0].study.surface.attributes.position.array.slice();
assert(changed.some((v,i)=>Math.abs(v-fresh[i])>.001));
actions.advance();assert.deepEqual(title.letters[0].study.surface.attributes.position.array,fresh);
assert.deepEqual(scene.children[1].children.map(stroke=>stroke.children[0].material.color.getHexString()),retainedColours,'navigation preserves strokes and colours');
title.traceStroke(facePoint,9,120);const beforeClear=title.letters[0].study.surface.attributes.position.array.slice();
actions.clear();assert.equal(ink.count,0);assert.deepEqual(title.letters[0].study.surface.attributes.position.array,beforeClear);
ink.colour(.34);ink.add({x:.3,y:.2});actions.reset();assert.equal(ink.count,0);assert.equal(navigationState.index,1);
assert.deepEqual(title.letters[0].study.surface.attributes.position.array,fresh);assert.equal(title.detachedCount,0);
title.animate(123);const phaseBeforeSlide=title.letters[0].pivot.rotation.y;
title.build([{text:'A',size:52}],font);title.animate(124);
assert(Math.abs(title.letters[0].pivot.rotation.y-phaseBeforeSlide-Math.PI*2/360)<1e-9,'new slide continues the shared rotation clock');
title.dispose();ink.dispose();surface.dispose();assert.equal(root.children.length,0);
console.log('PASS: independent continuous glyph turning, moving-surface picking, frozen swelling, slide/stroke isolation, local opacity, all programme glyphs and disposal.');
