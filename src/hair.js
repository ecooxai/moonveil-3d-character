import * as THREE from 'three';
import {mesh,gridGeometry,loft,sweep,line,ellipsoid,ribbon,contourVolume,sampleRows} from './geometry.js';
export function buildHair(root,M){
 const hair=new THREE.Group();hair.name='Hair / layered violet sculpt';root.add(hair);

 mesh(hair,'Continuous scalp cap',gridGeometry(72,38,(u,v)=>{
  const a=u*Math.PI*2,front=Math.max(0,Math.cos(a)),wrapped=a>Math.PI?a-Math.PI*2:a,notch=.65*Math.exp(-Math.pow((wrapped-.36)/.40,2)),p=(1-v)*(2.5-1.20*front**2-notch);
  return [.479*Math.sin(p)*Math.sin(a),5.775+.558*Math.cos(p),-.050+.427*Math.sin(p)*Math.cos(a)];
 }),M.hair,.008);
 loft(hair,'Long hair inner volume',[[4.00,0,-.26,.012,.01],[4.16,.035,-.29,.45,.10],[4.42,.035,-.28,.49,.13],[4.83,.012,-.25,.46,.145],[5.25,0,-.21,.43,.16],[5.66,0,-.178,.39,.16],[5.99,0,-.15,.30,.15],[6.19,0,-.065,.07,.06]],M.hair,{steps:56,segments:56,outline:.003});
 const rearShine=M.hair.clone();rearShine.name='Subtle rear strand sheen';rearShine.color.set('#7472a2');rearShine.emissive.set('#7472a2');
 const tipHeights=[3.84,3.64,3.88,3.57,3.72,3.52,3.68,3.55,3.79,3.69,3.92];
 const drifts=[-.12,-.08,.025,-.025,.10,.075,.145,.105,.165,.12,.16];
 const breadth=[1.10,.90,1.12,.82,1.05,.96,.90,1.08,.90,.97,.87];
 for(let i=0;i<11;i++){
  const s=(i-5)/5,drift=drifts[i],f=breadth[i];
  const points=[[s*.07,6.277,-.139],[s*.23,6.113,-.346+.048*s*s],[s*.382,5.844,-.453+.124*s*s],[s*.441+.024*Math.sin(i*.8),5.331,-.485+.116*s*s],[s*.53+.045+drift*.2,4.784,-.540+.094*s*s],[s*.575+.075+drift*.6,4.163,-.470+.070*s*s],[s*.558+.07+drift,tipHeights[i],-.335+.040*s]];
  const widths=[.025,.073,.102,.122,.126,.098,.0007].map(w=>w*f),depths=[.019,.035,.05,.061,.064,.040,.001];
  sweep(hair,`Back hair layer ${i+1}`,points,widths,depths,M.hair,{steps:76,sides:18,outline:.0025});
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.45),sizes=widths.map((w,j)=>[w,depths[j]]);
  const onSurface=(t,angle,offset=.0015)=>{
   const p=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),back=new THREE.Vector3(0,0,1).addScaledVector(tangent,-tangent.z).normalize(),side=back.clone().cross(tangent).normalize(),[w,d]=sampleRows(sizes,t);
   return p.addScaledVector(side,w*Math.cos(angle)).addScaledVector(back,d*Math.sin(angle)-offset).toArray();
  };
  if([1,4,7,9].includes(i)){
   const start=.17+.014*(i%3),length=.54-.030*(i%2);
   mesh(hair,`Rear silk highlight ${i+1}`,gridGeometry(12,50,(u,v)=>onSurface(start+length*v,-Math.PI/2+(u-.5)*.62*Math.pow(Math.sin(Math.PI*v),.65))),rearShine,0);
  }
  if(i%2===0){const groove=[];for(let j=0;j<=30;j++)groove.push(onSurface(.22+j/30*.68,-1.98,.0016));line(hair,`Rear strand separation ${i+1}`,groove,.0015,M.hairDark,{steps:74,sides:5});}
 }
 const locks=[
  ['Right outward wisp',[[-.35,5.93,-.10],[-.48,5.48,-.13],[-.57,5.04,-.17],[-.74,4.61,-.17],[-.92,4.39,-.09],[-1.17,4.31,.015]],[.05,.12,.13,.12,.065,.001],M.hair],
  ['Right lower tapered lock',[[-.34,5.8,-.26],[-.49,5.3,-.29],[-.52,4.84,-.30],[-.61,4.32,-.25],[-.73,4.02,-.21],[-.89,3.89,-.12]],[.05,.13,.14,.13,.09,.001],M.hairLight],
  ['Left flowing outer lock',[[.35,5.87,-.16],[.52,5.31,-.20],[.71,4.84,-.19],[.86,4.39,-.16],[.94,3.98,-.06],[.81,3.70,.055]],[.06,.145,.16,.16,.12,.001],M.hair],
  ['Left intermediate long lock',[[.29,5.93,-.27],[.43,5.3,-.34],[.56,4.82,-.38],[.62,4.36,-.34],[.70,3.98,-.21],[.59,3.70,-.13]],[.05,.14,.14,.14,.10,.001],M.hairLight],
  ['Left drifting flyaway',[[.42,5.6,-.20],[.56,5.12,-.15],[.69,4.82,-.09],[.89,4.53,-.04],[1.08,4.48,.015]],[.025,.06,.085,.045,.001],M.hairDark],
 ];
 for(const [name,p,w,mat] of locks)sweep(hair,name,p,w,w.map(v=>v*.49),mat,{steps:60,sides:14,outline:.005});
 const bangs=[
  ['Right cheek-framing lock',[[-.13,6.24,.11],[-.36,6.05,.24],[-.48,5.77,.225],[-.47,5.45,.24],[-.37,5.26,.22]],[.07,.15,.11,.095,.001],[.045,.075,.056,.038,.001],M.hair],
  ['Swept central bang',[[-.105,6.26,.135],[-.06,6.10,.33],[.002,5.958,.395],[.012,5.827,.391],[.065,5.725,.374],[.154,5.671,.35]],[.05,.145,.097,.080,.048,.001],[.020,.04,.033,.023,.015,.001],M.hairLight],
  ['Central left bang',[[-.10,6.23,.17],[-.28,6.074,.308],[-.252,5.873,.353],[-.165,5.721,.374],[-.067,5.668,.345]],[.057,.114,.09,.054,.001],[.024,.034,.027,.018,.001],M.hair],
  ['Slim eye-side bang',[[-.30,6.16,.20],[-.40,5.98,.279],[-.385,5.785,.327],[-.388,5.632,.318],[-.425,5.50,.217]],[.035,.058,.048,.028,.001],[.03,.03,.025,.014,.001],M.hairLight],
  ['Parted left forehead lock',[[.025,6.253,.11],[.235,6.109,.239],[.348,5.924,.267],[.385,5.696,.265],[.342,5.432,.271],[.234,5.302,.26]],[.060,.123,.119,.098,.082,.001],[.036,.051,.048,.044,.028,.001],M.hairLight],
  ['Left cheek outer layer',[[.23,6.19,-.008],[.433,5.984,.09],[.485,5.652,.145],[.467,5.371,.18],[.347,5.247,.199]],[.05,.114,.102,.075,.001],[.045,.062,.052,.039,.001],M.hair],
 ];
 for(const [name,p,w,d,mat] of bangs)if(!['Swept central bang','Parted left forehead lock','Central left bang','Slim eye-side bang'].includes(name))sweep(hair,name,p,w,d,mat,{steps:58,sides:18,outline:.0045});
 // Bezier silhouettes control the forehead curl while a curved support surface
 // gives each lock closed volume, a soft edge, and a natural three-quarter profile.
 const profile=[[5.24,.19],[5.40,.295],[5.60,.370],[5.80,.410],[5.96,.375],[6.10,.294],[6.22,.197],[6.31,.085]];
 const support=(x,y)=>{let i=0;while(i<profile.length-2&&y>profile[i+1][0])i++;const a=profile[i],b=profile[i+1],t=THREE.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);return THREE.MathUtils.lerp(a[1],b[1],t)*Math.sqrt(Math.max(.13,1-(x/.585)**2));};
 const edgeOf=(shape,name,offset)=>{const pts=shape.getPoints(28);pts.pop();line(hair,name,pts.map(p=>[p.x,p.y,support(p.x,p.y)+offset]),.0017,M.hairDark,{steps:220,sides:6,closed:true});};
 const fringe=new THREE.Shape();fringe.moveTo(-.068,6.302);
 fringe.bezierCurveTo(-.185,6.264,-.271,6.167,-.285,6.040);
 fringe.bezierCurveTo(-.296,5.916,-.248,5.805,-.159,5.731);
 fringe.bezierCurveTo(-.073,5.665,.017,5.638,.115,5.661);
 fringe.bezierCurveTo(.082,5.692,.084,5.736,.111,5.773);
 fringe.bezierCurveTo(.153,5.763,.194,5.783,.205,5.817);
 fringe.bezierCurveTo(.157,5.801,.111,5.835,.085,5.902);
 fringe.bezierCurveTo(.064,5.974,.061,6.056,.102,6.127);
 fringe.bezierCurveTo(.144,6.179,.100,6.251,-.068,6.302);fringe.closePath();
 contourVolume(hair,'Swept central bang',fringe,M.hairLight,support,{depth:.024,bevel:.0045,outline:0});
 edgeOf(fringe,'Central curl fine contour',.029);
 const side=new THREE.Shape();side.moveTo(.065,6.300);
 side.bezierCurveTo(.261,6.262,.424,6.108,.462,5.932);
 side.bezierCurveTo(.507,5.718,.477,5.398,.341,5.268);
 side.quadraticCurveTo(.288,5.235,.230,5.260);
 side.bezierCurveTo(.338,5.399,.351,5.560,.294,5.707);
 side.bezierCurveTo(.224,5.839,.214,6.032,.171,6.115);
 side.bezierCurveTo(.142,6.158,.128,6.174,.096,6.147);
 side.bezierCurveTo(.077,6.205,.087,6.267,.065,6.300);side.closePath();
 contourVolume(hair,'Parted left forehead lock',side,M.hairLight,support,{depth:.026,bevel:.005,outline:0});
 edgeOf(side,'Forehead part fine contour',.032);
 const left=new THREE.Shape();left.moveTo(-.07,6.30);
 left.bezierCurveTo(-.265,6.206,-.360,6.003,-.335,5.809);
 left.quadraticCurveTo(-.316,5.662,-.244,5.610);
 left.bezierCurveTo(-.269,5.754,-.243,5.919,-.169,6.051);
 left.quadraticCurveTo(-.110,6.204,-.07,6.30);left.closePath();
 contourVolume(hair,'Central left bang',left,M.hair,(x,y)=>support(x,y)-.016,{depth:.017,bevel:.004,outline:0});
 edgeOf(left,'Left fringe fine contour',.007);
 // A root-to-tip ribbon replaces the detached tubular temple patch.
 const temple=new THREE.Shape();temple.moveTo(-.085,6.300);
 temple.bezierCurveTo(-.284,6.246,-.416,6.068,-.446,5.894);
 temple.bezierCurveTo(-.468,5.746,-.445,5.576,-.399,5.499);
 temple.bezierCurveTo(-.406,5.660,-.375,5.812,-.326,5.941);
 temple.bezierCurveTo(-.278,6.065,-.171,6.222,-.085,6.300);temple.closePath();
 contourVolume(hair,'Rooted temple fringe ribbon',temple,M.hairLight,(x,y)=>support(x,y)+.004,{depth:.014,bevel:.0035,outline:0});
 edgeOf(temple,'Temple ribbon fine contour',.023);
 const strandPaths=[
  ['Central fringe flow',[[-.126,6.247],[-.215,6.115],[-.216,5.977],[-.157,5.846],[-.064,5.728]],.031],
  ['Parted fringe flow',[[.204,6.174],[.329,6.008],[.381,5.798],[.357,5.527],[.291,5.327]],.033],
 ];
 for(const [name,points,offset]of strandPaths)sweep(hair,name,points.map(([x,y])=>[x,y,support(x,y)+offset]),[.0003,.0019,.0016,.0013,.0003],[.0003,.0012,.0012,.0008,.0003],M.hair,{steps:58,sides:6,outline:0});
 const flow=[[.199,6.115],[.230,5.993],[.244,5.855],[.240,5.743],[.222,5.698]];
 sweep(hair,'Fine forehead part strand',flow.map(([x,y])=>[x,y,support(x,y)+.033]),[.003,.008,.007,.005,.0005],[.002,.004,.004,.003,.0004],M.hair,{steps:42,sides:10,outline:0});
 // Small attached highlights are curved surface details, not floating cards.
 const shine=new THREE.Shape();shine.moveTo(-.061,6.251);
 shine.bezierCurveTo(-.145,6.199,-.188,6.120,-.174,6.022);
 shine.lineTo(-.145,6.048);shine.lineTo(-.133,5.992);shine.lineTo(-.105,6.016);shine.lineTo(-.072,5.946);
 shine.bezierCurveTo(-.051,6.001,-.069,6.073,-.038,6.138);
 shine.quadraticCurveTo(-.021,6.206,-.061,6.251);shine.closePath();
 contourVolume(hair,'Soft crown highlight',shine,M.hairShine,(x,y)=>support(x,y)+.029,{depth:.002,bevel:.001,outline:0});
 sweep(hair,'Single curled crown flyaway',[[-.14,6.23,.09],[-.43,6.211,.065],[-.598,6.262,.02],[-.596,6.404,-.012],[-.491,6.463,-.015]],[.032,.030,.024,.015,.001],[.018,.015,.011,.009,.001],M.hairLight,{steps:58,sides:12,outline:.003});
 // A few broad sculpted highlights follow the flow, rather than dense painted noise.
 sweep(hair,'Fine cheek-side curl',[[-.45,5.73,.119],[-.562,5.40,.073],[-.60,5.168,.093],[-.533,5.019,.145],[-.467,5.014,.161]],[.023,.025,.021,.012,.001],[.012,.013,.010,.007,.001],M.hairLight,{steps:56,sides:12,outline:.002});
 sweep(hair,'Floating fine temple strand',[[-.46,5.70,.029],[-.60,5.341,.020],[-.643,5.147,.063],[-.574,4.997,.101]],[.012,.012,.009,.001],[.008,.007,.006,.001],M.hair,{steps:48,sides:10,outline:.001});
 // Tapered flyaways soften the solid outer lock without flattening it into a card.
 sweep(hair,'Fine right temple flyaway',[[.45,5.80,.09],[.57,5.48,.12],[.59,5.12,.13],[.68,4.81,.10],[.94,4.61,.055],[1.16,4.58,.045]],[.007,.011,.009,.013,.009,.0005],[.005,.006,.005,.007,.005,.0004],M.hairLight,{steps:86,sides:10,outline:.001});
 sweep(hair,'Tapered rear outer filament',[[-.28,5.92,-.37],[-.49,5.34,-.46],[-.57,4.72,-.47],[-.56,4.21,-.42],[-.70,3.84,-.32],[-.79,3.76,-.24]],[.004,.012,.013,.015,.010,.0005],[.004,.007,.007,.008,.005,.0004],M.hair,{steps:86,sides:10,outline:.001});
 // Hair uses soft directional shading; noisy self-shadow pixels obscure its authored strand flow.
 hair.traverse(o=>{if(o.isMesh)o.receiveShadow=false;});
 return hair;
}
