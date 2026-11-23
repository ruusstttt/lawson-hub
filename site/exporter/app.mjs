import {TEAMS,ADS} from './catalog.mjs';
import {createScheduleLoader,maxWeek,selectionKey,roundLabel,validateGames,validateSelection} from './schedule.mjs';
import {LAYOUTS,renderGame,canvasBlob} from './renderer.mjs';
import {makeZip,downloadBlob} from './zip.mjs';
const $=id=>document.getElementById(id),team=id=>TEAMS.find(t=>t.id===id),loadSchedule=createScheduleLoader();
const storageKey='lawson-hub:exporter:v1';let games=[],loaded=null,selected=0,busy=false,renderToken=0,adIndex=8;
const now=new Date(),currentSeason=now.getMonth()<2?now.getFullYear()-1:now.getFullYear();
function option(value,text){const o=document.createElement('option');o.value=value;o.textContent=text;return o;}
for(let year=now.getFullYear()+1;year>=2010;year--)$('season').append(option(year,year));$('season').value=currentSeason;
for(const t of [...TEAMS].sort((a,b)=>a.name.localeCompare(b.name))){$('away').append(option(t.id,t.name));$('home').append(option(t.id,t.name));}$('away').value='SF';$('home').value='KC';
function selection(){return {season:+$('season').value,phase:$('phase').value,week:+$('week').value};}
function populateWeeks(value=+$('week').value||1){const max=maxWeek(+$('season').value,$('phase').value);$('week').replaceChildren(...Array.from({length:max},(_,i)=>option(i+1,max===1?'—':i+1)));$('week').value=Math.min(value,max);$('week').disabled=busy||max===1;}
populateWeeks();
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function isCurrent(){return loaded&&selectionKey(loaded)===selectionKey(selection());}
function sync(){const unavailable=busy||!games.length||!isCurrent();$('download').disabled=unavailable;$('download-all').disabled=unavailable;$('save-project').disabled=busy||!games.length;$('week').disabled=busy||maxWeek(+$('season').value,$('phase').value)===1;}
function setBusy(value){busy=value;for(const el of $('games-panel').querySelectorAll('button,input,select'))el.disabled=value;sync();}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,selection:loaded,games,selected,layout:$('layout').value}));}catch{status('This browser could not save your draft. Use Save round JSON to keep it.');}}
function selectionChanged(){populateWeeks();sync();if(loaded&&!isCurrent())status('Round changed. Load this schedule or add a manual matchup before exporting. The previous draft is still shown.');else status(games.length?'Your round is ready. Edit the spreads and picks below.':'Choose a round to get started.');}
$('season').onchange=selectionChanged;$('phase').onchange=selectionChanged;$('week').onchange=()=>{sync();if(!isCurrent())status('Round changed. Load the selected schedule before exporting.');else status('Your round is ready.');};
function redrawTable(){
  $('game-rows').replaceChildren();$('empty').hidden=games.length>0;$('game-table').hidden=!games.length;
  $('round-title').textContent=loaded?roundLabel(loaded)+' · '+games.length+' games':'No round loaded';
  games.forEach((g,i)=>{
    const tr=document.createElement('tr');tr.classList.toggle('selected',i===selected);
    const selectCell=document.createElement('td'),choose=document.createElement('button');choose.type='button';choose.className='row-select';choose.textContent=i+1;choose.setAttribute('aria-label','Preview '+team(g.away).short+' at '+team(g.home).short);choose.setAttribute('aria-pressed',String(i===selected));choose.onclick=()=>{selected=i;redrawTable();updatePreview();persist();};selectCell.append(choose);tr.append(selectCell);
    const match=document.createElement('td'),names=document.createElement('div');names.className='matchup';
    for(const id of [g.away,g.home]){const im=document.createElement('img');im.className='team-logo';im.src=team(id).logo;im.alt='';names.append(im,document.createTextNode(id));if(id===g.away)names.append(document.createTextNode(' @ '));}
    const time=document.createElement('small');time.textContent=g.date?(g.date.includes('T')?new Date(g.date).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})+' · local time':g.date):'Manual matchup';match.append(names,time);tr.append(match);
    for(const field of ['spread','pick']){const cell=document.createElement('td'),input=document.createElement('input');input.type='text';input.value=g[field];input.maxLength=80;input.placeholder=field==='spread'?'e.g. KC -3.5':'e.g. KC';input.setAttribute('aria-label',`${team(g.away).short} at ${team(g.home).short} ${field}`);input.oninput=()=>{g[field]=input.value;persist();if(i===selected)updatePreview();};cell.append(input);tr.append(cell);}
    const removeCell=document.createElement('td'),remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='×';remove.setAttribute('aria-label','Remove '+team(g.away).short+' at '+team(g.home).short);remove.onclick=()=>{games.splice(i,1);selected=Math.max(0,Math.min(selected,games.length-1));redrawTable();updatePreview();persist();sync();};removeCell.append(remove);tr.append(removeCell);$('game-rows').append(tr);
  });sync();
}
async function updatePreview(){
  const token=++renderToken,game=games[selected]?{...games[selected]}:null,layout=$('layout').value;
  $('layout-name').textContent=LAYOUTS[layout].name;$('matchup-name').textContent=game?`${team(game.away).short} @ ${team(game.home).short}`:'Your next matchup';
  $('preview-note').textContent=game?'PNG export · 1920 × 200 · full resolution':'Select a game to preview your overlay.';
  try{const canvas=await renderGame(game,layout);if(token!==renderToken)return;const ctx=$('preview').getContext('2d');ctx.clearRect(0,0,1920,200);ctx.drawImage(canvas,0,0);}catch(e){if(token===renderToken)status(e.message,true);}
}
$('layout').onchange=()=>{persist();updatePreview();};
$('load').onclick=async()=>{
  const chosen=selection();setBusy(true);status('Loading and checking the selected round…');
  try{const result=await loadSchedule(chosen);const old=new Map(isCurrent()?games.map(g=>[g.away+'|'+g.home,g]):[]);games=result.games.map(g=>({...g,spread:old.get(g.away+'|'+g.home)?.spread||'',pick:old.get(g.away+'|'+g.home)?.pick||''}));loaded=chosen;selected=0;redrawTable();await updatePreview();persist();status(`${games.length} games loaded · ${result.source}. Kickoff times use your local time zone.`);}catch(e){status(e.message,true);}finally{setBusy(false);}
};
$('add-game').onclick=()=>{
  try{const s=selection(),list=isCurrent()?games:[];const next=validateGames([...list,{away:$('away').value,home:$('home').value,date:'',spread:'',pick:''}],s,{complete:false});games=next;loaded=s;selected=games.length-1;redrawTable();updatePreview();persist();status('Manual matchup added. Add your spread and pick below.');}catch(e){status(e.message,true);}
};
function safeName(text){return text.replace(/[^a-zA-Z0-9._ -]/g,'-');}
async function exportGames(all){
  if(busy||!games.length||!isCurrent())return;const snapshot=structuredClone(all?games:[games[selected]]),layout=$('layout').value,round={...loaded};setBusy(true);
  try{const files=[];for(let i=0;i<snapshot.length;i++){status(`Rendering ${i+1} of ${snapshot.length}…`);const g=snapshot[i];files.push({name:`Game ${all?i+1:selected+1} - ${g.away} at ${g.home}.png`,blob:await canvasBlob(await renderGame(g,layout))});}
    if(all)downloadBlob(await makeZip(files),safeName('NFL '+roundLabel(round)+' - '+LAYOUTS[layout].name)+'.zip');else downloadBlob(files[0].blob,files[0].name);status(all?`${files.length} PNGs packaged. Your ZIP download is ready.`:'Your PNG download is ready.');
  }catch(e){status('Export failed: '+e.message,true);}finally{setBusy(false);}
}
$('download').onclick=()=>exportGames(false);$('download-all').onclick=()=>exportGames(true);
$('save-project').onclick=()=>{if(!loaded||!games.length)return;downloadBlob(new Blob([JSON.stringify({version:1,selection:loaded,layout:$('layout').value,games},null,2)],{type:'application/json'}),safeName('Lawson '+roundLabel(loaded))+'.json');};
$('import-project').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>1024*1024)throw Error('This file is too large for a round.');const data=JSON.parse(await file.text());if(data.version!==1||!LAYOUTS[data.layout])throw Error('Unsupported round file.');const s=validateSelection(data.selection),next=validateGames(data.games,s,{complete:false});loaded=s;games=next;selected=0;$('season').value=s.season;$('phase').value=s.phase;populateWeeks(s.week);$('layout').value=data.layout;redrawTable();await updatePreview();persist();status('Saved round restored.');}catch(err){status('Could not import this round: '+err.message,true);}finally{e.target.value='';}
};
function showMode(ads){$('games-panel').hidden=ads;$('ads-panel').hidden=!ads;$('games-tab').setAttribute('aria-pressed',String(!ads));$('ads-tab').setAttribute('aria-pressed',String(ads));}
$('games-tab').onclick=()=>showMode(false);$('ads-tab').onclick=()=>showMode(true);
function selectAd(i){adIndex=i;const ad=ADS[i];$('ad-name').textContent=ad.name;$('ad-size').textContent=`${ad.width} × ${ad.height} PNG`;$('ad-preview-image').src=ad.url;$('ad-preview-image').alt=ad.name;$('ad-download').href=ad.url;$('ad-download').download=ad.file;[...$('ad-grid').children].forEach((button,index)=>button.setAttribute('aria-pressed',String(index===i)));}
ADS.forEach((ad,i)=>{const button=document.createElement('button');button.type='button';button.className='ad-tile';const im=document.createElement('img');im.src=ad.url;im.alt='';im.loading='lazy';const title=document.createElement('span');title.textContent=ad.name;const size=document.createElement('small');size.textContent=`${ad.width} × ${ad.height}`;button.append(im,title,size);button.onclick=()=>selectAd(i);$('ad-grid').append(button);});selectAd(adIndex);
$('download-ads').onclick=async()=>{
  $('download-ads').disabled=true;$('ad-status').textContent='Packing the original campaign artwork…';
  try{const files=[];for(const ad of ADS){const response=await fetch(ad.url);if(!response.ok)throw Error('Could not load '+ad.name);files.push({name:ad.file,blob:await response.blob()});}downloadBlob(await makeZip(files),'Lawson-Advertising-Overlays.zip');$('ad-status').textContent='All 10 original PNGs are ready in one ZIP.';}catch(e){$('ad-status').textContent=e.message;}finally{$('download-ads').disabled=false;}
};
try{
  const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
  if(saved?.version===1&&saved.selection&&saved.games?.length){loaded=validateSelection(saved.selection);games=validateGames(saved.games,loaded,{complete:false});selected=Math.max(0,Math.min(saved.selected||0,games.length-1));$('season').value=loaded.season;$('phase').value=loaded.phase;populateWeeks(loaded.week);if(LAYOUTS[saved.layout])$('layout').value=saved.layout;status('Your last round was restored on this browser.');}
}catch{loaded=null;games=[];status('Could not restore the saved draft. Load a schedule or import your round JSON.');}
redrawTable();updatePreview();
