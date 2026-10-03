import * as THREE from 'three';
import {MeshoptSimplifier} from 'meshoptimizer';
await MeshoptSimplifier.ready;
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {HANDS,ARMS} from '../src/hand-shapes.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const destination=new URL('../src/hand-meshes.json',import.meta.url);
const hash=createHash('sha256').update(await readFile(new URL('../src/hand-shapes.js',import.meta.url))).update(await readFile(new URL('./bake-hands.mjs',import.meta.url))).digest('hex');
let cached;try{cached=JSON.parse(await readFile(destination,'utf8'));}catch{}
if(cached?.hash===hash){console.log('Arm and hand sculpture cache: unchanged');process.exit(0);}
const smoothMin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
function capsules(points,radii,count,transform){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.27),segments=[];
 const radius=t=>{const f=t*(radii.length-1),i=Math.min(radii.length-2,Math.floor(f));return THREE.MathUtils.lerp(radii[i],radii[i+1],f-i);};
 for(let i=0;i<count;i++){
  const a=curve.getPoint(i/count),b=curve.getPoint((i+1)/count);if(transform){a.applyMatrix4(transform);b.applyMatrix4(transform);}const d=b.clone().sub(a);
  segments.push({a:a.toArray(),b:b.toArray(),d:d.toArray(),length2:d.lengthSq(),ra:radius(i/count),rb:radius((i+1)/count)});
 }
 return segments;
}
// Cancel opposite duplicate faces created when isosurface samples collapse to
// the same quantized vertex. A doubled zero-volume flap is not a skin surface.
function cleanFaces(indices){
 const faces=new Map();let repeated=0,oppositePairs=0,duplicates=0;
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  if(a===b||b===c||c===a){repeated++;continue;}
  const sorted=[a,b,c].sort((x,y)=>x-y),key=sorted.join(',');
  const positive=(a<b&&b<c)||(b<c&&c<a)||(c<a&&a<b),sign=positive?1:-1;
  if(!faces.has(key))faces.set(key,{face:[a,b,c],balance:sign});
  else{const entry=faces.get(key);if(entry.balance===sign)duplicates++;else{entry.balance+=sign;oppositePairs++;}}
 }
 const result=[];
 for(const entry of faces.values())if(entry.balance!==0){
  let face=entry.face,positive=(face[0]<face[1]&&face[1]<face[2])||(face[1]<face[2]&&face[2]<face[0])||(face[2]<face[0]&&face[0]<face[1]);
  if((entry.balance>0)!==positive)face=[face[0],face[2],face[1]];
  result.push(...face);
 }
 if(repeated||oppositePairs||duplicates)console.log(JSON.stringify({meshCleanup:{repeated,oppositePairs,duplicates}}));
 return result;
}
function capsuleDistance(x,y,z,s){
 const dx=x-s.a[0],dy=y-s.a[1],dz=z-s.a[2],t=Math.max(0,Math.min(1,(dx*s.d[0]+dy*s.d[1]+dz*s.d[2])/s.length2));
 return Math.hypot(dx-t*s.d[0],dy-t*s.d[1],dz-t*s.d[2])-(s.ra+(s.rb-s.ra)*t);
}
const output={hash,description:'Seamless arms, wrists, palms and fingers. Authored distance fields baked once; no runtime meshing.'};
for(const [name,spec]of Object.entries(HANDS)){
 const arm=ARMS[name],res=name==='raised'?160:168,mc=new MarchingCubes(res,new THREE.MeshBasicMaterial(),false,false,200000);mc.isolation=0;
 const [min,max]=arm.bounds,span=min.map((v,i)=>max[i]-v),field=new Float32Array(res**3);field.fill(10);
 const splits=name==='raised'?[-.93,5.36,.12]:[.90,3.40,.22],cuts=name==='raised'?[.32,.34,.35]:[.40,.66,.32];
 const at=(axis,t)=>t<cuts[axis]?min[axis]+t/cuts[axis]*(splits[axis]-min[axis]):splits[axis]+(t-cuts[axis])/(1-cuts[axis])*(max[axis]-splits[axis]);
 const indexAt=(axis,v)=>v<splits[axis]?(v-min[axis])/(splits[axis]-min[axis])*cuts[axis]:cuts[axis]+(v-splits[axis])/(max[axis]-splits[axis])*(1-cuts[axis]);
 const transform=new THREE.Matrix4().compose(new THREE.Vector3(...spec.origin),new THREE.Quaternion().setFromEuler(new THREE.Euler(...spec.rotation,'ZYX')),new THREE.Vector3(1,1,1));
 function applyBounds(bmin,bmax,fn,k=0){
  const lo=bmin.map((v,i)=>Math.max(1,Math.floor(indexAt(i,v)*res))),hi=bmax.map((v,i)=>Math.min(res-2,Math.ceil(indexAt(i,v)*res)));
  for(let iz=lo[2];iz<=hi[2];iz++)for(let iy=lo[1];iy<=hi[1];iy++)for(let ix=lo[0];ix<=hi[0];ix++){
   const index=ix+res*(iy+res*iz),d=fn(at(0,ix/res),at(1,iy/res),at(2,iz/res));field[index]=k?smoothMin(field[index],d,k):Math.min(field[index],d);
  }
 }
 const allSegments=capsules(arm.points,arm.radii,56,null);
 for(const finger of spec.fingers)allSegments.push(...capsules(finger.points,finger.radii,24,transform));
 for(const seg of allSegments){const pad=Math.max(seg.ra,seg.rb)+.029;applyBounds(seg.a.map((v,i)=>Math.min(v,seg.b[i])-pad),seg.a.map((v,i)=>Math.max(v,seg.b[i])+pad),(x,y,z)=>capsuleDistance(x,y,z,seg));}
 for(const [c,r,angle=0]of spec.pads){
  const local=new THREE.Matrix4().compose(new THREE.Vector3(...c),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle),new THREE.Vector3(1,1,1)),matrix=transform.clone().multiply(local),inverse=matrix.clone().invert().elements;
  const center=new THREE.Vector3().setFromMatrixPosition(matrix),radius=Math.max(...r)+.034,bmin=center.toArray().map(v=>v-radius),bmax=center.toArray().map(v=>v+radius);
  applyBounds(bmin,bmax,(x,y,z)=>{
   const xx=inverse[0]*x+inverse[4]*y+inverse[8]*z+inverse[12],yy=inverse[1]*x+inverse[5]*y+inverse[9]*z+inverse[13],zz=inverse[2]*x+inverse[6]*y+inverse[10]*z+inverse[14];
   const k0=Math.hypot(xx/r[0],yy/r[1],zz/r[2]),k1=Math.hypot(xx/(r[0]*r[0]),yy/(r[1]*r[1]),zz/(r[2]*r[2]));return k1>1e-10?k0*(k0-1)/k1:-Math.min(...r);
  },c[1]<0?.043:.019);
 }
 const filtered=new Float32Array(field.length);
 for(const stride of [1,res,res*res]){
  filtered.set(field);
  for(let iz=2;iz<res-2;iz++)for(let iy=2;iy<res-2;iy++)for(let ix=2;ix<res-2;ix++){
   const index=ix+res*(iy+res*iz);if(Math.abs(field[index])>.055)continue;
   filtered[index]=.16*field[index-stride]+.68*field[index]+.16*field[index+stride];
  }
  field.set(filtered);
 }
 for(let i=0;i<field.length;i++)mc.field[i]=-(field[i]-.00025);
 mc.update();if(mc.count>=600000)throw Error('Arm mesh buffer exceeded');
 const positions=mc.geometry.attributes.position.array.slice(0,mc.count*3);
 for(let i=0;i<positions.length;i++){const axis=i%3;const t=(positions[i]+1)*.5,value=at(axis,t);positions[i]=min[axis]+Math.round((value-min[axis])/span[axis]*65535)/65535*span[axis];}
 const raw=new THREE.BufferGeometry();raw.setAttribute('position',new THREE.BufferAttribute(positions,3));const welded=mergeVertices(raw,1e-7),p=welded.attributes.position,q=new Uint16Array(p.array.length);
 welded.setIndex(cleanFaces(welded.index.array));
 const neighbors=Array.from({length:p.count},()=>new Set());
 for(let i=0;i<welded.index.count;i+=3){const a=welded.index.getX(i),b=welded.index.getX(i+1),c=welded.index.getX(i+2);for(const [x,y]of[[a,b],[b,c],[c,a]]){if(x!==y){neighbors[x].add(y);neighbors[y].add(x);}}}
 const adjacency=neighbors.map(set=>Array.from(set)),scratch=new Float32Array(p.array.length);
 // Alternating positive/negative steps smooth meshing ridges without simple shrink-wrap smoothing.
 for(const factor of [.38,-.40,.38,-.40,.38,-.40]){
  for(let i=0;i<p.count;i++){
   const ns=adjacency[i];for(let axis=0;axis<3;axis++){let sum=0;for(const j of ns)sum+=p.array[j*3+axis];const value=p.array[i*3+axis];scratch[i*3+axis]=ns.length?value+factor*(sum/ns.length-value):value;}
  }
  p.array.set(scratch);
 }
 for(let i=0;i<q.length;i++)q[i]=Math.round((p.array[i]-min[i%3])/span[i%3]*65535);
 const clean=[];for(let i=0;i<welded.index.count;i+=3){const a=welded.index.getX(i),b=welded.index.getX(i+1),c=welded.index.getX(i+2);if(a!==b&&b!==c&&a!==c)clean.push(a,b,c);}
 const dequantized=new Float32Array(q.length);
 for(let i=0;i<q.length;i++)dequantized[i]=min[i%3]+q[i]/65535*span[i%3];
 const requestedError=.00075,target=Math.floor(clean.length*.34/3)*3;
 const [simplified,error]=MeshoptSimplifier.simplify(new Uint32Array(clean),dequantized,3,target,requestedError,['ErrorAbsolute']);
 const remap=new Map(),compact=[],newIndices=[];
 for(const old of cleanFaces(simplified)){
  if(!remap.has(old)){remap.set(old,remap.size);compact.push(q[old*3],q[old*3+1],q[old*3+2]);}
  newIndices.push(remap.get(old));
 }
 const IndexType=remap.size>65535?Uint32Array:Uint16Array,indices=new IndexType(newIndices),packed=new Uint16Array(compact);
 output[name]={min,span,positions:Buffer.from(packed.buffer).toString('base64'),indices:Buffer.from(indices.buffer).toString('base64'),indexBytes:IndexType.BYTES_PER_ELEMENT,vertices:remap.size,triangles:indices.length/3,optimization:{inputTriangles:clean.length/3,outputTriangles:indices.length/3,reportedAbsoluteError:error,requestedAbsoluteError:requestedError}};
 console.log(JSON.stringify({armAndHand:name,vertices:remap.size,triangles:indices.length/3,optimization:output[name].optimization}));
 mc.geometry.dispose();mc.material.dispose();raw.dispose();welded.dispose();
}
await writeFile(destination,JSON.stringify(output)+'\n');
console.log('Saved seamless arm meshes; encoded geometry kept in file only.');
