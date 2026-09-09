import * as T from 'three';

/** A deterministic, entirely geometric miniature. Repeated details share draw calls. */
export function buildKuonji() {
  const root = new T.Group();
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  const textures = new Set<T.Texture>();
  const ramp = new T.DataTexture(new Uint8Array([95, 160, 211, 255]), 4, 1, T.RedFormat);
  ramp.minFilter = ramp.magFilter = T.NearestFilter; ramp.needsUpdate = true; textures.add(ramp);
  const mat = (color: number, extra: T.MeshToonMaterialParameters = {}) => {
    const m = new T.MeshToonMaterial({ color, gradientMap: ramp, ...extra }); materials.add(m); return m;
  };
  const plaster = mat(0xb1b5ae), stone = mat(0x777f80), stoneLight = mat(0x9caaa7);
  const wood = mat(0x383333), oak = mat(0x716052), slate = mat(0x39424b), lead = mat(0x222b32);
  const soil = mat(0x555e54), grass = mat(0x667568), moss = mat(0x76836b);
  const brick = mat(0x837366), brass = mat(0xb69c6d), dark = mat(0x20272c);
  const glass = mat(0x77989d, {transparent: true, opacity: .2, depthWrite: false, side: T.DoubleSide});
  const warm = mat(0xe6bd82, {emissive: 0xe8aa55, emissiveIntensity: .42});
  const cool = mat(0x729197, {emissive: 0x557581, emissiveIntensity: .1});
  const boxGeo = new T.BoxGeometry(1, 1, 1); geometries.add(boxGeo);
  const sphereGeo = new T.IcosahedronGeometry(1, 1); geometries.add(sphereGeo);
  const cylinderGeo = new T.CylinderGeometry(1, 1, 1, 7); geometries.add(cylinderGeo);
  type Batch = {geometry: T.BufferGeometry; material: T.Material; matrices: T.Matrix4[]; colors: T.Color[]};
  const batches = new Map<string, Batch>();
  const dummy = new T.Object3D();
  let seed = 318;
  const random = () => {seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296;};
  function instance(g: T.BufferGeometry, m: T.Material, pos: number[], scale: number[], rotation = [0,0,0], tint = 1) {
    const key = g.uuid + m.uuid;
    if (!batches.has(key)) batches.set(key, { geometry:g, material:m, matrices:[], colors:[] });
    dummy.position.set(pos[0],pos[1],pos[2]); dummy.scale.set(scale[0],scale[1],scale[2]); dummy.rotation.set(rotation[0],rotation[1],rotation[2]); dummy.updateMatrix();
    const batch = batches.get(key)!; batch.matrices.push(dummy.matrix.clone()); batch.colors.push(new T.Color(tint,tint,tint));
  }
  const box = (x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rotation=[0,0,0],tint=1) => instance(boxGeo,m,[x,y,z],[w,h,d],rotation,tint);
  const blob = (x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material) => instance(sphereGeo,m,[x,y,z],[w,h,d],[random(),random(),random()],.85+random()*.2);
  function beam(a:number[],b:number[],r:number,m:T.Material, round=false) {
    const av = new T.Vector3(...a as [number,number,number]), bv = new T.Vector3(...b as [number,number,number]);
    const delta = bv.clone().sub(av); dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());
    const e = new T.Euler().setFromQuaternion(dummy.quaternion);
    instance(round ? cylinderGeo : boxGeo,m,av.add(bv).multiplyScalar(.5).toArray(),[r,delta.length(),r],[e.x,e.y,e.z]);
  }
  function mesh(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0) {
    geometries.add(g); const o=new T.Mesh(g,m); o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o;
  }
  function roundedSlab(size:number, height:number, y:number, material:T.Material) {
    const half=size/2, r=.16, s=new T.Shape();
    s.moveTo(-half+r,-half);s.lineTo(half-r,-half);s.quadraticCurveTo(half,-half,half,-half+r);
    s.lineTo(half,half-r);s.quadraticCurveTo(half,half,half-r,half);s.lineTo(-half+r,half);
    s.quadraticCurveTo(-half,half,-half,half-r);s.lineTo(-half,-half+r);s.quadraticCurveTo(-half,-half,-half+r,-half);
    const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:4});g.rotateX(-Math.PI/2);mesh(g,material,0,y,0);
  }
  // Complete square foundation: masonry, exposed wood sandwich, and garden soil.
  roundedSlab(14,.55,-.15,stone);roundedSlab(14.08,.18,.4,oak);roundedSlab(14,.13,.58,stoneLight);roundedSlab(13.85,.27,.71,soil);
  for(let row=0;row<3;row++) for(let i=0;i<22;i++) {
    const v=-6.67+i*.62+(row%2)*.12;
    for(const sign of [-1,1]) {box(v,-.06+row*.16,sign*7.006,.59,.135,.028,stone,[0,0,0],.78+random()*.4);box(sign*7.006,-.06+row*.16,v,.028,.135,.59,stone,[0,0,0],.78+random()*.4);}
  }
  // Back garden raised above the arrival court, with a masonry retaining terrace.
  box(0,1.28,-2.2,12.55,.6,7.8,soil);
  for(let row=0;row<4;row++) for(let i=0;i<26;i++) {
    const x=-6.15+i*.48;
    if(Math.abs(x)<1.17)continue;
    box(x,1.02+row*.15,1.72,.455,.13,.25,stone,[0,0,0],.85+random()*.25);
  }
  // A long gently rising stone approach, staying wholly inside the base.
  for(let row=0;row<17;row++) for(let col=0;col<5;col++) {
    box((col-2)*.43,1.01+row*.012,6.56-row*.245,.405,.085,.222,stoneLight,[0,(random()-.5)*.035,0],.82+random()*.22);
  }
  for(let i=0;i<6;i++) box(0,1.16+i*.08,2.55-i*.22,2.32,.18,.27,stoneLight);
  for(let x=-5.6;x<=5.6;x+=.48)for(let z=.4;z<1.65;z+=.42)box(x,1.62,z,.454,.07,.396,stoneLight,[0,0,0],.81+random()*.22);
  // Footprint and oak ground floor. Front points toward +Z.
  box(-.65,1.78,-2.35,7.9,.38,4.8,stone);
  box(-.65,2,-2.35,7.75,.08,4.65,oak);
  box(-.65,3.61,-4.65,7.75,3.2,.2,plaster);
  box(-4.44,3.61,-2.35,.2,3.2,4.65,plaster);
  box(3.14,3.61,-2.35,.2,3.2,4.65,plaster);
  box(-.65,3.67,-2.35,7.7,.16,4.65,oak);
  // Facade pierced by two tiers of tall windows, rather than painted rectangles.
  const front=.015;
  for(const y of [2.12,3.58,3.91,5.18])box(-.65,y,front,7.75,.26,.19,plaster);
  const windowXs=[-3.57,-2.07,-.57,.93,2.43];
  for(let i=0;i<6;i++)box(-4.32+i*1.5,3.62,front,.49,3.05,.22,plaster);
  function windowUnit(x:number,y:number,z:number,w=.92,h=1.12,lit=false,ry=0) {
    const local=(dx:number,dy:number,dz:number,ww:number,hh:number,dd:number,m:T.Material)=>box(x+dx*Math.cos(ry)+dz*Math.sin(ry),y+dy,z-dx*Math.sin(ry)+dz*Math.cos(ry),ww,hh,dd,m,[0,ry,0]);
    local(0,0,-.09,w,h,.035,lit?warm:cool);
    for(const xx of [-w/2,0,w/2])local(xx,0,.025,.048,h+.13,.09,wood);
    for(const yy of [-h/2,h/2,0])local(0,yy,.035,w+.1,.045,.1,wood);
    local(0,-h/2-.08,.09,w+.22,.1,.26,stoneLight);
    local(0,h/2+.075,.055,w+.2,.07,.15,wood);
    for(const xx of [-w*.36,w*.36]) local(xx,0,-.05,.1,h*.94,.03,plaster);
  }
  for(const x of windowXs){windowUnit(x,2.84,front+.07,.97,1.13,x===.93);windowUnit(x,4.52,front+.07,.97,1.12,x===-2.07);}
  for(const side of [-1,1]) for(const z of [-3.65,-2.15,-.7]) for(const y of [2.86,4.52])windowUnit(side===1?3.26:-4.56,y,z,.82,1.03,false,side*Math.PI/2);
  for(const x of windowXs)for(const y of [2.84,4.52])windowUnit(x,y,-4.79,.88,1.1,false,Math.PI);
  // Exposed half-timber grid and stone skirt on all four elevations.
  for(const y of [2.04,3.63,5.22]) {box(-.65,y,.17,7.98,.12,.14,wood);box(-.65,y,-4.81,7.98,.12,.12,wood);for(const x of [-4.57,3.28])box(x,y,-2.32,.14,.12,4.95,wood);}
  for(let i=0;i<6;i++){const x=-4.38+i*1.5;box(x,3.6,.17,.1,3.3,.14,wood);box(x,3.6,-4.81,.1,3.3,.12,wood);}
  for(const x of [-4.57,3.28])for(const z of [-4.66,-3.25,-1.75,-.05])box(x,3.61,z,.12,3.25,.11,wood);
  for(let row=0;row<3;row++)for(let i=0;i<17;i++)box(-4.35+i*.455,1.68+row*.105,.075,.43,.085,.14,stoneLight,[0,0,0],.83+random()*.2);
  function gable(x:number,z:number,w:number,depth:number,eave:number,rise:number,axis:'x'|'z'='z') {
    const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);
    if(axis==='x')g.rotateY(Math.PI/2);mesh(g,plaster,x,eave,z);
    const angle=Math.atan2(rise,w/2), slope=Math.hypot(w/2,rise), length=depth+.5;
    for(const side of [-1,1]) {
      const rot=axis==='z'?[0,0,-side*angle]:[side*angle,0,0];
      const px=x+(axis==='z'?side*w/4:0), pz=z+(axis==='x'?side*w/4:0);
      box(px,eave+rise/2,pz,axis==='z'?slope+.32:length,.13,axis==='z'?length:slope+.32,slate,rot);
      // Slate courses are real low relief tiles, batched into one instanced mesh.
      const rows=Math.ceil(slope/.23), cols=Math.ceil(length/.31);
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) {
        const t=(r+.5)/rows, across=-length/2+(c+.5)*length/cols;
        const a=side*w/2*(1-t), yy=eave+rise*t+.085;
        box(x+(axis==='z'?a:across),yy,z+(axis==='z'?across:a),axis==='z'?slope/rows*.91:length/cols*.94,.025,axis==='z'?length/cols*.94:slope/rows*.91,slate,rot,.85+random()*.3);
      }
    }
    if(axis==='z')beam([x,eave+rise+.1,z-length/2],[x,eave+rise+.1,z+length/2],.14,lead);
    else beam([x-length/2,eave+rise+.1,z],[x+length/2,eave+rise+.1,z],.14,lead);
    // Dark framing on both gable ends; diagonal braces define the silhouette.
    for(const end of [-1,1]) {
      const loc=(a:number,b:number)=>axis==='z'?[x+a,eave+b,z+end*(depth/2+.04)]:[x+end*(depth/2+.04),eave+b,z+a];
      beam(loc(-w/2,0),loc(0,rise),.12,wood);beam(loc(0,rise),loc(w/2,0),.12,wood);beam(loc(-w/2,0),loc(w/2,0),.13,wood);
      beam(loc(0,0),loc(0,rise),.11,wood);
      for(const sign of [-1,1]) {beam(loc(sign*w*.25,0),loc(sign*w*.25,rise*.5),.085,wood);beam(loc(0,.15),loc(sign*w*.31,rise*.35),.085,wood);}
    }
  }
  // Main cross roof, the tall left gable, entrance gable, and right projecting wing.
  gable(-.65,-2.35,4.9,8.15,5.25,2.18,'x');
  gable(-2.8,-1.72,2.64,4.5,5.26,2.48);
  box(1.98,3.61,.12,2.45,3.2,.58,plaster);gable(1.98,-.18,2.72,1.7,5.26,1.8);
  for(const y of [2.87,4.5])windowUnit(1.98,y,.47,1.63,1.13,y<3);
  for(const x of [.73,3.23])box(x,3.6,.49,.1,3.24,.1,wood);
  box(1.98,3.64,.5,2.6,.12,.14,wood);
  // Porch with heavy double doors, a small fanlight and a separate steep roof.
  box(-.56,2.95,.61,2.14,2.03,1.15,plaster);gable(-.56,.43,2.5,1.9,3.98,1.46);
  box(-.56,2.8,1.2,1.12,1.78,.13,wood);
  for(const x of [-.85,-.27])for(const y of [2.27,2.8,3.34])box(x,y,1.278,.44,.4,.03,oak);
  box(-.56,2.82,1.3,.055,1.82,.04,dark);
  for(const x of [-.66,-.46])blob(x,2.85,1.34,.033,.033,.033,brass);
  windowUnit(-.56,4.31,1.4,.56,.38,true);
  for(const x of [-1.64,.52])box(x,3,1.19,.14,2.18,.17,wood);
  for(let i=0;i<3;i++)box(-.56,1.71+i*.1,1.93-i*.24,2.5,.14,.4,stoneLight);
  // Belvedere and two prominent brick chimney stacks.
  box(-1.42,6.83,-2.82,1.16,1.82,1.2,plaster);
  for(const x of [-2.01,-.83])for(const z of [-3.43,-2.21])box(x,6.82,z,.1,1.9,.1,wood);
  windowUnit(-1.42,7.27,-2.18,.79,.71,false);
  for(const x of [-2.05,-.79])windowUnit(x,7.27,-2.83,.8,.7,false,x< -1? -Math.PI/2:Math.PI/2);
  const towerRoof=new T.ConeGeometry(1.18,1.3,4);towerRoof.rotateY(Math.PI/4);mesh(towerRoof,slate,-1.42,8.28,-2.82);
  box(-1.42,7.63,-2.82,1.63,.13,1.63,lead);
  beam([-1.42,8.84,-2.82],[-1.42,9.23,-2.82],.045,lead);beam([-1.68,9.11,-2.82],[-1.17,9.11,-2.82],.035,lead);
  for(const [x,z,top] of [[-3.9,-1.65,8.1],[1.18,-3.4,7.94]]) {
    box(x,(top+2)/2,z,.54,top-2,.64,brick);
    for(let y=2.12;y<top;y+=.2){box(x,y,z+.326,.56,.022,.015,stone);box(x+.28,y,z,.014,.022,.65,stone);for(let j=0;j<2;j++)box(x-.2+j*.28+(Math.floor(y*5)%2)*.08,y+.09,z+.332,.014,.16,.014,stone);}
    box(x,top,z,.78,.16,.84,stoneLight);for(const dx of [-.17,.17]){box(x+dx,top+.24,z,.2,.38,.23,brick);box(x+dx,top+.44,z,.25,.06,.27,dark);}
  }
  // Three little dormers on the front main slope.
  for(const x of [-.8,.2,1.2]) {box(x,6.19,-.9,.6,.62,.6,plaster);gable(x,-.93,.75,.8,6.5,.38);windowUnit(x,6.2,-.57,.4,.43,false);}
  // Conservatory: transparent panes, full mullion structure and furnished floor.
  const gx=4.39,gz=-1.2,gw=2.18,gd=3.42;
  box(gx,1.87,gz,gw+.25,.46,gd+.25,stone);box(gx,2.12,gz,gw,.05,gd,oak);
  for(const sx of [-1,1]){
    const xx=gx+sx*gw/2;box(xx,3.05,gz,.035,1.8,gd,glass);
    for(let i=0;i<6;i++)box(xx,3.13,gz-gd/2+i*gd/5,.05,2.02,.05,wood);
    for(const yy of [2.18,2.63,3.13,3.66,4.13])box(xx,yy,gz,.06,.045,gd+.12,wood);
  }
  for(const sz of [-1,1]) {
    const zz=gz+sz*gd/2;box(gx,3.13,zz,gw,1.9,.035,glass);
    for(let i=0;i<5;i++)box(gx-gw/2+i*gw/4,3.13,zz,.045,2.05,.06,wood);
    for(const yy of [2.18,2.63,3.13,3.66,4.13])box(gx,yy,zz,gw+.1,.045,.06,wood);
  }
  const greenhouseRise=.65, roofSlope=Math.hypot(gw/2,greenhouseRise), roofAngle=Math.atan2(greenhouseRise,gw/2);
  for(const side of [-1,1]) {
    box(gx+side*gw/4,4.13+greenhouseRise/2,gz,roofSlope,.04,gd+.25,glass,[0,0,-side*roofAngle]);
    for(let i=0;i<7;i++){const zz=gz-gd/2+i*gd/6;beam([gx+side*(gw/2+.1),4.1,zz],[gx,4.8,zz],.05,wood);}
  }
  beam([gx,4.8,gz-gd/2-.15],[gx,4.8,gz+gd/2+.15],.07,lead);
  // A small lived-in tea room: table, porcelain, chairs, books and plants.
  function table(x:number,y:number,z:number,w=1,d=.6) {box(x,y+.57,z,w,.08,d,oak);for(const dx of [-w*.38,w*.38])for(const dz of [-d*.35,d*.35])box(x+dx,y+.28,z+dz,.065,.55,.065,wood);}
  table(gx,2.13,gz,.94,.65);
  const porcelain=mat(0xd6d2c1), upholstery=mat(0x766267);
  for(const dx of [-.23,.22]){instance(cylinderGeo,porcelain,[gx+dx,2.77,gz],[.078,.085,.078]);instance(cylinderGeo,porcelain,[gx+dx,2.72,gz],[.11,.018,.11]);}
  blob(gx,2.8,gz-.13,.11,.13,.11,porcelain);beam([gx+.04,2.83,gz-.13],[gx+.17,2.88,gz-.13],.035,porcelain,true);
  for(const zz of [gz-.68,gz+.68]) {box(gx,2.46,zz,.46,.1,.43,upholstery);box(gx,2.8,zz+(zz>gz?.2:-.2),.46,.64,.065,wood);for(const xx of [-.16,.16])for(const dz of [-.14,.14])box(gx+xx,2.29,zz+dz,.045,.33,.045,wood);}
  function bookcase(x:number,y:number,z:number,w:number) {
    box(x,y+.65,z,w,1.3,.28,wood);
    for(let row=0;row<3;row++)for(let i=0;i<9;i++)box(x-w*.42+i*w*.105,y+.16+row*.38,z+.17,w*.075,.23+random()*.08,.2,[oak,slate,brick,moss][i%4]);
  }
  bookcase(3.57,2.13,-2.35,.9);
  // Furnished rooms behind the facade; rear partitions imply the old manor's depth.
  for(const y of [2.08,3.78]) {
    bookcase(-3.55,y,-4.17,1.1);bookcase(.25,y,-4.17,1.7);
    table(-2.8,y,-1.08,1.05,.63);box(.58,y+.25,-1.2,1.2,.4,.52,upholstery);box(.58,y+.57,-1.45,1.2,.55,.12,wood);
    box(-1.3,y+.71,-3.18,.08,1.4,2.4,plaster);
  }
  for(let i=0;i<11;i++)box(-.5,2.13+i*.14,-3.9+i*.18,.75,.15,.22,oak);
  // Rear kitchen and a compact dining room, concealed naturally by the roof.
  box(1.95,2.48,-4.15,1.8,.77,.5,oak);box(1.95,2.91,-4.15,1.86,.07,.55,stoneLight);
  box(2.45,2.93,-4.13,.36,.045,.32,lead);
  table(.82,2.08,-2.9,1.35,.74);
  for(const x of [.39,1.23])for(const z of [-3.46,-2.36]){box(x,2.44,z,.34,.08,.32,oak);box(x,2.7,z+(z<-3?-.13:.13),.34,.52,.055,wood);for(const dx of [-.12,.12])box(x+dx,2.26,z,.038,.36,.038,wood);}
  // Low cellar/workshop retained inside the raised foundation of the miniature.
  box(-2.2,1.48,-3,2.4,.045,2,oak);table(-2.2,1.5,-3,.92,.52);
  bookcase(-3.1,1.46,-3.72,.65);
  for(const dx of [-.22,.05,.24])blob(-2.2+dx,2.16,-3,.055,.09,.055,cool);
  box(2.49,2.64,-3.9,.9,1.1,.42,stone);box(2.49,2.48,-3.66,.56,.56,.03,dark);box(2.49,3.24,-3.9,1.08,.14,.6,oak);
  for(const x of [-1.96,.84]) {
    beam([x,3.31,1.22],[x,3.31,1.53],.055,lead);box(x,3.17,1.54,.18,.29,.18,warm);box(x,3.35,1.54,.25,.065,.25,lead);
  }
  // Garden wall, pale urns and a simple wrought-iron approach gate.
  for(const sign of [-1,1]) {
    for(let i=0;i<8;i++){const x=sign*(1.6+i*.6);box(x,1.2,5.8,.56,.43,.25,stone);box(x,1.44,5.8,.59,.07,.34,stoneLight);}
    box(sign*1.35,1.61,5.8,.38,1.3,.38,stone);box(sign*1.35,2.3,5.8,.5,.12,.5,stoneLight);blob(sign*1.35,2.49,5.8,.16,.16,.16,stoneLight);
    for(let i=0;i<10;i++){const x=sign*(1.68+i*.37);beam([x,1.49,5.8],[x,2.05,5.8],.026,lead);}
    beam([sign*1.56,1.88,5.8],[sign*5.04,1.88,5.8],.035,lead);
  }
  for(const x of [-2.05,2.05]) {
    instance(cylinderGeo,stoneLight,[x,1.98,1.44],[.23,.53,.23]);box(x,1.69,1.44,.53,.1,.53,stoneLight);
    blob(x,2.38,1.44,.43,.36,.4,grass);
  }
  // Quiet bare trees frame the roof without hiding the front elevation.
  function tree(x:number,z:number,height:number) {
    const ground=z<1.7?1.59:.99;
    const trunk=[x,ground,z], crown=[x+.13,ground+height,z-.15];
    beam(trunk,crown,.16,wood,true);
    for(let j=0;j<9;j++) {
      const angle=j*2.4+random()*.6, startY=ground+height*(.29+j*.06), reach=.7+random()*.7;
      const a=[x+.08,startY,z-.07], b=[x+Math.cos(angle)*reach,startY+.65+random()*.45,z+Math.sin(angle)*reach];
      beam(a,b,.065,wood,true);
      for(let k=0;k<3;k++){const end=[b[0]+Math.cos(angle+k-.7)*.46,b[1]+.42+random()*.36,b[2]+Math.sin(angle+k-.7)*.46];beam(b,end,.025,wood,true);beam(end,[end[0]+.18,end[1]+.23,end[2]-.14],.012,wood,true);}
    }
  }
  tree(-5.7,-.9,4.8);tree(5.84,-3.6,4.85);tree(-4.9,-5.42,5.25);tree(2.9,-5.62,4.15);tree(5.7,3.28,3.48);tree(-5.48,3.2,3.05);
  for(let i=0;i<100;i++) {
    const side=i%2?1:-1, x=side*(4.9+random()*1.55),z=-5.9+random()*11.2, y=z<1.7?1.57:1;
    blob(x,y+.14,z,.16+random()*.36,.15+random()*.26,.18+random()*.33,i%3?grass:moss);
  }
  for(let i=0;i<200;i++) {
    const x=(random()-.5)*12.8,z=2.8+random()*3.9;
    if(Math.abs(x)<1.23)continue;
    const h=.06+random()*.14;beam([x,1,z],[x+.03,1+h,z],.012,moss);if(i%4===0)blob(x,1.025,z,.065,.02,.043,oak);
  }
  for(const [x,z] of [[5.05,-2.58],[3.76,.12],[5.07,.02]]) {instance(cylinderGeo,brick,[x,2.32,z],[.18,.35,.18]);for(let i=0;i<7;i++)beam([x,2.43,z],[x+(random()-.5)*.45,2.8+random()*.3,z+(random()-.5)*.45],.028,grass,true);}
  // Bake all repeated pieces; transparent glass remains a separate batch.
  for(const b of batches.values()) {
    const inst=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);
    b.matrices.forEach((matrix,i)=>{inst.setMatrixAt(i,matrix);inst.setColorAt(i,b.colors[i]);});
    inst.castShadow=b.material!==glass;inst.receiveShadow=true;inst.computeBoundingSphere();root.add(inst);
  }
  return {root, dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
