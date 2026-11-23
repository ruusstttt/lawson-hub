// Keep a real download link available when a browser blocks automatic downloads.
let previousUrl;
export function downloadBlob(blob,name){
  if(previousUrl)URL.revokeObjectURL(previousUrl);
  previousUrl=URL.createObjectURL(blob);
  let panel=document.getElementById('download-ready');
  if(!panel){
    panel=document.createElement('div');panel.id='download-ready';panel.setAttribute('role','status');
    Object.assign(panel.style,{position:'fixed',bottom:'18px',right:'18px',zIndex:'1000',maxWidth:'calc(100vw - 36px)',padding:'14px 18px',border:'1px solid #6e4845',borderRadius:'10px',background:'#261e22',color:'#fff',boxShadow:'0 8px 28px #0008',font:'14px Arial,sans-serif'});
    document.body.append(panel);
  }
  const a=document.createElement('a');a.href=previousUrl;a.download=name;a.textContent='Download ready · '+name;
  Object.assign(a.style,{color:'#ffd2c9',overflowWrap:'anywhere',lineHeight:'1.5'});
  const close=document.createElement('button');close.textContent='×';close.type='button';close.setAttribute('aria-label','Dismiss download');close.style.marginLeft='14px';close.onclick=()=>{panel.remove();URL.revokeObjectURL(previousUrl);previousUrl=null;};
  panel.replaceChildren(a,close);a.click();
}
