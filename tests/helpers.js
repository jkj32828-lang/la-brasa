const R=[]; const ok=(n,c,d='')=>R.push((c?'OK    ':'FALHA ')+n+(c?'':'  >> '+d));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const txt=s=>(q(s)?.textContent||'').replace(/\s+/g,' ').trim();
const vis=s=>{const e=q(s);return !!e&&!e.closest('[hidden]');};
const setv=(s,v)=>{const e=q(s);if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
const clk=s=>{const e=q(s);if(e)e.click();return !!e;};
const S=window.__store; const keys=p=>[...S.keys()].filter(k=>k.startsWith(p));
const esc=()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
const finish=()=>document.body.insertAdjacentHTML('beforeend','<pre id="testout">'+R.join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre>');
async function run(fn){ try{ await fn(); }catch(e){ R.push('ERRO  teste parou: '+(e&&e.message||e)); } finish(); }
