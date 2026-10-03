import * as THREE from 'three';
export const LEG_LENGTHS={thigh:1.40,shin:1.632};
function solveKnee(hip,ankle){
 const h=new THREE.Vector3(...hip),a=new THREE.Vector3(...ankle),direction=a.clone().sub(h),distance=direction.length();
 const {thigh,shin}=LEG_LENGTHS;
 if(distance>thigh+shin)throw new Error('Unreachable leg pose');
 direction.normalize();
 const along=(thigh*thigh-shin*shin+distance*distance)/(2*distance);
 const forward=new THREE.Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize();
 return h.addScaledVector(direction,along).addScaledVector(forward,Math.sqrt(Math.max(0,thigh*thigh-along*along))).toArray();
}
export const LEGS=[
 {name:'Far leg',side:'right',hip:[-.245,3.15,-.015],ankle:[-.234,.165,-.189],shoe:[-.234,.014,-.094]},
 {name:'Near leg',side:'left',hip:[.23,3.15,.065],ankle:[.025,.165,.510],shoe:[.025,.014,.607]},
].map(leg=>({...leg,knee:solveKnee(leg.hip,leg.ankle)}));

export function legRows(leg){
 const {hip,knee,ankle}=leg;
 const profile=[[.124,.074,.083],[.30,.088,.102],[.60,.113,.127],[1.00,.15,.162],[1.35,.164,.173],[1.60,.146,.162],[knee[1],.153,.171],[2.03,.178,.195],[2.36,.220,.233],[2.69,.247,.259],[3.10,.237,.253],[3.32,.03,.03]].sort((a,b)=>a[0]-b[0]);
 return profile.map(([y,rx,rz])=>{
  const [start,end]=y<knee[1]?[ankle,knee]:[knee,hip];
  const t=THREE.MathUtils.clamp((y-start[1])/(end[1]-start[1]),0,1);
  let x=THREE.MathUtils.lerp(start[0],end[0],t),z=THREE.MathUtils.lerp(start[2],end[2],t);
  if(y<knee[1]){z-=.045*Math.sin(t*Math.PI);x+=(leg.side==='right'?-.018:.012)*Math.sin(t*Math.PI);}
  return [y,x,z,rx,rz];
 });
}
