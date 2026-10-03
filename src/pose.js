import * as THREE from 'three';
import {smoothSeamNormals} from './geometry.js';
// Small authored postures, applied equally to contacting surfaces and seams.
export function settlePose(root){
 root.updateMatrixWorld(true);
 const world=new THREE.Vector3(),inverse=new THREE.Matrix4();
 root.traverse(o=>{
  if(!o.isMesh||o.userData.outline)return;
  const a=o.geometry.attributes.position;inverse.copy(o.matrixWorld).invert();
  let ancestor=o,halo=false,part='';while(ancestor){if(ancestor.name==='Floating cyan-inset halo')halo=true;if(ancestor.parent===root)part=ancestor.name;ancestor=ancestor.parent;}
  for(let i=0;i<a.count;i++){
   world.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);
   const y0=world.y;
   if(!halo){
    const headShift=y=>.24-.14*(y-5.20);
    if(part.startsWith('Head'))world.y+=headShift(y0);
    else if(part.startsWith('Hair'))world.y+=y0>=5.2?headShift(y0):.24*THREE.MathUtils.smoothstep(y0,4.05,5.2);
    else if(part.startsWith('Accessories')&&y0>5.7){const dy=headShift(y0);world.y+=dy*(1-THREE.MathUtils.smoothstep(y0,6.32,6.67));}
    else world.y+=.24*Math.pow(THREE.MathUtils.smoothstep(y0,2.75,5.1),.45);
   }
   const y=world.y,upper=THREE.MathUtils.smoothstep(y,3.15,5.2),head=halo?0:THREE.MathUtils.smoothstep(y,5.10,5.46);
   world.x+=.176*upper;
   const px=world.x-.176,py=y-5.27;
   world.x+=head*(px*.023-py*.087);
   world.y+=head*(px*.087+py*.018);
   world.applyMatrix4(inverse);a.setXYZ(i,world.x,world.y,world.z);
  }
  a.needsUpdate=true;o.geometry.computeVertexNormals();smoothSeamNormals(o.geometry);o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
 });
}
