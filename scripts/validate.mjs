import {chromium} from 'playwright-core';
import {browserOptions} from './browser.mjs';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'output/validation');await mkdir(out,{recursive:true});
const basename='moonveil_gpt6-astra-pro_mcp-alagent_threejs',base='http://127.0.0.1:4186';
const checks=[],errors=[],requests=[];
const check=async(name,fn)=>{try{const detail=await fn();checks.push({name,passed:true,detail});}catch(e){checks.push({name,passed:false,error:String(e)});}};
const browser=await chromium.launch(browserOptions());
const context=await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:1,acceptDownloads:true});
let stats,exportInfo,roundTrip,benchmark;
const feetClear=async page=>{
 const result=await page.evaluate(()=>{
  const a=window.atelier;a.render();const group=a.character.root.getObjectByName('Near slipper assembly'),v=a.camera.position.clone(),canvas=a.renderer.domElement.getBoundingClientRect(),controls=document.querySelector('.camera-controls').getBoundingClientRect();
  let lowest=-Infinity;group.updateWorldMatrix(true,true);
  group.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).project(a.camera);lowest=Math.max(lowest,canvas.top+(1-v.y)*canvas.height/2);}});
  return {lowestFootPixel:lowest,controlsTop:controls.top,clearance:controls.top-lowest};
 });
 assert(result.clearance>=7,JSON.stringify(result));return result;
};
const ready=async page=>{await page.bringToFront();await page.waitForFunction(()=>window.atelier?.ready,null,{timeout:60000,polling:100});await page.waitForFunction(()=>getComputedStyle(document.querySelector('#loading')).visibility==='hidden');};
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>requests.push({url:r.url(),error:r.failure()}));
 await page.goto(base,{waitUntil:'networkidle',timeout:60000});await ready(page);
 stats=await page.evaluate(()=>window.atelier.validate());
 await check('Geometry contains no invalid coordinates',()=>assert.equal(stats.badVertices,0));
 await check('The model has real depth and complete volume',()=>{assert(stats.bounds.size[2]>1.3);assert(stats.meshes>150);return stats.bounds.size;});
 await check('Batching preserves the triangle count',()=>assert.equal(stats.drawTree.triangles,stats.triangles));
 await check('Batched drawing uses fewer than 40 meshes',()=>{assert(stats.batching.drawMeshes<40);return stats.batching;});
 await check('Semantic character parts remain editable',async()=>assert(await page.evaluate(()=>['Swept central bang','Raised arm','Pillow inflated front','Continuous neck and upper chest'].every(n=>window.atelier.character.root.getObjectByName(n)))));
 await check('Desktop has no horizontal overflow',async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)));
 for(const view of ['front','threequarter','side','back','portrait'])await check(`Camera preset: ${view}`,async()=>{await page.click(`[data-view="${view}"]`);assert(await page.locator(`[data-view="${view}"]`).evaluate(e=>e.classList.contains('active')));return page.locator('#view-label').textContent();});
 await check('Wireframe toggles and restores ink',async()=>{await page.click('#wire-button');assert(await page.evaluate(()=>window.atelier.character.drawRoot.children.filter(x=>x.userData.outline).every(x=>!x.visible)));await page.click('#wire-button');assert(await page.evaluate(()=>window.atelier.character.drawRoot.children.filter(x=>x.userData.outline).every(x=>x.visible)));});
 await check('Night backdrop toggles',async()=>{await page.click('#theme-button');assert(await page.locator('#stage').evaluate(e=>e.classList.contains('night')));await page.click('#theme-button');});
 await check('Turntable changes the camera',async()=>{const a=await page.evaluate(()=>window.atelier.camera.position.toArray());await page.bringToFront();await page.click('#rotate-button');await page.waitForFunction(previous=>window.atelier.camera.position.toArray().some((value,i)=>Math.abs(value-previous[i])>0.00001),a,{timeout:10000,polling:100});const b=await page.evaluate(()=>window.atelier.camera.position.toArray());assert.notDeepEqual(a,b);await page.click('#rotate-button');});
 await page.click('#reset-button');
 await check('Mouse drag orbits the model',async()=>{const a=await page.evaluate(()=>window.atelier.camera.position.toArray());await page.mouse.move(690,570);await page.mouse.down();await page.mouse.move(800,550,{steps:8});await page.mouse.up();await page.waitForTimeout(200);assert.notDeepEqual(a,await page.evaluate(()=>window.atelier.camera.position.toArray()));});
 await check('Mouse wheel zooms the model',async()=>{const a=await page.evaluate(()=>window.atelier.camera.zoom);await page.mouse.wheel(0,-120);await page.waitForTimeout(200);assert.notEqual(a,await page.evaluate(()=>window.atelier.camera.zoom));});
 await page.click('#reset-button');
 await check('Snapshot produces a PNG file',async()=>{const wait=page.waitForEvent('download');await page.click('#snapshot-button');const download=await wait;await download.saveAs(path.join(out,'viewport-snapshot.png'));const data=await readFile(path.join(out,'viewport-snapshot.png'));assert.equal(data.subarray(1,4).toString(),'PNG');return data.length;});
 await check('Desktop camera controls do not cover the feet',()=>feetClear(page));
 await page.screenshot({path:path.join(out,'desktop-studio.png')});
 await check('GLB export completes',async()=>{const wait=page.waitForEvent('download',{timeout:120000});await page.click('#export-top');const download=await wait;await download.saveAs(path.join(root,'build',basename+'.glb'));await copyFile(path.join(root,'build',basename+'.glb'),path.join(root,'output',basename+'.glb'));const data=await readFile(path.join(root,'build',basename+'.glb'));assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());exportInfo={bytes:data.length,nodes:json.nodes.length,meshes:json.meshes.length,materials:json.materials.length,images:json.images.length,externalUris:JSON.stringify(json).match(/"uri":/g)?.length||0};assert.equal(exportInfo.externalUris,0);return exportInfo;});
 await build({stdin:{contents:"import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'; import {boundsAndStats} from './src/geometry.js'; window.checkSavedGlb=async url=>{const gltf=await new GLTFLoader().loadAsync(url);return {...boundsAndStats(gltf.scene),animations:gltf.animations.length};};",resolveDir:root},bundle:true,format:'iife',outfile:path.join(root,'build','validation-loader.js')});
 await check('Exported GLB reloads as full geometry',async()=>{await page.addScriptTag({url:base+'/validation-loader.js'});roundTrip=await page.evaluate(async name=>window.checkSavedGlb('./'+name+'.glb'),basename);assert.equal(roundTrip.badVertices,0);assert.equal(roundTrip.triangles,stats.triangles);assert.equal(roundTrip.animations,0);return roundTrip;});
 await check('24 turntable directions render successfully',async()=>{
  benchmark=await page.evaluate(()=>{const a=window.atelier,positions=[],times=[];a.setView('front');for(let i=0;i<24;i++){const t=i/24*Math.PI*2;a.camera.position.set(Math.sin(t)*14,5,Math.cos(t)*14);a.camera.lookAt(a.controls.target);const start=performance.now();a.render();times.push(performance.now()-start);positions.push(a.camera.position.toArray());}a.setView('front');a.render();return {angles:positions.length,submissionMs:{min:Math.min(...times),max:Math.max(...times),mean:times.reduce((s,x)=>s+x,0)/times.length},drawCalls:a.renderer.info.render.calls,note:'CPU submission timing in software-rendered headless Chrome, not a mobile GPU FPS benchmark.'};});assert.equal(benchmark.angles,24);assert(benchmark.drawCalls<45);return benchmark;
 });
 await page.close();
 const mobile=await context.newPage();mobile.on('pageerror',e=>errors.push('mobile: '+e));mobile.on('console',m=>{if(m.type()==='error')errors.push('mobile console: '+m.text());});await mobile.setViewportSize({width:390,height:900});await mobile.goto(base,{waitUntil:'networkidle'});await ready(mobile);
 await check('Mobile has no horizontal overflow',async()=>assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)));
 await check('Mobile camera controls are usable',async()=>{await mobile.click('[data-view="back"]');assert(await mobile.locator('[data-view="back"]').evaluate(e=>e.classList.contains('active')));await mobile.click('[data-view="front"]');});
 await check('Mobile canvas fills its viewport',async()=>{const dimensions=await mobile.locator('#viewport canvas').boundingBox();assert(dimensions.width>300);assert(dimensions.height>500);return dimensions;});
 await check('Mobile camera controls do not cover the feet',()=>feetClear(mobile));
 await mobile.screenshot({path:path.join(out,'mobile-studio.png')});await mobile.close();
 const offlineContext=await browser.newContext({viewport:{width:1000,height:900},offline:true});const offlinePage=await offlineContext.newPage();offlinePage.on('pageerror',e=>errors.push('offline: '+e));
 await check('Standalone HTML renders without network access',async()=>{await offlinePage.goto('file://'+path.join(root,'build',basename+'.html'));await ready(offlinePage);assert(await offlinePage.evaluate(()=>window.atelier.validate().badVertices===0));await offlinePage.screenshot({path:path.join(out,'offline-studio.png')});});await offlineContext.close();
 await check('Browser raised no JavaScript exceptions',()=>{assert.deepEqual(errors,[]);return errors;});
 await check('Read-only server health responds',async()=>{const r=await fetch(base+'/health');assert(r.ok);assert((await r.json()).ok);});
}catch(error){checks.push({name:'Validation harness completed',passed:false,error:String(error)});}
finally{await browser.close();}
const result={checkedAt:new Date().toISOString(),checks,passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,stats,exportInfo,roundTrip,benchmark,errors,failedRequests:requests};
await writeFile(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,failed:result.failed,failures:checks.filter(x=>!x.passed),exportInfo,benchmark}));if(result.failed)process.exitCode=1;
