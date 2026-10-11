"""Make the generated authoring file easy to inspect interactively."""
from pathlib import Path
import bpy
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'output/altered-r.blend'))
for name in ['build-study.py','README.md']:
 if not bpy.data.texts.get(name):bpy.data.texts.load(str(root/name))
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   space=area.spaces.active;space.region_3d.view_perspective='CAMERA'
   space.shading.type='MATERIAL';space.shading.use_scene_world=True;space.shading.use_scene_lights=True
  elif area.type=='TEXT_EDITOR':area.spaces.active.text=bpy.data.texts.get('build-study.py')
bpy.ops.object.select_all(action='DESELECT')
letter=bpy.data.objects['Altered_R_Membrane'];letter.select_set(True);bpy.context.view_layer.objects.active=letter
bpy.ops.wm.save_as_mainfile(filepath=str(root/'output/altered-r.blend'))
