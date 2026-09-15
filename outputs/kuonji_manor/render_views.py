import bpy
from pathlib import Path
scene=next(s for s in bpy.data.scenes if s.name.startswith('久远寺邸') and len(s.objects)>100)
bpy.context.window.scene=scene
out=Path(bpy.data.filepath).parent
scene.render.filepath=str(out/'exterior.png')
bpy.ops.render.render(write_still=True)
for c in scene.collection.children:
    if c.name.startswith(('03_','08_','09_')):c.hide_render=True
for o in scene.objects:
    if o.name.startswith(('阁楼','二层','东侧主楼山墙')) and o.type=='MESH':o.hide_render=True
    if o.type=='MESH' and o.name.find('洞口')>=0 and o.location.z>4.15:o.hide_render=True
scene.camera=next(o for o in scene.objects if o.type=='CAMERA' and o.name.startswith('02 '))
scene.render.filepath=str(out/'structure.png')
bpy.ops.render.render(write_still=True)
print('PREVIEWS_COMPLETE')
