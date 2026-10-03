import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {HANDS} from '../src/hand-shapes.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const destination=new URL('../src/hand-meshes.json',import.meta.url);
const hash=createHash('sha256').update(await readFile(new URL('../src/hand-shapes.js',import.meta.url))).update(await readFile(new URL('./bake-hands.mjs',import.meta.url))).digest('hex');
let cached;try{cached=JSON.parse(await readFile(destination,'utf8'));}catch{}
if(cached?.hash===hash){console.log('Hand sculpture cache: unchanged');process.exit(0);}
const smoothMin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
function ellipsoidDistance(x,y,z,c,r,angle=0){
 x-=c[0];y-=c[1];z-=c[2];
 if(angle){const xx=x*Math.cos(angle)+y*Math.sin(angle);y=-x*Math.sin(angle)+y*Math.cos(angle);x=xx;}
 const k0=Math.hypot(x/r[0],y/r[1],z/r[2]),k1=Math.hypot(x/(r[0]*r[0]),y/(r[1]*r[1]),z/(r[2]*r[2]));
 return k1>1e-10?k0*(k0-1)/k1:-Math.min(...r);
}
function capsules(finger){
 const curve=new THREE.CatmullRomCurve3(finger.points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.27),segments=[];
 const radius=t=>{const f=t*(finger.radii.length-1),i=Math.min(finger.radii.length-2,Math.floor(f));return THREE.MathUtils.lerp(finger.radii[i],finger.radii[i+1],f-i);};
 for(let i=0;i<20;i++){
  const a=curve.getPoint(i/20),b=curve.getPoint((i+1)/20),d=b.clone().sub(a);
  segments.push({a:a.toArray(),d:d.toArray(),length2:d.lengthSq(),ra:radius(i/20),rb:radius((i+1)/20)});
 }
 return segments;
}
function capsuleDistance(x,y,z,s){
 const dx=x-s.a[0],dy=y-s.a[1],dz=z-s.a[2];
 const t=Math.max(0,Math.min(1,(dx*s.d[0]+dy*s.d[1]+dz*s.d[2])/s.length2));
 return Math.hypot(dx-t*s.d[0],dy-t*s.d[1],dz-t*s.d[2])-(s.ra+(s.rb-s.ra)*t);
}
const output={hash,description:'Baked full-volume hand sculpture from src/hand-shapes.js; no runtime meshing cost.',scale:1/65536};
for(const [name,spec]of Object.entries(HANDS)){
 const res=88,mc=new MarchingCubes(res,new THREE.MeshBasicMaterial(),false,false,60000);mc.isolation=0;
 const [min,max]=spec.bounds,span=min.map((v,i)=>max[i]-v),fingers=spec.fingers.map(capsules);
 let index=0;
 for(let iz=0;iz<res;iz++)for(let iy=0;iy<res;iy++)for(let ix=0;ix<res;ix++){
  const x=min[0]+ix/res*span[0],y=min[1]+iy/res*span[1],z=min[2]+iz/res*span[2];
  let palm=1e3;
  for(const [c,r,angle]of spec.pads)palm=smoothMin(palm,ellipsoidDistance(x,y,z,c,r,angle),.022);
  let digits=1e3;
  for(const finger of fingers){let distance=1e3;for(const seg of finger)distance=Math.min(distance,capsuleDistance(x,y,z,seg));digits=Math.min(digits,distance);}
  mc.field[index++]=-smoothMin(palm,digits,.014);
 }
 mc.update();
 if(mc.count>=60000*3)throw Error('Hand mesh buffer exceeded');
 const positions=mc.geometry.attributes.position.array.slice(0,mc.count*3);
 for(let i=0;i<positions.length;i++)positions[i]=min[i%3]+(positions[i]+1)*.5*span[i%3];
 for(let i=0;i<positions.length;i++)positions[i]=Math.round(positions[i]*65536)/65536;
 const raw=new THREE.BufferGeometry();raw.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const welded=mergeVertices(raw,1e-6),p=welded.attributes.position,quantized=new Int16Array(p.array.length);
 for(let i=0;i<quantized.length;i++)quantized[i]=Math.round(p.array[i]*65536);
 const clean=[];
 for(let i=0;i<welded.index.count;i+=3){const a=welded.index.getX(i),b=welded.index.getX(i+1),c=welded.index.getX(i+2);if(a!==b&&b!==c&&c!==a)clean.push(a,b,c);}
 const indices=new Uint16Array(clean);
 if(p.count>65535)throw Error('Hand exceeds 16-bit vertex index');
 output[name]={positions:Buffer.from(quantized.buffer).toString('base64'),indices:Buffer.from(indices.buffer).toString('base64'),vertices:p.count,triangles:indices.length/3};
 console.log(JSON.stringify({hand:name,vertices:p.count,triangles:indices.length/3}));
 mc.geometry.dispose();mc.material.dispose();raw.dispose();welded.dispose();
}
await writeFile(destination,JSON.stringify(output)+'\n');
console.log('Saved src/hand-meshes.json; encoded geometry kept in file only.');
