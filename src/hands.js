import * as THREE from 'three';
import {mesh,ellipsoid,line,inkMaterial} from './geometry.js';
import {HANDS,ARMS} from './hand-shapes.js';
import baked from './hand-meshes.json';
function decode(text,Type){const binary=atob(text),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Type(bytes.buffer);}
function geometry(name){
 const data=baked[name],q=decode(data.positions,Uint16Array),positions=new Float32Array(q.length);
 for(let i=0;i<q.length;i++)positions[i]=data.min[i%3]+q[i]/65535*data.span[i%3];
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setIndex(new THREE.BufferAttribute(decode(data.indices,data.indexBytes===4?Uint32Array:Uint16Array),1));
 g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(positions.length/3*2),2));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function buildHands(body,M){
 const nails=M.skin.clone();nails.name='Natural satin nail plates';nails.color.set('#fce9e8');nails.emissive.set('#fce9e8');nails.emissiveIntensity=.35;
 for(const [key,spec]of Object.entries(HANDS)){
  const group=new THREE.Group();group.name=key==='raised'?'Right hand / relaxed temple gesture':'Left hand / pillow grip';group.position.set(...spec.origin);group.rotation.set(...spec.rotation,'ZYX');body.add(group);
  const skin=mesh(body,ARMS[key].name,geometry(key),M.skin,.0045);
  skin.userData.anatomy={fingers:spec.fingers.map(f=>({name:f.name,landmarks:f.points})),continuousPalm:true,continuousWrist:true,handOrigin:spec.origin,handRotation:spec.rotation};
  skin.receiveShadow=false;skin.children[0].material=inkMaterial(.0045,'#67515f');
  const inv=new THREE.Matrix4().compose(new THREE.Vector3(...spec.origin),new THREE.Quaternion().setFromEuler(new THREE.Euler(...spec.rotation,'ZYX')),new THREE.Vector3(1,1,1)).invert(),pos=skin.geometry.attributes.position,v=new THREE.Vector3(),weights=new Float32Array(pos.count);
  for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(inv);weights[i]=1-.85*THREE.MathUtils.smoothstep(v.y,-.20,.025);}
  skin.children[0].userData.extrusionWeights=weights;
  for(const finger of spec.fingers){
   const curve=new THREE.CatmullRomCurve3(finger.points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.27),t=.88,p=curve.getPoint(t),direction=curve.getTangent(t).normalize();
   const normal=new THREE.Vector3(0,0,key==='raised'?-1:-1).addScaledVector(direction,direction.z).normalize();
   if(normal.lengthSq()<.2)normal.set(0,1,0).addScaledVector(direction,-direction.y).normalize();
   const across=new THREE.Vector3().crossVectors(direction,normal).normalize(),basis=new THREE.Matrix4().makeBasis(across,direction,normal);
   p.addScaledVector(normal,finger.radii.at(-1)*1.01);
   const nail=ellipsoid(group,finger.name+' nail',p.toArray(),[finger.radii.at(-1)*.66,.019,.0028],nails,0,18);nail.quaternion.setFromRotationMatrix(basis);nail.receiveShadow=false;nail.castShadow=false;
   if(key==='raised'&&finger.name!=='Thumb')for(const at of [.36,.66]){
    const joint=curve.getPoint(at),d=curve.getTangent(at).normalize(),normal=new THREE.Vector3(0,0,1).addScaledVector(d,-d.z).normalize(),across=new THREE.Vector3().crossVectors(d,normal).normalize();
    const f=at*(finger.radii.length-1),i=Math.min(finger.radii.length-2,Math.floor(f)),r=THREE.MathUtils.lerp(finger.radii[i],finger.radii[i+1],f-i);
    joint.addScaledVector(normal,r+.0006);
    const fold=[joint.clone().addScaledVector(across,-r*.45),joint.clone().addScaledVector(d,-.0013),joint.clone().addScaledVector(across,r*.45)].map(p=>p.toArray());
    const crease=line(group,finger.name+' soft palmar joint '+at,fold,.0005,M.skinShade,{steps:12,sides:5});crease.castShadow=false;crease.receiveShadow=false;
   }
   if(key==='holding'&&finger.name!=='Thumb'){const joint=curve.getPoint(.34),d=curve.getTangent(.34).normalize(),n=new THREE.Vector3(0,0,-1).addScaledVector(d,d.z).normalize(),cross=new THREE.Vector3().crossVectors(d,n).normalize();joint.addScaledVector(n,finger.radii[1]+.0004);line(group,finger.name+' knuckle fold',[joint.clone().addScaledVector(cross,-.009).toArray(),joint.clone().addScaledVector(d,-.002).toArray(),joint.clone().addScaledVector(cross,.008).toArray()],.0007,M.skinShade,{steps:12,sides:5});}
  }
  if(key==='raised'){
   line(group,'Soft palm transverse crease',[[-.057,.121,.035],[-.012,.109,.044],[.041,.127,.036]],.00075,M.skinShade,{steps:24,sides:5});
   line(group,'Thumb pad crease',[[.030,.015,.037],[.004,.055,.048],[.017,.096,.045]],.0007,M.skinShade,{steps:22,sides:5});
  }
 }
}
