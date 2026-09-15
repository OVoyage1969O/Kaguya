import bpy, math, os, json
from mathutils import Vector

OUT = 'D:/1/my-blog-master/outputs/kuonji_manor'
os.makedirs(OUT, exist_ok=True)
scene = bpy.data.scenes.new('久远寺邸 | 毛坯结构 v01')
bpy.context.window.scene = scene
scene.unit_settings.system='METRIC'
scene['设计依据']='用户提供的平面/立面设定及远景图；非测绘，尺寸按比例推定。正面为 -Y。'
scene['楼层标高']='首层 0.65m / 二层 4.15m / 阁楼 7.65m / 主屋脊 11.1m'
cols={}
for n in ['01_场地与基础','02_首层外墙','03_二层外墙','04_内隔墙','05_楼板与楼梯','06_承重梁柱','07_屋架椽条','08_屋面_可隐藏','09_塔楼与烟囱','10_门窗洞口框','11_温室及别栋占位','12_摄影与照明']:
    c=bpy.data.collections.new(n); scene.collection.children.link(c); cols[n[:2]]=c

def mat(n,c):
    m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'); p.inputs[0].default_value=(*c,1); p.inputs[2].default_value=.82
    return m
wall=mat('毛坯 | 暖灰抹灰',(0.65,.62,.54))
stone=mat('基础 | 灰石',(0.36,.39,.39))
timber=mat('结构 | 深色木梁',(.18,.21,.21))
roofmat=mat('屋面 | 石板灰',(.22,.28,.30))
floor=mat('楼板 | 浅灰',(.48,.48,.43))
ground=mat('场地 | 灰绿',(.25,.31,.29))
trim=mat('洞口框 | 浅木色',(.47,.40,.29))

def move(o,col,m):
    for c in list(o.users_collection): c.objects.unlink(o)
    cols[col].objects.link(o)
    if m:o.data.materials.append(m)
    return o
def box(n,loc,sz,m=wall,col='02'):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object; o.name=n; o.dimensions=sz
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    move(o,col,m); return o
def mesh(n,vs,fs,m,col):
    me=bpy.data.meshes.new(n); me.from_pydata(vs,[],fs); me.update()
    o=bpy.data.objects.new(n,me); cols[col].objects.link(o); o.data.materials.append(m); return o
def beam(n,a,b,w=.16,d=None,col='06',m=timber):
    a,b=Vector(a),Vector(b); o=box(n,(a+b)/2,(w,d or w,(b-a).length),m,col)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return o
def slab(n,x1,x2,y1,y2,z,t=.22): return box(n,((x1+x2)/2,(y1+y2)/2,z-t/2),(x2-x1,y2-y1,t),floor,'05')
def panel(n,a,b,z0,z1,col='02',openings=True):
    a,b=Vector(a),Vector(b); L=(b-a).length; v=(b-a).normalized(); mid=(a+b)/2
    def seg(label,u0,u1,h0,h1,m=wall,c=col,th=.26):
        if u1-u0<.015 or h1-h0<.015:return
        p=a+v*((u0+u1)/2); o=box(n+' | '+label,(p.x,p.y,(h0+h1)/2),(u1-u0,th,h1-h0),m,c); o.rotation_euler.z=math.atan2(v.y,v.x)
    if not openings or L<1.4:seg('墙体',0,L,z0,z1);return
    count=max(1,round(L/2.6)); step=L/count
    for i in range(count):
        u=i*step; lo=u+step*.2; hi=u+step*.8; sill=z0+.85; top=z1-.5
        seg('窗间墙',u,lo,z0,z1); seg('窗间墙',hi,u+step,z0,z1)
        seg('窗下墙',lo,hi,z0,sill); seg('过梁墙',lo,hi,top,z1)
        for q in [lo,hi]:seg('洞口立框',q-.055,q+.055,sill,top,trim,'10',.3)
        for h in [sill,top]:seg('洞口横框',lo,hi,h-.06,h+.06,trim,'10',.3)
def door(n,a,b,z0,z1,col='04'):
    a,b=Vector(a),Vector(b); v=(b-a).normalized(); L=(b-a).length; c=(L-1.05)/2
    panel(n+'左',a,a+v*c,z0,z1,col,False)
    panel(n+'右',a+v*(c+1.05),b,z0,z1,col,False)
    panel(n+'门过梁',a+v*c,a+v*(c+1.05),z0+2.35,z1,col,False)
def perimeter(n,poly,z0,z1,col):
    for i in range(len(poly)):panel(n+str(i),poly[i],poly[(i+1)%len(poly)],z0,z1,col)
def polyfloor(n,poly,z):
    N=len(poly);vs=[(x,y,z-.22) for x,y in poly]+[(x,y,z) for x,y in poly]
    return mesh(n,vs,[tuple(reversed(range(N))),tuple(range(N,2*N))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)],floor,'05')
def triangle(n,x1,x2,y,z,r,col='03'):
    return mesh(n,[(x1,y-.13,z),(x2,y-.13,z),((x1+x2)/2,y-.13,r),(x1,y+.13,z),(x2,y+.13,z),((x1+x2)/2,y+.13,r)],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)],wall,col)
def roof(n,x1,x2,y1,y2,eave,ridge,axis='X'):
    # Plane pairs, ridge beam, repeated tied A-frames; swap coordinates for cross-gables.
    if axis=='Y':x1,x2,y1,y2=y1,y2,x1,x2
    mid=(y1+y2)/2
    def P(x,y,z):return (x,y,z) if axis=='X' else (y,x,z)
    for side,edge in enumerate([y1-.35,y2+.35]):
        o=mesh(n+' 屋面 '+str(side),[P(x1-.35,edge,eave),P(x2+.35,edge,eave),P(x2+.35,mid,ridge),P(x1-.35,mid,ridge)],[(0,1,2,3)],roofmat,'08')
        sol=o.modifiers.new('屋面厚度 12cm','SOLIDIFY'); sol.thickness=.12
        beam(n+' 檐梁',P(x1-.35,edge,eave),P(x2+.35,edge,eave),.18,col='07')
    beam(n+' 脊檩',P(x1-.35,mid,ridge-.1),P(x2+.35,mid,ridge-.1),.22,col='07')
    for j in range(math.ceil((x2-x1)/1.2)+1):
        x=x1+(x2-x1)*j/math.ceil((x2-x1)/1.2)
        for edge in [y1,y2]:beam(n+' 椽架',P(x,edge,eave),P(x,mid,ridge-.08),.13,col='07')
        beam(n+' 拉梁',P(x,y1,eave),P(x,y2,eave),.15,col='07')
        beam(n+' 中柱',P(x,mid,eave),P(x,mid,ridge-.1),.12,col='07')

# Raised terrace and broad horizontal body, matching the reference's elongated footprint.
box('缓坡场地',(0,2,-.7),(48,36,.6),ground,'01')
box('石砌台地',(0,0,-.03),(34,17,.8),stone,'01')
box('正面露台',(0,-6.8,.35),(30,3,.2),floor,'01')
for i in range(6):box('入口台阶 %02d'%i,(0,-10.3+i*.42,-.32+(i+1)*.11),(3.8,.46,(i+1)*.22),stone,'01')
poly=[(-14,-3),(-3,-3),(-3,-5),(2,-5),(2,-3),(4,-3),(4,-5),(10,-5),(10,-3),(13,-3),(15,-1.5),(15,3.5),(13,5),(-14,5)]
polyfloor('首层完整底板',poly,.65)
# Continuous rear and end walls; the front is staggered by projecting bays.
for z0,z1,col in [(.65,4.15,'02'),(4.15,7.65,'03')]:
    panel('背面主墙',(-14,5),(13,5),z0,z1,col)
    panel('西侧墙',(-14,5),(-14,-3),z0,z1,col)
    for a,b in [((-14,-3),(-3,-3)),((2,-3),(4,-3)),((10,-3),(13,-3))]:panel('正面窗墙',a,b,z0,z1,col)
    for a,b in [((-3,-3),(-3,-5)),((2,-5),(2,-3)),((4,-3),(4,-5)),((10,-5),(10,-3))]:panel('凸出翼楼侧墙',a,b,z0,z1,col)
    if col=='02':door('门廊主入口',(-3,-5),(2,-5),z0,z1,'02')
    else:panel('门廊上层',(-3,-5),(2,-5),z0,z1,col)
    panel('起居室翼楼',(4,-5),(10,-5),z0,z1,col)
    for a,b in [((13,-3),(15,-1.5)),((15,-1.5),(15,3.5)),((15,3.5),(13,5))]:panel('东侧多边形端部',a,b,z0,z1,col)
# Sunroom polygon projects at southeast, with open bays and structural mullions.
sun=[(10,-5),(13,-5),(15,-3.5),(15,-1.5),(13,-3),(10,-3)]
polyfloor('日光室底板',sun,.65)
for i in range(4):
    a,b=sun[i],sun[i+1];panel('日光室毛坯',a,b,.65,3.55,'02')
polyfloor('日光室顶板',sun,3.55)
mesh('日光室低坡屋面',[(x,y,3.65) for x,y in sun]+[(12.2,-3.4,4.3)],[(i,(i+1)%6,6) for i in range(6)],roofmat,'08')
# Second floor is split around the entrance hall void and stair opening.
slab('二层西翼',-14,-3,-3,5,4.15)
slab('二层东翼',2,13,-3,5,4.15)
slab('二层后走廊',-3,2,2.4,5,4.15)
slab('二层门厅前桥',-3,2,-5,-3.2,4.15)
slab('二层起居室上方',4,10,-5,-3,4.15)
polyfloor('二层多边形端部',[(13,-3),(15,-1.5),(15,3.5),(13,5)],4.15)
slab('阁楼西楼板',-14,-3,-3,5,7.65)
slab('阁楼东楼板',2,13,-3,5,7.65)
slab('阁楼前部房间',-3,2,-5,-.8,7.65)
slab('阁楼后部连桥',-3,2,2.4,5,7.65)
# Plan-based room groups with actual doorway gaps.
for z in [.65,4.15]:
    for x in [-10,-5,4,10]:door('房间分隔', (x,-3),(x,5),z,z+3.5)
    for a,b in [((-14,1.2),(-3,1.2)),((2,1.2),(13,1.2))]:door('走廊隔墙',a,b,z,z+3.5)
for x in [-7,-3,2,7]:door('后排小房间',(x,2.5),(x,5),.65,4.15)
def stairs(n,x,y,z,h,width=1.35,run=4.1):
    for i in range(20):box(n+' 踏步 %02d'%i,(x,y+(i+.5)*run/20,z+(i+.5)*h/20),(width,run/20+.02,.15),floor,'05')
    for sx in [x-width/2,x+width/2]:
        beam(n+' 梯梁',(sx,y,z-.12),(sx,y+run,z+h-.12),.17,col='06')
        beam(n+' 扶手',(sx,y,z+.95),(sx,y+run,z+h+.95),.065,col='06')
stairs('门厅主楼梯',-.8,-2.1,.65,3.5,1.45,4.5)
stairs('阁楼楼梯',.9,-2.1,4.15,3.5,1.05,4.5)
# Exposed structural timber follows floor bands, with Tudor gable bracing only.
for z in [.65,4.15,7.65]:
    for a,b in [((-14,-3,z),(-3,-3,z)),((2,-3,z),(4,-3,z)),((10,-3,z),(13,-3,z)),((-14,5,z),(13,5,z)),((-3,-5,z),(2,-5,z)),((4,-5,z),(10,-5,z))]:beam('通长楼层圈梁',a,b,.22)
for x in [-14,-11,-8,-5,-3,2,4,7,10,13]:
    for y in [-3,5]:beam('主体立柱',(x,y,.65),(x,y,7.65),.22)
for x in [-3,2,4,7,10]:beam('前翼楼立柱',(x,-5,.65),(x,-5,7.65),.2)
for x in [-12,-8,-4,0,4,8,12]:
    for z in [4.0,7.5]:beam('室内横向楼梁',(x,-3,z),(x,5,z),.2,.28)
# Main east-west saddle roof, cross-gables and pointed towers define the silhouette.
roof('长条主楼',-14,13,-3,5,7.65,11.0)
for n,a,b,ya,yb,r in [('入口阁楼',-3,2,-5,1,10.5),('东侧翼楼',4,10,-5,1,10.7),('西侧主山墙',-11,-5,-3.15,2,11.5)]:
    roof(n,a,b,ya,yb,7.65,r,'Y'); triangle(n+' 正面山墙',a,b,ya,7.65,r)
    mid=(a+b)/2
    for xx in [a,mid,b]:
        top=r if xx==mid else 7.7;beam(n+' 山墙柱',(xx,ya-.18,7.6),(xx,ya-.18,top),.15)
    beam(n+' 山墙斜撑',(a,ya-.18,7.7),(mid,ya-.18,r),.15)
    beam(n+' 山墙斜撑',(mid,ya-.18,r),(b,ya-.18,7.7),.15)
    beam(n+' 山墙横梁',(a+.5,ya-.18,8.4),(b-.5,ya-.18,8.4),.14)
# End gable on east side.
o=triangle('东侧主楼山墙',-3,5,13,7.65,11.0);o.rotation_euler.z=math.pi/2
# Undo coordinate transformation ambiguity: replace generated east gable with direct mesh.
bpy.data.objects.remove(o,do_unlink=True)
mesh('东侧主楼山墙',[(13,-3,7.65),(13,5,7.65),(13,1,11)],[(0,1,2)],wall,'03')
def tower(n,x,y,w,d,base,top,peak):
    poly=[(x-w/2,y-d/2),(x+w/2,y-d/2),(x+w/2,y+d/2),(x-w/2,y+d/2)]
    perimeter(n,poly,base,top,'09')
    for xx,yy in poly:beam(n+' 角柱',(xx,yy,base),(xx,yy,top),.18,col='09')
    mesh(n+' 四坡尖顶',[(xx+(xx-x)*.16,yy+(yy-y)*.16,top) for xx,yy in poly]+[(x,y,peak)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],roofmat,'08')
    for xx,yy in poly:beam(n+' 塔顶斜梁',(xx,yy,top),(x,y,peak),.15,col='07')
    polyfloor(n+' 塔楼层板',poly,base)
tower('西端方塔',-11.9,2.6,3.0,3.4,7.65,10.9,13.1)
tower('中央细塔',-3.9,2.2,1.75,2.0,8.2,13.0,14.55)
for n,x,y,top in [('正面高烟囱',-5.4,-3.45,12.4),('东侧烟囱',8.2,2.2,12.3)]:
    box(n,(x,y,(.65+top)/2),(1.0,.9,top-.65),stone,'09')
    box(n+'压顶',(x,y,top),(1.25,1.1,.2),stone,'09')
    box(n+'烟道',(x,y,top+.3),(.35,.35,.5),timber,'09')
# Pair of small dormers on the long roof front slope.
for x in [3.0,5.0]:
    box('老虎窗窗间墙',(x,-1.35,9.55),(1.35,.18,1.05),wall,'03')
    box('老虎窗洞口暗部',(x,-1.46,9.58),(.9,.035,.62),timber,'10')
    roof('老虎窗',x-.8,x+.8,-1.6,.2,10.05,10.45,'Y')
# Greenhouse and separate rear library are secondary plan markers, intentionally simple.
cx,cy=-11.9,8.1
hexagon=[(cx+2.2*math.cos(math.pi/3*i),cy+2.2*math.sin(math.pi/3*i)) for i in range(6)]
polyfloor('温室六角基础',hexagon,.65)
for i,a in enumerate(hexagon):
    b=hexagon[(i+1)%6];beam('温室立柱',(*a,.65),(*a,3.4),.1,col='11');beam('温室檐梁',(*a,3.4),(*b,3.4),.1,col='11');beam('温室屋架',(*a,3.4),(cx,cy,4.5),.09,col='11')
box('别栋图书馆_体量占位',(10,13,1.5),(5,4,3),wall,'11')
box('别栋连通步道',(10,8,.35),(1.4,6,.2),stone,'11')

# Named camera views and a calm architectural clay presentation.
world=bpy.data.worlds.new('建筑灰模环境');world.use_nodes=True;bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.55,.63,.72,1);bg.inputs[1].default_value=.45;scene.world=world
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def camera(n,loc,target,scale):
    d=bpy.data.cameras.new(n);o=bpy.data.objects.new(n,d);cols['12'].objects.link(o);o.location=loc;aim(o,target);d.type='ORTHO';d.ortho_scale=scale;d.lens=45;return o
cam=camera('01 外观_前侧三分之四',(30,-43,25),(0,1,5),44)
cut=camera('02 拆顶结构',(25,-35,37),(0,1,3),43)
camera('03 正立面',(0,-55,9),(0,0,6.5),36)
camera('04 平面检查',(0,1,60),(0,1,0),38)
scene.camera=cam
d=bpy.data.lights.new('大面柔光','AREA');o=bpy.data.objects.new('大面柔光',d);cols['12'].objects.link(o);o.location=(0,-12,25);d.energy=2600;d.shape='DISK';d.size=18;aim(o,(0,0,0))
d=bpy.data.lights.new('太阳','SUN');o=bpy.data.objects.new('太阳',d);cols['12'].objects.link(o);o.rotation_euler=(.5,-.4,-.5);d.energy=2.1;d.angle=.2
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG'
scene.render.filepath=OUT+'/exterior.png'
for o in bpy.context.selected_objects:o.select_set(False)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.overlay.show_overlays=False
            area.spaces.active.shading.color_type='MATERIAL'
            area.spaces.active.clip_end=1000
notes=bpy.data.texts.new('README_模型说明')
notes.write('久远寺邸 / 毛坯体量与结构 v01\n参考：用户两张图片。按无尺寸设定图推定，非精确施工模型。\n长条主楼约 29m，层高 3.5m；正面为 -Y。\n集合 08 屋面可隐藏；07 是独立椽架；02/03 是分层外墙。\n首层和二层门窗为真实洞口，不含玻璃、门扇、家具和装饰。\n楼板保留门厅挑空、主梯和阁楼梯。图书馆为占位体量，温室为骨架。\n屋面交叉处尚未精细裁切，节点及结构仅用于视觉概念，不作工程依据。\n原有 Scene 保留；当前场景为久远寺邸。\n')
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/久远寺邸_毛坯框架_v01.blend')
print(json.dumps({'scene':scene.name,'objects':len(scene.objects),'blend':bpy.data.filepath},ensure_ascii=False))
