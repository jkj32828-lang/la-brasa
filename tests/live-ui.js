// Cliente sem login fazendo um pedido pela tela, com o Firebase REAL (sem simulação).
// Enquanto isso, live-ui.sh faz o papel do dono: acha o pedido no banco e muda o status para "preparing".
// Espera em tempo REAL: o relógio do Edge sem janela corre mais rápido, mas para enquanto uma requisição está pendente
const realSleep=ms=>fetch('/hold?ms='+ms).catch(()=>{});
run(async()=>{
  let t=0; while(!db && t<60){ await sleep(250); t++; }
  ok('L1  site conecta ao Firebase real', !!db, 'firebase.js não carregou');
  t=0; while(state.dbProductCount===undefined && t<30){ await realSleep(500); t++; }
  ok('L2  cardápio vem do banco real (todos os produtos)', state.dbProductCount===SEED_PRODUCTS.length && qa('#menuGrid h3').length===SEED_PRODUCTS.length, 'banco='+state.dbProductCount+' tela='+qa('#menuGrid h3').length);
  location.hash='product-burger-baconese'; await sleep(300);
  qa('#pdAddons .addon-row').find(r=>r.dataset.ad==='bacon')?.click(); await sleep(50);
  clk('#pdAdd'); await sleep(300);
  clk('#cartBtn'); await sleep(50); clk('#checkoutBtn'); await sleep(100);
  setv('#guestName','Teste Tela '+window.__RUN); setv('#guestPhone','22 90000-0000');
  clk('#editAddr'); setv('#aCep','28610190'); clk('#searchCep');
  t=0; while(txt('#cepHint').includes('Buscando') && t<60){ await sleep(250); t++; }
  ok('L3  CEP real no ViaCEP preenche a rua', q('#aStreet').value==='Rua Augusto Spinelli' && q('#aCity').value==='Nova Friburgo', txt('#cepHint')+' | '+q('#aStreet').value);
  if(!q('#aStreet').value) setv('#aStreet','Rua Augusto Spinelli');
  setv('#aNumber','92'); clk('#saveAddr'); await sleep(50);
  clk('#placeOrder');
  t=0; while(q('#successModal').hidden && t<400 && !(q('#toast').classList.contains('toast-error')&&!q('#toast').hidden)){ await sleep(250); t++; }
  ok('L4  pedido pela tela é aceito e confirma', vis('#successModal') && state.cart.length===0, 'aviso: '+txt('#toast'));
  const ref=myOrderRefs()[0]; if(ref) R.push('ID orders/'+ref.id);
  clk('#trackOrder'); await sleep(200);
  t=0; while(state.myOrders[ref?.id]?.total===undefined && t<120){ await sleep(250); t++; }
  ok('L5  Meus pedidos lê o pedido do banco real', vis('#viewOrders') && state.myOrders[ref?.id]?.status && txt('#myOrdersList').includes(ref.code), JSON.stringify(state.myOrders[ref?.id]||{}).slice(0,120));
  // O dono (live-ui.sh, com acesso de administrador) muda o status: o cliente tem que ver sozinho
  t=0; while(state.myOrders[ref?.id]?.status!=='preparing' && t<90){ await realSleep(1000); t++; }
  await sleep(100);
  ok('L6  status mudado pelo dono chega sozinho no cliente (Preparando)', q('#myOrdersList .track-step.now')?.textContent.includes('Preparando') && txt('#toast').includes('Preparando'), 'status='+state.myOrders[ref?.id]?.status);
  location.hash=''; await sleep(300);
  clk('.star-btn[data-s="5"]'); setv('#revName','Teste Tela'); setv('#revText','Avaliação de teste '+window.__RUN);
  q('#reviewForm').requestSubmit();
  t=0; while(!txt('#reviewList').includes(window.__RUN) && t<400){ await sleep(250); t++; }
  ok('L7  avaliação pela tela grava e aparece na lista', txt('#reviewList').includes(window.__RUN), txt('#toast'));
  const rv=state.reviews.find(r=>(r.text||'').includes(window.__RUN)); if(rv) R.push('ID reviews/'+rv.id);
  location.hash='admin'; await sleep(400);
  ok('L8  site do cliente: #admin não abre o painel (o painel é o outro site)', vis('#viewHome') && !vis('#viewAdmin'));
});
