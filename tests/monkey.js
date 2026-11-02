// "Pessoas fuçando": cada pessoa faz ações aleatórias (cliques, digitação maluca, links, Esc, envios, cliques repetidos)
// e depois de CADA ação o site é conferido. Qualquer problema vira uma linha QUEBROU com as últimas ações.
// Configuração vem de window.__MONKEY = {first, count, seed0, owner}
const M=window.__MONKEY;
const errors=[];
window.addEventListener('error', e=>errors.push('erro JS: '+(e.message||e.error)));
window.addEventListener('unhandledrejection', e=>errors.push('promessa sem tratamento: '+(e.reason?.message||e.reason?.code||e.reason)));
const _ce=console.error; console.error=(...a)=>{ errors.push('console.error: '+a.map(String).join(' ').slice(0,200)); _ce.apply(console,a); };
// Links para fora do site não navegam (a pessoa "abre outra aba")
document.addEventListener('click', e=>{ const a=e.target.closest('a[href]'); if(a && /^https?:/.test(a.getAttribute('href'))) e.preventDefault(); }, true);

function rng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const EVIL=['<img src=x onerror="window.__xss=1">','"><svg onload=window.__xss=1>',"'; DROP TABLE pedidos;--",'🍔🔥😋'.repeat(6),'   ','a'.repeat(300),'Ç'.repeat(150),
  '123456789012345678901234567890123456789','-5','0','99999','1e9','\n\n\n','José da Silva','(22) 99999-0000','28610190','00000000','2861','RJ','rj','X','  Rua Dois  ',
  '%00','{{7*7}}','${7*7}','\\','sem cebola, bem passado','Rua Augusto Spinelli','92','Centro','Nova Friburgo','ab'.repeat(70)];
const CHECKED=new Set();
const MAIN=['#viewHome','#viewProduct','#viewAdmin','#viewApp','#viewOrders'];
const PAIRS=[['#cartOverlay','#cartDrawer'],['#checkoutOverlay','#checkoutModal'],['#successOverlay','#successModal'],['#prodOverlay','#prodModal'],['#confirmOverlay','#confirmModal'],['#appSheetOverlay','#appSheet']];
const isVis=el=>!!el && !el.closest('[hidden]') && el.getClientRects().length>0 && getComputedStyle(el).visibility!=='hidden';

function problems(){
  const p=[];
  if(errors.length) p.push(...errors.splice(0));
  if(window.__xss) p.push('XSS: texto digitado virou código');
  if((window.__rejects||[]).length) p.push(...window.__rejects.splice(0).map(r=>'banco real recusaria: '+r));
  const shown=document.body.innerText;
  const bad=shown.match(/.{0,30}(\bNaN\b|undefined|\[object Object\]|Infinity).{0,30}/);
  if(bad) p.push('texto quebrado na tela: "'+bad[0].replace(/\s+/g,' ')+'"');
  const views=MAIN.filter(s=>isVis(q(s)));
  if(views.length!==1) p.push('telas principais visíveis: '+(views.join(',')||'nenhuma'));
  for(const [ov,md] of PAIRS) if(!q(ov).hidden && q(md).hidden) p.push('fundo escuro '+ov+' aberto sem a janela '+md+' (tela travada)');
  if(q('#appSheet').hidden && document.body.style.overflow==='hidden') p.push('rolagem da página ficou travada');
  if(!q('#checkoutModal').hidden && !q('#successModal').hidden) p.push('pagamento e confirmação abertos juntos');
  for(const l of state.cart){
    if(!Number.isInteger(l.qty)||l.qty<1||l.qty>20) p.push('quantidade inválida no carrinho: '+l.qty);
    if(!(l.unit>0&&isFinite(l.unit))) p.push('preço inválido no carrinho: '+l.unit);
  }
  const t=totals(), c=n=>Math.round(n*100);
  if(c(t.total)!==Math.max(0,c(t.subtotal)-c(t.discount)+c(t.delivery))) p.push('total não fecha: '+JSON.stringify(t));
  const qty=state.cart.reduce((s,l)=>s+l.qty,0);
  if(qty>0 && txt('#cartBadge')!==String(qty)) p.push('contador do carrinho '+txt('#cartBadge')+' ≠ '+qty);
  for(const [k,o] of S.entries()){
    if(!k.startsWith('orders/')||CHECKED.has(k)) continue; CHECKED.add(k);
    if(o.createdAt<M.started) continue;
    const sub=o.items.reduce((s,i)=>s+i.unit*i.qty,0);
    if(c(sub)!==c(o.subtotal)) p.push('pedido '+o.code+': subtotal '+o.subtotal+' ≠ itens '+sub.toFixed(2));
    if(c(o.total)!==Math.max(0,c(o.subtotal)-c(o.discount)+c(o.delivery))) p.push('pedido '+o.code+': total não fecha');
  }
  const codes=[...S.entries()].filter(([k])=>k.startsWith('orders/')).map(([,o])=>o.code);
  const dup=codes.find((x,i)=>codes.indexOf(x)!==i); if(dup && !M.dupSeen?.has(dup)){ (M.dupSeen||=new Set()).add(dup); p.push('dois pedidos com o mesmo código '+dup); }
  return p;
}

async function person(n, R){
  const pick=a=>a[Math.floor(R()*a.length)];
  const log=[];
  const clickables=()=>qa('button, a[href], label.addon-row, input[type=checkbox], [data-open], [data-acat], [data-tab], [data-go], .cat-btn, .star-btn').filter(el=>isVis(el)&&!el.disabled);
  const fields=()=>qa('input:not([type=checkbox]):not([type=file]):not([type=hidden]), textarea').filter(isVis);
  const ids=state.products.map(p=>p.id);
  const actions=[
    [30,()=>{ const el=pick(clickables()); if(!el) return 'nada para clicar'; el.click(); return 'clicou '+(el.id?'#'+el.id:el.tagName.toLowerCase())+' "'+(el.textContent||'').trim().slice(0,25)+'"'; }],
    [14,()=>{ const el=pick(fields()); if(!el) return 'sem campo'; const v=pick(EVIL); el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); return 'digitou em #'+el.id+': '+JSON.stringify(v).slice(0,30); }],
    [8,()=>{ const h=pick(['','#product-'+pick(ids),'#product-'+pick(ids),'#product-naoexiste','#product-','#pedidos','#admin','#app','#lixo%20<b>','#product-<img src=x onerror=window.__xss=1>']); location.hash=h; return 'foi para '+(h||'início'); }],
    [6,()=>{ esc(); return 'apertou Esc'; }],
    [6,()=>{ const f=pick(qa('form').filter(isVis)); if(!f) return 'sem formulário'; f.requestSubmit(); return 'enviou #'+f.id; }],
    [5,()=>{ const el=pick(['#placeOrder','#pdAdd','#asAdd','#pdInc','#asInc','#checkoutBtn','#appCheckout','#trackOrder','#saveAddr','#searchCep'].map(s=>q(s)).filter(isVis)); if(!el) return 'sem botão'; for(let i=0;i<6;i++) el.click(); return 'clicou 6x em #'+el.id; }],
    [8,async()=>{ // pedido inteiro, com dados ora bons ora malucos
      location.hash='product-'+pick(ids); await sleep(60);
      if(q('#viewApp').hidden){ qa('#pdAddons .addon-row').filter(()=>R()<.3).forEach(r=>r.click()); for(let i=Math.floor(R()*3);i>0;i--) clk('#pdInc'); clk('#pdAdd'); }
      else { location.hash=''; await sleep(40); clk('#appMenu [data-open="'+pick(ids)+'"]'); await sleep(40); qa('#asAddons input').filter(()=>R()<.3).forEach(i=>i.click()); clk('#asAdd'); }
      await sleep(60);
      if(!q('#viewApp').hidden) clk('#appCheckout'); else { clk('#cartBtn'); clk('#checkoutBtn'); }
      await sleep(60);
      const good=R()<.6;
      setv('#guestName', good?'Pessoa '+n:pick(EVIL)); setv('#guestPhone', good?'(22) 9'+Math.floor(R()*1e8):pick(EVIL));
      if(R()<.8){ clk('#editAddr'); if(q('#addrForm').hidden) clk('#editAddr');
        setv('#aCep', R()<.5?'28610190':pick(EVIL)); if(R()<.5){ clk('#searchCep'); await sleep(60); }
        setv('#aStreet', good?'Rua Augusto Spinelli':pick(EVIL)); setv('#aNumber', good?String(1+Math.floor(R()*500)):pick(EVIL));
        if(!good){ setv('#aCity',pick(EVIL)); setv('#aState',pick(EVIL).slice(0,2)); setv('#aComplement',pick(EVIL)); }
        clk('#saveAddr'); }
      clk(pick(['[data-pay="pix"]','[data-pay="card"]','[data-pay="cash"]']));
      clk('#placeOrder'); if(R()<.4) clk('#placeOrder');
      await sleep(150);
      return 'fez um pedido '+(good?'com dados bons':'com dados malucos');
    }],
    [5,()=>{ location.hash = q('#viewApp').hidden ? '' : ''; const forms=['#reviewForm','#msgForm','#appRevForm'].map(s=>q(s)).filter(isVis); const f=pick(forms); if(!f) return 'sem formulário de avaliação/mensagem';
      f.querySelectorAll('input,textarea').forEach(i=>{ i.value=R()<.5?'Texto bom':pick(EVIL); i.dispatchEvent(new Event('input',{bubbles:true})); }); f.requestSubmit(); return 'enviou '+f.id+' com textos aleatórios'; }],
  ];
  const total=actions.reduce((s,a)=>s+a[0],0);
  const steps=60+Math.floor(R()*60);
  for(let i=0;i<steps;i++){
    let r=R()*total, act=actions[0][1], ai=0; for(const [k,[w,f]] of actions.entries()){ if((r-=w)<0){ act=f; ai=k; break; } }
    trace(n, i, '(começando ação tipo '+ai+') depois de: '+(log[log.length-1]||''));
    let what; try{ what=await act(); }catch(e){ what='ação de teste falhou: '+e.message; }
    log.push(what); trace(n, i, what);
    await sleep(Math.floor(R()*90));
    const p=problems();
    if(p.length) return {n, ok:false, steps:i+1, p, log:log.slice(-6)};
  }
  return {n, ok:true, steps};
}

async function ownerPerson(n, R){
  const pick=a=>a[Math.floor(R()*a.length)];
  const log=[];
  for(let i=0, steps=60+Math.floor(R()*60); i<steps; i++){
    let what;
    try{
      const roll=R();
      if(roll<.15){ // cliente pedindo no outro site enquanto o dono mexe
        const id=secureId(), p=pick(state.products);
        await db.doc('orders/'+id).set({id, code:'#'+Math.floor(1000+R()*9000), createdAt:Date.now(), status:'new', customer:{name:'Cliente '+n,phone:'22 9'}, address:{cep:'',street:'Rua A',number:'1',complement:'',neighborhood:'Centro',city:'Nova Friburgo',state:'RJ'}, payment:'pix', items:[{pid:p.id,name:p.name,qty:1,unit:p.price,addons:[],obs:''}], subtotal:p.price, delivery:8.99, discount:0, total:p.price+8.99}).catch(()=>{});
        what='chegou pedido novo';
      } else if(roll<.55){ const el=pick(qa('#viewAdmin button, #prodModal button, #confirmModal button, #viewAdmin a[href], #prodModal input[type=checkbox]').filter(el=>isVis(el)&&!el.disabled)); if(el){ el.click(); what='clicou '+(el.id||el.dataset.at||el.dataset.adv||el.dataset.of||el.textContent.trim().slice(0,20)); } }
      else if(roll<.75){ const el=pick(qa('#prodModal input:not([type=checkbox]):not([type=file]):not([type=hidden]), #prodModal textarea').filter(isVis)); if(el){ const v=pick(EVIL); el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); what='digitou em #'+el.id+': '+JSON.stringify(v).slice(0,25); } }
      else if(roll<.85){ if(isVis(q('#prodForm'))){ q('#prodForm').requestSubmit(); what='salvou produto'; } }
      else if(roll<.92){ esc(); what='Esc'; }
      else { location.hash=pick(['','#admin','#pedidos','#product-x','#app']); what='mudou o endereço'; }
    }catch(e){ what='ação de teste falhou: '+e.message; }
    log.push(what||'nada');
    await sleep(Math.floor(R()*90));
    const p=problems().filter(x=>!x.startsWith('dois pedidos')); // códigos repetidos aqui vêm do próprio teste
    if(p.length) return {n, ok:false, steps:i+1, p, log:log.slice(-6)};
  }
  return {n, ok:true, steps:'ok'};
}

/* Se o navegador for cortado no meio (pessoa travada), a última ação fica na página para o relatório */
function trace(n,i,what){ let el=document.getElementById('monkeytrace'); if(!el){ el=document.createElement('pre'); el.id='monkeytrace'; el.hidden=true; document.body.appendChild(el); } el.textContent='TRAVOU pessoa '+n+' na ação '+(i+1)+' (relógio da página: '+Math.round((Date.now()-M.started)/1000)+'s): '+what; }
function softReset(){
  try{ localStorage.clear(); }catch(e){}
  ['#closeCart','#closeCheckout','#closeSuccess','#asClose','#closeProd','#confirmNo'].forEach(s=>{ if(isVis(q(s))) q(s).click(); });
  state.cart=[]; state.address=null; state.search=''; state.activeCat='Todos'; state.myOrders={};
  location.hash=''; renderCart(); renderMyOrders();
}

run(async()=>{
  await sleep(1500);
  M.started=Date.now();
  for(let k=0;k<M.count;k++){
    const n=M.first+k; softReset(); await sleep(80); problems();
    const res = await (M.owner?ownerPerson:person)(n, rng(M.seed0+n*7919));
    if(res.ok) R.push('OK    pessoa '+n+' ('+res.steps+' ações)');
    else R.push('FALHA pessoa '+n+' quebrou na ação '+res.steps+': '+res.p.join(' | ')+'  >> últimas: '+res.log.join(' → '));
  }
});
