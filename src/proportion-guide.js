import * as THREE from 'three';

/** Read measured landmarks from the already-posed sculpture, not display constants. */
export function measureLegs(root){
 const legs=[];
 root.traverse(object=>{
  const anatomy=object.userData.anatomy;
  if(!anatomy?.world?.hip)return;
  const v=p=>new THREE.Vector3(...p),{hip,knee,ankle}=anatomy.world;
  legs.push({side:anatomy.side,hip,knee,ankle,thigh:v(hip).distanceTo(v(knee)),shin:v(knee).distanceTo(v(ankle)),ankleHeight:ankle[1]});
 });
 root.updateWorldMatrix(true,true);
 for(const leg of legs){
  const sole=root.getObjectByName((leg.side==='right'?'Far':'Near')+' slipper soft sole'),v=new THREE.Vector3();
  if(!sole)throw new Error('A matching slipper sole is required.');
  let minimum=Infinity;const p=sole.geometry.attributes.position;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(sole.matrixWorld);minimum=Math.min(minimum,v.y);}
  leg.soleHeight=minimum;
 }
 legs.sort((a,b)=>a.side==='right'?-1:1);
 if(legs.length!==2)throw new Error('Two measured legs are required.');
 return {legs,soleHeightDifference:Math.abs(legs[0].soleHeight-legs[1].soleHeight),maximumSegmentDifference:Math.max(Math.abs(legs[0].thigh-legs[1].thigh),Math.abs(legs[0].shin-legs[1].shin)),ankleHeightDifference:Math.abs(legs[0].ankleHeight-legs[1].ankleHeight)};
}

/** An inspection overlay only; it is intentionally excluded from the exported character. */
export function makeProportionGuide(measurements){
 const root=new THREE.Group();root.name='Inspection only / leg joint guide';root.visible=false;
 for(const leg of measurements.legs){
  const color=leg.side==='right'?'#a582ba':'#6dabb4';
  const material=new THREE.MeshBasicMaterial({color,depthTest:false,depthWrite:false,transparent:true,opacity:.88});
  for(const [name,point]of [['hip',leg.hip],['knee',leg.knee],['ankle',leg.ankle]]){
   const marker=new THREE.Mesh(new THREE.SphereGeometry(.026,16,12),material);marker.name=leg.side+' '+name;marker.position.set(...point);marker.renderOrder=90;root.add(marker);
  }
  const geometry=new THREE.BufferGeometry().setFromPoints([leg.hip,leg.knee,leg.ankle].map(p=>new THREE.Vector3(...p)));
  const bone=new THREE.Line(geometry,new THREE.LineDashedMaterial({color,depthTest:false,depthWrite:false,transparent:true,opacity:.90,dashSize:.055,gapSize:.026}));
  bone.name=leg.side+' measured thigh and shin';bone.computeLineDistances();bone.renderOrder=89;root.add(bone);
 }
 return root;
}
