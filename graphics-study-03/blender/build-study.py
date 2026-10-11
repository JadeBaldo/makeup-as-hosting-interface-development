"""Blender --background --python build-study.py -- [--samples 48] [--size 900].
Creates a new scene only: saved .blend, shape-key GLB, three Cycles previews.
No edits to the browser study. All output paths resolve beside this script.
"""
import argparse, json, math, sys
from pathlib import Path
import bpy
from mathutils import Vector, Matrix
import bmesh

ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser()
parser.add_argument('--samples',type=int,default=48)
parser.add_argument('--size',type=int,default=900)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
OUT=ROOT/'output'; OUT.mkdir(exist_ok=True)
source=json.loads((ROOT/'source/letter-r.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
mesh=bpy.data.meshes.new('Gentilis_R_source');mesh.from_pydata(source['positions'],[],source['triangles']);mesh.update()
letter=bpy.data.objects.new('Altered_R_Membrane',mesh);scene.collection.objects.link(letter)
bpy.context.view_layer.objects.active=letter;letter.select_set(True)
remesh=letter.modifiers.new('Continuous rounded skin','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.015;remesh.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=remesh.name)
relax=letter.modifiers.new('Relax voxel skin','SMOOTH');relax.factor=.65;relax.iterations=6;bpy.ops.object.modifier_apply(modifier=relax.name)
sub=letter.modifiers.new('Smooth reflection topology','SUBSURF');sub.levels=1;sub.render_levels=1;bpy.ops.object.modifier_apply(modifier=sub.name)
for p in letter.data.polygons:p.use_smooth=True
if len(letter.data.vertices)>100000:raise RuntimeError('Mesh exceeds browser authoring budget')

rest=[v.co.copy() for v in letter.data.vertices]
lo=Vector(tuple(min(p[i] for p in rest) for i in range(3)));hi=Vector(tuple(max(p[i] for p in rest) for i in range(3)))
width=hi.x-lo.x;height=hi.y-lo.y
def spot(x,y,cx,cy,rx,ry):return math.exp(-((x-cx)/rx)**2-((y-cy)/ry)**2)
def deformed(p,state):
 x,y,z=p;u=(x-lo.x)/width;v=(y-lo.y)/height
 shoulder=spot(u,v,.43,.83,.20,.13);bowl=spot(u,v,.75,.64,.17,.25);leg=spot(u,v,.65,.28,.17,.24)
 face=min(1,abs(z)/.07);sign=1 if z>=0 else -1
 if state=='filled':return Vector((x,y,z+sign*.022*face*(.5+.5*math.sin(u*math.pi))))
 if state=='stretched':return Vector((x+.065*bowl-.032*shoulder+.024*leg,y+.045*shoulder-.04*leg,z+sign*face*(.065*shoulder+.045*bowl+.036*leg)))
 # Broad soft folds, counter-preserving loss of height; no particle replacement.
 crease=math.sin(u*16+v*9+math.sin(v*8))
 return Vector((x+.022*math.sin(v*8)*leg,y*.48+.024*crease,z*.22+.021*crease))
for vertex,p in zip(letter.data.vertices,rest):vertex.co=deformed(p,'filled')
letter.shape_key_add(name='Basis')
for name in ['Stretched','Collapsed']:
 key=letter.shape_key_add(name=name)
 for v,p in zip(key.data,rest):v.co=deformed(p,name.lower())
letter['source_font']='Bundled Gentilis bold';letter['purpose']='Standalone Study 03 authoring prototype; browser integration is a later step'

def material(name,color,roughness,metallic=0,transmission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 bsdf=m.node_tree.nodes.get('Principled BSDF')
 values={'Base Color':(*color,1),'Roughness':roughness,'Metallic':metallic,'IOR':1.38,'Transmission Weight':transmission,'Coat Weight':1,'Coat Roughness':.055}
 for name,value in values.items():
  if name in bsdf.inputs:bsdf.inputs[name].default_value=value
 return m
skin=material('Cobalt translucent elastic skin',(.014,.035,.48),.13,.12,.52);letter.data.materials.append(skin)
# A separate inner element in the authoring file, inset along normals. Export both
# with identical keys so later local deformation can remain registered.
core=letter.copy();core.data=letter.data.copy();core.name='Altered_R_Luminous_Core';scene.collection.objects.link(core)
for key in core.data.shape_keys.key_blocks:
 for i,p in enumerate(key.data):p.co-=letter.data.vertices[i].normal*.012
core.data.materials.clear();gel=material('Dense cyan gel',(.006,.28,.65),.16,.03,0)
bsdf=gel.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Emission Color'].default_value=(.002,.06,.18,1);bsdf.inputs['Emission Strength'].default_value=.22
core.data.materials.append(gel)

floor=material('Deep studio floor',(.012,.018,.055),.32,.15)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,lo.y-.014,-.30));ground=bpy.context.object;ground.name='Studio_Backdrop';ground.rotation_euler=(math.pi/2,0,0);ground.data.materials.append(floor)
world=bpy.data.worlds.new('Local studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.05,.10,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35;scene.world=world
def aim(obj,target):
 # Source glyph is Y-up. Explicit world up avoids Blender's Z-up camera roll.
 back=(obj.location-Vector(target)).normalized();right=Vector((0,1,0)).cross(back).normalized();up=back.cross(right)
 obj.rotation_euler=Matrix((right,up,back)).transposed().to_euler()
def light(name,location,power,color,size,size_y):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='RECTANGLE';data.size=size;data.size_y=size_y
 obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=location;aim(obj,(0,0,0))
light('Tall cyan softbox',(-1.4,.5,1.8),110,(.7,.9,1),.7,2.5)
light('Wide white top',(0,1.8,1.0),100,(1,1,1),2,.45)
light('Violet rim',(1.3,-.1,.2),65,(.28,.2,1),.6,1.8)
light('Soft front',(0,-.6,2),35,(.65,.85,1),1.8,.6)
camera_data=bpy.data.cameras.new('Study camera');camera=bpy.data.objects.new('Study camera',camera_data);scene.collection.objects.link(camera);camera.location=(.30,.12,2.7);aim(camera,(0,0,0));camera_data.type='ORTHO';camera_data.ortho_scale=max(width,height)*1.4;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=args.samples;scene.cycles.use_denoising=True
scene.render.resolution_x=args.size;scene.render.resolution_y=args.size;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'

def set_state(name):
 for obj in [letter,core]:
  obj.data.shape_keys.key_blocks['Stretched'].value=1 if name=='stretched' else 0
  obj.data.shape_keys.key_blocks['Collapsed'].value=1 if name=='collapsed' else 0
  obj.location.y=lo.y-min(deformed(p,'collapsed').y for p in rest) if name=='collapsed' else 0
 core.hide_render=name=='collapsed'
set_state('filled')
# Export mesh and morph targets only; render studio stays in .blend.
bpy.ops.object.select_all(action='DESELECT');letter.select_set(True);core.select_set(True);bpy.context.view_layer.objects.active=letter
bpy.ops.export_scene.gltf(filepath=str(OUT/'altered-r-shapes.glb'),export_format='GLB',use_selection=True,export_morph=True,export_morph_normal=True,export_animations=False)
bm=bmesh.new();bm.from_mesh(letter.data);nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.free()
report={'blender':bpy.app.version_string,'vertices':len(letter.data.vertices),'polygons':len(letter.data.polygons),'nonmanifold_edges':nonmanifold,'shape_keys':[k.name for k in letter.data.shape_keys.key_blocks],'outputs':['altered-r.blend','altered-r-shapes.glb','filled.png','stretched.png','collapsed.png'],'limitations':['Art-directed shapes, not a fluid simulation','Blender lighting/procedural appearance does not automatically transfer to the browser','GLB not integrated into Study 03 yet']}
(OUT/'build-report.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'altered-r.blend'))
for state in ['filled','stretched','collapsed']:
 set_state(state);scene.render.filepath=str(OUT/f'{state}.png');bpy.ops.render.render(write_still=True)
set_state('filled');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'altered-r.blend'))
print('ALTERED_IMAGES_BUILD_OK',json.dumps(report))
