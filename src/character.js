import * as THREE from 'three';
import {makeMaterials} from './materials.js';
import {buildBody} from './body.js';
import {buildCostume} from './costume.js';
import {buildFace} from './face.js';
import {buildHair} from './hair.js';
import {buildAccessories} from './accessories.js';
import {settlePose} from './pose.js';
import {boundsAndStats} from './geometry.js';
export function createCharacter(){
 const root=new THREE.Group();root.name='Moonveil • GPT-6 Astra Pro • mcp_colabdev • Three.js';
 const M=makeMaterials();buildBody(root,M);buildCostume(root,M);buildFace(root,M);buildHair(root,M);const {halo}=buildAccessories(root,M);
 settlePose(root);
 root.userData={title:'Moonveil / Pajama character study',author:'GPT-6 Astra Pro with mcp_colabdev',reference:'User-supplied illustration; interpreted by visual inspection',geometry:'Authored full-volume meshes; no image billboard or image-to-mesh inference',pose:'Static reference-inspired pose; not a skinned animation rig'};
 return {root,materials:M,halo,stats:boundsAndStats(root)};
}
