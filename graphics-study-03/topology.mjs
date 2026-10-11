// Adapted from Deformation Study 01: geometry subdivision and picking only.
import * as THREE from './vendor/three/three.module.js';
const key=v=>`${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;

// Weld first, then split shared edges on every incident triangle. Front, bevel,
// wall and back use one rest-space field; material seams are never pinned.
export function buildSurfaceStudy(textGeometry,{spacing=2.5}={}){
 const src=textGeometry.index?textGeometry.toNonIndexed():textGeometry;
 const vertices=[],lookup=new Map(),triangles=[];
 function vertex(v){const k=key(v);if(lookup.has(k))return lookup.get(k);const i=vertices.length;vertices.push(v);lookup.set(k,i);return i;}
 const p=src.attributes.position,n=src.attributes.normal;
 for(let i=0;i<p.count;i+=3){const ids=[0,1,2].map(j=>vertex(new THREE.Vector3().fromBufferAttribute(p,i+j)));
  if(new Set(ids).size===3)triangles.push({ids,front:[0,1,2].every(j=>n.getZ(i+j)>.999)});
 }
 if(src!==textGeometry)src.dispose();
 const originalFront=triangles.filter(t=>t.front).map(t=>t.ids.map(i=>vertices[i].clone()));
 if(!originalFront.length)throw Error('No front surface found');
 const center=originalFront.map(t=>t[0].clone().add(t[1]).add(t[2]).multiplyScalar(1/3)).sort((a,b)=>a.lengthSq()-b.lengthSq())[0];
 const frontZ=originalFront[0][0].z;
 const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
 for(let pass=0;pass<9;pass++){
  const mids=new Map();
  for(const {ids} of triangles)for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],k=edgeKey(a,b);
   if(!mids.has(k)&&vertices[a].distanceTo(vertices[b])>spacing)mids.set(k,vertex(vertices[a].clone().add(vertices[b]).multiplyScalar(.5)));
  }
  if(!mids.size)break;
  const next=[];
  for(const t of triangles){const [a,b,c]=t.ids,ab=mids.get(edgeKey(a,b)),bc=mids.get(edgeKey(b,c)),ca=mids.get(edgeKey(c,a));
   const split=[ab,bc,ca].filter(i=>i!==undefined).length;
   const add=ids=>next.push({ids,front:t.front});
   if(!split){next.push(t);continue;}
   if(split===3){add([a,ab,ca]);add([ab,b,bc]);add([ca,bc,c]);add([ab,bc,ca]);}
   else if(split===1){const j=[ab,bc,ca].findIndex(i=>i!==undefined),u=t.ids[j],v=t.ids[(j+1)%3],w=t.ids[(j+2)%3],m=[ab,bc,ca][j];add([u,m,w]);add([m,v,w]);}
   else {const j=[ab,bc,ca].findIndex(i=>i===undefined),u=t.ids[(j+2)%3],v=t.ids[j],w=t.ids[(j+1)%3],uv=mids.get(edgeKey(u,v)),wu=mids.get(edgeKey(w,u));add([u,uv,wu]);add([uv,v,w]);add([uv,w,wu]);}
  }
  triangles.length=0;for(const t of next)triangles.push(t);
 }
 // Area-weighted rest normals give outward motion at outer contours and inward
 // motion at hole contours. A shared vertex gets exactly one displacement.
 const normals=vertices.map(()=>new THREE.Vector3());
 for(const {ids:[a,b,c]} of triangles){const normal=new THREE.Vector3().subVectors(vertices[b],vertices[a]).cross(new THREE.Vector3().subVectors(vertices[c],vertices[a]));for(const i of [a,b,c])normals[i].add(normal);}
 normals.forEach(v=>v.normalize());
 
 function makePart(front){const ids=[],map=new Map(),indices=[];
  for(const t of triangles)if(t.front===front)for(const master of t.ids){if(!map.has(master)){map.set(master,ids.length);ids.push(master);}indices.push(map.get(master));}
  const geometry=new THREE.BufferGeometry(),base=new Float32Array(ids.length*3);
  ids.forEach((id,i)=>vertices[id].toArray(base,i*3));
  geometry.setAttribute('position',new THREE.BufferAttribute(base.slice(),3));geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(base.length),3));geometry.setIndex(indices);
  geometry.userData.rest=base;geometry.userData.masterIds=ids;
  return geometry;
 }
 const surface=makePart(true),shell=makePart(false);
 for(const geometry of [surface,shell]){
  const buffer=new Float32Array(geometry.attributes.position.count*3);
  geometry.userData.masterIds.forEach((id,i)=>normals[id].toArray(buffer,i*3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(buffer,3));
  geometry.computeBoundingSphere();geometry.computeBoundingBox();
 }
 const contains=point=>originalFront.some(t=>THREE.Triangle.containsPoint(new THREE.Vector3(point.x,point.y,frontZ),...t));
 return {surface,shell,center,frontZ,contains,vertices,normals,
  restPoint(intersection){const g=intersection.object.geometry,f=intersection.face,q=intersection.object.worldToLocal(intersection.point.clone()),attr=g.attributes.position;
   const bary=THREE.Triangle.getBarycoord(q,...[f.a,f.b,f.c].map(i=>new THREE.Vector3().fromBufferAttribute(attr,i)),new THREE.Vector3());
   if(!bary)return null;
   const out=new THREE.Vector3(),rest=g.userData.rest;
   [f.a,f.b,f.c].forEach((i,j)=>out.addScaledVector(new THREE.Vector3().fromArray(rest,i*3),bary.getComponent(j)));return out;
  },dispose(){surface.dispose();shell.dispose();}
 };
}
