import * as THREE from 'three';
import {ellipsoid,loft,sweep,line,ribbon} from './geometry.js';

function finger(parent,name,points,r,mat){
 const n=points.length, widths=points.map((_,i)=>r*(1-.40*i/(n-1)));widths[n-1]=r*.46;
 sweep(parent,name,points,widths,widths,mat,{steps:22,sides:10,outline:.002});
 ellipsoid(parent,`${name} fingertip`,points[n-1],[r*.5,r*.5,r*.5],mat,0,16);
}
export function buildBody(root,M){
 const body=new THREE.Group();body.name='Body / authored reference pose';root.add(body);
 loft(body,'Far leg',[
 [.583,-.235,-.189,.077,.086],[.746,-.239,-.187,.098,.107],[1.065,-.254,-.173,.139,.149],[1.408,-.272,-.118,.169,.179],[1.756,-.265,-.025,.149,.164],[1.956,-.254,.025,.173,.189],[2.30,-.267,.015,.221,.231],[2.69,-.254,-.004,.25,.255],[3.10,-.245,-.015,.25,.27],[3.32,-.24,0,.04,.04]
 ],M.skin,{outline:.006,steps:64,segments:40});
 loft(body,'Near leg',[
 [.12,.025,.51,.077,.083],[.30,.04,.4,.094,.102],[.65,.10,.30,.112,.126],[1.09,.145,.21,.155,.16],[1.53,.205,.175,.164,.17],[1.79,.20,.20,.151,.177],[1.97,.207,.145,.177,.19],[2.38,.24,.09,.221,.232],[2.76,.237,.08,.249,.26],[3.1,.23,.065,.25,.27],[3.33,.23,.04,.04,.04]
 ],M.skin,{outline:.007,steps:70,segments:40});
 loft(body,'Continuous neck and upper chest',[[4.48,0,.006,.27,.195],[4.69,0,.009,.35,.226],[4.87,0,.005,.319,.218],[5.005,.005,.002,.234,.177],[5.106,.008,-.004,.150,.136],[5.25,.006,-.01,.129,.126],[5.41,0,-.01,.151,.141],[5.5,0,-.01,.065,.066]],M.skin,{segments:56,steps:52,outline:.004});
 // The raised elbow opens to camera-left; a single continuous surface avoids ball joints.
 // The inner and outer contours are authored independently to avoid folding at the elbow.
 ribbon(body,'Raised arm',
 [[-.49,5.17,-.004],[-.82,5.060,.024],[-1.050,4.940,.055],[-1.100,4.860,.074],[-1.100,4.910,.088],[-.910,5.150,.108],[-.701,5.440,.124],[-.650,5.508,.127]],
 [[-.49,4.81,-.004],[-.88,4.720,.024],[-1.160,4.650,.055],[-1.360,4.740,.074],[-1.320,5.030,.088],[-1.090,5.290,.108],[-.822,5.525,.124],[-.750,5.580,.127]],
 [.163,.156,.141,.128,.122,.104,.074,.047],M.skin,{steps:84,sides:24,outline:.005});
 sweep(body,'Lowered arm',[[.51,4.94,-.04],[.61,4.62,.015],[.67,4.21,.055],[.72,3.97,.11],[.81,3.61,.15],[.93,3.20,.21],[.972,3.112,.244]],[.17,.17,.128,.126,.109,.076,.059],[.17,.165,.135,.132,.107,.075,.053],M.skin,{steps:68,sides:24,outline:.006});
 const palm=ellipsoid(body,'Raised palm',[-.697,5.61,.13],[.086,.145,.055],M.skin,.01,32);palm.rotation.z=-.20;
 finger(body,'Raised thumb',[[-.636,5.58,.158],[-.565,5.65,.205],[-.56,5.704,.245]],.033,M.skin);
 finger(body,'Raised index',[[-.649,5.687,.125],[-.628,5.829,.127],[-.565,5.839,.17],[-.53,5.806,.196]],.026,M.skin);
 finger(body,'Raised middle',[[-.701,5.714,.12],[-.679,5.904,.10],[-.615,5.915,.137],[-.581,5.862,.17]],.027,M.skin);
 finger(body,'Raised ring',[[-.751,5.70,.10],[-.749,5.844,.063],[-.705,5.892,.073],[-.664,5.853,.111]],.024,M.skin);
 finger(body,'Raised little finger',[[-.778,5.669,.073],[-.810,5.782,.055],[-.797,5.849,.036]],.022,M.skin);
 const down=ellipsoid(body,'Pillow-holding palm',[.992,3.094,.248],[.075,.129,.051],M.skin,.009,28);down.rotation.z=.55;
 finger(body,'Pillow thumb',[[.966,3.139,.283],[1.05,3.14,.326],[1.108,3.097,.32]],.032,M.skin);
 for(let i=0;i<4;i++){
  const x=.987+i*.036,y=3.059-i*.018;
  finger(body,`Pillow finger ${i+1}`,[[x,y,.254],[x+.065,y-.071,.265],[x+.093,y-.064,.217],[x+.088,y-.024,.183]],.024-i*.0018,M.skin);
 }
 // Keep hidden upper legs safely inside the loose garment; raise the relaxed far heel.
 for(const name of ['Far leg','Near leg']){const leg=body.getObjectByName(name),a=leg.geometry.attributes.position,cx=name==='Far leg'?-.245:.23;
  for(let i=0;i<a.count;i++){let y=a.getY(i),x=a.getX(i),z=a.getZ(i);const t=THREE.MathUtils.smoothstep(y,2.79,3.00);a.setX(i,cx+(x-cx)*(1-.29*t));a.setZ(i,z*(1-.30*t));}a.needsUpdate=true;leg.geometry.computeVertexNormals();}
 return body;
}
