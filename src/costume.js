import * as THREE from 'three';
import {V,mesh,gridGeometry,sampleRows,loft,sweep,line,ellipsoid,patch,polygonShape,contourVolume} from './geometry.js';
const profile=[[3.43,.59,.303],[3.76,.544,.29],[4.12,.495,.278],[4.46,.492,.267],[4.78,.495,.253],[5.04,.47,.228]];
function dims(y){let i=0;while(i<profile.length-2&&profile[i+1][0]<y)i++;const a=profile[i],b=profile[i+1],t=THREE.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);return [THREE.MathUtils.lerp(a[1],b[1],t),THREE.MathUtils.lerp(a[2],b[2],t)];}
function drape(x,y){
 const fade=THREE.MathUtils.smoothstep(y,3.48,3.74)*(1-THREE.MathUtils.smoothstep(y,4.80,5.02));
 const fold=(center,width,amplitude)=>amplitude*Math.exp(-Math.pow((x-center)/width,2));
 const left=-.32+.16*(y-3.60),right=.24+.18*(y-3.7);
 return fade*(fold(left,.041,.040)-fold(left+.057,.033,.021)+fold(right,.041,.042)-fold(right-.055,.032,.021))
  +.009*Math.sin(y*13+x*9)*Math.exp(-Math.pow((y-4.15)/.62,2));
}
function hemHeight(a){const front=Math.max(0,Math.cos(a));return 3.54-.072*front*front+.032*Math.sin(a*3+.5)+.028*Math.sin(a)**2;}
function frontZ(x,y){const [rx,rz]=dims(y),side=Math.sqrt(Math.max(.04,1-(x/rx)**2));return rz*side+drape(x,y)*side*side;}
function ruffle(root,name,center,axis,rx,rz,mat,piping,lobes=8){
 const t=V(axis).normalize(),b=new THREE.Vector3(0,0,1).addScaledVector(t,-t.z).normalize(),n=b.clone().cross(t).normalize();
 const point=(u,v)=>{const a=u*Math.PI*2,phase=(u*lobes)%1,ripple=Math.sqrt(Math.max(0,1-(phase*2-1)**2)),p=V(center);p.addScaledVector(t,-.014+v*(.064+.137*ripple));p.addScaledVector(n,Math.cos(a)*(rx+.029*v+.024*Math.sin(Math.PI*v)));p.addScaledVector(b,Math.sin(a)*(rz+.018*v+.023*Math.sin(Math.PI*v))); return p.toArray();};
 mesh(root,name,gridGeometry(lobes*20,16,point),mat,.0035);
 const edge=[];for(let i=0;i<lobes*20;i++)edge.push(point(i/(lobes*20),1));line(root,`${name} narrow hem`,edge,.004,piping,{steps:lobes*20,sides:6,closed:true});
}
export function buildCostume(root,M){
 const clothes=new THREE.Group();clothes.name='Outfit / cat-print pajamas';root.add(clothes);
 const shirtPoint=(u,v)=>{
  const a=u*Math.PI*2,front=Math.max(0,Math.cos(a)),top=5.035-.379*front**6;
  const y=hemHeight(a)+(top-hemHeight(a))*v,[rx,rz]=dims(y),fold=.006*Math.sin(a*7+y*4)*Math.sin(Math.PI*v),x=(rx+fold)*Math.sin(a);
  return [x,y,(rz+fold)*Math.cos(a)+drape(x,y)*front*front];
 };
 mesh(clothes,'Loose button shirt with open V neckline',gridGeometry(100,65,shirtPoint),M.cloth,.005);
 const hem=[];for(let i=0;i<100;i++)hem.push(shirtPoint(i/100,0));line(clothes,'Shirt turned hem',hem,.006,M.piping,{steps:140,sides:6,closed:true});
 // Soft short sleeves follow the arm axes and are finished with scalloped cuffs.
 sweep(clothes,'Raised short sleeve',[[-.41,5.026,0],[-.52,4.986,.012],[-.65,4.91,.027],[-.754,4.833,.041]],[.15,.217,.23,.209],[.165,.236,.24,.218],M.sleeve,{steps:32,sides:40,outline:.005});
 ruffle(clothes,'Raised sleeve scallops',[-.754,4.833,.041],[-.104,-.077,.014],.210,.218,M.blue,M.white,7);
 sweep(clothes,'Lowered short sleeve',[[.405,5.035,-.023],[.53,4.915,-.003],[.58,4.768,.009],[.625,4.579,.032]],[.14,.213,.233,.215],[.165,.23,.243,.218],M.sleeve,{steps:36,sides:40,outline:.005});
 ruffle(clothes,'Lowered sleeve scallops',[.625,4.579,.032],[.045,-.189,.023],.215,.218,M.blue,M.white,7);
 const left=new THREE.Shape();left.moveTo(-.145,5.11);left.quadraticCurveTo(-.32,5.10,-.417,4.99);left.quadraticCurveTo(-.443,4.938,-.313,4.917);left.lineTo(-.365,4.833);left.quadraticCurveTo(-.248,4.70,-.024,4.616);left.lineTo(-.116,4.92);left.closePath();
 const right=new THREE.Shape();right.moveTo(.166,5.1);right.quadraticCurveTo(.344,5.056,.423,4.96);right.quadraticCurveTo(.37,4.886,.282,4.896);right.quadraticCurveTo(.394,4.801,.333,4.761);right.lineTo(-.021,4.619);right.lineTo(.137,4.913);right.closePath();
 for(const [name,s]of[['Right white lapel',left],['Left white lapel',right]]){
  contourVolume(clothes,name,s,M.white,(x,y)=>frontZ(x,y)+.029,{depth:.012,bevel:.003,outline:0});
  const pts=s.getPoints(24).map(p=>[p.x,p.y,frontZ(p.x,p.y)+.051]);line(clothes,`${name} fine piping`,pts,.004,M.piping,{steps:100,sides:6,closed:true});
 }
 const placket=polygonShape([[-.026,3.484],[.018,3.484],[.031,4.03],[.017,4.62],[-.03,4.621],[-.017,4.05]]);
 patch(clothes,'Narrow soft button placket',placket,M.blue,(x,y)=>frontZ(x,y)+.014,.006,.001);
 const seam=[];for(let i=0;i<=16;i++){const y=3.489+(4.625-3.489)*i/16,x=.022+.006*Math.sin(i*.55);seam.push([x,y,frontZ(x,y)+.028]);}line(clothes,'White placket piping',seam,.0045,M.white,{steps:50,sides:6});
 for(const y of [4.483,4.175,3.867,3.575]){
  const x=-.004,z=frontZ(x,y)+.040;ellipsoid(clothes,'Pearl pajama button',[x,y,z],[.023,.030,.010],M.white,.023,24);ellipsoid(clothes,'Button inset',[x,y,z+.009],[.013,.020,.004],M.piping,0,20);
  for(const d of [-1,1])ellipsoid(clothes,'Button stitch',[x,y+d*.006,z+.013],[.0027,.0027,.002],M.white,0,12);
 }
 const pocket=new THREE.Shape();pocket.moveTo(.145,4.505);pocket.quadraticCurveTo(.29,4.52,.407,4.449);pocket.lineTo(.389,4.162);pocket.quadraticCurveTo(.29,4.091,.162,4.177);pocket.closePath();
 const pocketMesh=contourVolume(clothes,'Sewn breast pocket',pocket,M.cloth,(x,y)=>frontZ(x,y)+.025,{depth:.012,bevel:.003,outline:0});
 const pos=pocketMesh.geometry.attributes.position,uv=pocketMesh.geometry.attributes.uv;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),[rx]=dims(y),a=Math.asin(THREE.MathUtils.clamp(x/rx,-1,1)),top=5.035-.379*Math.cos(a)**6;uv.setXY(i,a/(2*Math.PI),(y-hemHeight(a))/(top-hemHeight(a)));}
 uv.needsUpdate=true;
 line(clothes,'Pocket upper welt',[[.145,4.493,frontZ(.145,4.493)+.041],[.278,4.469,frontZ(.278,4.469)+.041],[.406,4.428,frontZ(.406,4.428)+.041]],.006,M.white,{steps:32,sides:8});
 for(const s of [-1,1]){
  loft(clothes,`${s<0?'Right':'Left'} loose pajama shorts`,[[2.835,s*.258,.045,.282,.335],[2.94,s*.26,.04,.316,.356],[3.14,s*.254,.025,.309,.347],[3.37,s*.244,.008,.286,.301],[3.635,s*.218,-.005,.28,.278],[3.74,s*.214,-.008,.21,.22]],M.shorts,{segments:56,steps:45,outline:.005,deform:(p,u,v)=>[p[0]+.006*Math.cos(u*Math.PI*12)*(1-v),p[1],p[2]+.018*Math.sin(u*Math.PI*10+v*3)*(1-v)*Math.sin(v*Math.PI)]});
  ruffle(clothes,`${s<0?'Right':'Left'} shorts scallops`,[s*.258,2.85,.045],[0,-1,0],.28,.329,M.blue,M.white,9);
 }
 line(clothes,'Shorts center front seam',[[0,3.59,.294],[.006,3.39,.30],[.014,3.19,.298],[.014,3.02,.202]],.004,M.piping,{steps:36,sides:6});
 return clothes;
}
