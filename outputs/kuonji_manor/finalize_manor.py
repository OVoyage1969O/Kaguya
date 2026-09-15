import bpy, math, json
from pathlib import Path
scene=bpy.context.scene
assert len(scene.objects)>100
for p in ['D:/1/my-blog-master/~J)~@ZM4OJC~N3RCATZ8II5.jpg','D:/1/my-blog-master/29daebfd83c709f4b766fa6817e28acc-1024x576.jpg']:
    im=bpy.data.images.load(p,check_existing=True);im.pack()
for s in list(bpy.data.scenes):
    if s!=scene and s.name.startswith('久远寺邸') and not len(s.objects):bpy.data.scenes.remove(s)
scene.name='久远寺邸 | 毛坯结构 v01'
bad=[o.name for o in scene.objects if not all(math.isfinite(v) for v in o.location)]
assert not bad,bad
bpy.ops.wm.save_as_mainfile(filepath='D:/1/my-blog-master/outputs/kuonji_manor/久远寺邸_毛坯框架_v01.blend')
print(json.dumps({'object_count':len(scene.objects),'collections':{c.name:len(c.objects) for c in scene.collection.children},'packed_references':2,'file':bpy.data.filepath},ensure_ascii=False))
