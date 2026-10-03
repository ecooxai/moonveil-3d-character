import {chromium} from 'playwright-core';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {browserOptions} from './browser.mjs';
const [tag='iteration-24',...requested]=process.argv.slice(2),views=requested.length?requested:['front','portrait','side','back'];
await mkdir('output/iterations',{recursive:true});await mkdir('build/preview',{recursive:true});
const browser=await chromium.launch(browserOptions());
try{
 const page=await browser.newPage({viewport:{width:1000,height:1250},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4186/?render=front',{waitUntil:'networkidle',timeout:60000});
 await page.waitForFunction(()=>window.atelier?.ready,null,{timeout:60000});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#loading')).visibility==='hidden');
 for(const view of views){
  await page.evaluate(v=>{window.atelier.setView(v);window.atelier.render();},view);await page.waitForTimeout(200);
  await page.screenshot({path:`output/iterations/${tag}-${view}.png`});
  const stats=await page.evaluate(()=>({buildHash:window.MOONVEIL_BUILD,...window.atelier.validate(),render:window.atelier.renderer.info.render}));
  await writeFile(`output/iterations/${tag}-${view}.json`,JSON.stringify({tag,view,stats,errors},null,2));
  await copyFile(`output/iterations/${tag}-${view}.png`,`build/preview/${tag}-${view}.png`);
  console.log(JSON.stringify({tag,view,buildHash:stats.buildHash,triangles:stats.triangles,badVertices:stats.badVertices,drawCalls:stats.render.calls,errors}));
 }
}finally{await browser.close();}
