import bpy
from mathutils import Vector
scene=bpy.context.scene
cols={c.name[:2]:c for c in scene.collection.children}
roofmat=next(o.data.materials[0] for o in cols['08'].objects if o.type=='MESH')
wood=next(o.data.materials[0] for o in cols['07'].objects if o.type=='MESH')
wall=next(o.data.materials[0] for o in cols['02'].objects if o.type=='MESH')
def mesh(n,v,f,m,c):
    data=bpy.data.meshes.new(n);data.from_pydata(v,[],f);data.update();o=bpy.data.objects.new(n,data);cols[c].objects.link(o);data.materials.append(m);return o
def beam(n,a,b):
    a,b=Vector(a),Vector(b);v=[(x*.08,y*.08,z*(b-a).length/2) for x,y,z in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
    o=mesh(n,v,[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)],wood,'07');o.location=(a+b)/2;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
for o in list(scene.objects):
    if o.name=='东侧主楼山墙':bpy.data.objects.remove(o,do_unlink=True)
ring=[(13,-3.35,7.65),(15.35,-1.65,7.65),(15.35,3.65,7.65),(13,5.35,7.65)]
tip=(13,1,11)
o=mesh('东端多边形歇山收口',ring+[tip],[(0,1,4),(1,2,4),(2,3,4)],roofmat,'08');o.modifiers.new('屋面厚度','SOLIDIFY').thickness=.12
for i in range(3):beam('东端檐梁',ring[i],ring[i+1])
for p in ring:beam('东端斜椽',p,tip)
mesh('西端封闭山墙',[(-14,-3,7.65),(-14,5,7.65),(-14,1,11)],[(0,1,2)],wall,'03')
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('Roof end closed; saved.')
