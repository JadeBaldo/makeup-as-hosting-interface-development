import * as THREE from 'three';
import {FontLoader} from './vendor/three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from './vendor/three/examples/jsm/geometries/TextGeometry.js';
import {buildSurfaceStudy} from './surface-study.mjs';
const $=id=>document.getElementById(id),scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
const camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.1,1000);camera.position.set(0,3,285);camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#121015');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.prepend(renderer.domElement);
// Broad bright panels become reflections in the shared red lacquer.
const studio=new THREE.Scene();studio.background=new THREE.Color('#393139');
for(const [x,y,z,w,h,intensity] of [[-60,70,100,45,110,5],[80,5,40,25,100,3],[0,90,-60,90,25,4]]){
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(intensity),side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
}
const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.04);scene.environment=env.texture;pmrem.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
scene.add(new THREE.AmbientLight(0xffffff,.35));const light=new THREE.DirectionalLight(0xffe4dd,2);light.position.set(-70,90,100);scene.add(light);
const material=new THREE.MeshPhysicalMaterial({color:'#8f0824',roughness:.2,metalness:.25,clearcoat:1,clearcoatRoughness:.1,envMapIntensity:1.15});
let study,held=false,seconds=0,last=performance.now(),dirty=true;
new FontLoader().load('./vendor/three/examples/fonts/gentilis_bold.typeface.json',font=>{
 const geo=new TextGeometry('I',{font,size:96,depth:13,curveSegments:12,bevelEnabled:true,bevelThickness:1.2,bevelSize:1,bevelSegments:4});geo.center();
 study=buildSurfaceStudy(geo);geo.dispose();group.add(new THREE.Mesh(study.shell,material),new THREE.Mesh(study.surface,material));$('grow').disabled=false;dirty=true;
},undefined,()=>{$('status').textContent='Could not load lettering. Open study.html through Live Server.';});
function stop(){held=false;}
$('grow').onpointerdown=e=>{held=true;$('grow').setPointerCapture(e.pointerId);};$('grow').onpointerup=$('grow').onpointercancel=stop;
addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'){e.preventDefault();held=true;}});addEventListener('keyup',e=>{if(e.code==='Space')stop();});
$('reset').onclick=()=>{seconds=0;held=false;dirty=true;};$('progress').oninput=e=>{seconds=Number(e.target.value);held=false;dirty=true;};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.06,(now-last)/1000);last=now;
 if(study&&held){seconds=Math.min(25,seconds+dt);dirty=true;}
 if(study&&dirty){study.update(seconds);$('progress').value=seconds;$('status').textContent=`${seconds.toFixed(1)} seconds of tracing · ${seconds<1.5?'surface swelling':seconds<19.5?'stretching and drooping':'full growth'} · release to freeze`;dirty=false;}
 group.rotation.y=Number($('angle').value)*Math.PI/180;renderer.render(scene,camera);
}requestAnimationFrame(frame);
