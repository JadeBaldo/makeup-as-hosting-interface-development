import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('./vendor/three/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const {FontLoader}=await import('./vendor/three/examples/jsm/loaders/FontLoader.js');
const {TextGeometry}=await import('./vendor/three/examples/jsm/geometries/TextGeometry.js');
const {buildSurfaceStudy}=await import('./surface-study.mjs');
const THREE=await import('./vendor/three/three.module.js');
const font=new FontLoader().parse(JSON.parse(readFileSync(new URL('./vendor/three/examples/fonts/gentilis_bold.typeface.json',import.meta.url))));
const geo=new TextGeometry('B',{font,size:96,depth:13,curveSegments:12,bevelEnabled:true,bevelThickness:1.2,bevelSize:1,bevelSegments:4});geo.center();
const s=buildSurfaceStudy(geo),p=s.surface.attributes.position,base=Float32Array.from(p.array),point=s.center.clone();
assert(s.contains(point));assert(!s.contains({x:999,y:999}));assert(s.trace(point,3));
s.step(2,point);assert([...p.array].every(Number.isFinite));assert(p.array.some((v,i)=>v!==base[i]));
const frozen=Float32Array.from(p.array);s.lift();assert.deepEqual(s.step(1,null),[]);assert.deepEqual(p.array,frozen);
for(let i=0;i<p.count;i++)if(Math.hypot(base[i*3]-point.x,base[i*3+1]-point.y)>3)assert.equal(p.getZ(i),base[i*3+2]);
let events=[];for(let i=0;i<40;i++)events.push(...s.step(.4,point));assert(events.length>=1);assert.equal(s.step(10,point).length,0);
assert([...s.surface.attributes.normal.array].every(Number.isFinite));s.reset();assert.deepEqual(p.array,base);
// A continuous stroke affects the region between endpoints, not just two dots.
const a=point.clone(),b=point.clone();a.y-=1;b.y+=1;
assert(s.trace(a,1.5));assert(s.trace(b,1.5));s.step(2,b);
let middleRaised=0;for(let i=0;i<p.count;i++)if(Math.hypot(base[i*3]-point.x,base[i*3+1]-point.y)<.6&&p.getZ(i)>base[i*3+2])middleRaised++;
assert(middleRaised>0);
// Every shared front/shell vertex must keep identical positions and normals.
function checkJoins(){const front=new Map(s.surface.userData.masterIds.map((id,i)=>[id,i]));let joins=0;
 s.shell.userData.masterIds.forEach((id,i)=>{if(!front.has(id))return;joins++;const j=front.get(id);
  for(const component of ['position','normal'])for(let k=0;k<3;k++)assert.equal(s.shell.attributes[component].array[i*3+k],s.surface.attributes[component].array[j*3+k]);
 });assert(joins>20);}
s.reset();checkJoins();
const shellBase=Float32Array.from(s.shell.attributes.position.array);
// Paint through a front contour instead of requiring fixed boundary vertices.
const edges=new Map();for(let i=0;i<s.surface.index.count;i+=3){const ids=[0,1,2].map(j=>s.surface.index.getX(i+j));for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],k=[a,b].sort((a,b)=>a-b).join(':');const e=edges.get(k);if(e)e.count++;else edges.set(k,{a,b,count:1});}}
const boundary=[...new Set([...edges.values()].filter(e=>e.count===1).flatMap(e=>[e.a,e.b]))];
const outer=boundary.reduce((a,b)=>base[a*3]>base[b*3]?a:b),outerPoint=new THREE.Vector3().fromArray(base,outer*3);
s.trace(outerPoint,6,true);s.step(2,outerPoint);checkJoins();
assert(p.getX(outer)>base[outer*3]+.1,'outer silhouette must expand');
assert(s.shell.attributes.position.array.some((v,i)=>v!==shellBase[i]),'bevels and walls must deform');
const inner=boundary.find(i=>base[i*3]>Math.min(...boundary.map(j=>base[j*3]))+5&&s.surface.attributes.normal.getX(i)<-.02);
assert.notEqual(inner,undefined,'find an inward-facing opening boundary');
s.reset();const innerPoint=new THREE.Vector3().fromArray(base,inner*3);
s.trace(innerPoint,6,true);s.step(2,innerPoint);checkJoins();
assert(p.getX(inner)<base[inner*3]-.1,'hole wall must move into its opening');
const first=p.getX(inner);s.trace(innerPoint,6,true);s.step(1,innerPoint);assert(p.getX(inner)<first,'retracing increases swelling');
// Unpainted vertices keep the saturated base colour, including the shell.
const textColour=new THREE.Color('#143dff');let unchanged=0,painted=0;
for(const geometry of [s.surface,s.shell]){assert([...geometry.attributes.position.array].every(Number.isFinite));assert([...geometry.attributes.normal.array].every(Number.isFinite));
 const rest=geometry.userData.rest,color=geometry.attributes.color;
 for(let i=0;i<color.count;i++){const distance=Math.hypot(rest[i*3]-innerPoint.x,rest[i*3+1]-innerPoint.y);
  if(distance>6){for(let k=0;k<3;k++)assert(Math.abs(color.array[i*3+k]-textColour.toArray()[k])<1e-6);unchanged++;}
  if(distance<1&&color.getX(i)>textColour.r+.1)painted++;
 }}assert(unchanged>0);assert(painted>0);
// Raycast actual deformed meshes at several view angles, then recover rest
// coordinates from that hit (including the bevels/walls).
const group=new THREE.Group(),mat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});group.add(new THREE.Mesh(s.surface,mat),new THREE.Mesh(s.shell,mat));
const camera=new THREE.PerspectiveCamera(32,1,.1,1000);camera.position.set(0,0,300);camera.updateMatrixWorld();
for(const angle of [0,.5,-.5]){group.rotation.y=angle;group.updateMatrixWorld(true);
 const target=new THREE.Vector3().fromBufferAttribute(p,inner).applyMatrix4(group.matrixWorld).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(target.x,target.y),camera);
 const hits=ray.intersectObjects(group.children);assert(hits.length>0);const intersection=hits[0],rest=s.restPoint(intersection);assert(rest&&rest.toArray().every(Number.isFinite));
 const g=intersection.object.geometry,f=intersection.face,local=intersection.object.worldToLocal(intersection.point.clone());
 const weights=THREE.Triangle.getBarycoord(rest,...[f.a,f.b,f.c].map(i=>new THREE.Vector3().fromArray(g.userData.rest,i*3)),new THREE.Vector3());
 const reconstructed=new THREE.Vector3();[f.a,f.b,f.c].forEach((i,j)=>reconstructed.addScaledVector(new THREE.Vector3().fromBufferAttribute(g.attributes.position,i),weights.getComponent(j)));
 assert(reconstructed.distanceTo(local)<1e-4,'drawing remains registered after deformation and rotation');
}
const beforeRupture=Float32Array.from(p.array);let ruptures=[];for(let i=0;i<40;i++)ruptures.push(...s.step(.4,innerPoint));assert(ruptures.length>0);
assert(p.array.some((v,i)=>v!==beforeRupture[i]));assert(p.array.some((v,i)=>v!==base[i]),'rupture leaves residual distortion');checkJoins();
const frozenShell=Float32Array.from(s.shell.attributes.position.array),frozenFront=Float32Array.from(p.array);s.lift();s.step(1,null);assert.deepEqual(p.array,frozenFront);assert.deepEqual(s.shell.attributes.position.array,frozenShell);
const savedField=s.snapshot();s.reset();s.restore(savedField);assert.deepEqual(p.array,frozenFront);assert.deepEqual(s.shell.attributes.position.array,frozenShell);
s.reset();assert.deepEqual(p.array,base);assert.deepEqual(s.shell.attributes.position.array,shellBase);checkJoins();
mat.dispose();s.dispose();geo.dispose();console.log('PASS: continuous trails, connected front/bevel/wall joins, outward silhouette, narrowing openings, retracing, rupture distortion, rotated raycast registration, freeze and reset.');
