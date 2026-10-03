import * as THREE from 'three';
import {mesh,gridGeometry,sweep,line,ellipsoid,V} from './geometry.js';
function shoe(root,M,name,x,y,z,far=false){
 const group=new THREE.Group();group.name=name+' assembly';group.position.x=x;group.scale.x=1.24;root.add(group);root=group;x=0;
 const m=far?M.whiteShade:M.white;
 ellipsoid(root,`${name} soft sole`,[x,y+.045,z],[.166,.044,.285],M.whiteShade,.019,44);
 ellipsoid(root,`${name} foot`,[x,y+.130,z-.023],[.111,.107,.208],M.skin,.005,36);
 ellipsoid(root,`${name} padded upper`,[x,y+.147,z+.091],[.162,.123,.184],m,.016,44);
 const rim=mesh(root,`${name} heel opening`,new THREE.TorusGeometry(.098,.015,10,48),m,.003);rim.rotation.x=Math.PI/2;rim.position.set(x,y+.16,z-.095);rim.scale.y=1.09;
 for(let i=0;i<11;i++){const a=-1.55+i/10*3.10;ellipsoid(root,`${name} plush edge ${i+1}`,[x+Math.sin(a)*.148,y+.094,z+.087+Math.cos(a)*.167],[.024,.029,.027],m,0,16);}
 const by=y+.248,bz=z+.226;
 for(const s of [-1,1]){const loop=ellipsoid(root,`${name} rose ribbon loop`,[x+s*.054,by,bz],[.058,.025,.032],M.pink,.010,28);loop.rotation.y=s*.25;}
 ellipsoid(root,`${name} bow knot`,[x,by+.005,bz],[.022,.022,.023],M.pinkLight,.015,24);
}
export function buildAccessories(root,M){
 const accessories=new THREE.Group();accessories.name='Accessories / halo, bow, slippers, pillow';root.add(accessories);
 const arch=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI;arch.push([.572*Math.cos(a),5.866+.470*Math.sin(a),.005+.14*Math.cos(a)**2]);}
 line(accessories,'Soft white headband',arch,.055,M.white,{steps:90,sides:12});
 for(let i=0;i<17;i++){const a=i/16*Math.PI;ellipsoid(accessories,'Headband gathered fold',[.572*Math.cos(a),5.866+.470*Math.sin(a),.005+.14*Math.cos(a)**2],[.05,.054,.049],M.white,0,20);}
 sweep(accessories,'White bow left leaf',[[-.019,6.327,.080],[-.162,6.420,.064],[-.300,6.478,.048],[-.448,6.463,.024]],[.028,.102,.088,.001],[.023,.036,.028,.001],M.white,{steps:42,sides:18,outline:.004});
 sweep(accessories,'White bow upward leaf',[[.02,6.327,.075],[.142,6.45,.055],[.264,6.578,.026],[.312,6.664,.013]],[.027,.106,.074,.001],[.026,.04,.025,.001],M.white,{steps:42,sides:18,outline:.004});
 ellipsoid(accessories,'White bow center knot',[0,6.335,.095],[.061,.057,.049],M.white,.025,32);
 line(accessories,'Bow knot fold',[[-.022,6.300,.138],[-.027,6.331,.143],[-.016,6.370,.123]],.0026,M.whiteShade,{steps:20,sides:6});
 line(accessories,'White bow left crease',[[-.024,6.34,.115],[-.105,6.39,.112],[-.202,6.43,.095]],.003,M.whiteShade,{steps:28,sides:6});
 line(accessories,'White bow right crease',[[.038,6.359,.111],[.105,6.43,.107],[.184,6.5,.078]],.003,M.whiteShade,{steps:28,sides:6});
 const halo=new THREE.Group();halo.name='Floating cyan-inset halo';halo.position.set(0,6.744,-.035);halo.rotation.set(-.012,0,-.052);accessories.add(halo);
 const shape=new THREE.Shape();shape.absarc(0,0,.649,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,.589,0,Math.PI*2,true);shape.holes.push(hole);
 const ring=mesh(halo,'Charcoal flat annular halo',new THREE.ExtrudeGeometry(shape,{depth:.048,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:2,steps:1,curveSegments:72}),M.halo,.002);ring.rotation.x=-Math.PI/2;
 const glow=mesh(halo,'Fine cyan halo inlay',new THREE.TorusGeometry(.650,.0045,8,128),M.haloBlue,0);glow.rotation.x=Math.PI/2;glow.position.y=.015;
 const inner=mesh(halo,'Dark inner halo rim',new THREE.TorusGeometry(.591,.003,8,100),M.haloDark,0);inner.rotation.x=Math.PI/2;inner.position.y=.012;
 shoe(accessories,M,'Far slipper',-.234,.498,-.182,true);shoe(accessories,M,'Near slipper',.025,.014,.607,false);
 const A=V([1.102,3.092,.162]),B=V([2.06,2.344,.034]),C=V([.935,.718,-.08]),D=V([-.13,1.442,-.445]);
 const AB=new THREE.CubicBezierCurve3(A,V([1.186,2.912,.123]),V([1.852,2.392,.055]),B);
 const BC=new THREE.CubicBezierCurve3(B,V([1.945,1.893,.018]),V([1.010,.903,-.068]),C);
 const DC=new THREE.CubicBezierCurve3(D,V([.165,1.409,-.360]),V([.800,.863,-.137]),C);
 const AD=new THREE.CubicBezierCurve3(A,V([.663,2.967,-.10]),V([-.304,1.963,-.461]),D);
 const pillowFront=M.white.clone();pillowFront.name='Soft filled pillow cotton';pillowFront.emissiveIntensity=.30;
 const pillowPoint=(u,v,side)=>{
  const q=1-v,base=A.clone().multiplyScalar((1-u)*(1-q)).addScaledVector(B,u*(1-q)).addScaledVector(C,u*q).addScaledVector(D,(1-u)*q);
  const p=AB.getPoint(u).multiplyScalar(1-q).addScaledVector(DC.getPoint(u),q).addScaledVector(AD.getPoint(q),1-u).addScaledVector(BC.getPoint(q),u).sub(base);
  const fullness=Math.pow(Math.max(0,Math.sin(Math.PI*u)*Math.sin(Math.PI*q)),.60);
  const crease=.048*Math.sin(32*u+6*q)*Math.exp(-8*q)+.031*Math.sin(29*q+5*u)*Math.exp(-9*u);
  const radius=Math.sqrt(u*u+q*q),angle=Math.atan2(q,u);
  let folds=0;for(const [theta,amp]of[[.28,.095],[.69,.127],[1.19,.142],[1.42,.098]])folds-=amp*Math.exp(-Math.pow((angle-theta)/.09,2))*Math.sin(Math.min(1,radius)*Math.PI)*Math.exp(-radius*.75);
  const longFold=.090*Math.exp(-Math.pow((u-(.22+.11*q))/.042,2))*Math.sin(Math.PI*q);
  const bottomFold=.048*Math.sin(u*18+2*q)*Math.exp(-Math.pow((q-.87)/.15,2));
  p.z+=side*((side>0?.370:.29)*fullness+(crease+folds-longFold+bottomFold)*fullness);return p.toArray();
 };
 for(const side of [1,-1]){
  const g=gridGeometry(60,64,(u,v)=>pillowPoint(u,v,side));if(side<0){const idx=g.index;for(let i=0;i<idx.count;i+=3){const t=idx.getX(i);idx.setX(i,idx.getX(i+2));idx.setX(i+2,t);}g.computeVertexNormals();}
  mesh(accessories,side>0?'Pillow inflated front':'Pillow inflated reverse',g,side>0?pillowFront:M.whiteShade,.003);
 }
 const seam=[];for(const [edge,reverse]of[[AB,false],[BC,false],[DC,true],[AD,true]])for(let i=0;i<32;i++)seam.push(edge.getPoint(reverse?1-i/32:i/32).toArray());
 line(accessories,'Pillow continuous sewn edge',seam,.009,M.whiteShade,{steps:160,sides:8,closed:true});
 sweep(accessories,'Pinched pillow corner',[[1.097,3.066,.166],[1.136,3.143,.156],[1.151,3.191,.172]],[.045,.034,.001],[.025,.021,.001],M.white,{steps:26,sides:14,outline:.003});
 accessories.traverse(o=>{if(o.isMesh&&/bow|headband/i.test(o.name))o.receiveShadow=false;});
 return {accessories,halo};
}
