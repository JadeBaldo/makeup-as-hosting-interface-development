import * as THREE from 'three';
import {FontLoader} from './vendor/three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from './vendor/three/examples/jsm/geometries/TextGeometry.js';
import {letterRotation} from './letter-motion.mjs';
import {buildSurfaceStudy} from './surface-study.mjs?v=body02';
const $=id=>document.getElementById(id),scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
const camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.1,1000);camera.position.set(0,-10,300);camera.lookAt(0,-10,0);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#090914');renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;document.body.prepend(renderer.domElement);
const studio=new THREE.Scene();studio.background=new THREE.Color('#151525');
for(const [x,y,z,w,h,intensity] of [[-60,70,100,30,110,3],[80,5,40,20,100,2],[0,90,-60,80,20,2]]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(intensity),side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);}
const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.04);scene.environment=env.texture;pmrem.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});scene.add(new THREE.AmbientLight(0xffffff,.65));const light=new THREE.DirectionalLight(0xffffff,1.8);light.position.set(-70,90,100);scene.add(light);
const properties={roughness:.24,metalness:.08,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.8};
const material=new THREE.MeshPhysicalMaterial({...properties,color:0xffffff,vertexColors:true});
const shellMaterial=new THREE.MeshPhysicalMaterial({...properties,color:0xffffff,vertexColors:true}),dropMaterial=new THREE.MeshPhysicalMaterial({...properties,color:'#ff168e'});
const palettes={cobalt:['#143dff','#bb005d','#ff168e'],cyan:['#00cfff','#ad002c','#ff174a'],violet:['#7100ff','#087b29','#40ff25']};
let study,pointer=null,held=false,last=performance.now(),seconds=0,pops=0;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const drops=[],dropGeometry=new THREE.SphereGeometry(1,16,12);
function applyPalette(){const [text,stroke,growth]=palettes[$('palette').value];study?.setColours(text,stroke,growth);dropMaterial.color.set(growth);$('swatch').innerHTML=` <span style="color:${stroke}">● stroke</span> → <span style="color:${growth}">● growth</span>`;}
function addDrops(events){for(const e of events){if(drops.length>=90){scene.remove(drops.shift().mesh);}const mesh=new THREE.Mesh(dropGeometry,dropMaterial);const position=new THREE.Vector3(e.x,e.y,e.z).applyMatrix4(group.matrixWorld);mesh.position.copy(position);mesh.scale.set(.7,1.4,.55);scene.add(mesh);drops.push({mesh,age:0,vx:Math.sin(e.x*3)*3,vy:3,vz:4});pops++;}}
new FontLoader().load('./vendor/three/examples/fonts/gentilis_bold.typeface.json',font=>{const geo=new TextGeometry('B',{font,size:96,depth:13,curveSegments:12,bevelEnabled:true,bevelThickness:1.2,bevelSize:1,bevelSegments:4});geo.center();study=buildSurfaceStudy(geo);geo.dispose();group.add(new THREE.Mesh(study.shell,shellMaterial),new THREE.Mesh(study.surface,material));applyPalette();$('status').textContent='Ready · draw on the coloured letter.';},undefined,()=>{$('status').textContent='Font failed to load. Open index.html through Live Server.';});
function stop(){held=false;pointer=null;study?.lift();}
const canvas=renderer.domElement;
canvas.onpointerdown=e=>{held=true;pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(held)pointer={x:e.clientX,y:e.clientY};};canvas.onpointerup=canvas.onpointercancel=stop;
addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
$('reset').onclick=()=>{stop();study?.reset();for(const d of drops)scene.remove(d.mesh);drops.length=0;seconds=0;pops=0;};$('palette').onchange=applyPalette;
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.06,(now-last)/1000);last=now;const turn=letterRotation(now/1000,0);group.rotation.set(turn.x,Number($('angle').value)*Math.PI/180+turn.y,turn.z);group.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 let touching=false;
 if(study&&held&&pointer){mouse.set(pointer.x/innerWidth*2-1,1-pointer.y/innerHeight*2);raycaster.setFromCamera(mouse,camera);const intersection=raycaster.intersectObjects(group.children,false)[0];const hit=intersection?study.restPoint(intersection):null;
  if(hit&&study.trace(hit,Number($('width').value),true)){touching=true;seconds+=dt;addDrops(study.step(dt,hit));}else study.lift();
 }
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.age+=dt;d.vy-=40*dt;d.mesh.position.x+=d.vx*dt;d.mesh.position.y+=d.vy*dt;d.mesh.position.z+=d.vz*dt;d.mesh.rotation.z+=dt*d.vx*.15;if(d.age>3){scene.remove(d.mesh);drops.splice(i,1);}}
 if(study)$('status').textContent=`${touching?'Inflating along your trace':held?'Move onto the letter':'Attached growth frozen'} · ${seconds.toFixed(1)}s · ${pops} ruptures`;
 renderer.render(scene,camera);
}requestAnimationFrame(frame);
