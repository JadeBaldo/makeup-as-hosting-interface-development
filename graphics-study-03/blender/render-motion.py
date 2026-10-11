"""Render an inexpensive complete inspection preview, preserving the saved scene."""
import bpy,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
kind='chemical' if '--chemical' in sys.argv else 'motion'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'output/altered-r-{kind}-study.blend'))
scene=bpy.context.scene
scene.render.resolution_x=384;scene.render.resolution_y=384;scene.cycles.samples=8
scene.render.image_settings.file_format='PNG'
frames=ROOT/f'output/{kind}-frames';frames.mkdir(exist_ok=True)
for frame in range(1,min(432,scene.frame_end)+1,2):
 scene.frame_set(frame);scene.render.filepath=str(frames/f'{frame:04}.png');bpy.ops.render.render(write_still=True)
print('MOTION_FRAMES_COMPLETE')
