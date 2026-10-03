import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {browserOptions} from './browser.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
execFileSync(process.execPath,[path.join(root,'scripts/bake-hands.mjs')],{cwd:root,stdio:'inherit'});
const out=path.join(root,'build'),stage=path.join(root,'.cache/staged-build');
await mkdir(out,{recursive:true});await mkdir(path.join(out,'preview'),{recursive:true});await mkdir(stage,{recursive:true});
const digest=createHash('sha256');for(const f of (await readdir(path.join(root,'src'))).sort())digest.update(await readFile(path.join(root,'src',f)));const sourceHash=digest.digest('hex').slice(0,16);
await build({banner:{js:`window.MOONVEIL_BUILD='${sourceHash}';`},entryPoints:[path.join(root,'src/main.js')],outfile:path.join(stage,'app.js'),bundle:true,format:'iife',target:['es2022'],minify:true,legalComments:'eof'});
const css=await readFile(path.join(root,'src/style.css'),'utf8'),html=await readFile(path.join(root,'src/index.html'),'utf8'),rawManifest=await readFile(path.join(root,'docs/manifest.json'),'utf8');
const manifest=JSON.stringify({...JSON.parse(rawManifest),modelBuildHash:sourceHash,builtAt:new Date().toISOString()});
const js=(await readFile(path.join(stage,'app.js'),'utf8')).replace(/<\/script/gi,'<\\/script');
const embedded=`<script>window.MOONVEIL_MANIFEST=${manifest.replace(/</g,'\\u003c')};</script>`;
const standalone=html.replace('<link rel="stylesheet" href="./style.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="./app.js"></script>',()=>`${embedded}<script>${js}</script>`);
const candidate=path.join(stage,'candidate.html');await writeFile(candidate,standalone);
const browser=await chromium.launch(browserOptions()),exceptions=[];
let smoke;
try{
 const page=await browser.newPage({viewport:{width:880,height:900}});page.on('pageerror',e=>exceptions.push(String(e)));
 await page.goto(pathToFileURL(candidate).href,{waitUntil:'load',timeout:60000});
 await page.waitForFunction(()=>window.atelier?.ready||window.atelier?.error,null,{timeout:45000});
 smoke=await page.evaluate(()=>({ready:window.atelier.ready,error:window.atelier.error,buildHash:window.MOONVEIL_BUILD,stats:window.atelier.ready?window.atelier.validate():null}));
 if(!smoke.ready||smoke.error||exceptions.length||smoke.stats.badVertices||smoke.buildHash!==sourceHash)throw new Error('Staged Chrome startup failed: '+JSON.stringify({smoke,exceptions}));
}finally{await browser.close();}
const report={sourceHash,ready:smoke.ready,badVertices:smoke.stats.badVertices,triangles:smoke.stats.triangles,exceptions,passed:true};
await mkdir(path.join(root,'output/validation'),{recursive:true});await writeFile(path.join(root,'output/validation/build-smoke.json'),JSON.stringify(report,null,2));
const files={
 'app.js':await readFile(path.join(stage,'app.js')),
 'style.css':css,
 'index.html':html.replace('type="module" ','').replace('./app.js',`./app.js?v=${sourceHash}`).replace('./style.css',`./style.css?v=${sourceHash}`),
 'moonveil_gpt6-astra-pro_mcp-colabdev_threejs.html':standalone,
 'manifest.json':manifest,
};
// Only a Chrome-verified candidate can reach these publication writes. Manifest is last.
for(const [name,content]of Object.entries(files)){await writeFile(path.join(out,name+'.tmp'),content);await rename(path.join(out,name+'.tmp'),path.join(out,name));}
console.log(JSON.stringify({build:out,sourceHash,bundleBytes:Buffer.byteLength(js),standaloneBytes:Buffer.byteLength(standalone),chromeSmoke:report,ok:true}));
