import * as T from 'three';
import {roomUrl} from './door-navigation';

/** Both floors share one double-height atrium; only the arrival viewpoint changes. */
export function buildHall(upstairs=false){
  const root=new T.Group(),geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial({color:0x0b0c0e});
  const textures:T.Texture[]=[],materials:T.Material[]=[material],geometries:T.BufferGeometry[]=[geometry];
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,parent:T.Object3D=root)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;};
  const beam=(a:number[],b:number[],width:number,parent:T.Object3D=root)=>{const av=new T.Vector3(...a as [number,number,number]),bv=new T.Vector3(...b as [number,number,number]),delta=bv.clone().sub(av);const m=box(0,0,0,width,delta.length(),width,parent);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;};
  const plate=(x:number,y:number,z:number,text:string,parent:T.Object3D=root,w=2.3)=>{
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const c=canvas.getContext('2d')!;
    c.fillStyle='#0b0c0e';c.fillRect(0,0,768,160);c.fillStyle='#d2d3d5';c.font='40px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,384,80);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);const mat=new T.MeshBasicMaterial({map:texture});materials.push(mat);
    const m=box(x,y,z,w,.46,.018,parent);m.material=mat;m.userData.roomLabel=true;return m;
  };
  box(0,-.12,0,12,.24,12);
  for(const x of [-6,6])box(x,4.6,0,.18,9.2,12);
  for(const z of [-6,6])box(0,4.6,z,12,9.2,.18);
  // Lofty square skylight with a fine lattice, surrounded by a coffered ceiling.
  for(const x of [-4.65,4.65])box(x,9.18,0,2.7,.18,12);
  for(const z of [-4.65,4.65])box(0,9.18,z,6.6,.18,2.7);
  box(0,9.22,0,6.5,.035,6.5);
  for(const x of [-3.35,3.35])box(x,9.05,0,.2,.22,6.9);
  for(const z of [-3.35,3.35])box(0,9.05,z,6.9,.22,.2);
  for(let n=-3.12;n<=3.13;n+=.39){box(n,9.16,0,.018,.015,6.4);box(0,9.16,n,6.4,.015,.018);}
  for(const x of [-5.75,-2.2,2.2,5.75]){
    box(x,4.5,-5.76,.28,8.9,.26);for(const y of [.2,4.28,8.75])box(x,y,-5.66,.48,.2,.45);
  }
  for(const x of [-5.86,5.86])for(const y of [.15,1.28,4.25,8.72])box(x,y,0,.15,.06,12);
  for(const z of [-5.86,5.86])for(const y of [.15,1.28,4.25,8.72])box(0,y,z,12,.06,.15);
  for(let x=-5.7;x<6;x+=.8)box(x,.01,0,.015,.016,11.7);
  for(let z=-5.6;z<6;z+=2.3)box(0,.01,z,11.7,.016,.012);
  // Upper gallery runs along the left wall and across the rear wall.
  box(-4.08,4.28,0,3.8,.24,11.8);box(1.9,4.28,-4.98,8.15,.24,1.8);
  const rail=(a:number[],b:number[],parent:T.Object3D=root)=>{
    beam(a,b,.09,parent);const aa=new T.Vector3(...a as [number,number,number]),bb=new T.Vector3(...b as [number,number,number]);
    const count=Math.ceil(aa.distanceTo(bb)/.32);for(let i=0;i<=count;i++){const p=aa.clone().lerp(bb,i/count);box(p.x,p.y-.49,p.z,.045,.98,.045,parent);}
  };
  rail([-2.12,5.43,5.75],[-2.12,5.43,-1.05]);rail([-2.12,5.43,-3.18],[-2.12,5.43,-4.03]);rail([-2.12,5.43,-4.04],[5.75,5.43,-4.04]);
  for(const z of [-4.05,-1.05,5.75]){box(-2.12,4.99,z,.17,1.45,.17);box(-2.12,5.75,z,.28,.12,.28);}
  // Right-hand stair turns left at its half landing, as in the reference.
  const stairs=new T.Group();stairs.userData.href=roomUrl(upstairs?'hall':'landing');root.add(stairs);
  for(let i=0;i<10;i++){const y=(i+1)*.22,z=3-i*.36;box(3.93,y/2,z,2.02,y,.37,stairs);}
  box(3.93,2.09,-1.09,2.35,.22,1.48,stairs);
  for(let i=0;i<10;i++){const y=2.2+(i+1)*.22,x=3.47-i*.51;box(x,y-.11,-2.25,.53,.22,1.94,stairs);}
  box(-1.91,4.29,-2.25,.95,.22,2.1,stairs);
  for(const x of [2.89,4.97]){rail([x,1.25,3.12],[x,3.23,-.33],stairs);box(x,.78,3.15,.18,1.56,.18,stairs);box(x,1.61,3.15,.29,.1,.29,stairs);}
  for(const z of [-1.24,-3.27])rail([3.52,3.42,z],[-1.29,5.51,z],stairs);
  rail([5.05,3.25,-.4],[5.05,3.25,-3.25],stairs);
  for(const x of [3.73,-1.69]){box(x,x>0?2.92:5.02,-1.24,.2,1.5,.2,stairs);box(x,x>0?3.72:5.83,-1.24,.34,.13,.34,stairs);}
  plate(3.65,1.45,3.23,upstairs?'下楼 / 1F':'二楼卧室 ↑',stairs,1.65);
  if(upstairs)plate(-1.9,5.54,-1.02,'下楼 · 门厅 / 1F',stairs,2.1);
  function door(x:number,y:number,z:number,title:string,href:string,angle=0){
    const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;g.userData.href=href;root.add(g);
    box(0,1.5,0,1.7,3,.14,g);for(const xx of [-.96,.96]){box(xx,1.64,.04,.18,3.28,.25,g);box(xx,3.1,.05,.29,.15,.31,g);}
    box(0,3.29,.05,2.16,.17,.3,g);beam([-.65,3.42,.05],[0,3.68,.05],.065,g);beam([0,3.68,.05],[.65,3.42,.05],.065,g);
    for(const xx of [-.4,.4])for(const yy of [.63,1.62,2.52])box(xx,yy,.1,.62,.74,.04,g);
    box(.65,1.48,.17,.06,.19,.075,g);plate(0,3.92,.03,title,g);
  }
  door(-5.77,0,-.9,'客厅 / PARLOR',roomUrl(upstairs?'hall':'parlor'),Math.PI/2);
  door(5.77,0,3.65,'花房 / GARDEN',roomUrl(upstairs?'hall':'conservatory'),-Math.PI/2);
  door(0,0,5.78,'庭院 / COURTYARD',`${import.meta.env.BASE_URL.replace(/\/$/,'')}/kuonji/`,Math.PI);
  door(-4.1,4.4,-5.78,'2F 卧室 / BEDROOM',roomUrl(upstairs?'bedroom':'landing'));
  // Central fireplace, mirror, mantel and inset hearth.
  const hearth=new T.Group();hearth.userData.href='action:fireplace';root.add(hearth);
  box(0,.15,-5.2,3.8,.3,1.15,hearth);box(0,.37,-5.32,3.3,.14,.86,hearth);
  for(const x of [-1.28,1.28]){box(x,1.13,-5.36,.34,1.45,.58,hearth);box(x,1.87,-5.36,.47,.16,.69,hearth);}
  box(0,2,-5.34,3.05,.17,.81,hearth);box(0,1.76,-5.45,2.28,.2,.36,hearth);
  const curve=new T.EllipseCurve(0,1.01,.79,.75,0,Math.PI,false,0);const points=curve.getPoints(16);
  for(let i=0;i<points.length-1;i++)beam([points[i].x,points[i].y,-5.12],[points[i+1].x,points[i+1].y,-5.12],.07,hearth);
  for(const x of [-.79,.79])box(x,.75,-5.12,.07,.56,.07,hearth);
  box(0,3.1,-5.68,1.73,1.8,.08);box(0,3.1,-5.61,1.5,1.58,.05);
  plate(0,.56,-4.88,'点燃 / FIREPLACE',hearth,1.6);
  const flames=new T.Group();flames.name='fireplace-flames';flames.userData.href='action:fireplace';flames.visible=false;root.add(flames);
  const flameMat=new T.MeshBasicMaterial({color:0xd2d3d5,side:T.DoubleSide});materials.push(flameMat);
  for(let i=0;i<5;i++){const shape=new T.Shape();shape.moveTo(-.14,0);shape.quadraticCurveTo(-.22,.25,.03,.55+(i%2)*.14);shape.quadraticCurveTo(.28,.13,.14,0);shape.closePath();const geo=new T.ShapeGeometry(shape);geometries.push(geo);const flame=new T.Mesh(geo,flameMat);flame.position.set(-.54+i*.27,.49,-5.08);flame.userData.preserveSurface=true;flames.add(flame);}
  // Clock and narrow console give the otherwise spare hall a lived-in focal point.
  box(-4.5,.83,-4.95,1.15,.1,.6);for(const x of [-4.97,-4.03])box(x,.4,-4.95,.065,.8,.065);
  box(-5.15,1.56,-3.92,.56,3.12,.56);box(-5.15,2.58,-3.61,.43,.58,.025);
  root.updateMatrixWorld(true);
  const fixed:T.Mesh[]=[];
  root.traverse(o=>{if(!(o instanceof T.Mesh)||o.material!==material)return;let parent:T.Object3D|null=o;while(parent){if(parent.userData.href)return;parent=parent.parent;}fixed.push(o);});
  const batch=new T.InstancedMesh(geometry,material,fixed.length);
  fixed.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrixWorld);mesh.removeFromParent();});batch.computeBoundingSphere();root.add(batch);
  return {root,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
