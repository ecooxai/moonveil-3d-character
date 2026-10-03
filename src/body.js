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
 // The raised elbow opens to camera-left; a single continuous surface avoids ball joints.
 // The inner and outer contours are authored independently to avoid folding at the elbow.
 ribbon(body,'Raised arm',
 [[-.49,5.17,-.004],[-.82,5.060,.024],[-1.050,4.940,.055],[-1.100,4.860,.074],[-1.100,4.910,.088],[-.940,5.150,.168],[-.754,5.440,.232],[-.703,5.508,.254]],
 [[-.49,4.81,-.004],[-.88,4.720,.024],[-1.160,4.650,.055],[-1.360,4.740,.074],[-1.320,5.030,.088],[-1.120,5.290,.168],[-.875,5.525,.232],[-.803,5.580,.254]],
 [.163,.156,.141,.128,.122,.104,.065,.028],M.skin,{steps:84,sides:24,outline:.005});
 sweep(body,'Lowered arm',[[.51,4.94,-.04],[.61,4.62,.015],[.67,4.21,.055],[.72,3.97,.11],[.81,3.61,.15],[.93,3.20,.21],[1.002,3.095,.243]],[.17,.17,.128,.126,.109,.076,.045],[.17,.165,.135,.132,.107,.075,.030],M.skin,{steps:68,sides:24,outline:.006});
 buildHands(body,M);
 // Keep hidden upper legs safely inside the loose garment; preserve the shared anatomical segment lengths.
 for(const name of ['Far leg','Near leg']){const leg=body.getObjectByName(name),a=leg.geometry.attributes.position,cx=name==='Far leg'?-.245:.23;
  for(let i=0;i<a.count;i++){let y=a.getY(i),x=a.getX(i),z=a.getZ(i);const t=THREE.MathUtils.smoothstep(y,2.66,2.89);a.setX(i,cx+(x-cx)*(1-.29*t));a.setZ(i,z*(1-.38*t));}a.needsUpdate=true;leg.geometry.computeVertexNormals();}
 return body;
}
