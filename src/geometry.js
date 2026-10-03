import * as THREE from 'three';
export const V = p => new THREE.Vector3(...p);
export const clamp = THREE.MathUtils.clamp;
export const lerp = THREE.MathUtils.lerp;
const inkMaterials = new Map();
export function inkMaterial(thickness = .008, color = '#45405f') {
  const key = `${thickness}:${color}`;
  if (!inkMaterials.has(key)) inkMaterials.set(key,new THREE.ShaderMaterial({
    name:'Illustration silhouette',side:THREE.BackSide,
    uniforms:{thickness:{value:thickness},ink:{value:new THREE.Color(color)}},
    vertexShader:'uniform float thickness; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*thickness,1.);}',
    fragmentShader:'uniform vec3 ink; void main(){gl_FragColor=vec4(ink,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
  }));
  return inkMaterials.get(key);
}
export function mesh(parent,name,geometry,material,outline=.005) {
  const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);
  if(outline>0){const ink=new THREE.Mesh(geometry,inkMaterial(outline));ink.name=`ink / ${name}`;ink.userData.outline=true;m.add(ink);}
  return m;
}
export function ellipsoid(parent,name,center,scale,mat,outline=.006,segments=40){
  const m=mesh(parent,name,new THREE.SphereGeometry(1,segments,Math.ceil(segments*.65)),mat,outline);
  m.position.set(...center);m.scale.set(...scale);return m;
}
export function gridGeometry(nu,nv,fn){
  const pos=[],uv=[],index=[];
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv;pos.push(...fn(u,v));uv.push(u,v);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,d=a+nu+1,c=d+1;index.push(a,b,d,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
// Smooth interpolation of manually authored cross-sections, not image measurements.
export function sampleRows(rows,t){
  const f=clamp(t,0,1)*(rows.length-1),k=Math.min(rows.length-2,Math.floor(f)),u=f-k;
  const a=rows[Math.max(0,k-1)],b=rows[k],c=rows[k+1],d=rows[Math.min(rows.length-1,k+2)];
  return b.map((_,i)=>.5*(2*b[i]+(-a[i]+c[i])*u+(2*a[i]-5*b[i]+4*c[i]-d[i])*u*u+(-a[i]+3*b[i]-3*c[i]+d[i])*u*u*u));
}
// A row is [height, centerX, centerZ, radiusX, radiusZ].
export function loft(parent,name,rows,mat,{segments=56,steps=52,outline=.006,deform=null}={}){
  return mesh(parent,name,gridGeometry(segments,steps,(u,v)=>{
    const [y,x,z,rx,rz]=sampleRows(rows,v),a=u*Math.PI*2;
    const p=[x+Math.max(.0003,rx)*Math.sin(a),y,z+Math.max(.0003,rz)*Math.cos(a)];return deform?deform(p,u,v):p;
  }),mat,outline);
}
export function sweep(parent,name,points,widths,depths,mat,{steps=56,sides=16,outline=.005}={}){
  const curve=new THREE.CatmullRomCurve3(points.map(V),false,'catmullrom',.45),sizes=widths.map((w,i)=>[w,depths[i]]);
  return mesh(parent,name,gridGeometry(sides,steps,(u,v)=>{
    const p=curve.getPoint(v),t=curve.getTangent(v).normalize();let b=new THREE.Vector3(0,0,1);b.addScaledVector(t,-b.dot(t)).normalize();
    if(b.lengthSq()<.1)b.set(0,1,0).addScaledVector(t,-t.y).normalize();
    const n=b.clone().cross(t).normalize(),a=u*Math.PI*2,[w,d]=sampleRows(sizes,v);
    p.addScaledVector(n,Math.max(.0006,w)*Math.cos(a)).addScaledVector(b,Math.max(.0006,d)*Math.sin(a));return p.toArray();
  }),mat,outline);
}
export function line(parent,name,points,radius,mat,{steps=40,sides=8,closed=false}={}){
  const curve=new THREE.CatmullRomCurve3(points.map(V),closed,'catmullrom',.35);
  return mesh(parent,name,new THREE.TubeGeometry(curve,steps,radius,sides,closed),mat,0);
}
export function patch(parent,name,shape,mat,zFunction,depth=.014,outline=.003){
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,curveSegments:20,steps:1});
  const a=g.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,a.getZ(i)+zFunction(a.getX(i),a.getY(i)));g.computeVertexNormals();return mesh(parent,name,g,mat,outline);
}
export function polygonShape(points){const s=new THREE.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
export function boundsAndStats(root){
  let meshes=0,vertices=0,triangles=0,badVertices=0;const materials=new Set();root.updateMatrixWorld(true);
  root.traverse(o=>{if(!o.isMesh||o.userData.outline)return;meshes++;const g=o.geometry,p=g.attributes.position;vertices+=p.count;triangles+=(g.index?g.index.count:p.count)/3;for(const x of p.array)if(!Number.isFinite(x))badVertices++;for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m.uuid);});
  const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3());return {meshes,vertices,triangles,materials:materials.size,badVertices,bounds:{min:b.min.toArray(),max:b.max.toArray(),size:size.toArray()}};
}

// A closed, curved hair ribbon with independently authored silhouette edges.
// Unlike a round swept tube, its width does not rotate with a center tangent.
export function ribbon(parent,name,left,right,depths,mat,{steps=64,sides=20,outline=.004}={}){
 const l=new THREE.CatmullRomCurve3(left.map(V),false,'catmullrom',.35),r=new THREE.CatmullRomCurve3(right.map(V),false,'catmullrom',.35);
 const depthRows=depths.map(d=>[d]);
 return mesh(parent,name,gridGeometry(sides,steps,(u,v)=>{
  const a=u*Math.PI*2,p=l.getPoint(v).lerp(r.getPoint(v),(Math.cos(a)+1)/2);
  p.z+=Math.sin(a)*Math.max(.0003,sampleRows(depthRows,v)[0]);return p.toArray();
 }),mat,outline);
}

// Average duplicate-position normals across UV seams after a posture deformation.
// Positions and UVs are untouched; genuine three-dimensional silhouettes are preserved.
export function smoothSeamNormals(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal;
 if(!p||!n)return;
 const sums=new Map(),keys=new Array(p.count);
 for(let i=0;i<p.count;i++){
  const key=`${Math.round(p.getX(i)*100000)},${Math.round(p.getY(i)*100000)},${Math.round(p.getZ(i)*100000)}`;
  keys[i]=key;let a=sums.get(key);
  if(!a){a=[0,0,0,0];sums.set(key,a);}
  a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);a[3]++;
 }
 for(let i=0;i<p.count;i++){
  const a=sums.get(keys[i]);if(a[3]<2)continue;
  const length=Math.hypot(a[0],a[1],a[2]);if(length>1e-6)n.setXYZ(i,a[0]/length,a[1]/length,a[2]/length);
 }
 n.needsUpdate=true;
}

// Closed beveled volume from a hand-drawn contour. Subdivided caps follow a curved
// support surface rather than remaining a flat card. This is useful for broad locks.
export function contourVolume(parent,name,shape,material,zFunction,{depth=.032,bevel=.006,outline=.003}={}){
 const base=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,curveSegments:18,steps:1});
 const source=base.index?base.toNonIndexed():base,p=source.attributes.position,uv=source.attributes.uv;
 const positions=[],texcoords=[];
 const mid=(a,b)=>a.map((x,i)=>(x+b[i])*.5);
 const emit=(a,b,c,n)=>{
  if(n){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);emit(a,ab,ca,n-1);emit(ab,b,bc,n-1);emit(ca,bc,c,n-1);emit(ab,bc,ca,n-1);return;}
  for(const v of [a,b,c]){positions.push(v[0],v[1],v[2]+zFunction(v[0],v[1]));texcoords.push(v[3],v[4]);}
 };
 for(let i=0;i<p.count;i+=3){
  const v=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j),uv.getX(i+j),uv.getY(i+j)]);
  const cap=Math.max(v[0][2],v[1][2],v[2][2])-Math.min(v[0][2],v[1][2],v[2][2])<1e-6;
  emit(v[0],v[1],v[2],cap?2:0);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(texcoords,2));g.computeVertexNormals();smoothSeamNormals(g);g.computeBoundingSphere();base.dispose();
 return mesh(parent,name,g,material,outline);
}
