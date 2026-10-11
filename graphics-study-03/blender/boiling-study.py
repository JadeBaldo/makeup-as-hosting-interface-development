"""Alternative aftermath: rupture, wet bubbling and progressive dissolution.
Preserves both prior .blend studies. Blender --background --python boiling-study.py -- --render
"""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector, noise
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'output'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'altered-r-motion-study.blend'))
scene=bpy.context.scene;scene.frame_set(1)
skin=bpy.data.objects['Altered_R_Membrane'];core=bpy.data.objects['Altered_R_Luminous_Core']
def smooth(x):
 x=max(0,min(1,x));return x*x*(3-2*x)
centre=Vector((.09,.40,.12))
thresholds=[]
for obj in [skin,core]:
 obj.animation_data_clear();obj.location=(0,0,0);obj.hide_render=False;obj.hide_viewport=False
 basis=obj.data.shape_keys.key_blocks['Basis']
 for phase in [0,1]:
  key=obj.shape_key_add(name=f'Wet bubbling {phase+1}')
  for i,p in enumerate(basis.data):
   source=p.co*18+Vector((phase*1.8,.2,phase*.7))
   n=noise.noise(source)
   bulge=max(0,n+.2)**2*.032
   key.data[i].co=p.co+obj.data.vertices[i].normal*bulge
 # Spatially coherent holes reveal the scene behind the membrane, rather than
 # reducing opacity uniformly. Both layers dissolve from the same local point.
 mat=obj.data.materials[0].copy();obj.data.materials[0]=mat;mat.name=f'{obj.name} boiling wet skin'
 nodes=mat.node_tree.nodes;links=mat.node_tree.links
 bs=nodes.get('Principled BSDF');out=nodes.get('Material Output')
 tex=nodes.new('ShaderNodeTexCoord')
 field=nodes.new('ShaderNodeTexNoise');field.inputs['Scale'].default_value=12;field.inputs['Detail'].default_value=2
 links.new(tex.outputs['Object'],field.inputs['Vector'])
 distance=nodes.new('ShaderNodeVectorMath');distance.operation='DISTANCE';distance.inputs[1].default_value=centre
 links.new(tex.outputs['Object'],distance.inputs[0])
 grain=nodes.new('ShaderNodeMath');grain.operation='MULTIPLY';grain.inputs[1].default_value=.22
 links.new(field.outputs['Fac'],grain.inputs[0])
 combined=nodes.new('ShaderNodeMath');combined.operation='ADD';links.new(distance.outputs['Value'],combined.inputs[0]);links.new(grain.outputs[0],combined.inputs[1])
 threshold=nodes.new('ShaderNodeMath');threshold.name='Boil threshold';threshold.operation='LESS_THAN';threshold.inputs[1].default_value=-1
 links.new(combined.outputs[0],threshold.inputs[0]);thresholds.append(threshold.inputs[1])
 transparent=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader')
 links.new(threshold.outputs[0],mix.inputs[0]);links.new(bs.outputs[0],mix.inputs[1]);links.new(transparent.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
 fine=nodes.new('ShaderNodeTexNoise');fine.inputs['Scale'].default_value=48;fine.inputs['Detail'].default_value=2
 links.new(tex.outputs['Object'],fine.inputs['Vector'])
 bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.01
 links.new(fine.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])

# The previously rendered folds/fall are explicitly disabled in this alternative.
tear=bpy.data.objects['Local rupture slit'];lips=[bpy.data.objects[f'Recoiling membrane lip {i}'] for i in [1,2]]
for obj in [tear,*lips]:obj.animation_data_clear()
poolmat=bpy.data.materials['Released glossy cyan gel']
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=20,radius=1)
pool=bpy.context.object;pool.name='Small released liquid pool';pool.data.materials.append(poolmat)
pool.location=(.04,-.47,.08)
for p in pool.data.polygons:p.use_smooth=True
for frame in range(1,433):
 scene.frame_set(frame);t=(frame-1)/24
 boil=smooth((t-10.5)/7)
 agitation=smooth((t-8)/2)*(1-smooth((t-16)/2))
 for obj in [skin,core]:
  keys=obj.data.shape_keys.key_blocks
  for name in ['Collapsed','Residue folds']:
   keys[name].value=0;keys[name].keyframe_insert('value',frame=frame)
  for i in [0,1]:
   key=keys[f'Wet bubbling {i+1}'];key.value=agitation*(.55+.45*math.sin(t*5.2+i*math.pi));key.keyframe_insert('value',frame=frame)
 for socket in thresholds:
  socket.default_value=-.02+boil*1.55;socket.keyframe_insert('default_value',frame=frame)
 bpy.context.view_layer.update()
 evaluated=skin.evaluated_get(bpy.context.evaluated_depsgraph_get())
 hit,point,normal,index=evaluated.ray_cast(Vector((centre.x,centre.y,2)),Vector((0,0,-1)))
 pos=point+normal*.003 if hit else centre
 opening=smooth((t-10.5)/.12)*(1-smooth((t-11.3)/.6))
 tear.location=pos;tear.scale=(opening,opening,opening)
 tear.keyframe_insert('location',frame=frame);tear.keyframe_insert('scale',frame=frame)
 for i,lip in enumerate(lips):
  lip.location=pos+Vector((0,(-1 if i==0 else 1)*.014,.003));lip.scale=(.048*opening,.005*opening,.006*opening)
  lip.keyframe_insert('location',frame=frame);lip.keyframe_insert('scale',frame=frame)
 amount=smooth((t-11.4)/2)
 pool.scale=(.12*amount,.006*amount,.075*amount);pool.keyframe_insert('scale',frame=frame)
scene['Aftermath']='Alternative: local rupture, bubbling dissolution, small liquid residue; no carcass fall.'
scene.timeline_markers.clear()
for name,t in [('Pressure + delayed gel',3),('Wet bubbling',8),('RUPTURE + LIQUID',10.5),('Dissolving skin',13),('Liquid residue',17.5)]:scene.timeline_markers.new(name,frame=round(t*24)+1)
bpy.data.texts.load(str(ROOT/'boiling-study.py'))
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'altered-r-boiling-study.blend'))
(OUT/'boiling-report.json').write_text(json.dumps({'inspection_seconds':18,'performance_buildup_seconds':360,'bubbling_start_seconds':8,'rupture_seconds':10.5,'dissolves_by_seconds':17.5,'limitations':['Shader dissolution with keyed geometry, not a liquid/evaporation simulation','Glyph disappears at the end deliberately; its counter stays open during earlier buildup','No browser integration or performance-timing change']},indent=2))
if '--render' in sys.argv:
 scene.render.resolution_x=640;scene.render.resolution_y=640;scene.cycles.samples=24
 for t in [8,10.75,12,14,16,17.5]:
  scene.frame_set(round(t*24)+1);scene.render.filepath=str(OUT/f'boiling-{t:g}.png');bpy.ops.render.render(write_still=True)
print('BOILING_BUILD_OK')
