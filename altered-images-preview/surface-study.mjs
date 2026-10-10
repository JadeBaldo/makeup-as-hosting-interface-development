import * as THREE from './vendor/three/three.module.js';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const key=v=>`${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;

// Weld first, then split shared edges on every incident triangle. Front, bevel,
// wall and back use one rest-space field; material seams are never pinned.
export function buildSurfaceStudy(textGeometry,{spacing=2.2}={}){
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
 const count=vertices.length,mask=new Float32Array(count),dose=new Float32Array(count);
 function makePart(front){const ids=[],map=new Map(),indices=[];
  for(const t of triangles)if(t.front===front)for(const master of t.ids){if(!map.has(master)){map.set(master,ids.length);ids.push(master);}indices.push(map.get(master));}
  const geometry=new THREE.BufferGeometry(),base=new Float32Array(ids.length*3);
  ids.forEach((id,i)=>vertices[id].toArray(base,i*3));
  geometry.setAttribute('position',new THREE.BufferAttribute(base.slice(),3));geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(base.length),3));geometry.setAttribute('growthWeight',new THREE.BufferAttribute(new Float32Array(ids.length),1));geometry.setIndex(indices);
  geometry.userData.rest=base;geometry.userData.masterIds=ids;
  return geometry;
 }
 const surface=makePart(true),shell=makePart(false),parts=[surface,shell];
 let previous=null,time=0,extent=1,textColour=new THREE.Color('#143dff'),strokeColour=new THREE.Color('#bb005d'),growthColour=new THREE.Color('#ff168e');
 const sites=[],positions=vertices.map(v=>v.clone()),colours=vertices.map(()=>new THREE.Color()),tint=new THREE.Color(),sharedNormals=new Float32Array(count*3);
 const threshold=(x,y)=>7+2*(.5+.5*Math.sin(x*.55+y*.27));
 function render(){
  for(let i=0;i<count;i++){const rest=vertices[i],normal=normals[i],m=mask[i],d=dose[i],growth=smooth(d/8),rupture=smooth((d-threshold(rest.x,rest.y))/.85);
   const lobe=.85+.15*Math.sin(rest.x*.43+rest.y*.37),swelling=m*(.12+growth*10*lobe)*extent;
   // Leave a permanent compressed/warped footprint after rupture, not a reset.
   const lateral=swelling*(1-rupture*.62);
   positions[i].copy(rest);
   positions[i].x+=normal.x*lateral;
   positions[i].y+=normal.y*lateral-growth*m*(.7+rupture*1.2)*extent;
   positions[i].z+=normal.z*(swelling*(1-rupture*.96)-rupture*m*1.8*extent);
   positions[i].x+=Math.sin(time*.9+rest.x*.12)*growth*m*.16*(1-rupture)*extent;
   colours[i].copy(textColour);
   if(m>0){tint.copy(strokeColour).lerp(growthColour,smooth(d/2));tint.multiplyScalar(1-rupture*.3);colours[i].lerp(tint,smooth(m*2));}
  }
  for(const geometry of parts){const attr=geometry.attributes.position,color=geometry.attributes.color;
   geometry.userData.masterIds.forEach((id,i)=>{positions[id].toArray(attr.array,i*3);colours[id].toArray(color.array,i*3);geometry.attributes.growthWeight.array[i]=extent>0?smooth(mask[id]*2):0;});
   geometry.attributes.growthWeight.needsUpdate=true;
   attr.needsUpdate=true;color.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.computeBoundingBox();
  }
  // Share normals across the material seam as well as positions.
  sharedNormals.fill(0);
  for(const geometry of parts){const attr=geometry.attributes.normal.array;geometry.userData.masterIds.forEach((id,i)=>{for(let k=0;k<3;k++)sharedNormals[id*3+k]+=attr[i*3+k];});}
  for(let i=0;i<count;i++){const j=i*3,length=Math.hypot(sharedNormals[j],sharedNormals[j+1],sharedNormals[j+2])||1;for(let k=0;k<3;k++)sharedNormals[j+k]/=length;}
  for(const geometry of parts){geometry.userData.masterIds.forEach((id,i)=>{for(let k=0;k<3;k++)geometry.attributes.normal.array[i*3+k]=sharedNormals[id*3+k];});geometry.attributes.normal.needsUpdate=true;}
 }
 const contains=point=>originalFront.some(t=>THREE.Triangle.containsPoint(new THREE.Vector3(point.x,point.y,frontZ),...t));
 render();
 return {surface,shell,center,radius:3,frontZ,contains,
  // Invert a hit on the CURRENT surface with barycentric coordinates. The field
  // stays in material coordinates while the visible outline changes.
  restPoint(intersection){const g=intersection.object.geometry,f=intersection.face,q=intersection.object.worldToLocal(intersection.point.clone()),attr=g.attributes.position;
   const bary=THREE.Triangle.getBarycoord(q,...[f.a,f.b,f.c].map(i=>new THREE.Vector3().fromBufferAttribute(attr,i)),new THREE.Vector3());
   if(!bary)return null;
   const out=new THREE.Vector3(),rest=g.userData.rest;
   [f.a,f.b,f.c].forEach((i,j)=>out.addScaledVector(new THREE.Vector3().fromArray(rest,i*3),bary.getComponent(j)));return out;
  },
  setColours(text,stroke,growth){textColour.set(text);strokeColour.set(stroke);growthColour.set(growth);render();},
  setExtent(value){if(value===extent)return;extent=Math.max(0,value);render();},
  trace(point,width=3,surfaceHit=false){
   if(!surfaceHit&&!contains(point)){previous=null;return false;}
   const a=previous||point,b=point,dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
   let nearest=0,best=Infinity;
   for(let i=0;i<count;i++){const {x,y}=vertices[i],t=den?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/den)):0;
    mask[i]=Math.max(mask[i],smooth(1-Math.hypot(x-a.x-t*dx,y-a.y-t*dy)/width));
    const distance=Math.hypot(x-b.x,y-b.y,(vertices[i].z-frontZ)*.01);if(distance<best){best=distance;nearest=i;}
   }
   if(sites.length<350&&!sites.some(s=>Math.hypot(s.x-b.x,s.y-b.y)<3.8))sites.push({x:b.x,y:b.y,index:nearest,popped:false});
   previous={x:b.x,y:b.y};return true;
  },
  lift(){previous=null;},
  step(dt,point){if(!(dt>0)||!point)return [];time+=dt;
   for(let i=0;i<count;i++)if(mask[i]>0){const rest=vertices[i],near=Math.exp(-((rest.x-point.x)**2+(rest.y-point.y)**2)/65);dose[i]=Math.min(13,dose[i]+dt*(.28+1.8*near)*mask[i]);}
   render();const detached=[];
   for(const s of sites)if(!s.popped&&dose[s.index]>=threshold(s.x,s.y)){s.popped=true;const at=positions[s.index];detached.push({x:at.x,y:at.y,z:at.z});}
   return detached;
  },
  reset(){mask.fill(0);dose.fill(0);sites.length=0;previous=null;time=0;render();},
  dispose(){surface.dispose();shell.dispose();}
 };
}
