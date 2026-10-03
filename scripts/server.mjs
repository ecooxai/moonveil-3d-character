import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {stat,realpath} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
const root=await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../build'));
const port=Number(process.env.PORT||4186);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.zip':'application/zip','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Read-only preview.');return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,project:'moonveil_gpt6_astra_pro_mcp_alagent_web'}));return;}
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(root+path.sep)||pathname.split('/').some(x=>x.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
  const actual=await realpath(target);if(!actual.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const info=await stat(actual);if(!info.isFile())throw Error('Not a file');
  res.setHeader('Content-Type',mime[path.extname(actual)]||'application/octet-stream');res.setHeader('Content-Length',info.size);
  if(req.method==='HEAD')res.end();else createReadStream(actual).on('error',()=>res.destroy()).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Moonveil read-only studio: http://127.0.0.1:${port}`));
