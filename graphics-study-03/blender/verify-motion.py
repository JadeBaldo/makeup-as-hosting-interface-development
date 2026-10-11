"""Run with Blender --background --python verify-motion.py."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'output/altered-r-motion-study.blend'))
scene=bpy.context.scene;skin=bpy.data.objects['Altered_R_Membrane'];core=bpy.data.objects['Altered_R_Luminous_Core']
keys=skin.data.shape_keys.key_blocks
assert scene.render.fps==24 and scene.frame_end==432
assert scene['Performance buildup seconds']==360
records=[]
for second in [0,4,9,10.75,11.4,12.7,17]:
 scene.frame_set(round(second*24)+1)
 obj=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=obj.to_mesh()
 coords=[p.co for p in mesh.vertices]
 assert len(coords)==46424 and all(math.isfinite(c) for p in coords for c in p)
 height=max(p.y for p in coords)-min(p.y for p in coords)
 # Sample the original counter centre after its vertical compression.
 v=keys['Collapsed'].value
 point=Vector((-.015,.14*(1-.52*v),2))
 hit,_,_,_=obj.ray_cast(point,Vector((0,0,-1)))
 assert not hit, f'Counter centre closed at {second}s'
 records.append({'seconds':second,'height':height,'collapse':v,'counter_centre_open':not hit,'core_visible':not core.hide_render})
 obj.to_mesh_clear()
assert records[-1]['height']<records[0]['height']*.65
assert records[-1]['collapse']==1 and not records[-1]['core_visible']
scene.frame_set(259)
assert bpy.data.objects['Local rupture slit'].scale.x>0
assert bpy.data.objects['Released gel drop 1'].scale.x>0
assert not bpy.data.objects['Brief attached liquid thread'].hide_render
scene.frame_set(432)
assert bpy.data.objects['Released gel drop 1'].scale.x==0
assert bpy.data.objects['Brief attached liquid thread'].hide_render
scene.frame_set(1)
assert keys['Collapsed'].value==0 and not core.hide_render
(ROOT/'output/motion-verification.json').write_text(json.dumps(records,indent=2))
print('MOTION_VERIFICATION_PASS',json.dumps(records))
