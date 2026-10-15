import {subtitleLayout} from './subtitle-layout.mjs';
import {BUILD_SECONDS,HOLD_SECONDS,SCORE_SECONDS,setBuildMinutes} from './score.mjs';
import {createCapture,createCaptureGesture} from './capture.mjs';
import {loadProgramme,saveProgramme} from './programme.mjs';
import {createMakeupInput} from './makeup-input.mjs?v=makeup-24';
import {createMembraneSheet} from './membrane-sheet.mjs?v=sheet-relief-23';
import {loadCameraTrackers,cameraError} from './camera-loader.mjs';
import * as THREE from 'three';
import {FontLoader} from './vendor/three/examples/jsm/loaders/FontLoader.js';
import {createDeformingTitle} from './deforming-title.mjs?v=sheet-relief-23';
import {PerformanceState,TITLES} from './state.mjs?v=editable-programme-25';
import {createStrokeRenderer} from './strokes.mjs?v=stroke-opacity-14';
import {faceSpace} from './face-space.mjs?v=palm-navigation-13';
import {createTitleMaterial} from './material.mjs?v=palm-navigation-13';
import {createInteraction} from './interaction.mjs?v=clear-slide-marks-16';
import {classifyHandPose,handAwayFromFace} from './hand-pose.mjs?v=palm-navigation-13';
import {smoothFace,headTurn,titleFaceTransform} from './face-motion.mjs?v=palm-navigation-13';
const $=id=>document.getElementById(id),programme=loadProgramme(TITLES),state=new PerformanceState(programme);
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
const membrane=createMembraneSheet(scene);
const makeup=createMakeupInput();let applicationSample={trace:null,point:null};
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
function refreshSlideList(){$('slides').replaceChildren();programme.forEach((t,i)=>$('slides').add(new Option(`${i+1} - ${t.title.replace(/\n/g,' ')}`,i)));$('slides').value=state.index;}
refreshSlideList();
function clearInk(){makeup.reset();membrane.clear();ctx.clearRect(0,0,W,H);lastStroke=null;strokeRenderer.clear();title.lift();}
function fitTitle(){baseFit=Math.max(.01,Math.min((W*.82)/(group.userData.width+24),(H*.58)/(group.userData.height+36)));}
function setTitleColours(){const hue=$('palette').value==='red'?.985:slideHues[state.index%slideHues.length];
 title.setColours(new THREE.Color().setHSL((hue+.5)%1,.95,.48),new THREE.Color().setHSL(hue,1,.38),new THREE.Color().setHSL(hue,1,.64));
}
function buildTitle(){
 if(!font)return;
 const t=programme[state.index];membrane.setText(t.title,t.subtitle,font);let lines=t.title.split('\n');
 if(lines.length===1&&lines[0].length>13)lines=lines[0].split(' ').reduce((a,w)=>{if(!a.length||`${a.at(-1)} ${w}`.length>14)a.push(w);else a[a.length-1]+=' '+w;return a;},[]);
 const rows=[...lines.map(text=>({text,size:52})),...(t.subtitle?[{text:t.subtitle,size:20}]:[])];
 const size=title.build(rows,font);group.userData.width=size.x;group.userData.height=size.y;fitTitle();setTitleColours();dirty=true;
}
function currentSubtitle(){const slide=programme[state.index];return [slide.title,slide.subtitle].filter(Boolean).join('\n');}
const subtitleMeasure=document.createElement('canvas').getContext('2d');
function refreshSubtitle(){
 const layout=subtitleLayout(currentSubtitle(),W*.8,Number($('subtitleSize').value),subtitleMeasure);
 $('performanceSubtitle').style.fontSize=layout.size+'px';
 $('performanceSubtitle').textContent=layout.lines.join('\n');
}
$('subtitleSize').oninput=refreshSubtitle;
function resetVisuals(){refreshSubtitle();lastStroke=null;strokeRenderer.finish();title.lift();buildTitle();$('slides').value=state.index;$('slideTitle').value=programme[state.index].title;$('slideSubtitle').value=programme[state.index].subtitle;$('counter').textContent=`${String(state.index+1).padStart(2,'0')} / ${String(programme.length).padStart(2,'0')}`;$('hint').classList.toggle('hidden',mode!=='demo');}
const interaction=createInteraction(state,{resetTitle:resetVisuals,clearStrokes:clearInk,finishDrawing(){lastStroke=null;strokeRenderer.finish();title.lift();}});
function advance(d=1){interaction.advance(d);}
function resize(){W=innerWidth;H=innerHeight;refreshSubtitle();ink.width=W;ink.height=H;renderer.setSize(W,H);camera.left=-W/2;camera.right=W/2;camera.top=H/2;camera.bottom=-H/2;camera.updateProjectionMatrix();fitTitle();dirty=true;lastStroke=null;}
addEventListener('resize',resize);ink.width=W;ink.height=H;
function mapPoint(p){const vw=video.videoWidth||640,vh=video.videoHeight||480,s=Math.max(W/vw,H/vh);return {x:W-(p.x*vw*s-(vw*s-W)/2),y:p.y*vh*s-(vh*s-H)/2};}
function updateFaceFrame(dt){
 if(!face){faceFrame=null;return;}
 const target=faceSpace(OVAL.map(i=>mapPoint(face[i])),mapPoint(face[33]),mapPoint(face[263]));
 Object.assign(target,headTurn(face));smoothedFace=smoothFace(smoothedFace,target,dt);faceFrame=smoothedFace;
}
function faceTrace(pose,dt){
 applicationSample=makeup.update({points:hands[0]?.map(mapPoint),pose,tool:$('makeupTool').value,reach:Number($('brushReach').value),lateral:Number($('brushLateral').value),frame:faceFrame,oval:face?OVAL.map(i=>mapPoint(face[i])):[],dt});
 return applicationSample.trace;
}
async function startCamera(){
 $('start').disabled=true;delete $('status').dataset.failed;$('status').textContent='Allow camera access when your browser asks…';
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access requires localhost or HTTPS.');
  stream?.getTracks().forEach(t=>t.stop());video.srcObject=null;mode='demo';hands=[];face=null;pointer=null;
  stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720},facingMode:'user'},audio:false});video.srcObject=stream;await video.play();
  $('status').textContent='Camera connected. Loading hand and face tracking…';
  ({handTracker,faceTracker}=await loadCameraTrackers());
  mode='camera';stage.classList.remove('demo');pointer=null;face=null;hands=[];smoothedFace=null;lastDetection=0;lastVideoTime=-1;state.resetGesture();state.reset();resetVisuals();
  renderer.render(scene,camera);capture.frame();try{capture.start();$('captureStatus').textContent='Recording. Open palm, then close into a fist to capture.';}catch(e){$('captureStatus').textContent=e.message;}
 }catch(e){stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;mode='demo';stage.classList.add('demo');$('status').dataset.failed='camera';$('status').textContent=cameraError(e);}
 finally{$('start').disabled=false;}
}
$('start').onclick=startCamera;
$('demo').onclick=()=>{delete $('status').dataset.failed;stream?.getTracks().forEach(t=>t.stop());video.srcObject=null;mode='demo';face=null;hands=[];faceFrame=null;smoothedFace=null;stage.classList.add('demo');state.resetGesture();state.reset();resetVisuals();};
function resetAll(){interaction.reset();}
$('prev').onclick=()=>advance(-1);$('next').onclick=()=>advance();$('reset').onclick=resetAll;
$('clearStrokes').onclick=()=>interaction.clear();
$('slides').onchange=e=>interaction.select(Number(e.target.value));
function storeSlides(){try{saveProgramme(programme);$('slideSaveStatus').textContent='Saved in this browser.';}catch(e){$('slideSaveStatus').textContent='Changes are active but could not be saved: '+e.message;}}
$('applySlide').onclick=()=>{const text=$('slideTitle').value.trim();if(!text){$('slideSaveStatus').textContent='Enter a title first.';return;}programme[state.index]={title:text,subtitle:$('slideSubtitle').value.trim()};refreshSlideList();interaction.select(state.index);storeSlides();};
$('addSlide').onclick=()=>{if(programme.length>=100){$('slideSaveStatus').textContent='Maximum 100 slides.';return;}programme.push({title:'NEW TITLE',subtitle:''});refreshSlideList();interaction.select(programme.length-1);storeSlides();$('slideTitle').focus();$('slideTitle').select();};
let scorePaused=false;
$('growthMinutes').oninput=e=>{
 if(e.target.value===''||!e.target.validity.valid)return;
 const stats=title.metalStats,previousBuild=BUILD_SECONDS;
 const elapsed=stats.scoreTime%SCORE_SECONDS;
 setBuildMinutes(e.target.value);
 $('scoreScrub').max=BUILD_SECONDS;
 if(stats.scoreStarted){
  title.inspect(elapsed<previousBuild?elapsed/previousBuild*BUILD_SECONDS:BUILD_SECONDS+elapsed-previousBuild);
  title.fall(0);
 }
};
$('scoreScrub').oninput=e=>{title.inspect(Number(e.target.value));title.fall(0);};
$('scorePause').onclick=()=>{scorePaused=!scorePaused;$('scorePause').textContent=scorePaused?'Resume score':'Pause score';};
for(const id of ['makeupTool','brushReach','brushLateral'])$(id).onchange=()=>{makeup.reset();strokeRenderer.finish();title.lift();lastStroke=null;};
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
const captureGesture=createCaptureGesture();
const capture=createCapture({renderer,scene,camera,video,ink,reset:()=>advance(),subtitle:currentSubtitle,subtitleSize:()=>Number($('subtitleSize').value),metadata:()=>({slide:state.index+1,programme:programme.map(s=>({...s})),score:title.score,mode}),onStatus:message=>{$('captureStatus').textContent=message;$('saveCapture').disabled=!capture.saved;}});
$('recordCapture').onclick=()=>{try{renderer.render(scene,camera);capture.frame();capture.start();$('captureStatus').textContent='Recording. Open palm, then close into a fist to capture.';}catch(e){$('captureStatus').textContent=e.message;}};
$('captureNow').onclick=()=>capture.capture();$('saveCapture').onclick=()=>capture.download();
let statusAt=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;
 if(mode==='camera'&&video.readyState>=2&&now-lastDetection>80&&video.currentTime!==lastVideoTime){
  lastDetection=now;lastVideoTime=video.currentTime;
  try{hands=handTracker.detectForVideo(video,now).landmarks;face=faceTracker.detectForVideo(video,now).faceLandmarks[0]||null;if($('status').dataset.failed==='tracking')delete $('status').dataset.failed;}catch(e){hands=[];face=null;$('status').dataset.failed='tracking';$('status').textContent='Tracking interrupted: '+e.message;}
 }
 if(mode==='camera'&&now-lastDetection>350){hands=[];face=null;faceFrame=null;}
 updateFaceFrame(dt);
 const pose=mode==='demo'?'pointing':hands[0]?classifyHandPose(hands[0]):'released';
 const candidate=mode==='demo'&&pointer?{x:pointer.x/W,y:pointer.y/H,screenX:pointer.x,screenY:pointer.y}:mode==='camera'?faceTrace(pose,dt):null;
 const away=mode==='camera'&&hands[0]?handAwayFromFace(hands[0].map(mapPoint),faceFrame):false;
 const {trace,mapped:mappedStroke}=interaction.frame(candidate?'pointing':pose,ready?candidate:null,dt,{navigationAllowed:false});
 $('gestureHold').hidden=true;
 $('gestureProgress').value=state.gestureProgress;
 if(trace){membrane.trace(trace,W,H,scorePaused?0:dt,mode==='camera',Number($('strokeWidth').value));dirty=true;$('hint').classList.add('hidden');
  strokeRenderer.colour($('palette').value==='red'?null:slideHues[state.index%slideHues.length]);
  strokeRenderer.add(trace,{radius:Number($('strokeWidth').value),depth:Number($('strokeDepth').value)});
 }else {membrane.lift();lastStroke=null;strokeRenderer.finish();}


 if(ready&&dirty)deform();group.visible=ready;
 const transform=titleFaceTransform(mode==='camera'?smoothedFace:null,W,H,baseFit,{width:group.userData.width||1,height:group.userData.height||1},Number($('scale').value));
 group.position.set(transform.x,transform.y,0);group.scale.setScalar(transform.scale*title.growth);
 group.rotation.set(transform.xRotation,transform.yRotation,transform.zRotation);

 strokeRenderer.follow(faceFrame,W,H,mode==='camera');
 title.animate(now/1000);group.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 if(mappedStroke&&ready){
  const travel=lastStroke?Math.hypot((mappedStroke.x-lastStroke.x)*640,(mappedStroke.y-lastStroke.y)*480):0;
  if(travel>120)title.lift();
  title.traceStroke(mappedStroke,Number($('strokeWidth').value),dt);
  lastStroke=mappedStroke;
 }else {title.lift();lastStroke=null;}
 const beforeScore=title.score.time;title.fall(scorePaused?0:dt);if(beforeScore<BUILD_SECONDS+HOLD_SECONDS&&title.score.time>=BUILD_SECONDS+HOLD_SECONDS){advance();title.inspect(BUILD_SECONDS+HOLD_SECONDS);title.fall(0);}
 const scoreSeconds=title.metalStats.scoreTime%SCORE_SECONDS;
 const clock=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
 $('scoreScrub').value=Math.min(BUILD_SECONDS,scoreSeconds);$('scoreTime').textContent=`${clock(Math.min(BUILD_SECONDS,scoreSeconds))} / ${clock(BUILD_SECONDS)}${scoreSeconds>BUILD_SECONDS?' ? reforming':''}`;title.renderSea(camera,mode==='camera'?(faceFrame||smoothedFace):null,W,H,renderer.getPixelRatio());
 membrane.update(scorePaused?0:dt,W,H,mode==='camera'?(faceFrame||smoothedFace):null,renderer.getPixelRatio(),ready,Math.max(.25,Math.min(2,(Number($('sheetSize').value)||100)/100)),title.score);
 const tip=mode==='camera'?applicationSample.point:null;$('makeupTip').hidden=!tip;if(tip){$('makeupTip').style.left=tip.x+'px';$('makeupTip').style.top=tip.y+'px';$('makeupTip').style.borderColor=candidate?'#b6ff88':'#ffbb77';}
 renderer.render(scene,camera);
 capture.frame();
 if(mode==='camera'&&ready&&captureGesture.update(pose,hands[0],dt)&&capture.recording)void capture.capture();
 if(now-statusAt>500&&ready&&!$('start').disabled&&!$('status').dataset.failed){statusAt=now;$('status').textContent=pose==='open'?('Close palm into a fist to capture'):pose==='closed'?'Reopen palm to arm another capture':mode==='demo'?'Rehearsal':!face?'Looking for a face':!hands.length?'Face found - show your hand':trace?($('makeupTool').value==='brush'?'Brush proxy - applying':'Finger - applying'):pose==='unknown'?'Ambiguous hand - drawing paused':'Lifted - material continues';}
}
new FontLoader().load('./vendor/three/examples/fonts/gentilis_bold.typeface.json',f=>{font=f;ready=true;resetVisuals();},undefined,e=>{$('status').textContent='Font failed to load. Serve this folder over localhost rather than opening the HTML file directly.';});
requestAnimationFrame(frame);

window.metalPerformance={capture,get sheet(){return membrane.stats},get ready(){return ready},get title(){return title},get state(){return state},get strokes(){return strokeRenderer.count},get mode(){return mode},get stats(){return title.metalStats},get group(){return group},get camera(){return camera},inspect:t=>title.inspect(t),mappedTrace(p,dt=.1){return title.traceStroke(p,Number($("strokeWidth").value),dt)},get layout(){return {width:group.userData.width,height:group.userData.height}},screenOf(p){const q=group.localToWorld(new THREE.Vector3(p.x,p.y,p.z||0)).project(camera);return {x:(q.x+1)*W/2,y:(1-q.y)*H/2}},reset:resetAll};
