import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Keep the named editable sculpture; build a separate material-batched draw tree.
export function createDrawTree(source){
 source.updateMatrixWorld(true);
 const result=new THREE.Group();result.name='Moonveil / batched draw tree';
 const batches=new Map(),ink=new Map();let inputMeshes=0;
 source.traverse(object=>{
  if(!object.isMesh||!object.visible)return;
  inputMeshes++;
  const outline=!!object.userData.outline;
  let material=object.material,geometry=object.geometry.clone();
  if(Array.isArray(material))throw new Error('One material per authored surface required.');
  if(outline){
   // Expand in local coordinates before baking nonuniform sphere transforms.
   const thickness=material.uniforms.thickness.value,p=geometry.attributes.position,n=geometry.attributes.normal;
   for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*thickness,p.getY(i)+n.getY(i)*thickness,p.getZ(i)+n.getZ(i)*thickness);
   const color=material.uniforms.ink.value,key=color.getHexString();
   if(!ink.has(key))ink.set(key,new THREE.MeshBasicMaterial({name:'Baked silhouette ink',color:color.clone(),side:THREE.BackSide}));
   material=ink.get(key);
  }
  geometry.applyMatrix4(object.matrixWorld);
  const indexed=mergeVertices(geometry,1e-6);geometry.dispose();geometry=indexed;
  const key=material.transparent?object.uuid:[material.uuid,object.castShadow,object.receiveShadow,object.renderOrder,outline].join('|');
  if(!batches.has(key))batches.set(key,{geometries:[],material,outline,names:[],cast:object.castShadow,receive:object.receiveShadow,order:object.renderOrder});
  const batch=batches.get(key);batch.geometries.push(geometry);batch.names.push(object.name);
 });
 for(const batch of batches.values()){
  const geometry=mergeGeometries(batch.geometries,false);
  if(!geometry)throw new Error('Material batch could not be joined.');
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,batch.material);mesh.name=batch.material.name+' / batch';
  mesh.castShadow=batch.cast;mesh.receiveShadow=batch.receive;mesh.renderOrder=batch.order;
  mesh.userData={outline:batch.outline,authoredParts:batch.names};result.add(mesh);
  for(const g of batch.geometries)g.dispose();
 }
 result.userData={inputMeshes,drawMeshes:result.children.length,method:'Exact material batching with baked outline extrusion'};
 return result;
}
