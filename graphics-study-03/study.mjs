import * as THREE from 'three';
import {FontLoader} from './vendor/three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from './vendor/three/examples/jsm/geometries/TextGeometry.js';
import {createLetterStudy} from './deformation.mjs';
import {performanceCycle,END_AT} from './performance-cycle.mjs';
const $=id=>document.getElementById(id),scene=new THREE.Scene();
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor('#030711');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;document.body.prepend(renderer.domElement);
const camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.1,1000);camera.position.set(0,8,275);camera.lookAt(0,0,0);
let landingFloor=0;
const studio=new THREE.Scene();studio.background=new THREE.Color('#081329');
// Local softbox gradients give broad reflection bands rather than hard white bars.
const softboxCanvas=document.createElement('canvas');softboxCanvas.width=128;softboxCanvas.height=256;
const ctx=softboxCanvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,128,0);
gradient.addColorStop(0,'#080808');gradient.addColorStop(.16,'#686868');gradient.addColorStop(.45,'#ffffff');gradient.addColorStop(.78,'#b0b0b0');gradient.addColorStop(1,'#101010');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,256);
const softboxTexture=new THREE.CanvasTexture(softboxCanvas);softboxTexture.colorSpace=THREE.SRGBColorSpace;
for(const [x,y,z,w,h,power,colour] of [[-65,70,100,38,130,4,'#d2faff'],[75,15,50,26,100,3,'#7096ff'],[0,95,-30,100,22,4,'#ffffff'],[-80,-40,20,30,60,2,'#1268ff'],[0,-80,85,100,28,2,'#5422ff']]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:softboxTexture,color:new THREE.Color(colour).multiplyScalar(power),side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);}
const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.03);scene.environment=env.texture;pmrem.dispose();softboxTexture.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});scene.add(new THREE.AmbientLight('#6095ff',.45));
for(const [x,y,z,power,colour] of [[-70,90,110,2.6,'#d8f8ff'],[80,0,40,1.5,'#2c74ff']]){const l=new THREE.DirectionalLight(colour,power);l.position.set(x,y,z);scene.add(l);}
const drops=[],dropGeometry=new THREE.SphereGeometry(.65,12,8),dropMaterial=new THREE.MeshPhysicalMaterial({color:'#20f0f5',roughness:.045,metalness:.1,clearcoat:1,transmission:.12,thickness:1,envMapIntensity:1.5});
let letter,time=0,paused=false,ready=false,last=performance.now(),fps=60,stats={},held=false,pointer=null,lastPoint=null,replaying=false,path=[],replayIndex=0,replayBorn=0,replayStarted=false,scrub=false;
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
function clearDrops(){for(const d of drops)scene.remove(d.mesh);drops.length=0;}
function reset(){letter?.reset();time=0;paused=false;held=false;pointer=null;lastPoint=null;replaying=false;replayIndex=0;clearDrops();$('pause').textContent='Pause';}
function startReplay(clear=true){if(!letter)return;if(clear)reset();letter.lift();replayBorn=time;replayIndex=0;replayStarted=false;replaying=true;paused=false;$('pause').textContent='Pause';}
function fit(){camera.aspect=innerWidth/innerHeight;camera.position.z=innerWidth<700?370:Math.max(265,200/camera.aspect);camera.lookAt(0,innerWidth<700?-25:0,0);camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);const viewH=2*camera.position.z*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));landingFloor=innerWidth<700?-25+(.5-(document.querySelector('aside').getBoundingClientRect().top-28)/innerHeight)*viewH:-viewH*.43;if(letter)letter.group.position.x=innerWidth<700?0:-12;}
new FontLoader().load('./vendor/three/examples/fonts/gentilis_bold.typeface.json',font=>{
 const geo=new TextGeometry('R',{font,size:100,depth:12,curveSegments:10,bevelEnabled:true,bevelThickness:1.8,bevelSize:1.25,bevelSegments:4});geo.center();letter=createLetterStudy(geo);letter.setPerformanceMode(true);geo.dispose();scene.add(letter.group);letter.group.rotation.set(.04,-.18,-.015);fit();
 const box=letter.front.boundingBox,w=box.max.x-box.min.x,h=box.max.y-box.min.y;
 // One unbroken stroke skims the shoulder and counter, then the descending leg.
 const anchors=[[.22,.87],[.39,.91],[.63,.84],[.69,.70],[.59,.56],[.41,.49],[.58,.30],[.78,.10]];
 for(let i=1;i<anchors.length;i++){const a=anchors[i-1],b=anchors[i];for(let j=0;j<9;j++)path.push({x:box.min.x+(a[0]+(b[0]-a[0])*j/9)*w,y:box.min.y+(a[1]+(b[1]-a[1])*j/9)*h,z:letter.frontZ});}
 // Filter invalid points and lift at gaps, never paint through the counter.
 ready=true;startReplay();
},undefined,()=>{$('status').textContent='Font unavailable. Start the local server.';});
const canvas=renderer.domElement;
canvas.onpointerdown=e=>{if(!ready)return;replaying=false;letter.lift();held=true;paused=false;$('pause').textContent='Pause';pointer={x:e.clientX,y:e.clientY};lastPoint=null;canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(held)pointer={x:e.clientX,y:e.clientY};};
function lift(){held=false;pointer=null;lastPoint=null;letter?.lift();}canvas.onpointerup=canvas.onpointercancel=lift;addEventListener('blur',lift);
$('reset').onclick=reset;$('replay').onclick=()=>startReplay();$('add').onclick=()=>startReplay(false);$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';};
$('soft').oninput=()=>{letter?.setSoftness(Number($('soft').value));$('soft-value').textContent=`${Math.round(Number($('soft').value)*100)}%`;};$('gloss').oninput=()=>letter?.setGloss(Number($('gloss').value));
$('glow').oninput=()=>letter?.setGlow(Number($('glow').value));
function inspect(t){paused=true;replaying=false;letter?.lift();time=t;scrub=true;clearDrops();$('pause').textContent='Resume';}
$('time').oninput=()=>inspect(Number($('time').value));addEventListener('resize',fit);
function frame(now){requestAnimationFrame(frame);const raw=(now-last)/1000,dt=Math.min(.08,raw);last=now;fps=fps*.96+(raw>0?1/raw:60)*.04;
 if(ready){
  if(!paused&&(letter.field.nextId||replaying||held))time=Math.min(END_AT,time+dt);
  if(replaying){const target=Math.min(path.length,Math.floor((time-replayBorn)/.8*path.length));while(replayIndex<target){const p=path[replayIndex++];if(letter.field.contains(p)){letter.trace(p,replayBorn);replayStarted=true;}else letter.lift();}if(replayIndex===path.length){letter.lift();replaying=false;}}
  const cycle=performanceCycle(letter.field.nextId?time:0);
  const box=letter.front.boundingBox,height=box.max.y-box.min.y,width=box.max.x-box.min.x;
  const viewH=2*camera.position.z*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),viewW=viewH*camera.aspect;
  const fillX=Math.max(1,viewW/width*.84),fillY=Math.max(1,viewH/height*.82);
  const scaleX=(1+(fillX-1)*cycle.crowding)*(1-cycle.empty*.12),scaleY=(1+(fillY-1)*cycle.crowding)*(1-cycle.empty*.12);
  letter.group.scale.set(scaleX,scaleY,Math.sqrt(scaleX*scaleY));
  const floor=landingFloor;
  letter.group.position.y=cycle.drop?cycle.drop*(floor+height*.17*scaleY):0;
  letter.group.position.x=(innerWidth<700?0:-12)*(1-cycle.crowding);
  letter.group.rotation.set(.04+Math.sin(time*.07)*.045*cycle.pressure*(1-cycle.empty),-.18*(1-cycle.empty),-.015+Math.sin(time*.1)*.025*cycle.pressure*(1-cycle.empty));
  letter.group.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  if(held&&pointer&&!paused){mouse.set(pointer.x/innerWidth*2-1,1-pointer.y/innerHeight*2);ray.setFromCamera(mouse,camera);const p=letter.pick(ray);if(p){if(!lastPoint||p.distanceTo(lastPoint)>.65){if(!letter.field.marks.length)time=0;letter.trace(p,time);lastPoint=p;}}else{letter.lift();lastPoint=null;}}
  stats=letter.update(time,{scrub});scrub=false;
  for(const event of stats.events){for(let i=0;i<2;i++){if(drops.length>=24){scene.remove(drops.shift().mesh);}const mesh=new THREE.Mesh(dropGeometry,dropMaterial);mesh.position.copy(letter.group.localToWorld(new THREE.Vector3(event.x+i*.6,event.y,letter.frontZ+4)));mesh.scale.set(.7,1.3,.7);scene.add(mesh);drops.push({mesh,age:0,v:new THREE.Vector3((i-.5)*1.2,.8+i,1.5)});}}
  if(!paused)for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.age+=dt;d.v.y-=14*dt;d.mesh.position.addScaledVector(d.v,dt);d.mesh.scale.y=1.3+Math.min(1,d.age*.6);if(d.age>2.2){scene.remove(d.mesh);drops.splice(i,1);}}
  $('status').textContent=`${paused?'Paused · ':''}${cycle.stage} / ${stats.stage} · ${stats.marks} strokes · one shared skin${letter.field.reason?' · '+letter.field.reason:''}`;
  $('time-value').textContent=`${time.toFixed(1)} s`;$('time').max=String(END_AT);$('time').value=time;
  $('metrics').textContent=`${Math.round(fps)} FPS · ${Math.round(renderer.info.render.triangles/1000)}k triangles`;
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.study={get ready(){return ready;},get letter(){return letter;},get time(){return time;},get stats(){return stats;},get drops(){return drops.length;},get fps(){return fps;},reset,replay:()=>startReplay(),addTrace:()=>startReplay(false),inspect,project(p){const v=letter.group.localToWorld(p.clone()).project(camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};},get cycle(){return performanceCycle(time);},get renderer(){return renderer;}};
