import * as T from 'three';

/** Opaque black surfaces occlude hidden lines; no triangular wireframe or X-ray walls. */
export function outlineInterior(root:T.Group) {
  const fill=new T.MeshBasicMaterial({color:0x0b0c0e,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  const labelMaterials:T.Material[]=[];
  const main:number[]=[],detail:number[]=[];
  const point=new T.Vector3(),matrix=new T.Matrix4();
  root.updateMatrixWorld(true);
  const visit=(geometry:T.BufferGeometry,world:T.Matrix4)=>{
    const scale=new T.Vector3().setFromMatrixScale(world);
    // Avoid outlining tiny stitches and lamp hardware; architectural contours dominate.
    if(Math.max(scale.x,scale.y,scale.z)<.075)return;
    const axes=[scale.x,scale.y,scale.z];
    const ordered=[...axes].sort((a,b)=>b-a);
    // Long hairline moldings use one stroke instead of four nearly coincident edges.
    if(geometry.type==='BoxGeometry'&&ordered[0]>1&&ordered[1]<.09){
      const axis=axes.indexOf(ordered[0]);
      for(const sign of [-.5,.5]){point.set(0,0,0);point.setComponent(axis,sign);point.applyMatrix4(world);detail.push(point.x,point.y,point.z);}
      return;
    }
    const edges=new T.EdgesGeometry(geometry,28),position=edges.getAttribute('position');
    const target=Math.max(scale.x,scale.y,scale.z)>1.25?main:detail;
    for(let i=0;i<position.count;i++){point.fromBufferAttribute(position,i).applyMatrix4(world);target.push(point.x,point.y,point.z);}edges.dispose();
  };
  root.traverse(o=>{
    if(o instanceof T.Light){o.visible=false;return;}
    if(!(o instanceof T.Mesh))return;
    if(o.userData.preserveSurface)return;
    if(o.userData.roomLabel){const original=o.material as T.MeshToonMaterial;const material=new T.MeshBasicMaterial({map:original.map,color:0xffffff});o.material=material;labelMaterials.push(material);return;}
    o.material=fill;o.castShadow=false;o.receiveShadow=false;
    if(o instanceof T.InstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);visit(o.geometry,matrix);}}
    else visit(o.geometry,o.matrixWorld);
  });
  const lineResources:{geo:T.BufferGeometry;mat:T.LineBasicMaterial;line:T.LineSegments}[]=[];
  for(const [vertices,color] of [[main,0xb5b7ba],[detail,0x52565c]] as const){
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    const mat=new T.LineBasicMaterial({color});const line=new T.LineSegments(geo,mat);line.userData.ignoreDoorRay=true;line.raycast=()=>{};root.add(line);lineResources.push({geo,mat,line});
  }
  const dispose=()=>{fill.dispose();labelMaterials.forEach(m=>m.dispose());lineResources.forEach(({geo,mat,line})=>{geo.dispose();mat.dispose();line.removeFromParent();});};
  dispose.setTheme=(dark:boolean)=>{
    fill.color.setHex(dark?0x0b0c0e:0xf7f7f5);
    lineResources[0].mat.color.setHex(dark?0xb5b7ba:0x25282c);
    lineResources[1].mat.color.setHex(dark?0x52565c:0x85888b);
  };
  return dispose;
}
