// Run with Node 22.15+; reuse the exact bundled typeface rather than another font.
import {registerHooks} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
registerHooks({resolve(s,c,next){return s==='three'?{url:new URL('../vendor/three/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c);}});
const {FontLoader}=await import('../vendor/three/examples/jsm/loaders/FontLoader.js');
const {TextGeometry}=await import('../vendor/three/examples/jsm/geometries/TextGeometry.js');
const font=new FontLoader().parse(JSON.parse(readFileSync(new URL('../vendor/three/examples/fonts/gentilis_bold.typeface.json',import.meta.url))));
const g=new TextGeometry('R',{font,size:100,depth:18,curveSegments:32,bevelEnabled:true,bevelThickness:4,bevelSize:3.5,bevelSegments:8});g.center();
const positions=[],triangles=[],lookup=new Map(),a=g.attributes.position;
for(let i=0;i<a.count;i+=3){const face=[];for(let j=0;j<3;j++){const xyz=[a.getX(i+j),a.getY(i+j),a.getZ(i+j)].map(x=>x*.01),k=xyz.map(x=>x.toFixed(6)).join(',');if(!lookup.has(k)){lookup.set(k,positions.length);positions.push(xyz);}face.push(lookup.get(k));}if(new Set(face).size===3)triangles.push(face);}
mkdirSync(new URL('./source/',import.meta.url),{recursive:true});
writeFileSync(new URL('./source/letter-r.json',import.meta.url),JSON.stringify({font:'bundled Gentilis bold',units:'one Three.js unit = 0.01 Blender units',positions,triangles}));
console.log(`Prepared ${positions.length} welded vertices / ${triangles.length} triangles`);g.dispose();
