import {chromium} from 'playwright-core';
import {browserOptions} from './browser.mjs';
const browser=await chromium.launch(browserOptions());
try {
 const page=await browser.newPage({viewport:{width:1000,height:1250},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4186/?render=front',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.atelier?.ready);
 await page.evaluate(()=>{
  const a=window.atelier;
  
  const materials=new Set();a.character.root.traverse(o=>{if(o.isMesh&&!o.userData.outline&&o.material.isMeshToonMaterial)materials.add(o.material);});
  for(const material of materials){
   if(material.name!=='Warm porcelain skin')continue;
   const values=[95,143,199,237,255];
   const ramp=material.gradientMap.clone();ramp.image={data:new Uint8Array(values),width:values.length,height:1};ramp.magFilter=ramp.minFilter=1003;ramp.needsUpdate=true;
   material.gradientMap=ramp;material.emissiveIntensity=.38;material.color.set('#fff6f0');material.emissive.set('#ffddd8');material.needsUpdate=true;
  }
  a.render();
 });
 for(const view of ['front','legs','raisedhand']){await page.evaluate(v=>{window.atelier.setView(v);window.atelier.render();},view);await page.waitForTimeout(400);await page.screenshot({path:`.cache/skin-study-${view}.png`});}
 console.log('Saved two WebGL lighting-study screenshots; source materials unchanged.');
} finally {await browser.close();}
