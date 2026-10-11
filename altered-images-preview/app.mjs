import * as THREE from 'three';
import {FontLoader} from './vendor/three/examples/jsm/loaders/FontLoader.js';
import {createDeformingTitle} from './deforming-title.mjs?v=palm-navigation-13';
import {PerformanceState,TITLES} from './state.mjs?v=palm-navigation-13';
import {createStrokeRenderer} from './strokes.mjs?v=stroke-opacity-14';
import {faceSpace} from './face-space.mjs?v=palm-navigation-13';
import {createTitleMaterial} from './material.mjs?v=palm-navigation-13';
import {createInteraction} from './interaction.mjs?v=accumulated-marks-15';
import {classifyHandPose,handAwayFromFace} from './hand-pose.mjs?v=palm-navigation-13';
import {smoothFace,headTurn,titleFaceTransform} from './face-motion.mjs?v=palm-navigation-13';
const $=id=>document.getElementById(id),state=new PerformanceState();
const video=$('camera'),stage=$('stage'),ink=$('ink'),ctx=ink.getContext('2d');
let W=innerWidth,H=innerHeight,mode='demo',pointer=null,face=null,hands=[],handTracker,faceTracker,stream;
let lastDetection=0,lastVideoTime=-1,lastTime=performance.now(),lastStroke=null,dirty=true,ready=false;
let group=new THREE.Group(),baseFit=1,faceFrame=null,smoothedFace=null;
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
const surface=createTitleMaterial(),title=createDeformingTitle(group,scene,surface.material);let font;
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
TITLES.forEach((t,i)=>{$('slides').add(new Option(`${i+1} · ${t.title.replace('\n',' ')}`,i));});
function clearInk(){ctx.clearRect(0,0,W,H);lastStroke=null;strokeRenderer.clear();title.lift();}
function fitTitle(){baseFit=Math.max(.01,Math.min((W*.82)/(group.userData.width+24),(H*.58)/(group.userData.height+36)));}
function setTitleColours(){const hue=$('palette').value==='red'?.985:slideHues[state.index];
 title.setColours(new THREE.Color().setHSL((hue+.5)%1,.95,.48),new THREE.Color().setHSL(hue,1,.38),new THREE.Color().setHSL(hue,1,.64));
}
function buildTitle(){
 if(!font)return;
 const t=TITLES[state.index];let lines=t.title.split('\n');
 if(lines.length===1&&lines[0].length>13)lines=lines[0].split(' ').reduce((a,w)=>{if(!a.length||`${a.at(-1)} ${w}`.length>14)a.push(w);else a[a.length-1]+=' '+w;return a;},[]);
 const rows=[...lines.map(text=>({text,size:52})),...(t.subtitle?[{text:t.subtitle,size:20}]:[])];
 const size=title.build(rows,font);group.userData.width=size.x;group.userData.height=size.y;fitTitle();setTitleColours();dirty=true;
}
function resetVisuals(){lastStroke=null;strokeRenderer.finish();title.lift();buildTitle();$('slides').value=state.index;$('counter').textContent=`${String(state.index+1).padStart(2,'0')} / 06`;$('hint').classList.toggle('hidden',mode!=='demo');}
const interaction=createInteraction(state,{resetTitle:resetVisuals,clearStrokes:clearInk,finishDrawing(){lastStroke=null;strokeRenderer.finish();title.lift();}});
function advance(d=1){interaction.advance(d);}
function resize(){W=innerWidth;H=innerHeight;ink.width=W;ink.height=H;renderer.setSize(W,H);camera.left=-W/2;camera.right=W/2;camera.top=H/2;camera.bottom=-H/2;camera.updateProjectionMatrix();fitTitle();dirty=true;lastStroke=null;}
addEventListener('resize',resize);ink.width=W;ink.height=H;
function mapPoint(p){const vw=video.videoWidth||640,vh=video.videoHeight||480,s=Math.max(W/vw,H/vh);return {x:W-(p.x*vw*s-(vw*s-W)/2),y:p.y*vh*s-(vh*s-H)/2};}
function updateFaceFrame(dt){
 if(!face){faceFrame=null;return;}
 const target=faceSpace(OVAL.map(i=>mapPoint(face[i])),mapPoint(face[33]),mapPoint(face[263]));
 Object.assign(target,headTurn(face));smoothedFace=smoothFace(smoothedFace,target,dt);faceFrame=smoothedFace;
}
function faceTrace(){
 if(!faceFrame||!hands.length)return null;
 const oval=OVAL.map(i=>mapPoint(face[i]));
 for(const hand of hands){if(classifyHandPose(hand)!=='pointing')continue;const p=mapPoint(hand[8]);let inside=false;
  for(let i=0,j=oval.length-1;i<oval.length;j=i++){const a=oval[i],b=oval[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}
  if(inside){const {x,y}=faceFrame.local(p);return {x,y,screenX:p.x,screenY:p.y};}
 }return null;
}
async function startCamera(){
 $('start').disabled=true;$('status').textContent='Loading hand and face models… Internet required on first load.';
 try{
  if(!handTracker){const {FilesetResolver,HandLandmarker,FaceLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/vision_bundle.mjs');
   const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm');
   handTracker=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:1});
   faceTracker=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:1});
  }
  stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:'user'},audio:false});video.srcObject=stream;await video.play();mode='camera';stage.classList.remove('demo');pointer=null;face=null;hands=[];smoothedFace=null;state.resetGesture();state.reset();resetVisuals();
 }catch(e){$('status').textContent=`Camera setup failed: ${e.message}. Use localhost, allow camera access, and check your connection. Rehearsal remains available.`;}
 finally{$('start').disabled=false;}
}
$('start').onclick=startCamera;
$('demo').onclick=()=>{stream?.getTracks().forEach(t=>t.stop());video.srcObject=null;mode='demo';face=null;hands=[];faceFrame=null;smoothedFace=null;stage.classList.add('demo');state.resetGesture();state.reset();resetVisuals();};
function resetAll(){interaction.reset();}
$('prev').onclick=()=>advance(-1);$('next').onclick=()=>advance();$('reset').onclick=resetAll;
$('clearStrokes').onclick=()=>interaction.clear();
$('slides').onchange=e=>interaction.select(Number(e.target.value));
$('strokeOpacity').oninput=e=>strokeRenderer.opacity(e.target.value);
$('palette').onchange=()=>{setTitleColours();dirty=true;};
for(const id of ['scale','extent'])$(id).oninput=()=>dirty=true;
const toggleControls=()=>document.body.classList.toggle('clean');$('reveal').onclick=toggleControls;
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){$('status').textContent=e.message;}}$('full').onclick=fullscreen;
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;if(e.key==='ArrowRight')advance();if(e.key==='ArrowLeft')advance(-1);if(e.key.toLowerCase()==='r')resetAll();if(e.key.toLowerCase()==='c')interaction.clear();if(e.key.toLowerCase()==='h')toggleControls();if(e.key.toLowerCase()==='f')fullscreen();});
stage.style.touchAction='none';stage.onpointerdown=e=>{if(mode==='demo'){stage.setPointerCapture(e.pointerId);pointer={x:e.clientX,y:e.clientY};}};stage.onpointermove=e=>{if(pointer)pointer={x:e.clientX,y:e.clientY};};stage.onpointerup=stage.onpointercancel=()=>pointer=null;
addEventListener('blur',()=>{pointer=null;hands=[];lastStroke=null;strokeRenderer.finish();title.lift();});
function deform(){
 title.setExtent(Number($('extent').value));
 surface.update({opacity:1});
 dirty=false;
}
let statusAt=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;
 if(mode==='camera'&&video.readyState>=2&&now-lastDetection>80&&video.currentTime!==lastVideoTime){
  lastDetection=now;lastVideoTime=video.currentTime;
  try{hands=handTracker.detectForVideo(video,now).landmarks;face=faceTracker.detectForVideo(video,now).faceLandmarks[0]||null;}catch(e){hands=[];face=null;$('status').textContent='Tracking interrupted: '+e.message;}
 }
 if(mode==='camera'&&now-lastDetection>350){hands=[];face=null;faceFrame=null;}
 updateFaceFrame(dt);
 const pose=mode==='demo'?'pointing':hands[0]?classifyHandPose(hands[0]):'released';
 const candidate=mode==='demo'&&pointer?{x:pointer.x/W,y:pointer.y/H,screenX:pointer.x,screenY:pointer.y}:mode==='camera'?faceTrace():null;
 const away=mode==='camera'&&hands[0]?handAwayFromFace(hands[0].map(mapPoint),faceFrame):false;
 const {trace,mapped:mappedStroke}=interaction.frame(pose,ready?candidate:null,dt,{navigationAllowed:away});
 $('gestureHold').hidden=pose!=='open'||!away||state.gestureLocked;
 $('gestureProgress').value=state.gestureProgress;
 if(trace){dirty=true;$('hint').classList.add('hidden');
  strokeRenderer.colour($('palette').value==='red'?null:slideHues[state.index]);
  strokeRenderer.add(trace,{radius:Number($('strokeWidth').value),depth:Number($('strokeDepth').value)});
 }else {lastStroke=null;strokeRenderer.finish();}


 if(ready&&dirty)deform();group.visible=ready;
 const transform=titleFaceTransform(mode==='camera'?smoothedFace:null,W,H,baseFit,{width:group.userData.width||1,height:group.userData.height||1},Number($('scale').value));
 group.position.set(transform.x,transform.y,0);group.scale.setScalar(transform.scale);
 group.rotation.set(transform.xRotation,transform.yRotation,transform.zRotation);

 strokeRenderer.follow(faceFrame,W,H,mode==='camera');
 title.animate(now/1000);group.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 if(mappedStroke&&ready){
  const travel=lastStroke?Math.hypot((mappedStroke.x-lastStroke.x)*640,(mappedStroke.y-lastStroke.y)*480):0;
  if(travel>120)title.lift();
  title.traceStroke(mappedStroke,Number($('strokeWidth').value),dt);
  lastStroke=mappedStroke;
 }else {title.lift();lastStroke=null;}
 title.fall(dt);
 renderer.render(scene,camera);
 if(now-statusAt>500&&ready&&!$('start').disabled&&!$('status').dataset.failed){statusAt=now;$('status').textContent=pose==='open'?(state.gestureLocked?'Release palm before repeating':away?'Hold palm away from face to advance':'Move palm away from face'):pose==='closed'?'Hand closed - use left arrow for previous slide':mode==='demo'?'Rehearsal':!face?'Looking for a face':!hands.length?'Face found - show your hand':trace?'Index pointing - drawing':pose==='unknown'?'Ambiguous hand - drawing paused':'Lifted - frozen';}
}
new FontLoader().load('./vendor/three/examples/fonts/gentilis_bold.typeface.json',f=>{font=f;ready=true;resetVisuals();},undefined,e=>{$('status').textContent='Font failed to load. Serve this folder over localhost rather than opening the HTML file directly.';});
requestAnimationFrame(frame);
