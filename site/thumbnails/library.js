/* Offline assets use data URLs loaded by local scripts: file:// canvas export stays readable.
   Only four decoded library photos are retained. All original PNGs remain in cutouts/. */
window.MONEY_PICK_PHOTOS = Object.create(null);
const photoCache = new Map(), photoPending = new Map();
const slotRequests = {john:0, ca:0, bg:0};
let pendingAssets = 0, photoReady = false, fontsReady = false, exporting = false;

function syncExportButtons(){
  const needsLogo = ['logo','vs'].includes($('cMode').value);
  const disabled = exporting || pendingAssets > 0 || !fontsReady || !photoReady || (needsLogo && !Object.keys(LOGOS).length);
  $('dl').disabled = $('dl2x').disabled = disabled;
}
function libraryStatus(text, error=false){
  $('assetStatus').textContent=text;
  $('assetStatus').classList.toggle('error',error);
}
async function assetTask(work){
  pendingAssets++; syncExportButtons();
  try { return await work(); }
  finally { pendingAssets--; syncExportButtons(); }
}
function loadScript(src){
  return new Promise((resolve,reject)=>{
    const el=document.createElement('script');
    const timer=setTimeout(()=>finish(new Error('Asset loading timed out.')),20000);
    function finish(error){clearTimeout(timer);el.remove();error?reject(error):resolve();}
    el.onload=()=>finish();el.onerror=()=>finish(new Error('Could not load '+src));
    el.src=src;document.head.appendChild(el);
  });
}
function decodeImage(src){
  return new Promise((resolve,reject)=>{
    const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('This image could not be opened.'));im.src=src;
  });
}
async function getPhoto(item){
  if(photoCache.has(item.id)){
    const im=photoCache.get(item.id);photoCache.delete(item.id);photoCache.set(item.id,im);return im;
  }
  if(photoPending.has(item.id)) return photoPending.get(item.id);
  const task=(async()=>{
    await loadScript(item.script);
    const src=window.MONEY_PICK_PHOTOS[item.id];delete window.MONEY_PICK_PHOTOS[item.id];
    if(!src) throw new Error('Photo bundle is missing.');
    const im=await decodeImage(src);photoCache.set(item.id,im);
    while(photoCache.size>4) photoCache.delete(photoCache.keys().next().value);
    return im;
  })();
  photoPending.set(item.id,task);
  try{return await task;}finally{photoPending.delete(item.id);}
}
async function selectPhoto(){
  const item=(window.MONEY_PICK_CATALOG||[]).find(p=>p.id===$('johnPhoto').value);
  if(!item) return;
  const request=++slotRequests.john;
  await assetTask(async()=>{
    libraryStatus('Loading John’s photo…');
    try{
      const im=await getPhoto(item);
      if(request!==slotRequests.john) return;
      IMG.john=im;photoReady=true;$('fJohn').value='';
      libraryStatus('Photo ready · '+item.label);scheduleDraw();
    }catch(error){
      if(request!==slotRequests.john) return;
      photoReady=false;
      libraryStatus('Photo unavailable. Select another photo or upload a PNG. Keep the assets folder next to this HTML file.',true);
    }
  });
}
function bindUpload(id,slot){
  $(id).addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    const request=++slotRequests[slot];
    await assetTask(async()=>{
      const src=URL.createObjectURL(file);
      try{
        const im=await decodeImage(src);
        if(request!==slotRequests[slot])return;
        IMG[slot]=im;
        if(slot==='john'){$('johnPhoto').value='';photoReady=true;}
        libraryStatus('Image ready · '+file.name);scheduleDraw();
      }catch(error){libraryStatus('Could not open '+file.name+'. Choose a valid image.',true);}
      finally{URL.revokeObjectURL(src);}
    });
  });
}
async function loadBundledLogos(){
  await assetTask(async()=>{
    try{
      await loadScript('assets/logos.js');
      const entries=Object.entries(window.MONEY_PICK_LOGOS||{});delete window.MONEY_PICK_LOGOS;
      const results=await Promise.allSettled(entries.map(async([name,src])=>{
        LOGOS[tidyName(name)]=await decodeImage(src);
      }));
      refreshLogoLists();
      matchLogoToTeam();
      if(results.some(r=>r.status==='rejected')) $('logoCount').textContent+=' Some logos could not load; add them below.';
    }catch(error){$('logoCount').textContent='Bundled logos unavailable. Keep assets/ beside the HTML file, or add logo files below.';}
  });
}
$('fLogos').addEventListener('change',async e=>{
  const files=[...e.target.files];if(!files.length)return;
  await assetTask(async()=>{
    const results=await Promise.allSettled(files.map(async file=>{
      const src=URL.createObjectURL(file);
      try{LOGOS[tidyName(file.name)]=await decodeImage(src);}finally{URL.revokeObjectURL(src);}
    }));
    refreshLogoLists();
    const failed=results.filter(r=>r.status==='rejected').length;
    if(failed)$('logoCount').textContent+=` ${failed} file(s) could not be opened.`;
    e.target.value='';
  });
});
const catalog=window.MONEY_PICK_CATALOG||[];
catalog.forEach(item=>{
  const option=document.createElement('option');option.value=item.id;option.textContent=item.label;
  option.dataset.photo='';$('johnPhoto').appendChild(option);
});
$('photoCount').textContent=`${catalog.length} photos available · loads only the photo you choose.`;
$('johnPhoto').addEventListener('change',selectPhoto);
$('cMode').addEventListener('change',syncExportButtons);
bindUpload('fJohn','john');bindUpload('fCa','ca');bindUpload('fBg','bg');
Promise.resolve(document.fonts?document.fonts.ready:null).then(()=>{fontsReady=true;syncExportButtons();scheduleDraw();});
const bundledLogosReady = loadBundledLogos();
let editorPhotoInitialized = false;
function initializeEditorPhoto(){
  if(editorPhotoInitialized) return;
  editorPhotoInitialized = true;
  if(catalog.length){
    $('johnPhoto').value=(catalog.find(p=>p.id==='55-handsup-shocked-gucci-white')||catalog[0]).id;
    selectPhoto();
  }else{libraryStatus('Photo catalog unavailable. Upload a photo below or restore the assets folder.',true);}
}
syncExportButtons();
