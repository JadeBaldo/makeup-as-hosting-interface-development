"""Liquid-metal covering over slime: rupture, leakage and chemical dissolution.
Preserves prior .blend studies. Blender --background --python chemical-study.py -- --render
"""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector, noise
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'output'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'altered-r-motion-study.blend'))
scene=bpy.context.scene;scene.frame_set(1)
scene.cycles.transparent_max_bounces=32
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
 if obj==skin:
  bs.inputs['Metallic'].default_value=.94;bs.inputs['Transmission Weight'].default_value=0
  bs.inputs['Base Color'].default_value=(.045,.12,.62,1);bs.inputs['Roughness'].default_value=.14
 else:
  bs.inputs['Metallic'].default_value=.02;bs.inputs['Transmission Weight'].default_value=.32
  bs.inputs['Base Color'].default_value=(.002,.28,.20,1);bs.inputs['Roughness'].default_value=.085
  bs.inputs['Emission Color'].default_value=(.001,.05,.025,1);bs.inputs['Emission Strength'].default_value=.2
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
 bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13 if obj==skin else .055;bump.inputs['Distance'].default_value=.01
 links.new(fine.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])

# The previously rendered folds/fall are explicitly disabled in this alternative.
tear=bpy.data.objects['Local rupture slit'];lips=[bpy.data.objects[f'Recoiling membrane lip {i}'] for i in [1,2]]
for obj in [tear,*lips]:obj.animation_data_clear()
poolmat=bpy.data.materials['Released glossy cyan gel']
slimebs=poolmat.node_tree.nodes.get('Principled BSDF')
slimebs.inputs['Base Color'].default_value=(.002,.28,.20,1)
slimebs.inputs['Emission Color'].default_value=(.001,.14,.07,1);slimebs.inputs['Emission Strength'].default_value=.2
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=20,radius=1)
pool=bpy.context.object;pool.name='Small released liquid pool';pool.data.materials.append(poolmat)
pool.location=(.04,bpy.data.objects['Studio_Backdrop'].location.y+.005,.08)
for p in pool.data.polygons:p.use_smooth=True
# Two small procedural volumes, not a smoke simulation. Their upward movement
# and fading density make the reaction readable without concealing the glyph.
vapour=bpy.data.materials.new('Chemical vapour');vapour.use_nodes=True
nodes=vapour.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial')
volume=nodes.new('ShaderNodeVolumePrincipled');volume.inputs['Color'].default_value=(.18,.75,.63,1)
texture=nodes.new('ShaderNodeTexNoise');texture.inputs['Scale'].default_value=3;texture.inputs['Detail'].default_value=3
density=nodes.new('ShaderNodeMath');density.operation='MULTIPLY';density.inputs[1].default_value=0
coords=nodes.new('ShaderNodeTexCoord');edge=nodes.new('ShaderNodeVectorMath');edge.operation='DISTANCE';edge.inputs[1].default_value=(.5,.5,.5)
fade=nodes.new('ShaderNodeMath');fade.operation='SUBTRACT';fade.inputs[0].default_value=.5;fade.use_clamp=True
shaped=nodes.new('ShaderNodeMath');shaped.operation='MULTIPLY'
links=vapour.node_tree.links
links.new(coords.outputs['Generated'],edge.inputs[0]);links.new(edge.outputs['Value'],fade.inputs[1])
links.new(texture.outputs['Fac'],shaped.inputs[0]);links.new(fade.outputs[0],shaped.inputs[1])
links.new(shaped.outputs[0],density.inputs[0]);links.new(density.outputs[0],volume.inputs['Density']);links.new(volume.outputs[0],out.inputs['Volume'])
fumes=[]
for i in [0,1]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1)
 puff=bpy.context.object;puff.name=f'Rising chemical vapour {i+1}';puff.data.materials.append(vapour);fumes.append(puff)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1)
slime=bpy.context.object;slime.name='Slime stretching through rupture';slime.data.materials.append(poolmat)
for p in slime.data.polygons:p.use_smooth=True
thread=bpy.data.objects['Brief attached liquid thread'];thread.name='Viscous slime draining from rupture'
for frame in range(1,433):
 scene.frame_set(frame);t=(frame-1)/24
 boil=smooth((t-10.5)/7)
 agitation=smooth((t-8)/2)
 for obj in [skin,core]:
  keys=obj.data.shape_keys.key_blocks
  for name in ['Collapsed','Residue folds']:
   keys[name].value=0;keys[name].keyframe_insert('value',frame=frame)
  for name,start,length in [('Shoulder pressure',1,3),('Bowl pressure',2.6,3.3),('Leg pressure',4.2,3.5)]:
   keys[name].value=smooth((t-start)/length);keys[name].keyframe_insert('value',frame=frame)
  for i in [0,1]:
   key=keys[f'Wet bubbling {i+1}'];key.value=agitation*(.55+.45*math.sin(t*5.2+i*math.pi));key.keyframe_insert('value',frame=frame)
 for i,socket in enumerate(thresholds):
  # Deliberate non-conservation: metal opens but the interior never exhausts.
  socket.default_value=-.02+boil*.62 if i==0 else -.02
  socket.keyframe_insert('default_value',frame=frame)
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
 growth=math.sqrt(1+max(0,t-12)*.65)
 pool.scale=(.12*amount*growth,.006*amount,.075*amount*growth);pool.keyframe_insert('scale',frame=frame)
 release=smooth((t-10.5)/.4)*(.9+.1*math.sin(t*4))
 slime.location=pos+Vector((0,-.045*release,.025));slime.scale=(.023*release,.03*release*(1+release),.022*release)
 slime.keyframe_insert('location',frame=frame);slime.keyframe_insert('scale',frame=frame)
 draining=t>10.65
 thread.hide_render=not draining;thread.hide_viewport=not draining
 thread.keyframe_insert('hide_render',frame=frame);thread.keyframe_insert('hide_viewport',frame=frame)
 for i,p in enumerate(thread.data.splines[0].points):
  f=i/8;length=min(.84,max(0,t-10.65)*.55)
  p.co=(pos.x+.018*math.sin(f*4+t*2)*f,pos.y-f*length,pos.z+.03*f,1)
  p.keyframe_insert('co',frame=frame)
 # Two reusable drops model a recurring drip without an unbounded object list.
 for i in [1,2]:
  drop=bpy.data.objects[f'Released gel drop {i}']
  age=(max(0,t-10.65)+(i-1)*.65)%1.3
  radius=.015 if i==1 else .011
  drop.scale=(radius,radius*(1+age*.45),radius) if draining else (0,0,0)
  drop.location=(pos.x+.025*math.sin(t*2+i),pos.y-.12*age-.43*age*age,pos.z+.025)
  drop.keyframe_insert('scale',frame=frame);drop.keyframe_insert('location',frame=frame)
 active=smooth((t-10.5)/.6)
 density.inputs[1].default_value=active*1.4;density.inputs[1].keyframe_insert('default_value',frame=frame)
 for i,puff in enumerate(fumes):
  rise=(max(0,t-10.5)+i*.9)%2.6
  puff.location=(centre.x+math.sin(t*1.4+i)*.035,centre.y+.05+.055*rise,.15+i*.015)
  puff.scale=(.09*active,.13*active,.065*active);puff.keyframe_insert('location',frame=frame);puff.keyframe_insert('scale',frame=frame)
# Procedural drivers keep the source running beyond the inspection keyframes.
# No particles are retained: the same two drops and nine thread points are reused.
def drive(owner,path,index,expression):
 fc=owner.driver_add(path,index) if index is not None else owner.driver_add(path)
 fc.driver.type='SCRIPTED';fc.driver.expression=expression
for i in [1,2]:
 drop=bpy.data.objects[f'Released gel drop {i}'];drop.animation_data_clear()
 age=f'((max(0,frame-256)/24+{(i-1)*.65})%1.3)'
 r=.015 if i==1 else .011
 for channel in [0,2]:drive(drop,'scale',channel,f'{r} if frame>256 else 0')
 drive(drop,'scale',1,f'{r}*(1+{age}*.45) if frame>256 else 0')
 drive(drop,'location',0,f'{centre.x}+.025*sin(frame/12+{i})')
 drive(drop,'location',1,f'{centre.y}-.12*{age}-.43*{age}**2')
 drive(drop,'location',2,str(centre.z+.045))
thread.animation_data_clear();thread.data.animation_data_clear()
for path in ['hide_render','hide_viewport']:drive(thread,path,None,'frame<=256')
for i,p in enumerate(thread.data.splines[0].points):
 f=i/8
 drive(p,'co',0,f'{centre.x}+.018*sin({f}*4+frame/12)*{f}')
 drive(p,'co',1,f'{centre.y}-{f}*min(.84,max(0,frame-256)/24*.55)')
 drive(p,'co',2,str(centre.z+.035+.03*f))
pool.animation_data_clear()
for channel,r in [(0,.12),(2,.075)]:drive(pool,'scale',channel,f'{r}*sqrt(1+max(0,frame-288)/24*.65)*min(1,max(0,frame-274)/48)')
drive(pool,'scale',1,'.006*min(1,max(0,frame-274)/48)')
for i,puff in enumerate(fumes):
 puff.animation_data_clear()
 drive(puff,'location',0,f'{centre.x}+.035*sin(frame/17+{i})')
 drive(puff,'location',1,f'{centre.y}+.05+.055*((max(0,frame-252)/24+{i*.9})%2.6)')
 puff.location.z=.15+i*.015
 for channel,s in enumerate([.09,.13,.065]):drive(puff,'scale',channel,f'{s}*min(1,max(0,frame-252)/14)')
scene.frame_end=1440
scene['Aftermath']='Impossible inexhaustible slime source inside boiling liquid-metal covering. Continuous draining, recurring drops, accumulating pool and vapour; no emptying.'
scene['Inexhaustible slime source']=True
scene.timeline_markers.clear()
for name,t in [('Pressure + delayed gel',3),('Wet bubbling',8),('RUPTURE + LIQUID',10.5),('Opening metal skin',13),('Continuous impossible source',17.5)]:scene.timeline_markers.new(name,frame=round(t*24)+1)
bpy.data.texts.load(str(ROOT/'chemical-study.py'))
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'altered-r-chemical-study.blend'))
(OUT/'chemical-report.json').write_text(json.dumps({'rendered_excerpt_seconds':18,'playback_seconds':60,'performance_buildup_seconds':360,'bubbling_start_seconds':8,'rupture_seconds':10.5,'inexhaustible_slime':True,'metal_dissolution':'Partial, preserving a covering around the interior source','limitations':['Procedural emission continues beyond keyed inspection frames; timeline restart repeats the buildup','Shader dissolution with keyed geometry, not a liquid/chemical simulation','Vapour is two small animated procedural volumes','Mass is deliberately not conserved','No browser integration or performance-timing change']},indent=2))
if '--render' in sys.argv:
 scene.render.resolution_x=640;scene.render.resolution_y=640;scene.cycles.samples=24
 for t in [8,10.75,12,14,16,17.5]:
  scene.frame_set(round(t*24)+1);scene.render.filepath=str(OUT/f'chemical-{t:g}.png');bpy.ops.render.render(write_still=True)
print('CHEMICAL_BUILD_OK')
