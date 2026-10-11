"""Build a separate playable motion proposal; never overwrites the static authoring file.
Blender --background --python animate-study.py -- [--render]
The 18-second timeline is accelerated art-direction inspection, not performance timing.
"""
import sys, math, json
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'output'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'altered-r.blend'))
scene=bpy.context.scene
skin=bpy.data.objects['Altered_R_Membrane']
core=bpy.data.objects['Altered_R_Luminous_Core']
objects=[skin,core]
fps=24; duration=18
scene.render.fps=fps;scene.frame_start=1;scene.frame_end=duration*fps
scene['Inspection duration seconds']=duration
scene['Performance buildup seconds']=360
scene['Timing note']='Accelerated motion proposal. Browser six-minute timing is unchanged.'

def smooth(x):
 x=max(0,min(1,x));return x*x*(3-2*x)
def g(u,v,x,y,rx,ry):return math.exp(-((u-x)/rx)**2-((v-y)/ry)**2)
basis=[p.co.copy() for p in skin.data.shape_keys.key_blocks['Basis'].data]
lo=Vector(tuple(min(p[i] for p in basis) for i in range(3)))
hi=Vector(tuple(max(p[i] for p in basis) for i in range(3)))
w=hi.x-lo.x;h=hi.y-lo.y
# Each path channel displaces the connected glyph, including its bevel and edges.
# Matching coordinates keep the inner gel registered with the membrane.
for obj in objects:
 for name in ['Shoulder pressure','Bowl pressure','Leg pressure','Gel sway X','Gel sway Y','Residue folds']:
  key=obj.shape_key_add(name=name)
  if 'sway' in name:key.slider_min=-1
  for i,p in enumerate(obj.data.shape_keys.key_blocks['Basis'].data):
   x,y,z=p.co;u=(basis[i].x-lo.x)/w;v=(basis[i].y-lo.y)/h
   front=min(1,abs(z)/.07);sign=1 if z>=0 else -1
   a=g(u,v,.43,.84,.23,.13);b=g(u,v,.76,.66,.16,.22);c=g(u,v,.66,.28,.17,.23)
   dx=dy=dz=0
   if name=='Shoulder pressure':dx=-.035*a;dy=.04*a;dz=sign*.065*front*a
   elif name=='Bowl pressure':dx=.045*b;dy=-.025*b;dz=sign*.078*front*b
   elif name=='Leg pressure':dx=.028*c;dy=-.045*c;dz=sign*.05*front*c
   elif name=='Gel sway X':dx=.027*v*v;dz=.015*math.sin(v*5)*front
   elif name=='Gel sway Y':dy=.022*math.sin(u*5)*v;dz=.018*math.sin(u*4+v*3)*front
   elif name=='Residue folds':
    fold=math.sin(u*24+v*13+math.sin(v*7))
    dz=.009*fold*front;dy=.006*math.sin(u*17+v*12)
   key.data[i].co=(x+dx,y+dy,z+dz)

# A narrow visible rupture seam with two recoiling lips. This is an art-directed
# opening cue, not a simulated topology tear; the underlying glyph stays connected.
tear_x=lo.x+w*.63;tear_y=lo.y+h*.93;tear_z=hi.z+.058
mat=bpy.data.materials.new('Wet dark rupture interior');mat.diffuse_color=(.002,.004,.035,1)
mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value=(.002,.004,.035,1);bs.inputs['Roughness'].default_value=.2
mesh=bpy.data.meshes.new('Tear seam');mesh.from_pydata([(-.044,-.007,0),(.044,-.006,0),(.052,.005,0),(-.04,.008,0)],[],[(0,1,2,3)])
tear=bpy.data.objects.new('Local rupture slit',mesh);scene.collection.objects.link(tear);tear.data.materials.append(mat)
tear.parent=skin;tear.location=(tear_x,tear_y,tear_z)
lips=[]
for n,side in enumerate([-1,1]):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=1)
 lip=bpy.context.object;lip.name=f'Recoiling membrane lip {n+1}';lip.parent=skin
 lip.location=(tear_x,tear_y+side*.012,tear_z+.005);lip.data.materials.append(skin.data.materials[0]);lips.append(lip)
 for p in lip.data.polygons:p.use_smooth=True

# A connected liquid thread precedes two heavy drops. It lasts briefly rather
# than filling the screen; quantities are intentionally bounded for this proposal.
liquid=core.data.materials[0].copy();liquid.name='Released glossy cyan gel'
bs=liquid.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.09
bs.inputs['Transmission Weight'].default_value=.28
drops=[]
for n in range(2):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1)
 drop=bpy.context.object;drop.name=f'Released gel drop {n+1}';drop.data.materials.append(liquid);drops.append(drop)
 for p in drop.data.polygons:p.use_smooth=True
curve=bpy.data.curves.new('Liquid neck','CURVE');curve.dimensions='3D';curve.bevel_depth=.008;curve.bevel_resolution=3
sp=curve.splines.new('POLY');sp.points.add(8)
thread=bpy.data.objects.new('Brief attached liquid thread',curve);scene.collection.objects.link(thread);curve.materials.append(liquid)

floor_y=lo.y-.014
collapsed_min=min(p.co.y for p in skin.data.shape_keys.key_blocks['Collapsed'].data)
landing=floor_y-collapsed_min+.012
# A lightly damped spring records delayed gel motion as inexpensive shape keys.
sx=sy=vx=vy=0;dt=1/fps
checks=[]
for frame in range(1,scene.frame_end+1):
 t=(frame-1)/fps
 burst=10.5;collapse=smooth((t-burst)/1.05)
 pressure=[smooth((t-1.0)/3),smooth((t-2.6)/3.3),smooth((t-4.2)/3.5)]
 envelope=(.35+.65*smooth(t/4))*(1-smooth((t-10.7)/3))
 targetx=math.sin(t*3.7)*envelope;targety=math.sin(t*3.7-.65)*envelope
 vx+=(32*(targetx-sx)-5*vx)*dt; sx+=vx*dt
 vy+=(26*(targety-sy)-4.6*vy)*dt; sy+=vy*dt
 # Fast initial loss of volume, then gravity and a small damped landing response.
 fall=smooth((t-11.15)/1.55)
 impact=max(0,t-12.7)
 bounce=.016*math.sin(impact*11)*math.exp(-impact*2.6) if impact>0 else 0
 for obj in objects:
  keys=obj.data.shape_keys.key_blocks
  values={'Stretched':0,'Collapsed':collapse,
   'Shoulder pressure':pressure[0]*(1-collapse),'Bowl pressure':pressure[1]*(1-collapse),
   'Leg pressure':pressure[2]*(1-collapse),'Gel sway X':sx*(1-.9*collapse),
   'Gel sway Y':sy*(1-.9*collapse),'Residue folds':collapse*.8}
  for name,value in values.items():keys[name].value=value;keys[name].keyframe_insert('value',frame=frame)
  obj.location.y=landing*fall+max(0,bounce);obj.keyframe_insert('location',frame=frame)
 # Inner liquid disappears during release; the empty outer skin remains.
 core.hide_render=t>burst+.55;core.hide_viewport=t>burst+.55
 core.keyframe_insert('hide_render',frame=frame);core.keyframe_insert('hide_viewport',frame=frame)
 opening=smooth((t-burst)/.12)
 tear.scale=(opening,opening*(1-.5*collapse),opening);tear.keyframe_insert('scale',frame=frame)
 # Ray-register the seam to the evaluated front surface, rather than leaving it
 # floating over the counter as the letter slumps.
 bpy.context.view_layer.update()
 local_y=tear_y*(1-.52*collapse)
 evaluated=skin.evaluated_get(bpy.context.evaluated_depsgraph_get())
 hit,point,normal,index=evaluated.ray_cast(Vector((tear_x,local_y,2)),Vector((0,0,-1)))
 if hit:tear.location=point+normal*.003
 else:tear.location=(tear_x,local_y,hi.z*(1-.78*collapse)+.005)
 tear.keyframe_insert('location',frame=frame)
 for n,lip in enumerate(lips):
  side=-1 if n==0 else 1
  lip.scale=(.048*opening,.005*opening,.006*opening)
  lip.location=tear.location+Vector((0,side*(.011+.012*opening),.003))
  lip.keyframe_insert('scale',frame=frame);lip.keyframe_insert('location',frame=frame)
 for n,drop in enumerate(drops):
  age=t-(burst+.12+n*.27);visible=0<age<1.4
  radius=.016 if n==0 else .011
  drop.scale=(radius,radius*(1+.4*max(0,age)),radius) if visible else (0,0,0)
  drop.location=(tear_x+.018*math.sin(age*3+n),tear_y-.1*age-.32*age*age,tear_z+.035*age)
  drop.keyframe_insert('scale',frame=frame);drop.keyframe_insert('location',frame=frame)
 age=t-(burst+.12);visible=0<age<.75
 thread.hide_render=not visible;thread.hide_viewport=not visible
 thread.keyframe_insert('hide_render',frame=frame);thread.keyframe_insert('hide_viewport',frame=frame)
 for i,p in enumerate(sp.points):
  f=i/8;p.co=(tear_x+.012*math.sin(f*math.pi),tear_y-f*(.1*max(0,age)+.32*max(0,age)**2),tear_z+.035*max(0,age)*f,1)
  p.keyframe_insert('co',frame=frame)
 if frame in [1,145,253,265,307,432]:checks.append({'frame':frame,'seconds':t,'collapse':collapse,'fall':fall,'core_visible':not core.hide_render})

for label,second in [('Fresh pressure',1),('Delayed gel motion',4),('Full pressure',9),('LOCAL RUPTURE + LIQUID',10.5),('Empty skin falls',11.5),('Settled residue',15)]:
 scene.timeline_markers.new(label,frame=round(second*fps)+1)
for name in ['animate-study.py','reference-analysis/BEHAVIOURS.md']:
 if (ROOT/name).exists():bpy.data.texts.load(str(ROOT/name))
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
   area.spaces.active.shading.use_scene_world=True;area.spaces.active.shading.use_scene_lights=True
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');skin.select_set(True);bpy.context.view_layer.objects.active=skin
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'altered-r-motion-study.blend'))
report={'fps':fps,'frames':scene.frame_end,'preview_seconds':duration,'performance_buildup_seconds':360,'rupture_preview_seconds':10.5,'checkpoints':checks,'mesh_vertices_per_layer':len(skin.data.vertices),'limitations':['Accelerated proposal, not a six-minute simulation','Slit and lips are an art-directed rupture cue, not a topology cut','No fluid solver; thread and two droplets are bounded keyed geometry','Morph weights and shape offsets can transfer; Cycles lighting cannot transfer directly']}
(OUT/'motion-report.json').write_text(json.dumps(report,indent=2))
if '--render' in sys.argv:
 scene.render.resolution_x=640;scene.render.resolution_y=640;scene.cycles.samples=24
 for second in [0,4,9,10.75,11.4,12.7,17]:
  scene.frame_set(round(second*fps)+1);scene.render.filepath=str(OUT/f'motion-{second:g}.png');bpy.ops.render.render(write_still=True)
print('MOTION_BUILD_OK',json.dumps(report))
