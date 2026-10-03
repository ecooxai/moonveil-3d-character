import * as THREE from 'three';
import {fabricTexture,eyeTexture,blushTexture} from './textures.js';
export function makeMaterials(){
 const data=new Uint8Array([110,176,223,255]);const grad=new THREE.DataTexture(data,4,1,THREE.RedFormat);grad.needsUpdate=true;grad.minFilter=grad.magFilter=THREE.NearestFilter;
 const softData=new Uint8Array(Array.from({length:64},(_,i)=>Math.round(155+i*100/63)));const soft=new THREE.DataTexture(softData,64,1,THREE.RedFormat);soft.needsUpdate=true;soft.minFilter=soft.magFilter=THREE.LinearFilter;
 const toon=(name,color,extra={})=>new THREE.MeshToonMaterial({name,color,gradientMap:soft,...extra,emissive:color,emissiveMap:extra.map||null,emissiveIntensity:.36});
 const skinData=new Uint8Array(Array.from({length:64},(_,i)=>Math.round(100+155*Math.pow(i/63,.85))));
 const skinRamp=new THREE.DataTexture(skinData,64,1,THREE.RedFormat);skinRamp.needsUpdate=true;skinRamp.minFilter=skinRamp.magFilter=THREE.LinearFilter;
 const skin=(name,color)=>{const m=toon(name,color);m.gradientMap=skinRamp;m.emissiveIntensity=.30;return m;};
 const fabric=fabricTexture();fabric.repeat.set(1.60,1.08);const sleeve=fabric.clone();sleeve.repeat.set(.68,.46);const shorts=fabric.clone();shorts.repeat.set(.97,.72);
 const basic=(name,color)=>new THREE.MeshBasicMaterial({name,color});
 return {
 face:toon('Soft porcelain face','#fff5f0'),skin:skin('Warm porcelain skin','#ffece5'),skinShade:toon('Warm fingers and ears','#f3c5c6'),
 hair:toon('Dusty violet hair','#696696'),hairLight:toon('Violet hair light','#7879b0'),hairDark:toon('Deep violet underneath','#54527e'),hairShine:toon('Soft lilac hair ribbons','#8386ba'),
 cloth:toon('Powder blue cat-print cotton','#ffffff',{map:fabric,side:THREE.DoubleSide}),sleeve:toon('Cat-print sleeve cotton','#ffffff',{map:sleeve,side:THREE.DoubleSide}),shorts:toon('Cat-print shorts cotton','#ffffff',{map:shorts,side:THREE.DoubleSide}),blue:toon('Powder blue ruffles','#c6ebf7'),white:toon('Soft ivory cotton','#fbfcff'),whiteShade:toon('Ivory folded edges','#dbe5f1'),piping:toon('Blue-grey seam piping','#96b4c6'),
 ink:basic('Eyelash ink','#453b55'),lowerLid:basic('Soft lower eyelid','#aa91a7'),eye:new THREE.MeshBasicMaterial({name:'Violet eye painting',map:eyeTexture(),side:THREE.DoubleSide}),blush:new THREE.MeshBasicMaterial({name:'Soft cheek blush',map:blushTexture(),transparent:true,depthWrite:false,side:THREE.DoubleSide}),mouth:basic('Rose mouth line','#b38591'),pink:toon('Muted rose bows','#bc77a2'),pinkLight:toon('Rose bow highlight','#dda8c9'),
 halo:new THREE.MeshStandardMaterial({name:'Charcoal halo ceramic',color:'#606068',roughness:.55,metalness:.15}),haloBlue:basic('Cyan halo inset','#73dafa'),haloDark:basic('Halo inset shadow','#20232f')
 };
}
