import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createCharacter} from './character.js';
import {LEGS} from './anatomy.js';
import {boundsAndStats} from './geometry.js';
import {createDrawTree} from './optimize.js';
const $=s=>document.querySelector(s);
const parameters=new URLSearchParams(location.search),renderOnly=parameters.has('render'),offline=location.protocol==='file:';
if(offline)document.body.classList.add('offline');
if(renderOnly)document.body.classList.add('render-only');
let renderer,scene,camera,controls,character,needsRender=true,night=false,wire=false;
const host=$('#viewport'),stage=$('#stage');
let currentView='front',viewHeight=7.60;
const views={front:{position:[.29,5.05,14],target:[.29,3.48,0],height:7.6,label:'FRONT STUDY'},threequarter:{position:[8.6,5.0,13],target:[.23,3.46,0],height:7.6,label:'THREE-QUARTER STUDY'},side:{position:[14,4.9,.20],target:[.2,3.45,0],height:7.6,label:'SIDE STUDY'},back:{position:[.2,4.95,-14],target:[.2,3.46,0],height:7.6,label:'BACK STUDY'},portrait:{position:[0,6.82,12],target:[0,5.68,0],height:2.76,label:'PORTRAIT STUDY'}};
Object.assign(views,{
 raisedhand3q:{position:[-4.6,6.0,6.5],target:[-.58,5.91,.17],height:1.03,minWidth:.70,detail:true,label:'RIGHT HAND / THREE-QUARTER'},
 pillowhand3q:{position:[4.6,3.6,6.5],target:[1.08,3.15,.19],height:.91,minWidth:.66,detail:true,label:'LEFT HAND / THREE-QUARTER'},
 raisedhand:{position:[-.53,5.93,8],target:[-.53,5.93,.10],height:.93,minWidth:.64,detail:true,label:'RIGHT HAND / TEMPLE'},
 pillowhand:{position:[1.06,3.21,8],target:[1.06,3.21,.18],height:.86,minWidth:.59,detail:true,label:'LEFT HAND / PILLOW'},
 legs:{position:[.02,1.85,10],target:[.02,1.55,.1],height:3.48,minWidth:1.65,detail:true,label:'LEG ANATOMY STUDY'}
});
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),3500);}
function resize(){if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const aspect=w/h;const height=Math.max(viewHeight,(views[currentView]?.minWidth??(currentView==='portrait'?1.35:3.45))/aspect);camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false);needsRender=true;}
function setView(name){const v=views[name]||views.front;currentView=name;viewHeight=v.height+(!renderOnly&&name!=='portrait'&&!v.detail?.80:0);camera.position.set(...v.position);controls.target.set(...v.target);if(!renderOnly&&name!=='portrait'&&!v.detail){camera.position.y-=.45;controls.target.y-=.45;}camera.zoom=1;controls.autoRotate=false;$('#rotate-button').setAttribute('aria-pressed','false');controls.update();resize();$('#view-label').textContent=v.label;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===name);b.setAttribute('aria-pressed',String(b.dataset.view===name));});needsRender=true;}
function restoreCamera(){
 if(renderOnly||offline)return;
 try{
  const saved=JSON.parse(sessionStorage.getItem('moonveil-resume')||'null');sessionStorage.removeItem('moonveil-resume');
  if(!saved||!views[saved.view]||![saved.position,saved.target].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite)))return;
  setView(saved.view);camera.position.fromArray(saved.position);controls.target.fromArray(saved.target);camera.zoom=Number.isFinite(saved.zoom)?saved.zoom:1;controls.update();resize();
 }catch{}
}
function setWire(value){wire=value;character.drawRoot.traverse(o=>{if(!o.isMesh)return;if(o.userData.outline){o.visible=!wire;return;}for(const m of Array.isArray(o.material)?o.material:[o.material])m.wireframe=wire;});$('#wire-button').setAttribute('aria-pressed',String(wire));needsRender=true;}
function setNight(value){night=value;stage.classList.toggle('night',night);$('#theme-button').setAttribute('aria-pressed',String(night));needsRender=true;}
function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);}
async function exportGLB(){
 const btn=$('#export-top');btn.disabled=true;toast('Preparing mesh, materials and textures…');
 try{
  const copy=character.root.clone(true),outlines=[],converted=new Map();
  copy.traverse(o=>{if(o.userData.outline)outlines.push(o);else if(o.isMesh){
   const convert=m=>{if(!converted.has(m.uuid))converted.set(m.uuid,m.isMeshToonMaterial?new THREE.MeshStandardMaterial({name:m.name,color:m.color.clone(),map:m.map,roughness:.85,metalness:0,transparent:m.transparent,opacity:m.opacity,side:m.side}):m.clone());return converted.get(m.uuid);};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);for(const m of Array.isArray(o.material)?o.material:[o.material])m.wireframe=false;
  }});outlines.forEach(o=>o.removeFromParent());copy.updateMatrixWorld(true);
  const buffer=await new GLTFExporter().parseAsync(copy,{binary:true,onlyVisible:true,maxTextureSize:1024});
  save(new Blob([buffer],{type:'model/gltf-binary'}),'moonveil_gpt6-astra-pro_mcp-colabdev_threejs.glb');toast('GLB exported. Ready for another 3D editor.');return {bytes:buffer.byteLength};
 }catch(error){console.error(error);toast(`Export failed: ${error.message}`);throw error;}finally{btn.disabled=false;}
}
function screenshot(){renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob){save(blob,`moonveil_${currentView}_gpt6-astra-pro_mcp-alagent_threejs.png`);toast('Viewport saved as a PNG.');}},'image/png');}
function ground(){
 const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d'),g=c.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,'rgba(91,70,115,.20)');g.addColorStop(.4,'rgba(91,70,115,.11)');g.addColorStop(1,'rgba(91,70,115,0)');c.fillStyle=g;c.fillRect(0,0,128,128);
 const t=new THREE.CanvasTexture(cv),m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false});const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.3,2.3),m);shadow.name='Studio contact shadow';shadow.rotation.x=-Math.PI/2;shadow.position.set(.18,.006,.20);scene.add(shadow);
 for(const leg of LEGS){const contact=new THREE.Mesh(new THREE.PlaneGeometry(.53,.85),m.clone());contact.name=leg.side+' foot contact shadow';contact.material.opacity=.65;contact.rotation.x=-Math.PI/2;contact.position.set(leg.shoe[0],.007,leg.shoe[2]);scene.add(contact);}
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.10}));plane.name='Studio shadow catcher';plane.rotation.x=-Math.PI/2;plane.position.y=.002;plane.receiveShadow=true;
}
function init(){
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
 scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-5,5,4,-4,.1,80);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.085;controls.rotateSpeed=.65;controls.zoomSpeed=.8;controls.minZoom=.55;controls.maxZoom=5;controls.maxPolarAngle=Math.PI*.55;controls.minPolarAngle=.12;controls.autoRotateSpeed=.6;controls.addEventListener('change',()=>{needsRender=true;});
 scene.add(new THREE.HemisphereLight(0xf1edff,0xa7a0b7,.96));const key=new THREE.DirectionalLight(0xfff9f6,1.15);key.position.set(-3.5,7,5.2);key.target.position.set(0,3.5,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3,right:3,top:4,bottom:-4,near:.5,far:18});key.shadow.normalBias=.023;key.shadow.bias=-.00025;scene.add(key,key.target);
 const fill=new THREE.DirectionalLight(0xcbd4ff,.29);fill.position.set(3,4,-4);scene.add(fill);
 character=createCharacter();character.drawRoot=createDrawTree(character.root);scene.add(character.drawRoot);ground();setView(parameters.get('render')||'front');restoreCamera();new ResizeObserver(resize).observe(host);resize();renderer.render(scene,camera);
 $('#triangle-count').textContent=`${Math.round(character.stats.triangles/1000)}k triangles`;$('#mesh-count').textContent=`${character.stats.meshes} SURFACES`;$('#loading').classList.add('loaded');
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('Graphics context paused. Reload to restore the studio.');});
 function animate(){requestAnimationFrame(animate);if(document.hidden)return;const changed=controls.update();if(needsRender||changed||controls.autoRotate){renderer.render(scene,camera);needsRender=false;}}
 animate();
 window.atelier={ready:true,character,renderer,scene,camera,controls,stats:character.stats,setView,setWire,setNight,exportGLB,screenshot,validate:()=>({...boundsAndStats(character.root),batching:character.drawRoot.userData,drawTree:boundsAndStats(character.drawRoot)}),render:()=>renderer.render(scene,camera)};
}
try{init();}catch(error){console.error(error);$('#loading').innerHTML='<p>This device could not open the WebGL studio.<br>Try a current browser with graphics acceleration enabled.</p>';window.atelier={ready:false,error:String(error)};}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>setView(b.dataset.view));
$('#portrait-button').addEventListener('click',()=>setView('portrait'));$('#reset-button').addEventListener('click',()=>setView('front'));
$('#rotate-button').addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;$('#rotate-button').setAttribute('aria-pressed',String(controls.autoRotate));needsRender=true;});
$('#wire-button').addEventListener('click',()=>setWire(!wire));$('#theme-button').addEventListener('click',()=>setNight(!night));$('#snapshot-button').addEventListener('click',screenshot);$('#export-top').addEventListener('click',exportGLB);$('#glb-download').addEventListener('click',e=>{e.preventDefault();exportGLB();});
$('#copy-path').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#project-path').textContent);toast('Project path copied.');}catch{toast('Select and copy the displayed project path.');}});

let lastManifest='';
function updateManifest(data){
 if(!offline&&!renderOnly&&window.atelier?.ready&&data.modelBuildHash&&data.modelBuildHash!==window.MOONVEIL_BUILD&&!updateManifest.reloading&&!$('#export-top').disabled){
  updateManifest.reloading=true;
  try{sessionStorage.setItem('moonveil-resume',JSON.stringify({view:currentView,position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom}));}catch{}
  toast('A new Colab sculpt is ready. Updating the studio…');setTimeout(()=>location.reload(),700);
 }

 const key=JSON.stringify(data);if(key===lastManifest)return;lastManifest=key;updateLatestViews(data.latestViews||[]);
 $('#quality-score').textContent=data.visualScore==null?'—':String(data.visualScore);const denom=document.createElement('small');denom.textContent='/100';$('#quality-score').appendChild(denom);
 $('#quality-detail').textContent=data.review||'Awaiting visual inspection';$('#iteration-count').textContent=String(data.iterations?.length||0);$('#build-status').textContent=data.status||'In progress';$('#test-status').textContent=data.testsSummary||'Validation not yet run';
 const build=data.buildPath||'/build/moonveil_gpt6_astra_pro_mcp_colabdev_web',name='moonveil_gpt6-astra-pro_mcp-colabdev_threejs';
 $('#project-path').textContent=data.projectPath||'/home/dev/project/3d/moonveil_gpt6_astra_pro_mcp_colabdev_web';for(const ext of ['glb','html','zip'])$(`#${ext}-path`).textContent=`${build}/${name}.${ext}`;
 if(data.iterations?.length){const grid=$('#journal-grid');grid.replaceChildren();for(const it of [...data.iterations].reverse()){
  const card=document.createElement('article');card.className='journal-card';if(it.image&&!offline){const link=document.createElement('a');link.href=it.image;link.target='_blank';link.rel='noopener';const img=document.createElement('img');img.className='journal-image';img.src=it.image;img.alt=it.title;img.loading='lazy';link.appendChild(img);card.appendChild(link);}
  const body=document.createElement('div');body.className='journal-card-body';const top=document.createElement('div');top.className='journal-kicker';const num=document.createElement('span');num.textContent=`ITERATION ${String(it.iteration).padStart(2,'0')}`;const score=document.createElement('b');score.textContent=`${it.score}/100 · VISUAL`;top.append(num,score);body.appendChild(top);
  const h=document.createElement('h3');h.textContent=it.title;const p=document.createElement('p');p.textContent=it.note;const path=document.createElement('code');path.className='path';path.textContent=it.absolutePath||`${build}/${(it.image||'').replace('./','')}`;body.append(h,p,path);card.appendChild(body);grid.appendChild(card);
 }}
}
async function poll(){if(location.protocol==='file:')return;try{const r=await fetch('./manifest.json',{cache:'no-store'});if(r.ok)updateManifest(await r.json());}catch{}}
if(window.MOONVEIL_MANIFEST)updateManifest(window.MOONVEIL_MANIFEST);poll();if(!renderOnly)setInterval(poll,5000);

function updateLatestViews(views){
 const grid=document.querySelector('#latest-grid');grid.replaceChildren();if(offline)return;
 for(const view of views){
  const card=document.createElement('figure'),link=document.createElement('a'),img=document.createElement('img'),caption=document.createElement('figcaption'),path=document.createElement('code');
  link.href=view.url;link.target='_blank';link.rel='noopener';img.src=view.url;img.alt=view.label;img.loading='lazy';link.appendChild(img);
  caption.textContent=view.label;path.className='path';path.textContent=view.absolutePath;card.append(link,caption,path);grid.appendChild(card);
 }
}
