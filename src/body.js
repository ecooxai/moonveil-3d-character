import * as THREE from 'three';
import {LEGS,LEG_LENGTHS,legRows} from './anatomy.js';
import {buildHands} from './hands.js';
import {ellipsoid,loft,sweep,line,ribbon} from './geometry.js';

export function buildBody(root,M){
 const body=new THREE.Group();body.name='Body / authored reference pose';root.add(body);
 for(const leg of LEGS){
  const limb=loft(body,leg.name,legRows(leg),M.skin,{outline:.005,steps:78,segments:48,deform:(p,u,v)=>{
   const front=Math.max(0,Math.cos(u*Math.PI*2));p[2]+=.012*Math.exp(-Math.pow((p[1]-leg.knee[1])/.14,2))*front**4;return p;
  }});
  limb.userData.anatomy={side:leg.side,hip:leg.hip,knee:leg.knee,ankle:leg.ankle,restLengths:LEG_LENGTHS};
 }
 loft(body,'Continuous neck and upper chest',[[4.48,0,.006,.27,.195],[4.69,0,.009,.35,.226],[4.87,0,.005,.319,.218],[5.005,.005,.002,.234,.177],[5.106,.008,-.004,.150,.136],[5.25,.006,-.01,.129,.126],[5.41,0,-.01,.151,.141],[5.5,0,-.01,.065,.066]],M.skin,{segments:56,steps:52,outline:.004});
 buildHands(body,M);
 // Keep hidden upper legs safely inside the loose garment; preserve the shared anatomical segment lengths.
 for(const name of ['Far leg','Near leg']){const leg=body.getObjectByName(name),a=leg.geometry.attributes.position,cx=name==='Far leg'?-.245:.23;
  for(let i=0;i<a.count;i++){let y=a.getY(i),x=a.getX(i),z=a.getZ(i);const t=THREE.MathUtils.smoothstep(y,2.66,2.89);a.setX(i,cx+(x-cx)*(1-.29*t));a.setZ(i,z*(1-.38*t));}a.needsUpdate=true;leg.geometry.computeVertexNormals();}
 return body;
}
