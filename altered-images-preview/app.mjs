import * as THREE from 'three';
import {FontLoader} from './vendor/three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from './vendor/three/examples/jsm/geometries/TextGeometry.js';
import {PerformanceState,TITLES,regionAt,SLIDE_SECONDS} from './state.mjs';
import {createJets} from './jets.mjs';
import {createStrokeRenderer} from './strokes.mjs';
import {faceSpace} from './face-space.mjs';
import {createTitleMaterial} from './material.mjs';
const $=id=>document.getElementById(id),state=new PerformanceState();
const video=$('camera'),stage=$('stage'),ink=$('ink'),ctx=ink.getContext('2d');
let W=innerWidth,H=innerHeight,mode='demo',pointer=null,face=null,hands=[],handTracker,faceTracker,stream;
let lastDetection=0,lastVideoTime=-1,lastTime=performance.now(),lastStroke=null,dirty=true,ready=false;
let group=new THREE.Group(),meshes=[],baseFit=1,anchor={x:0,y:0},faceFrame=null;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-W/2,W/2,H/2,-H/2,.1,12000);
camera.position.z=6000;
let renderer;
try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch(e){$('status').textContent='WebGL is unavailable. Enable hardware acceleration in your browser.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(W,H);$('gl').append(renderer.domElement);scene.add(group);
const strokeRenderer=createStrokeRenderer(scene);
// Broad studio reflections make the metallic jelly readable from the front.
const environmentScene=new THREE.Scene();
environmentScene.background=new THREE.Color('#606579');
for(const [x,y,z,sx,sy,color,intensity] of [[-260,180,300,170,420,'#ffffff',5],[260,60,220,110,340,'#ffd7e5',3],[0,-240,160,420,90,'#b4dfff',3]]){
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity)}));
 panel.position.set(x,y,z);panel.lookAt(0,0,0);environmentScene.add(panel);
}
const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(environmentScene,.04);
scene.environment=environment.texture;pmrem.dispose();
environmentScene.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});
const slideHues=[.98,.08,.52,.78,.34,.62];
scene.add(new THREE.AmbientLight(0xffffff,1.35));
const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(-180,220,360);scene.add(key);
const rim=new THREE.DirectionalLight(0xff7890,1.8);rim.position.set(250,-160,180);scene.add(rim);
const surface=createTitleMaterial(),jets=createJets(group,surface.growthMaterial);let font;
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
TITLES.forEach((t,i)=>{$('slides').add(new Option(`${i+1} · ${t.title.replace('\n',' ')}`,i));});
function clearInk(){ctx.clearRect(0,0,W,H);lastStroke=null;strokeRenderer.clear();}
function buildTitle(preserve=false){
 if(!font)return;
 const saved=preserve?jets.capture():null;
 jets.clear();
 meshes.forEach(m=>{group.remove(m);m.geometry.dispose();});meshes=[];
 const t=TITLES[state.index];
 // Headings occupy the full composition; face sections drive growth only.
 let lines=t.title.split('\n');if(lines.length===1&&lines[0].length>13)lines=lines[0].split(' ').reduce((a,w)=>{if(!a.length||`${a.at(-1)} ${w}`.length>14)a.push(w);else a[a.length-1]+=' '+w;return a;},[]);
 const rows=[...lines.map(text=>({text,size:52})),...(t.subtitle?[{text:t.subtitle,size:20}]:[])];
 let y=0;
 for(const row of rows){
  const geo=new TextGeometry(row.text,{font,size:row.size,depth:16,curveSegments:8,bevelEnabled:true,bevelThickness:3,bevelSize:2,bevelSegments:5});
  geo.computeBoundingBox();const box=geo.boundingBox;geo.translate(-(box.max.x+box.min.x)/2,y-box.max.y,0);y-=row.size*1.2;
  const mesh=new THREE.Mesh(geo,surface.material);mesh.userData.base=Float32Array.from(geo.attributes.position.array);group.add(mesh);meshes.push(mesh);
 }
 const bounds=new THREE.Box3();meshes.forEach(m=>{m.geometry.computeBoundingBox();bounds.union(m.geometry.boundingBox);});
 const center=bounds.getCenter(new THREE.Vector3());meshes.forEach(m=>{m.geometry.translate(0,-center.y,0);m.userData.base=Float32Array.from(m.geometry.attributes.position.array);});
 const size=bounds.getSize(new THREE.Vector3());baseFit=Math.max(.01,Math.min((W*.82)/(size.x+24),(H*.58)/(size.y+36)));group.userData.width=size.x;group.userData.height=size.y;
 jets.seed(meshes,size.x,size.y);if(saved)jets.restore(saved);
 dirty=true;
}
function resetVisuals(){lastStroke=null;strokeRenderer.finish();buildTitle();$('slides').value=state.index;$('counter').textContent=`${String(state.index+1).padStart(2,'0')} / 06`;anchor={x:0,y:0};$('hint').classList.toggle('hidden',mode!=='demo');}
function advance(d=1){state.advance(d);resetVisuals();}
function cellCenter(region){return {x:((region%2)+.5)*W/2-W/2,y:H/2-(Math.floor(region/2)+.5)*H/3};}
function resize(){W=innerWidth;H=innerHeight;ink.width=W;ink.height=H;renderer.setSize(W,H);camera.left=-W/2;camera.right=W/2;camera.top=H/2;camera.bottom=-H/2;camera.updateProjectionMatrix();buildTitle(true);anchor={x:0,y:0};lastStroke=null;}
addEventListener('resize',resize);ink.width=W;ink.height=H;
function mapPoint(p){const vw=video.videoWidth||640,vh=video.videoHeight||480,s=Math.max(W/vw,H/vh);return {x:W-(p.x*vw*s-(vw*s-W)/2),y:p.y*vh*s-(vh*s-H)/2};}
function updateFaceFrame(){
 faceFrame=face?faceSpace(OVAL.map(i=>mapPoint(face[i])),mapPoint(face[33]),mapPoint(face[263])):null;
}
function faceTrace(){
 if(!faceFrame||!hands.length)return null;
 const oval=OVAL.map(i=>mapPoint(face[i]));
 for(const hand of hands){if(handPose(hand)==='closed')continue;const p=mapPoint(hand[8]);let inside=false;
  for(let i=0,j=oval.length-1;i<oval.length;j=i++){const a=oval[i],b=oval[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}
  if(inside){const {x,y}=faceFrame.local(p);return {x,y,screenX:p.x,screenY:p.y,region:regionAt(x,y)};}
 }return null;
}
function paintInk(){
 ctx.clearRect(0,0,W,H);
 const project=p=>mode==='camera'?faceFrame?.screen(p):{x:p.x*W,y:p.y*H};
 if(mode==='camera'&&!faceFrame)return;
 if(mode==='camera'&&$('guides').checked&&!document.body.classList.contains('clean')){
  ctx.strokeStyle='#ffffff66';ctx.lineWidth=1;ctx.beginPath();
  for(const [a,b] of [[{x:.5,y:0},{x:.5,y:1}],[{x:0,y:1/3},{x:1,y:1/3}],[{x:0,y:2/3},{x:1,y:2/3}]]){const p=project(a),q=project(b);ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);}ctx.stroke();
 }
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function handPose(h){let extended=0;for(const [tip,pip] of [[8,6],[12,10],[16,14],[20,18]])if(distance(h[tip],h[0])>distance(h[pip],h[0])*1.18)extended++;return extended>=4?'open':extended===0?'closed':'unknown';}
async function startCamera(){
 $('start').disabled=true;$('status').textContent='Loading hand and face models… Internet required on first load.';
 try{
  if(!handTracker){const {FilesetResolver,HandLandmarker,FaceLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/vision_bundle.mjs');
   const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm');
   handTracker=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:1});
   faceTracker=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:1});
  }
  stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:'user'},audio:false});video.srcObject=stream;await video.play();mode='camera';stage.classList.remove('demo');pointer=null;face=null;hands=[];state.gestureArmed=false;state.lastPose='unknown';state.reset();resetVisuals();
 }catch(e){$('status').textContent=`Camera setup failed: ${e.message}. Use localhost, allow camera access, and check your connection. Rehearsal remains available.`;}
 finally{$('start').disabled=false;}
}
$('start').onclick=startCamera;
$('demo').onclick=()=>{stream?.getTracks().forEach(t=>t.stop());video.srcObject=null;mode='demo';face=null;hands=[];faceFrame=null;stage.classList.add('demo');state.reset();resetVisuals();};
$('prev').onclick=()=>advance(-1);$('next').onclick=()=>advance();$('reset').onclick=()=>{clearInk();state.reset();resetVisuals();};
$('clearStrokes').onclick=clearInk;
$('slides').onchange=e=>{state.index=Number(e.target.value);state.reset();resetVisuals();};$('auto').onchange=e=>state.auto=e.target.checked;
$('palette').onchange=()=>dirty=true;
$('cameraAlpha').oninput=e=>video.style.opacity=e.target.value;
for(const id of ['scale','extent','titleAlpha'])$(id).oninput=()=>dirty=true;
$('guides').onchange=e=>$('grid').classList.toggle('hidden',!e.target.checked);
const toggleControls=()=>document.body.classList.toggle('clean');$('reveal').onclick=toggleControls;
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){$('status').textContent=e.message;}}$('full').onclick=fullscreen;
addEventListener('keydown',e=>{if(/INPUT|SELECT|BUTTON/.test(document.activeElement.tagName))return;if(e.key==='ArrowRight')advance();if(e.key==='ArrowLeft')advance(-1);if(e.key.toLowerCase()==='r'){clearInk();state.reset();resetVisuals();}if(e.key.toLowerCase()==='c')clearInk();if(e.key.toLowerCase()==='h')toggleControls();if(e.key.toLowerCase()==='f')fullscreen();if(e.code==='Space'){e.preventDefault();state.auto=!state.auto;$('auto').checked=state.auto;}});
stage.style.touchAction='none';stage.onpointerdown=e=>{if(mode==='demo'){stage.setPointerCapture(e.pointerId);pointer={x:e.clientX,y:e.clientY};}};stage.onpointermove=e=>{if(pointer)pointer={x:e.clientX,y:e.clientY};};stage.onpointerup=stage.onpointercancel=()=>pointer=null;
addEventListener('blur',()=>{pointer=null;hands=[];lastStroke=null;strokeRenderer.finish();});
function deform(){
 const extent=Number($('extent').value);
 jets.update({paintTime:state.paintTime,activity:state.activity,stroke:state.stroke,activeRegion:state.region,extent:extent*2.2});
 surface.update({titleHue:slideHues[state.index],strokeHue:(slideHues[state.index]+.12)%1,paintTime:state.paintTime,opacity:Number($('titleAlpha').value),activity:state.activity,stroke:state.stroke,activeRegion:state.region});
 group.scale.setScalar(baseFit*Number($('scale').value));dirty=false;
}
let statusAt=0;
function frame(now){requestAnimationFrame(frame);const wallDt=(now-lastTime)/1000,dt=Math.min(wallDt,.1);lastTime=now;
 if(mode==='camera'&&video.readyState>=2&&now-lastDetection>80&&video.currentTime!==lastVideoTime){
  lastDetection=now;lastVideoTime=video.currentTime;
  try{hands=handTracker.detectForVideo(video,now).landmarks;face=faceTracker.detectForVideo(video,now).faceLandmarks[0]||null;}catch(e){hands=[];face=null;$('status').textContent='Tracking interrupted: '+e.message;}
 }
 if(mode==='camera'&&now-lastDetection>350){hands=[];face=null;faceFrame=null;}
 updateFaceFrame();
 const before=state.index,oldElapsed=state.elapsed;
 const pose=mode==='camera'&&hands[0]?handPose(hands[0]):'unknown';const advanced=state.gesture(pose,dt);
 const trace=mode==='demo'&&pointer?{x:pointer.x/W,y:pointer.y/H,screenX:pointer.x,screenY:pointer.y,region:regionAt(pointer.x/W,pointer.y/H)}:mode==='camera'?faceTrace():null;
 state.tick(dt,advanced?null:trace,wallDt);
 if(before!==state.index||oldElapsed>state.elapsed){resetVisuals();lastStroke=null;}
 else if(trace){dirty=true;$('hint').classList.add('hidden');
  strokeRenderer.colour($('palette').value==='red'?null:slideHues[state.index]);
  strokeRenderer.add(trace,{radius:Number($('strokeWidth').value),depth:Number($('strokeDepth').value)});
 }else {lastStroke=null;strokeRenderer.finish();}


 if(ready&&dirty)deform();group.visible=state.visible&&ready&&(mode==='demo'||!!faceFrame);
 const point=faceFrame?.screen({x:.5,y:.5});
 const target={x:0,y:0},follow=1-Math.exp(-dt*14);
 anchor.x+=(target.x-anchor.x)*follow;anchor.y+=(target.y-anchor.y)*follow;group.position.set(anchor.x,anchor.y,0);
 group.rotation.x=.10;group.rotation.y=-.12;
 group.rotation.z+=((mode==='camera'&&faceFrame?-faceFrame.angle:0)-group.rotation.z)*follow;
 $('grid').classList.toggle('hidden',mode==='camera'||!$('guides').checked);paintInk();
 
 strokeRenderer.follow(faceFrame,W,H,mode==='camera');
 renderer.render(scene,camera);
 if(now-statusAt>500&&ready&&!$('start').disabled){statusAt=now;const remaining=Math.max(0,SLIDE_SECONDS-state.elapsed);$('status').textContent=`${mode==='demo'?'Rehearsal':!face?'Looking for a face':!hands.length?'Face found · show your hand':trace?'Tracing · accumulating':'Lifted · frozen'} · ${state.auto?`${Math.floor(remaining/60)}:${String(Math.floor(remaining%60)).padStart(2,'0')} to next`:'Timer paused'}${state.gestureArmed?' · gesture armed':''}`;}
}
new FontLoader().load('./vendor/three/examples/fonts/gentilis_bold.typeface.json',f=>{font=f;ready=true;resetVisuals();},undefined,e=>{$('status').textContent='Font failed to load. Serve this folder over localhost rather than opening the HTML file directly.';});
requestAnimationFrame(frame);
