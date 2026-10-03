import fs from 'node:fs';
import * as THREE from 'three';
import {LEGS} from '../src/anatomy.js';
const report={legs:[],hands:[]};
for(const l of LEGS){const v=p=>new THREE.Vector3(...p);report.legs.push({leg:l.side,thigh:v(l.hip).distanceTo(v(l.knee)),shin:v(l.knee).distanceTo(v(l.ankle)),ankleHeight:l.ankle[1],soleBase:l.shoe[1],knee:l.knee});}
const data=JSON.parse(fs.readFileSync('src/hand-meshes.json'));
for(const key of ['raised','holding']){
 const d=data[key],ib=Buffer.from(d.indices,'base64'),inds=d.indexBytes===4?new Uint32Array(ib.buffer,ib.byteOffset,ib.length/4):new Uint16Array(ib.buffer,ib.byteOffset,ib.length/2),edges=new Map();let repeats=0;
 for(let i=0;i<inds.length;i+=3){const a=inds[i],b=inds[i+1],c=inds[i+2];if(a===b||b===c||c===a)repeats++;for(const [x,y]of[[a,b],[b,c],[c,a]]){const k=x<y?x+','+y:y+','+x;edges.set(k,(edges.get(k)||0)+1);}}
 let boundary=0,nonmanifold=0;for(const n of edges.values()){if(n===1)boundary++;if(n>2)nonmanifold++;}
 report.hands.push({hand:key,vertices:d.vertices,triangles:d.triangles,repeatedIndexFaces:repeats,boundaryEdges:boundary,nonmanifoldEdges:nonmanifold});
}
fs.mkdirSync('output/validation',{recursive:true});fs.writeFileSync('output/validation/anatomy-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
