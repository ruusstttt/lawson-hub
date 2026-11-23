import {TEAMS} from './catalog.mjs';
export const LAYOUTS={
  'stadium-gold':{name:'Stadium Gold',file:'stadium-fusion-flat-open-logo-zones-transparent-1920x200.png',glow:'#efc265'},
  'nfl-broadcast':{name:'NFL Broadcast',file:'nfl-broadcast-theme-transparent-1920x200.png',glow:'#b2cfff'},
  christmas:{name:'Christmas',file:'christmas-transparent-1920x200.png',glow:'#ffd678'},
  thanksgiving:{name:'Thanksgiving',file:'thanksgiving-transparent-1920x200.png',glow:'#ffaa46'},
  halloween:{name:'Halloween',file:'halloween-transparent-1920x200.png',glow:'#ff9628'},
  'legacy-compact':{name:'Legacy Compact',glow:'#efc265'}
};
const images=new Map();
export function loadImage(url){if(!images.has(url)){const promise=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(url);reject(Error('Could not load artwork: '+url));};im.src=url;});images.set(url,promise);}return images.get(url);}
function mapBounds([x,y,w,h]){return [Math.round(-57+x*2034/1920),Math.round(-12+y*224/200),Math.round(w*2034/1920),Math.round(h*224/200)];}
function fit(im,[x,y,w,h]){const scale=Math.min(w/im.width,h/im.height);return [x+(w-im.width*scale)/2,y+(h-im.height*scale)/2,im.width*scale,im.height*scale];}
function logo(ctx,im,rect,glow){const r=fit(im,rect);ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=13;ctx.drawImage(im,...r);ctx.shadowColor='#0009';ctx.shadowOffsetY=3;ctx.shadowBlur=4;ctx.drawImage(im,...r);ctx.restore();}
function text(ctx,value,rect,size){if(!value)return;const [x,y,w,h]=rect;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';const copy=value.toUpperCase();while(size>8){ctx.font=`italic ${size}px 'Archivo Black', Arial, sans-serif`;if(ctx.measureText(copy).width<=w-14&&size<=h-2)break;size-=.5;}ctx.shadowColor='#000d';ctx.shadowOffsetX=1.2;ctx.shadowOffsetY=1.7;ctx.lineJoin='round';ctx.strokeStyle='#020408';ctx.lineWidth=1.25;ctx.strokeText(copy,x+w/2,y+h/2);const grad=ctx.createLinearGradient(0,y,0,y+h);grad.addColorStop(0,'white');grad.addColorStop(1,'#bcc2cc');ctx.fillStyle=grad;ctx.fillText(copy,x+w/2,y+h/2);ctx.restore();}
function legacyBackground(ctx){
  const gradient=ctx.createLinearGradient(0,0,0,200);['#111419','#0c0f13','#050608','#000'].forEach((c,i)=>gradient.addColorStop([0,.48,.72,1][i],c));ctx.fillStyle=gradient;ctx.fillRect(0,0,1920,200);
  for(const start of [26,1770])for(let i=0;i<6;i++){ctx.save();ctx.shadowColor='white';ctx.shadowBlur=18;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(start+i*23,3+(start===26?i:5-i)*4,4,4,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.strokeStyle='#c69e57b0';ctx.lineWidth=1;for(const [x,z] of [[565,720],[1200,1355]]){ctx.beginPath();ctx.moveTo(x,23);ctx.lineTo(z,23);ctx.stroke();}
  ctx.strokeStyle='#dbab5673';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(520,92);ctx.lineTo(1400,92);ctx.stroke();ctx.fillStyle='#030406';ctx.strokeStyle='#d5ccbc';ctx.lineWidth=4;ctx.beginPath();ctx.arc(960,86,46,0,Math.PI*2);ctx.fill();ctx.stroke();text(ctx,'@',[914,48,92,68],52);
  ctx.fillStyle='#030406';ctx.strokeStyle='#b58a46';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(625,128);ctx.lineTo(1295,128);ctx.lineTo(1325,195);ctx.lineTo(595,195);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(963,137);ctx.lineTo(957,188);ctx.stroke();
  ctx.font='italic bold 12px Arial';ctx.fillStyle='#e2c69a';ctx.textAlign='center';ctx.fillText('S P R E A D',795,147);ctx.fillText('P I C K',1125,147);ctx.strokeRect(664,155,270,33);ctx.strokeRect(987,155,270,33);
}
export async function renderGame(game,layoutId){
  const layout=LAYOUTS[layoutId];if(!layout)throw Error('Unknown overlay style.');await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=200;const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
  if(layout.file)ctx.drawImage(await loadImage('../assets/layouts/'+layout.file),-57,-12,2034,224);else legacyBackground(ctx);
  if(!game)return canvas;
  const away=TEAMS.find(t=>t.id===game.away),home=TEAMS.find(t=>t.id===game.home);if(!away||!home)throw Error('Select valid teams.');
  const [a,h]=await Promise.all([loadImage(away.logo),loadImage(home.logo)]);
  if(layoutId==='legacy-compact'){logo(ctx,a,[250,34,430,104],layout.glow);logo(ctx,h,[1240,34,430,104],layout.glow);text(ctx,game.spread,[664,155,270,33],19);text(ctx,game.pick,[987,155,270,33],18);}
  else{logo(ctx,a,mapBounds([185,18,535,126]),layout.glow);logo(ctx,h,mapBounds([1200,18,535,126]),layout.glow);const broadcast=layoutId==='nfl-broadcast';text(ctx,game.spread,mapBounds(broadcast?[721,152,200,28]:[723,149,198,27]),28);text(ctx,game.pick,mapBounds(broadcast?[999,152,200,28]:[999,149,195,27]),26);}
  return canvas;
}
export function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed.')),'image/png'));}
