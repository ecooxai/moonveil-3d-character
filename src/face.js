import * as THREE from 'three';
import {ellipsoid,loft,sweep,line,gridGeometry,mesh,sampleRows,patch,polygonShape} from './geometry.js';
export const headRows=[
 [5.205,0,.188,.003,.015],[5.230,0,.157,.077,.077],[5.270,0,.085,.162,.180],[5.407,0,.022,.317,.285],[5.594,0,-.018,.425,.345],[5.824,0,-.025,.438,.352],[6.04,0,-.034,.383,.325],[6.186,0,-.033,.24,.23],[6.244,0,-.03,.007,.008]
];
export function faceDepth(x,y){
 let lo=0,hi=1;for(let i=0;i<18;i++){const m=(lo+hi)/2;if(sampleRows(headRows,m)[0]<y)lo=m;else hi=m;}
 const [,cx,cz,rx,rz]=sampleRows(headRows,(lo+hi)/2);return cz+rz*Math.sqrt(Math.max(.005,1-((x-cx)/rx)**2));
}
export function buildFace(root,M){
 const head=new THREE.Group();head.name='Head / three-dimensional anime face';root.add(head);
 loft(head,'Smooth cheek and jaw topology',headRows,M.face,{segments:80,steps:80,outline:.006});
 for(const s of [-1,1]){
  ellipsoid(head,`${s<0?'Right':'Left'} ear`,[s*.423,5.574,-.009],[.062,.112,.071],M.skin,.025,28);
  ellipsoid(head,'Ear concha',[s*.453,5.583,.032],[.026,.066,.025],M.skinShade,0,24);
  const cx=s*.191,cy=5.626,w=.141,h=.13;
  const edge=(u,top)=>{const x=cx+(u-.5)*2*w;const slope=s*(u-.5)*.026;return [x,cy+slope+(top?1:-1)*Math.pow(Math.sin(Math.PI*u),.75)*(top?.074:.078)];};
  const g=gridGeometry(36,12,(u,v)=>{const [x,y1]=edge(u,true),[,y0]=edge(u,false),y=y0+(y1-y0)*v;return [x,y,faceDepth(x,y)+.009+.012*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)];});
  const a=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<a.count;i++)uv.setXY(i,(a.getX(i)-cx)/(w*2)+.5,(a.getY(i)-cy)/(h*2)+.5);
  mesh(head,`${s<0?'Right':'Left'} almond-shaped painted eye`,g,M.eye,0);
  const top=[],bottom=[];for(let i=0;i<=16;i++){for(const [arr,t] of [[top,true],[bottom,false]]){const [x,y]=edge(i/16,t);arr.push([x,y,faceDepth(x,y)+.024]);}}
  const lidWidths=top.map((_,i)=>{const u=i/(top.length-1),outer=s>0?u:1-u;return .0007+.0050*Math.pow(outer,.65)*Math.pow(Math.sin(Math.PI*u),.25);});
  sweep(head,'Tapered upper eyelid ink',top,lidWidths,lidWidths.map(x=>x*.65),M.ink,{steps:56,sides:8,outline:0});
  line(head,'Lower eyelid ink',bottom,.0013,M.lowerLid,{steps:48,sides:6});
  const ox=cx+s*w,oy=cy+.013;
  const lash=polygonShape([[ox-s*.05,oy+.030],[ox+s*.024,oy+.047],[ox+s*.039,oy+.061],[ox+s*.031,oy+.015],[ox-s*.015,oy-.010]]);
  patch(head,'Tapered outer eyelashes',lash,M.ink,(x,y)=>faceDepth(x,y)+.022,.008,0);
  line(head,'Upper lid fold',[[cx-s*.12,cy+.131,faceDepth(cx-s*.12,cy+.131)+.008],[cx,cy+.149,faceDepth(cx,cy+.149)+.007],[cx+s*.13,cy+.135,faceDepth(cx+s*.13,cy+.135)+.007]],.0015,M.skinShade,{steps:22,sides:6});
  line(head,'Soft arched eyebrow',[[cx-s*.081,5.779,faceDepth(cx-s*.081,5.779)+.010],[cx,5.791,faceDepth(cx,5.791)+.011],[cx+s*.092,5.780,faceDepth(cx+s*.092,5.780)+.011]],.0026,M.hair,{steps:24,sides:8});
  const bx=s*.267,by=5.48;
  const blush=mesh(head,'Subtle painted cheek blush',gridGeometry(18,8,(u,v)=>{const x=bx+(u-.5)*.248,y=by+(v-.5)*.103;return [x,y,faceDepth(x,y)+.017];}),M.blush,0);blush.renderOrder=2;
  for(let k=0;k<3;k++){const x=bx+(k-1)*.031;line(head,'Cheek blush hatch',[[x-.007,5.463,faceDepth(x-.007,5.463)+.023],[x+.002,5.491,faceDepth(x+.002,5.491)+.023]],.0018,M.pinkLight,{steps:8,sides:5});}
 }
 ellipsoid(head,'Small sculpted nose',[0,5.526,faceDepth(0,5.526)+.009],[.017,.025,.019],M.face,0,24);
 line(head,'Nose underside',[[-.006,5.505,faceDepth(0,5.505)+.008],[.007,5.501,faceDepth(0,5.501)+.009]],.0024,M.skinShade,{steps:8,sides:6});
 for(const [name,pts]of [['Upper lip suggestion',[[-.025,5.363],[-.009,5.369]]],['Lower lip suggestion',[[.01,5.363],[.024,5.355]]]])line(head,name,pts.map(([x,y])=>[x,y,faceDepth(x,y)+.010]),.0023,M.mouth,{steps:12,sides:6});
 head.traverse(o=>{if(o.isMesh)o.receiveShadow=false;});
 return head;
}
