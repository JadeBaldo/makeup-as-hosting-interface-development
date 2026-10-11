"""Validate the chemical proposal with Blender, independently of rendering."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'output/altered-r-chemical-study.blend'))
scene=bpy.context.scene;skin=bpy.data.objects['Altered_R_Membrane'];core=bpy.data.objects['Altered_R_Luminous_Core']
assert scene['Performance buildup seconds']==360 and scene.frame_end==1440
materials=[o.data.materials[0] for o in [skin,core]]
thresholds=[m.node_tree.nodes['Boil threshold'].inputs[1] for m in materials]
assert materials[0].node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value>.9
assert materials[1].node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value>.25
previous=[-2,-2];records=[]
for frame in range(1,433,4):
 scene.frame_set(frame)
 values=[s.default_value for s in thresholds]
 assert all(a>=b-1e-6 for a,b in zip(values,previous));previous=values
 for obj in [skin,core]:
  assert obj.data.shape_keys.key_blocks['Collapsed'].value==0
  assert obj.location.length<1e-6 and not obj.hide_render
for t in [0,9,10.8,12,14,17.9]:
 scene.frame_set(round(t*24)+1)
 obj=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=obj.to_mesh()
 assert len(mesh.vertices)==46424 and all(math.isfinite(c) for v in mesh.vertices for c in v.co)
 hit,*_=obj.ray_cast(Vector((-.015,.14,2)),Vector((0,0,-1)))
 assert not hit
 values=[s.default_value for s in thresholds]
 records.append({'seconds':t,'skin_threshold':values[0],'slime_threshold':values[1],'counter_centre_open':True})
 if t==12:assert values[0]>values[1] and not bpy.data.objects['Viscous slime draining from rupture'].hide_render
 if t==17.9:
  assert values[1]<0 and values[0]>.5
  assert not bpy.data.objects['Viscous slime draining from rupture'].hide_render
  assert bpy.data.objects['Released gel drop 1'].scale.x>0
  assert bpy.data.objects['Small released liquid pool'].scale.x>.2
 obj.to_mesh_clear()
scene.frame_set(1);assert all(s.default_value<0 for s in thresholds)
assert scene['Inexhaustible slime source']
for frame in [1000,2000,8000]:
 scene.frame_set(frame)
 assert not bpy.data.objects['Viscous slime draining from rupture'].hide_render
 assert bpy.data.objects['Released gel drop 1'].scale.x>0
 assert thresholds[1].default_value<0 and not core.hide_render
(ROOT/'output/chemical-verification.json').write_text(json.dumps(records,indent=2))
print('CHEMICAL_VERIFICATION_PASS',json.dumps(records))
