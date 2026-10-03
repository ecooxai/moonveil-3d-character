import * as THREE from 'three';
function cat(ctx,x,y,s,turn=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(turn);ctx.scale(s,s);ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#f6fdff';ctx.lineWidth=.042;
 ctx.beginPath();ctx.moveTo(-.38,-.15);ctx.quadraticCurveTo(-.53,-.78,-.20,-.43);ctx.quadraticCurveTo(0,-.50,.21,-.43);ctx.quadraticCurveTo(.56,-.78,.4,-.12);ctx.bezierCurveTo(.70,.49,.38,.60,0,.58);ctx.bezierCurveTo(-.46,.6,-.7,.42,-.38,-.15);ctx.stroke();ctx.fillStyle='#d9b8e5';
 for(const a of [-1,1]){ctx.beginPath();ctx.moveTo(a*.29,-.39);ctx.quadraticCurveTo(a*.48,-.56,a*.41,-.25);ctx.closePath();ctx.fill();}ctx.fillStyle='#f9feff';
 for(const a of [-1,1]){ctx.beginPath();ctx.ellipse(a*.20,.19,.049,.068,0,0,Math.PI*2);ctx.fill();}ctx.restore();
}
export function fabricTexture(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d');c.fillStyle='#cff2fa';c.fillRect(0,0,1024,1024);
 const motifs=[[80,110,191,-.3],[470,115,202,.23],[850,65,190,-.23],[205,510,199,.26],[650,555,201,-.19],[945,550,176,.2],[50,910,182,.18],[445,935,205,-.3],[845,955,205,.14]];for(const [x,y,s,a]of motifs)for(const dx of [-1024,0,1024])for(const dy of [-1024,0,1024])cat(c,x+dx,y+dy,s,a);
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.repeat.set(2,1.25);t.name='Hand-drawn repeating cat pajama print';return t;
}
export function eyeTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;const c=canvas.getContext('2d');
 const sclera=c.createLinearGradient(0,0,0,384);sclera.addColorStop(0,'#b5a8c2');sclera.addColorStop(.34,'#fdf9ff');sclera.addColorStop(1,'#fffafb');c.fillStyle=sclera;c.fillRect(0,0,512,384);
 c.save();c.translate(-14,0);c.beginPath();c.ellipse(259,205,134,126,0,0,Math.PI*2);c.clip();
 const g=c.createLinearGradient(0,40,0,380);g.addColorStop(0,'#211b45');g.addColorStop(.30,'#454079');g.addColorStop(.65,'#7561b6');g.addColorStop(1,'#b797e2');c.fillStyle=g;c.fillRect(120,0,280,384);c.lineWidth=3;
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;c.strokeStyle=i%3?'#9981d6':'#78b8ee';c.globalAlpha=.12;c.beginPath();c.moveTo(259+Math.cos(a)*61,217+Math.sin(a)*63);c.lineTo(259+Math.cos(a)*115,217+Math.sin(a)*101);c.stroke();}
 c.globalAlpha=1;c.fillStyle='#292448';c.beginPath();c.ellipse(259,196,29,52,0,0,Math.PI*2);c.fill();c.strokeStyle='#4b427e';c.lineWidth=9;c.beginPath();c.ellipse(259,205,130,122,0,0,Math.PI*2);c.stroke();
 c.fillStyle='#ffffff';c.beginPath();c.ellipse(211,130,14,21,-.2,0,Math.PI*2);c.fill();c.fillStyle='#e3faff';c.beginPath();c.ellipse(298,283,12,20,.15,0,Math.PI*2);c.fill();c.fillStyle='#b4e9ff';c.beginPath();c.ellipse(214,302,11,16,-.3,0,Math.PI*2);c.fill();c.restore();
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.name='Painted violet anime eyes';return t;
}
export function blushTexture(){
 const cv=document.createElement('canvas');cv.width=256;cv.height=128;const c=cv.getContext('2d');c.scale(1,.5);
 const g=c.createRadialGradient(128,128,3,128,128,112);g.addColorStop(0,'rgba(240,155,171,.38)');g.addColorStop(.6,'rgba(248,180,189,.16)');g.addColorStop(1,'rgba(248,180,189,0)');c.fillStyle=g;c.fillRect(0,0,256,256);
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
