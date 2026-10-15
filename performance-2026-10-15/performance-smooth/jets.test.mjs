import assert from 'node:assert/strict';
import * as THREE from './vendor/three/three.module.js';
import {makeJetGeometry,shapeJet,createJets} from './jets.mjs';
const geometry=makeJetGeometry();
for(const growth of [0,.25,1]){
 shapeJet(geometry,{growth,time:17,seed:3,extent:1});
 assert([...geometry.attributes.position.array].every(Number.isFinite));
 assert([...geometry.attributes.normal.array].every(Number.isFinite));
 assert.equal(geometry.attributes.position.getZ(0),Math.fround(-1.2));
 const {segments,radial}=geometry.userData,tip=segments*(radial+1);
 assert(Math.abs(geometry.attributes.position.getX(tip)-geometry.attributes.position.getX(tip+8))<1e-5);
}
geometry.dispose();
const large=makeJetGeometry();
shapeJet(large,{growth:1,time:30,seed:7,extent:6.6});
assert([...large.attributes.position.array].every(Number.isFinite));
assert([...large.attributes.normal.array].every(Number.isFinite));
large.computeBoundingBox();assert(large.boundingBox.max.z>600);large.dispose();
const group=new THREE.Group(),mat=new THREE.MeshPhysicalMaterial(),text=new THREE.Mesh(new THREE.BoxGeometry(100,100,9,4,4,1),mat);
const jets=createJets(group,mat);jets.seed([text],100,100);assert(jets.count>0);
let input={paintTime:0,activity:[0,0,0,0,0,0],stroke:{x:.2,y:.2},activeRegion:0,extent:1};
jets.update(input);assert(group.children.every(m=>!m.visible));
for(let i=1;i<=50;i++){input={...input,paintTime:i/10,activity:[.6,.1,.1,.1,.1,.1]};jets.update(input);}
assert(group.children.some(m=>m.visible));
const before=group.children.map(m=>Array.from(m.geometry.attributes.position.array));jets.update(input);
assert.deepEqual(group.children.map(m=>Array.from(m.geometry.attributes.position.array)),before);
const saved=jets.capture();jets.seed([text],100,100);jets.restore(saved);jets.update(input);
assert.deepEqual(group.children.map(m=>Array.from(m.geometry.attributes.position.array)),before);
jets.clear();assert.equal(group.children.length,0);text.geometry.dispose();mat.dispose();
console.log('PASS: attached roots, closed bulb tips, finite geometry, readable initial state, growth, freeze and resize preservation');
