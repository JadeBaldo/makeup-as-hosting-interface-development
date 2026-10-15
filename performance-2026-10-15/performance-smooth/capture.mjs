import {subtitleLayout} from './subtitle-layout.mjs';
import * as THREE from './vendor/three/three.module.js';

// Require a stable, broadside open hand, then a stable fist. Reopen to rearm.
export function createCaptureGesture(){
 let open=0,closed=0,armed=false,age=0;
 return {update(pose,hand,dt){
  if(!hand){open=closed=age=0;armed=false;return false;}
  const a=hand[5],b=hand[17],w=hand[0];
  const u=[a.x-w.x,a.y-w.y,(a.z||0)-(w.z||0)],v=[b.x-w.x,b.y-w.y,(b.z||0)-(w.z||0)];
  const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const facing=Math.abs(normal[2])/Math.max(1e-9,Math.hypot(...normal))>.65;
  if(pose==='open'&&facing){open+=dt;closed=0;age=0;if(open>=.22)armed=true;}
  else {open=0;if(armed){age+=dt;closed=pose==='closed'&&facing?closed+dt:0;if(age>2){armed=false;closed=0;}else if(closed>=.12){armed=false;closed=0;return true;}}}
  return false;
 }};
}

export function exportOBJ(scene,stem){
 scene.updateMatrixWorld(true);const obj=[`mtllib ${stem}.mtl`],mtl=[];let offset=1,meshCount=0;
 scene.traverseVisible(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
  const g=mesh.geometry,p=g.attributes.position,uv=g.attributes.uv,n=g.attributes.normal;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  if(materials.every(m=>m.visible===false||m.opacity===0))return;
  const id=++meshCount;obj.push(`o mesh_${id}`);
  const point=new THREE.Vector3(),normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);obj.push(`v ${point.x} ${point.y} ${point.z}`);}
  for(let i=0;i<p.count;i++){if(uv)obj.push(`vt ${uv.getX(i)} ${uv.getY(i)}`);else obj.push('vt 0 0');}
  for(let i=0;i<p.count;i++){if(n)point.fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix);else point.set(0,0,1);obj.push(`vn ${point.x} ${point.y} ${point.z}`);}
  materials.forEach((m,j)=>{const c=m.color||new THREE.Color(1,1,1);mtl.push(`newmtl material_${id}_${j}\nKd ${c.r} ${c.g} ${c.b}\nd ${m.opacity??1}\nNs ${Math.round((1-(m.roughness??.5))*1000)}\nillum 2`);});
  const count=g.index?.count??p.count,start=g.drawRange.start,end=Math.min(count,Number.isFinite(g.drawRange.count)?start+g.drawRange.count:count);
  let previous=-1;
  for(let i=start;i+2<end;i+=3){const material=g.groups.find(group=>i>=group.start&&i<group.start+group.count)?.materialIndex||0;if(materials[material]?.visible===false)continue;if(material!==previous){obj.push(`usemtl material_${id}_${material}`);previous=material;}
   const indices=[0,1,2].map(j=>offset+(g.index?g.index.getX(i+j):i+j));if(mesh.matrixWorld.determinant()<0)indices.reverse();obj.push('f '+indices.map(k=>`${k}/${k}/${k}`).join(' '));}
  offset+=p.count;
 });
 return {obj:obj.join('\n'),mtl:mtl.join('\n\n'),meshCount};
}

// Uncompressed ZIP keeps video encoding in the browser and needs no dependency.
export async function makeZip(files){
 const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
 const table=Array.from({length:256},(_,n)=>{for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 const header=(size)=>{const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};};
 for(const [name,source] of Object.entries(files)){
  const data=new Uint8Array(await new Blob([source]).arrayBuffer()),filename=encoder.encode(name);let crc=0xffffffff;
  for(const byte of data)crc=table[(crc^byte)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
  if(offset+data.length>0xffffffff)throw Error('Capture exceeds ZIP size limit. Capture shorter video segments.');
  const h=header(30);h.view.setUint32(0,0x04034b50,true);h.view.setUint16(4,20,true);h.view.setUint16(6,0x800,true);h.view.setUint32(14,crc,true);h.view.setUint32(18,data.length,true);h.view.setUint32(22,data.length,true);h.view.setUint16(26,filename.length,true);
  parts.push(h.bytes,filename,data);
  const c=header(46);c.view.setUint32(0,0x02014b50,true);c.view.setUint16(4,20,true);c.view.setUint16(6,20,true);c.view.setUint16(8,0x800,true);c.view.setUint32(16,crc,true);c.view.setUint32(20,data.length,true);c.view.setUint32(24,data.length,true);c.view.setUint16(28,filename.length,true);c.view.setUint32(42,offset,true);central.push(c.bytes,filename);offset+=30+filename.length+data.length;
 }
 const size=central.reduce((n,b)=>n+b.length,0),end=header(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,central.length/2,true);end.view.setUint16(10,central.length/2,true);end.view.setUint32(12,size,true);end.view.setUint32(16,offset,true);
 return new Blob([...parts,...central,end.bytes],{type:'application/zip'});
}

export function createCapture({renderer,scene,camera,video,ink,reset,metadata,onStatus,subtitle=()=>'',subtitleSize=()=>22}){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 const cleanCanvas=document.createElement('canvas'),cleanCtx=cleanCanvas.getContext('2d');let recorder,cleanRecorder,recordStream,cleanStream,startedAt,busy=false,pending=null;
 function drawSubtitle(){
  const text=subtitle();if(!text)return;
  const scale=canvas.width/Math.max(1,globalThis.innerWidth||canvas.width);
  ctx.save();
  const layout=subtitleLayout(text,canvas.width*.8,subtitleSize()*scale,ctx),fontSize=layout.size,lines=layout.lines;
  ctx.font=`italic ${fontSize}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='bottom';
  ctx.shadowColor='#000';ctx.shadowBlur=8*scale;ctx.shadowOffsetY=2*scale;
  lines.forEach((line,i)=>ctx.fillText(line,canvas.width/2,canvas.height-28*scale-(lines.length-1-i)*fontSize*1.35,canvas.width*.8));ctx.restore();
 }
 function composite(){
  const w=renderer.domElement.width,h=renderer.domElement.height;
  if(!recorder||recorder.state==='inactive'){canvas.width=cleanCanvas.width=w;canvas.height=cleanCanvas.height=h;}
  ctx.fillStyle='#101213';ctx.fillRect(0,0,canvas.width,canvas.height);
  if(video.readyState>=2){const s=Math.max(canvas.width/video.videoWidth,canvas.height/video.videoHeight);ctx.save();ctx.translate(canvas.width,0);ctx.scale(-1,1);ctx.drawImage(video,(canvas.width-video.videoWidth*s)/2,(canvas.height-video.videoHeight*s)/2,video.videoWidth*s,video.videoHeight*s);ctx.restore();}
  // Copy the mirrored, cropped camera frame before adding any AR or ink.
  cleanCtx.drawImage(canvas,0,0);
  ctx.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);ctx.drawImage(ink,0,0,canvas.width,canvas.height);drawSubtitle();
 }
 function start(){
  if(recorder?.state==='recording')return;
  if(!globalThis.MediaRecorder||!canvas.captureStream)throw Error('Video recording needs a browser with MediaRecorder and canvas capture support.');
  composite();
  recordStream??=canvas.captureStream(30);
  cleanStream??=cleanCanvas.captureStream(30);
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
  function prepare(stream){
  const next=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),chunks=[];
  next.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  next.onerror=e=>onStatus('Recording failed: '+(e.error?.message||'unknown error'));
  next.onstop=()=>{next.resolveSegment?.(new Blob(chunks,{type:next.mimeType}));};
  return next;
  }
  const next=prepare(recordStream),cleanNext=prepare(cleanStream);startedAt=new Date().toISOString();
  try{next.start(1000);cleanNext.start(1000);}catch(e){if(next.state==='recording')next.stop();throw e;}
  recorder=next;cleanRecorder=cleanNext;
 }
 async function capture(){
  if(busy)return;busy=true;
  try{
   renderer.render(scene,camera);composite();
   if(!recorder||recorder.state!=='recording'||cleanRecorder?.state!=='recording')throw Error('Start recording before capturing.');
   const stamp=new Date().toISOString(),stem='altered-images-'+stamp.replace(/[:.]/g,'-'),meta={capturedAt:stamp,recordingStartedAt:startedAt,...metadata(),viewport:{width:canvas.width,height:canvas.height},format:'OBJ world-space geometry; MTL base materials. Custom shader appearance and screen-space face cutouts are represented in the PNG/video, not baked into OBJ.'};
   const still=new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Still capture failed')),'image/png'));
   function stopSegment(previous){const segment=new Promise(resolve=>previous.resolveSegment=resolve);previous.requestData();previous.stop();return segment;}
   const segment=stopSegment(recorder),cleanSegment=stopSegment(cleanRecorder);start();
   // Copy the live vertex arrays to export text before clearing the source geometry.
   const geometry=exportOBJ(scene,stem);meta.meshCount=geometry.meshCount;
   const png=await still;reset();onStatus('Recording restarted. Preparing capture…');
   const [clip,cleanClip]=await Promise.all([segment,cleanSegment]),extension=clip.type.includes('mp4')?'mp4':'webm',cleanExtension=cleanClip.type.includes('mp4')?'mp4':'webm';
   meta.videos={ar:stem+'.'+extension,webcamOnly:stem+'-webcam-only.'+cleanExtension,framing:'Both videos share the mirrored, cropped viewport framing.'};
   const zip=await makeZip({[stem+'.png']:png,[stem+'.obj']:geometry.obj,[stem+'.mtl']:geometry.mtl,[stem+'.'+extension]:clip,[stem+'-webcam-only.'+cleanExtension]:cleanClip,[stem+'.json']:JSON.stringify(meta,null,2)});
   pending={name:stem+'.zip',blob:zip};download();onStatus('Capture saved. Recording continues.');
  }catch(e){onStatus('Capture failed: '+e.message+' — scene retained unless capture already completed.');}
  finally{busy=false;}
 }
 function download(){if(!pending)return;const url=URL.createObjectURL(pending.blob),a=document.createElement('a');a.href=url;a.download=pending.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 // Match the recording rate instead of copying two full-resolution canvases
 // at display refresh rate. Forced still captures always composite immediately.
 let lastComposite=-Infinity;
 function frame(){
  if(recorder?.state!=='recording')return;
  const now=performance.now();
  if(now-lastComposite<1000/30-.5)return;
  lastComposite=now;composite();
 }
 return {frame,start,capture,download,get recording(){return recorder?.state==='recording'&&cleanRecorder?.state==='recording';},get busy(){return busy;},get saved(){return !!pending;}};
}
