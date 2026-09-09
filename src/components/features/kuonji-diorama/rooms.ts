import * as T from 'three';
import { roomUrl } from './door-navigation';
export type RoomName='parlor'|'conservatory'|'bedroom';

export function buildRoom(name:RoomName) {
  const root=new T.Group(), geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
  const boxGeo=new T.BoxGeometry(1,1,1), ballGeo=new T.SphereGeometry(1,16,10),cylGeo=new T.CylinderGeometry(1,1,1,16);
  [boxGeo,ballGeo,cylGeo].forEach(g=>geometries.add(g));
  const ramp=new T.DataTexture(new Uint8Array([110,174,220,255]),4,1,T.RedFormat);ramp.needsUpdate=true;ramp.magFilter=ramp.minFilter=T.NearestFilter;textures.add(ramp);
  const mat=(color:number,extra:T.MeshToonMaterialParameters={})=>{const m=new T.MeshToonMaterial({color,gradientMap:ramp,...extra});materials.add(m);return m;};
  const wood=mat(0x3f3029), edge=mat(0x6d5140), dark=mat(0x26252a), cream=mat(0xc6bca3), brass=mat(0x9c8051), green=mat(0x555b33), red=mat(0x754047), white=mat(0xdad8d1), cane=mat(0x987854);
  function canvasMaterial(draw:(c:CanvasRenderingContext2D)=>void,repeat=[1,1],size=256) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d')!;draw(c);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeat[0],repeat[1]);texture.anisotropy=4;textures.add(texture);return mat(0xffffff,{map:texture});
  }
  const wallpaper=canvasMaterial(c=>{c.fillStyle=name==='bedroom'?'#687b75':'#b4aa95';c.fillRect(0,0,256,256);c.strokeStyle=name==='bedroom'?'#8d9d8e':'#c7bea9';c.lineWidth=1.8;for(let x=-32;x<290;x+=64)for(let y=-32;y<290;y+=64){c.beginPath();c.moveTo(x,y-30);c.lineTo(x+27,y);c.lineTo(x,y+30);c.lineTo(x-27,y);c.closePath();c.stroke();c.beginPath();c.ellipse(x,y,8,13,0,0,Math.PI*2);c.stroke();}},[12,5]);
  const rug=canvasMaterial(c=>{c.fillStyle=name==='conservatory'?'#454b3e':name==='bedroom'?'#ae977e':'#795761';c.fillRect(0,0,256,256);if(name==='bedroom'){for(let x=0;x<256;x+=64)for(let y=0;y<256;y+=64){c.fillStyle=['#b79389','#bdb494','#92938b'][(x/64+y/64)%3];c.fillRect(x,y,64,64);}}else{c.strokeStyle='#b8ad8a';c.lineWidth=1.5;for(let x=16;x<256;x+=32)for(let y=16;y<256;y+=32){c.beginPath();c.ellipse(x,y,8,12,0,0,7);c.stroke();c.beginPath();c.arc(x,y,2,0,7);c.stroke();}}},[6,5]);
  function object(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,scale:number[],parent:T.Object3D=root) {
    const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.scale.set(scale[0],scale[1],scale[2]);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,parent:T.Object3D=root)=>object(boxGeo,m,x,y,z,[w,h,d],parent);
  const ball=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,parent:T.Object3D=root)=>object(ballGeo,m,x,y,z,[w,h,d],parent);
  const cyl=(x:number,y:number,z:number,r:number,h:number,m:T.Material,parent:T.Object3D=root)=>object(cylGeo,m,x,y,z,[r,h,r],parent);
  function beam(a:number[],b:number[],r:number,m:T.Material,parent:T.Object3D=root) {
    const av=new T.Vector3(...a as [number,number,number]),bv=new T.Vector3(...b as [number,number,number]),delta=bv.clone().sub(av);
    const mesh=object(cylGeo,m,...av.add(bv).multiplyScalar(.5).toArray() as [number,number,number],[r,delta.length(),r],parent);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh;
  }
  function roundBox(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,parent:T.Object3D=root,r=.09) {
    const shape=new T.Shape(),hw=w/2,hh=h/2,rr=Math.min(r,hw*.6,hh*.6);
    shape.moveTo(-hw+rr,-hh);shape.lineTo(hw-rr,-hh);shape.quadraticCurveTo(hw,-hh,hw,-hh+rr);shape.lineTo(hw,hh-rr);shape.quadraticCurveTo(hw,hh,hw-rr,hh);shape.lineTo(-hw+rr,hh);shape.quadraticCurveTo(-hw,hh,-hw,hh-rr);shape.lineTo(-hw,-hh+rr);shape.quadraticCurveTo(-hw,-hh,-hw+rr,-hh);
    const geo=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:6});geo.translate(0,0,-d/2);geometries.add(geo);return object(geo,m,x,y,z,[1,1,1],parent);
  }
  // Full room shell. Viewing point is inside; the rear return door stays reachable.
  box(0,-.1,0,12,.2,10,wood);
  const floorMats=[0x574437,0x4c3b31,0x614b3a].map(color=>mat(color));
  for(let x=-5.85;x<6;x+=.29)for(let z=-4.65;z<5;z+=1.2){const floor=box(x,.005,z,.274,.025,1.18,edge);floor.material=floorMats[Math.abs(Math.round((x+6)*8+z*2))%3];}
  box(0,2.5,-5,12,5,.18,wallpaper);box(-6,2.5,0,.18,5,10,wallpaper);box(0,2.5,5,12,5,.18,wallpaper);
  if(name!=='conservatory')box(6,2.5,0,.18,5,10,wallpaper);
  // Dark wood wainscoting, fluted pilasters and a coffered ceiling.
  for(const z of [-4.87,4.87]){box(0,.57,z,12,1.13,.08,wood);for(const y of [.09,1.13,4.67,4.8])box(0,y,z,12,.075,.12,edge);for(let x=-5.7;x<6;x+=1.2){box(x,.59,z+.035,.035,.94,.1,edge);box(x,4.71,z+.045,.68,.13,.1,wood);}}
  for(const x of [-5.87,5.87]){box(x,.57,0,.08,1.13,10,wood);for(const y of [.09,1.13,4.67,4.8])box(x,y,0,.12,.075,10,edge);for(let z=-4.5;z<5;z+=1.2)box(x,.59,z,.1,.94,.035,edge);}
  for(const x of [-5.65,-1.25,2.4,5.65]){box(x,2.86,-4.76,.28,3.58,.16,wood);for(const dx of [-.075,0,.075])box(x+dx,2.86,-4.65,.018,3.4,.024,edge);}
  if(name!=='conservatory') {
    box(0,5,0,12,.14,10,wood);
    for(let x=-5.9;x<6;x+=.24)box(x,4.91,0,.012,.012,10,dark);
    for(const x of [-4,0,4])box(x,4.79,0,.16,.2,10,dark);
    for(const z of [-3.2,0,3.2])box(0,4.79,z,12,.2,.16,dark);
  }
  const carpet=box(name==='bedroom'?.5:0,.035,.2,name==='conservatory'?8.6:7.8,.035,6.6,rug);
  for(const x of [-3.87,3.87])box(x,.059,.2,.065,.01,6.6,cream);
  // Outside trees drawn to a self-contained window texture, never stretched room photos.
  const view=canvasMaterial(c=>{const gradient=c.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#cbd0d7');gradient.addColorStop(1,'#8d9997');c.fillStyle=gradient;c.fillRect(0,0,256,256);c.strokeStyle='#74818b';for(let i=0;i<30;i++){let x=(i*79)%256;c.lineWidth=.5+(i%4)*.3;c.beginPath();c.moveTo(x,256);c.lineTo(x+Math.sin(i)*15,20);c.stroke();for(let j=0;j<4;j++){const y=45+j*48;c.beginPath();c.moveTo(x,y+35);c.lineTo(x+((i+j)%2?1:-1)*(12+i%20),y-16);c.stroke();}}},[1,1]);
  const viewMat=view as T.MeshToonMaterial;viewMat.emissive=new T.Color(0x9eacbd);viewMat.emissiveMap=viewMat.map;viewMat.emissiveIntensity=.6;
  function windowAt(x:number,z:number,w:number,angle=0) {
    const group=new T.Group();group.position.set(x,0,z);group.rotation.y=angle;root.add(group);
    const frame=name==='bedroom'?cream:wood;
    box(0,2.64,0,w,3.35,.045,view,group);
    for(const xx of [-w/2,0,w/2])box(xx,2.63,.06,.075,3.55,.11,frame,group);
    for(const yy of [.94,1.58,2.29,3,3.77,4.31])box(0,yy,.07,w+.17,.055,.12,frame,group);
    for(const xx of [-w/4,w/4])box(xx,2.62,.09,.023,3.3,.075,wood,group);
    box(0,.85,.17,w+.35,.1,.38,frame,group);box(0,4.42,.11,w+.32,.13,.24,wood,group);
    return group;
  }
  function curtain(group:T.Group,w:number,m:T.Material) {
    for(const sign of [-1,1])for(let i=0;i<8;i++){
      const strip=new T.PlaneGeometry(.115,3.59,2,18);const attr=strip.getAttribute('position');
      for(let j=0;j<attr.count;j++){const y=attr.getY(j),t=(y+1.795)/3.59;attr.setX(j,attr.getX(j)+sign*.2*Math.sin(t*Math.PI));attr.setZ(j,Math.sin(i*1.8)*.07);}
      strip.computeVertexNormals();geometries.add(strip);object(strip,m,sign*(w/2-.18)+i*.08*sign,2.59,.23,[1,1,1],group);
    }
    box(0,4.36,.3,w+.65,.3,.12,m,group);
    for(const s of [-1,1])box(s*(w/2+.15),1.55,.31,.4,.06,.05,brass,group);
  }
  const curtainMat=mat(name==='bedroom'?0x8c9b7b:0x773d38,{side:T.DoubleSide});
  if(name==='conservatory') {
    for(const x of [-4,-1,2,4.7])windowAt(x,-4.78,x===4.7?2.05:2.65);
    for(const z of [-3.45,-.35,2.8])windowAt(5.79,z,2.84,-Math.PI/2);
    // Glazed roof and cross bars continue the wall window rhythm.
    for(let x=-5.7;x<6;x+=2.2){box(x,4.98,0,2.06,.05,10,view);box(x-1.05,4.89,0,.12,.15,10,wood);}
    for(const z of [-3.4,0,3.4])box(0,4.85,z,12,.14,.12,wood);
  } else {
    for(const z of [-2.9,.45,3.65])curtain(windowAt(5.79,z,2.52,-Math.PI/2),2.52,curtainMat);
    if(name==='bedroom')curtain(windowAt(.5,-4.77,2.54),2.54,curtainMat);
  }
  // Diegetic brass nameplates identify doors; no floating room menu.
  const portals:T.Object3D[]=[];
  function door(x:number,z:number,label:string,href:string,angle=0) {
    const group=new T.Group();group.position.set(x,0,z);group.rotation.y=angle;group.userData.href=href;root.add(group);portals.push(group);
    box(0,1.51,0,1.4,3,.12,wood,group);
    for(const xx of [-.77,.77])box(xx,1.58,.05,.14,3.2,.2,edge,group);box(0,3.2,.04,1.72,.15,.2,edge,group);
    for(const xx of [-.34,.34])for(const yy of [.54,1.44,2.37]){box(xx,yy,.09,.53,.68,.08,edge,group);box(xx,yy,.14,.45,.58,.02,wood,group);}
    ball(.51,1.4,.23,.045,.045,.045,brass,group);box(.51,1.4,.14,.1,.22,.05,brass,group);
    const sign=canvasMaterial(c=>{c.fillStyle='#8d7554';c.fillRect(0,0,256,256);c.strokeStyle='#d2bd90';c.lineWidth=6;c.strokeRect(9,76,238,104);c.fillStyle='#272221';c.textAlign='center';c.textBaseline='middle';c.font='46px serif';c.fillText(label.split(' / ')[0],128,128);});
    box(0,2.76,.17,.79,.26,.025,sign,group);
    return group;
  }
  const exterior=`${import.meta.env.BASE_URL.replace(/\/$/,'')}/kuonji/`;
  if(name==='parlor'){door(-4,-4.72,'花房 / GARDEN',roomUrl('conservatory'));door(-5.73,-2.5,'私室 / BEDROOM',roomUrl('bedroom'),Math.PI/2);}
  else if(name==='bedroom')door(-5.73,-2.7,'客厅 / PARLOR',roomUrl(),Math.PI/2);
  else door(-4.3,-4.72,'客厅 / PARLOR',roomUrl());
  door(-5.73,3.25,'庭院 / COURTYARD',exterior,Math.PI/2);
  function tea(x:number,y:number,z:number,parent:T.Object3D=root){cyl(x,y,z,.14,.025,white,parent);cyl(x,y+.055,z,.09,.095,white,parent);const torus=new T.TorusGeometry(.055,.013,6,12);geometries.add(torus);object(torus,white,x+.11,y+.065,z,[1,1,1],parent);}
  function table(x:number,z:number,w:number,d:number,h=.72,parent:T.Object3D=root){roundBox(x,h,z,w,.11,d,wood,parent);box(x,.24,z,w*.88,.06,d*.88,edge,parent);for(const dx of [-w*.43,w*.43])for(const dz of [-d*.4,d*.4])beam([x+dx,.05,z+dz],[x+dx*.94,h,z+dz*.94],.055,edge,parent);}
  function sofa(x:number,z:number,width:number,angle=0){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);
    roundBox(0,.61,0,width,.29,.91,green,g,.17);roundBox(0,1.25,-.4,width,.99,.22,green,g,.2);
    for(const s of [-1,1]) {roundBox(s*(width/2+.03),.93,0,.21,.45,1,green,g,.1);beam([s*width/2,.81,.44],[s*width/2,1.03,-.45],.052,edge,g);for(const zz of [-.36,.36])beam([s*(width/2-.09),.47,zz],[s*(width/2+.02),.04,zz+.05],.05,edge,g);}
    for(let i=0;i<Math.floor(width/.26);i++)for(const y of [1.11,1.43])ball(-width/2+.14+i*.27,y,-.267,.036,.036,.022,brass,g);
    for(let i=0;i<24;i++){const xx=-width/2+i*width/23;beam([xx,1.8+Math.sin(i/23*Math.PI)*.14,-.4],[xx+width/23,1.8+Math.sin((i+1)/23*Math.PI)*.14,-.4],.042,edge,g);}
    return g;
  }
  function lamp(x:number,z:number){cyl(x,.035,z,.27,.07,dark);cyl(x,1.17,z,.024,2.3,brass);const g=new T.ConeGeometry(.31,.26,18,1,true);g.rotateX(Math.PI);geometries.add(g);object(g,cream,x,2.37,z,[1,1,1]);const light=new T.PointLight(0xffd9a4,5,5,2);light.position.set(x,2.4,z);root.add(light);}
  function chandelier(){beam([0,5,0],[0,4.12,0],.024,dark);ball(0,4.02,0,.12,.18,.12,brass);for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*.72,z=Math.sin(a)*.72;beam([0,4.12,0],[x,3.95,z],.027,dark);beam([x,3.95,z],[x,4.16,z],.025,dark);ball(x,4.23,z,.18,.13,.18,cream);const glow=new T.PointLight(0xffd9ac,.9,7,2);glow.position.set(x,4.1,z);root.add(glow);}}
  function plant(x:number,z:number,height=2){cyl(x,.25,z,.23,.5,cream);for(let i=0;i<11;i++){const angle=i*2.4,h=.55+i*height/12;beam([x,.4,z],[x+Math.cos(angle)*.37,h,z+Math.sin(angle)*.37],.016,wood);const leaf=ball(x+Math.cos(angle)*.39,h,z+Math.sin(angle)*.39,.1,.28,.045,green);leaf.rotation.z=Math.sin(angle)*.8;leaf.rotation.y=angle;}}
  function books(x:number,y:number,z:number,count=8){for(let i=0;i<count;i++){box(x+i*.11,y+.13,z,.085,.24+(i%3)*.04,.2,[red,cream,green,edge][i%4]);box(x+i*.11,y+.05,z+.107,.085,.013,.012,brass);}}
  if(name==='parlor') {
    sofa(3.17,-.45,3.13,-Math.PI/2);sofa(-2.33,.75,1.25,Math.PI/2);sofa(2.65,2.72,1.32,Math.PI-.25);
    table(.25,.2,2.78,1.6,.66);tea(.65,.735,.32);tea(-.38,.735,-.12);
    box(.2,2.9,-4.79,3.3,3.57,.11,wood);for(const x of [-1.39,1.79])box(x,2.92,-4.68,.06,3.4,.045,edge);
    box(.2,.81,-4.05,2.58,.98,.65,wood);for(const x of [-.61,.19,.99]){box(x,.8,-3.69,.72,.72,.06,edge);ball(x,.87,-3.635,.044,.022,.025,brass);}
    roundBox(.2,1.96,-4.08,1.83,1.36,.8,dark,root,.12);roundBox(.2,2,-3.635,1.49,1.04,.045,mat(0x171e25),root,.09);
    for(let i=0;i<7;i++)box(.52+i*.06,1.36,-3.629,.025,.03,.016,edge);
    lamp(-5.12,1.74);
    const mirrorGeo=new T.CylinderGeometry(.65,.65,.04,8);mirrorGeo.rotateX(Math.PI/2);geometries.add(mirrorGeo);
    object(mirrorGeo,edge,2.64,2.84,-4.67,[1,1,1]);const mirror=object(mirrorGeo,mat(0x77858a),2.64,2.84,-4.63,[.83,1,.83]);mirror.rotation.z=Math.PI/8;
    box(-5.52,.85,.15,.57,1.7,2.12,wood);box(-5.16,.88,.15,.035,1.26,1.62,dark);box(-5.46,1.76,.15,.85,.12,2.39,edge);
    chandelier();
  } else if(name==='conservatory') {
    cyl(-1.3,.88,-.2,1.02,.1,wood);for(const a of [0,2.09,4.18])beam([-1.3+Math.cos(a)*.67,.85,-.2+Math.sin(a)*.67],[-1.3+Math.cos(a)*.78,.06,-.2+Math.sin(a)*.78],.052,wood);
    for(const [x,z,angle] of [[-2.63,.1,-Math.PI/2],[-.38,1.08,Math.PI],[-1.05,-1.58,0]]){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);roundBox(0,.51,0,.67,.15,.64,cream,g);roundBox(0,1.14,-.28,.67,1.1,.09,wood,g,.2);roundBox(0,1.18,-.21,.54,.9,.06,cream,g,.17);for(const dx of [-.25,.25])for(const dz of [-.23,.23])beam([dx,.46,dz],[dx,.04,dz+.04],.035,wood,g);}
    tea(-1.55,.945,-.15);tea(-.96,.945,-.38);
    for(const [x,z,angle] of [[2.44,-2.68,-.36],[3.49,.79,-.6]]){
      const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);
      roundBox(0,.56,0,.85,.12,.75,cane,g);roundBox(0,1.11,-.37,.83,1.0,.08,cane,g,.21);
      for(let i=0;i<13;i++)beam([-.4+i*.065,.65,-.29],[-.4+i*.065,1.57,-.34],.012,cream,g);
      for(const dx of [-.43,.43]){beam([dx,.67,.35],[dx,1.15,-.3],.028,cane,g);for(const dz of [-.3,.3])beam([dx,.54,dz],[dx,.03,dz],.03,cane,g);}
      for(let i=0;i<12;i++)box(-.36+i*.065,.634,0,.02,.01,.7,cream,g);
      table(0,1.02,.68,.54,.52,g);
    }
    plant(-5.15,-3.4,2.7);plant(5.1,-3.95,2.4);plant(5.1,3.55,2.75);plant(1.13,-3.6,1.9);
    beam([0,4.9,-.4],[0,3.94,-.4],.023,dark);ball(0,3.72,-.4,.3,.43,.3,cream);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;beam([Math.cos(a)*.1,4.13,-.4+Math.sin(a)*.1],[Math.cos(a)*.31,3.71,-.4+Math.sin(a)*.31],.013,dark);beam([Math.cos(a)*.31,3.71,-.4+Math.sin(a)*.31],[0,3.32,-.4],.013,dark);}
  } else {
    // Bedroom: roll-top desk, green patterned curtains, guitars, quilt and chrome table.
    box(-3.25,.98,-3.59,2.15,.14,.87,edge);for(const x of [-4.12,-2.4])box(x,.54,-3.6,.065,.95,.065,wood);
    box(-3.25,1.32,-3.92,2.12,.64,.22,wood);for(const x of [-4.2,-2.3])roundBox(x,1.32,-3.65,.11,.74,.83,edge);
    for(const x of [-3.91,-3.26,-2.61]){box(x,.81,-3.1,.59,.22,.03,edge);beam([x-.075,.82,-3.05],[x+.075,.82,-3.05],.018,brass);}
    books(-4.05,1.03,-3.85,12);books(-3.85,1.65,-3.99,5);
    roundBox(-3.25,.52,-2.46,.65,.1,.63,edge);for(const x of [-3.5,-3]){beam([x,.06,-2.21],[x,1.26,-2.21],.03,wood);beam([x,.04,-2.7],[x,.49,-2.7],.03,wood);}for(const y of [.72,.98,1.23])box(-3.25,y,-2.2,.55,.07,.04,edge);
    // Iron bed, softly bulging mattress and layered pillows.
    box(-4.1,.33,1.55,2.32,.22,3.47,dark);roundBox(-4.1,.57,1.55,2.27,.36,3.42,white,root,.16);
    roundBox(-4.1,.79,.33,1.67,.15,.6,white,root,.1);
    for(const z of [-.22,3.32]){for(const x of [-5.22,-2.98]){beam([x,.05,z],[x,1.11,z],.026,dark);ball(x,1.16,z,.047,.047,.047,brass);}beam([-5.22,.99,z],[-2.98,.99,z],.025,dark);for(let x=-5.02;x<-3;x+=.22)beam([x,.3,z],[x,.96,z],.017,dark);}
    const chrome=mat(0x9ca9ac);roundBox(.25,.53,.8,2.34,.055,1.38,cream,root,.16);for(const x of [-.79,1.29])for(const z of [.25,1.35])beam([x,.49,z],[x,.055,z+.05],.027,chrome);
    for(let i=0;i<4;i++)box(.44+i*.035,.59+i*.032,.76,.52,.027,.38,[red,white,green,edge][i]);
    ball(1.75,.18,1.74,.52,.16,.37,white);ball(2.04,.12,1.11,.46,.12,.33,cream);
    box(3.58,.47,-3.32,1.04,.87,.63,dark);box(3.58,.47,-2.98,.91,.67,.02,edge);for(let i=0;i<20;i++)box(3.16+i*.044,.47,-2.96,.009,.64,.016,cream);
    function guitar(x:number,z:number,color:T.Material,angle:number){const g=new T.Group();g.position.set(x,0,z);g.rotation.z=angle;root.add(g);ball(0,.48,0,.31,.38,.095,color,g);ball(0,.78,0,.24,.26,.09,color,g);box(0,1.22,0,.087,.8,.085,wood,g);roundBox(0,1.69,0,.13,.23,.07,edge,g);ball(0,.64,.093,.078,.078,.008,dark,g);for(let i=0;i<6;i++)beam([-.027+i*.011,.42,.112],[-.027+i*.011,1.76,.065],.002,brass,g);for(let i=0;i<8;i++)box(0,.89+i*.084,.054,.085,.008,.005,brass,g);}
    guitar(2.27,-3.31,mat(0xbda16c),-.08);guitar(2.94,-3.83,mat(0x34445a),.12);
    for(const x of [-4.22,-3.33]){const art=canvasMaterial(c=>{c.fillStyle='#c2beb5';c.fillRect(0,0,256,256);c.fillStyle='#626867';c.beginPath();c.ellipse(128,94,49,64,0,0,7);c.fill();c.beginPath();c.ellipse(128,240,100,94,0,0,7);c.fill();});box(x,2.72,-4.72,.65,.88,.02,art);}
    chandelier();
  }
  root.updateMatrixWorld(true);
  const batches=new Map<string,{geometry:T.BufferGeometry;material:T.Material;meshes:T.Mesh[]}>();
  root.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material))return;let parent:T.Object3D|null=o;while(parent){if(parent.userData.href)return;parent=parent.parent;}const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,{geometry:o.geometry,material:o.material,meshes:[]});batches.get(key)!.meshes.push(o);});
  for(const batch of batches.values()){if(batch.meshes.length<4)continue;const inst=new T.InstancedMesh(batch.geometry,batch.material,batch.meshes.length);batch.meshes.forEach((o,i)=>{inst.setMatrixAt(i,o.matrixWorld);o.removeFromParent();});inst.castShadow=inst.receiveShadow=true;inst.computeBoundingSphere();root.add(inst);}
  return {root,portals,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
