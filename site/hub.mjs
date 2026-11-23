import {TOOLS} from './tools.mjs';
const nav=document.querySelector('#tools'), workspace=document.querySelector('#workspace');
const frames=new Map();
for(const tool of TOOLS){
  const button=document.createElement('button'); button.id='tool-'+tool.id;
  button.type='button'; button.dataset.tool=tool.id;
  const icon=document.createElement('span'); icon.className='tool-icon'; icon.textContent=tool.short; icon.setAttribute('aria-hidden','true');
  button.append(icon,document.createTextNode(tool.name));
  button.onclick=()=>{location.hash=tool.id;}; nav.append(button);
}
function activate(){
  if(location.hash==='#workspace')return;
  const tool=TOOLS.find(t=>t.id===location.hash.slice(1))||TOOLS[0];
  for(const button of nav.children) button.setAttribute('aria-pressed',String(button.dataset.tool===tool.id));
  if(!frames.has(tool.id)){
    const frame=document.createElement('iframe');frame.src=tool.src;frame.title=tool.name;
    frame.id='frame-'+tool.id; workspace.append(frame);frames.set(tool.id,frame);
  }
  for(const [id,frame] of frames) frame.hidden=id!==tool.id;
  document.querySelector('#tool-description').textContent=tool.description;
  document.title=tool.name+' · Lawson Hub';
}
addEventListener('hashchange',activate);activate();
