import * as THREE from 'three';
import {LEGS} from './anatomy.js';
import {mesh,gridGeometry,sweep,line,ellipsoid,V,contourVolume,loft} from './geometry.js';
function shoe(root,M,name,x,y,z,far=false){
 const group=new THREE.Group();group.name=name+' assembly';group.position.x=x;group.scale.x=1.18;root.add(group);root=group;x=0;
 const m=far?M.whiteShade:M.white;
 loft(root,`${name} soft sole`,[[y+.002,x,z,.001,.001],[y+.009,x,z,.142,.246],[y+.016,x,z,.169,.284],[y+.034,x,z,.171,.286],[y+.056,x,z,.163,.278],[y+.068,x,z,.131,.23],[y+.069,x,z,.001,.001]],M.whiteShade,{segments:64,steps:30,outline:.002});
 ellipsoid(root,`${name} foot`,[x,y+.133,z-.035],[.107,.102,.203],M.skin,0,36);
 const upper=ellipsoid(root,`${name} padded upper`,[x,y+.136,z+.090],[.168,.132,.200],m,.003,52);
 const a=upper.geometry.attributes.position;
 for(let i=0;i<a.count;i++){const xx=a.getX(i),yy=a.getY(i),zz=a.getZ(i),ripple=.007*Math.sin(xx*29+zz*17)*Math.sin(yy*31-zz*13);a.setXYZ(i,xx*(1+ripple),yy*(1+ripple),zz*(1+ripple));}
 a.needsUpdate=true;upper.geometry.computeVertexNormals();
 const rim=mesh(root,`${name} heel opening`,new THREE.TorusGeometry(.097,.013,12,56),m,.0015);rim.rotation.x=Math.PI/2;rim.position.set(x,y+.149,z-.096);rim.scale.y=1.10;
 // A continuous softly gathered edge replaces the previous row of spherical beads.
 mesh(root,`${name} gathered plush edge`,gridGeometry(128,14,(u,v)=>{
  const theta=-1.88+u*3.76,phi=v*Math.PI*2,r=.0175*(1+.10*Math.sin(theta*19)+.065*Math.cos(theta*31));
  return [Math.sin(theta)*(.157+r*Math.cos(phi)),y+.077+r*Math.sin(phi),z+.087+Math.cos(theta)*(.180+r*Math.cos(phi))];
 }),m,.0012);
 const by=y+.245,bz=z+.218;
 for(const sign of [-1,1]){
  const shape=new THREE.Shape();shape.moveTo(x,by);shape.bezierCurveTo(x+sign*.029,by+.008,x+sign*.079,by+.045,x+sign*.083,by+.022);
  shape.quadraticCurveTo(x+sign*.095,by-.032,x+sign*.069,by-.032);shape.quadraticCurveTo(x+sign*.031,by-.026,x,by-.004);shape.closePath();
  contourVolume(root,`${name} ribbon loop ${sign}`,shape,M.pink,(xx,yy)=>bz+.007*Math.sin((xx-x)*22)+.20*(by-yy),{depth:.009,bevel:.003,outline:.0013});
  line(root,`${name} ribbon crease ${sign}`,[[x+sign*.015,by,bz+.014],[x+sign*.043,by+.008,bz+.014],[x+sign*.067,by+.012,bz+.016]],.0017,M.pinkLight,{steps:18,sides:5});
 }
 ellipsoid(root,`${name} bow knot`,[x,by-.002,bz+.012],[.014,.021,.012],M.pinkLight,.0015,24);
}
export function buildAccessories(root,M){
 const accessories=new THREE.Group();accessories.name='Accessories / halo, bow, slippers, pillow';root.add(accessories);
 // A softly gathered cloth band, broader across the hair and flatter than a foam tube.
 const bandPoint=(u,v)=>{
  const theta=u*Math.PI,alpha=v*Math.PI*2,gather=.0035*Math.sin(theta*38+.4)+.0018*Math.sin(theta*64),r=.036+gather;
  return [(.545+r*Math.cos(alpha))*Math.cos(theta),5.885+(.480+r*Math.cos(alpha))*Math.sin(theta),-.015+.077*Math.sin(alpha)+.105*Math.cos(theta)**2];
 };
 mesh(accessories,'Soft white headband',gridGeometry(112,24,bandPoint),M.white,.0018);
 for(const sign of [-1,1])ellipsoid(accessories,'Headband padded end',[sign*.545,5.885,.090],[.038,.037,.077],M.white,.001,28);
 const edge=[];for(let i=0;i<=60;i++)edge.push(bandPoint(i/60,.205));line(accessories,'Headband fine gathered seam',edge,.0014,M.whiteShade,{steps:140,sides:5});
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
 for(const leg of LEGS)shoe(accessories,M,leg.side==='right'?'Far slipper':'Near slipper',...leg.shoe,leg.side==='right');
 const A=V([1.144,3.158,.228]),B=V([2.06,2.344,.034]),C=V([.935,.718,-.08]),D=V([-.13,1.442,-.445]);
 const AB=new THREE.CubicBezierCurve3(A,V([1.149,3.050,.220]),V([1.852,2.392,.055]),B);
 const BC=new THREE.CubicBezierCurve3(B,V([1.945,1.893,.018]),V([1.010,.903,-.068]),C);
 const DC=new THREE.CubicBezierCurve3(D,V([.165,1.409,-.360]),V([.800,.863,-.137]),C);
 const AD=new THREE.CubicBezierCurve3(A,V([1.060,3.130,.220]),V([-.304,1.963,-.461]),D);
 const pillowFront=M.white.clone();pillowFront.name='Soft filled pillow cotton';pillowFront.emissiveIntensity=.40;pillowFront.gradientMap=M.skin.gradientMap;
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
 accessories.traverse(o=>{if(o.isMesh&&/bow|headband/i.test(o.name))o.receiveShadow=false;});
 return {accessories,halo};
}
