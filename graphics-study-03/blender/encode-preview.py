"""Use Blender's bundled encoder, without downloading ffmpeg or saving a scene."""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'output'
files=sorted((OUT/'chemical-frames').glob('*.png'))
assert len(files)==216,'Run render-motion.py --chemical first'
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;editor=scene.sequence_editor_create()
strip=editor.strips.new_image('Chemical motion excerpt',str(files[0]),channel=1,frame_start=1)
for f in files[1:]:strip.elements.append(f.name)
strip.frame_final_duration=len(files)
scene.render.resolution_x=384;scene.render.resolution_y=384;scene.render.resolution_percentage=100
scene.render.fps=12;scene.frame_start=1;scene.frame_end=len(files)
scene.view_settings.view_transform='Standard';scene.render.use_sequencer=True
scene.render.image_settings.media_type='VIDEO'
scene.render.image_settings.file_format='FFMPEG';scene.render.ffmpeg.format='MPEG4';scene.render.ffmpeg.codec='H264'
scene.render.ffmpeg.constant_rate_factor='HIGH';scene.render.filepath=str(OUT/'chemical-preview.mp4')
bpy.ops.render.render(animation=True)
print('CHEMICAL_VIDEO_COMPLETE')
