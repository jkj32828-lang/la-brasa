// Dois sites, um banco: o cliente pede no site dos clientes → chega no site do dono → o dono muda o status → o cliente vê.
// O banco simulado é o mesmo nos dois "sites"; aqui a página troca de site com OWNER_SITE (como abrir o outro endereço).
const asOwnerSite=async()=>{ OWNER_SITE=true; route(); await sleep(150); };
const asClientSite=async(hash)=>{ OWNER_SITE=false; location.hash=hash; route(); await sleep(150); };
run(async()=>{
  await sleep(1200);
  location.hash='product-b3'; await sleep(120);
  qa('#pdAddons .addon-row').find(r=>r.dataset.ad==='carne')?.click(); await sleep(20);
  setv('#pdObs','bem passado'); clk('#pdAdd'); await sleep(120);
  clk('#cartBtn'); await sleep(20); clk('#checkoutBtn'); await sleep(40);
  setv('#guestName','Cliente Ligação'); setv('#guestPhone','22 97777-6666');
  clk('#editAddr'); setv('#aStreet','Rua Teste'); setv('#aNumber','5'); setv('#aNeighborhood','Centro'); clk('#saveAddr'); await sleep(20);
  clk('[data-pay="cash"]'); await sleep(20);
  clk('#placeOrder'); await sleep(200);
  const code=txt('#orderId');
  ok('H1  site do cliente: pedido confirmado', vis('#successModal') && /^#[A-Z0-9]{5}$/.test(code), code);
  clk('#closeSuccess');
  await asOwnerSite();
  const art=()=>qa('#ordersList article').find(a=>a.textContent.includes(code));
  ok('H2  site do dono: abre direto no painel, sem cardápio nem carrinho', vis('#adminPanel') && !vis('#viewHome') && !vis('#siteHeader') && document.title.includes('La Brasa'));
  ok('H3  site do dono: o pedido chegou com cliente, itens, adicional, observação e pagamento', !!art() && ['Cliente Ligação','Bacon Supreme','Carne de fraldinha 100g','bem passado','Dinheiro','Rua Teste'].every(s=>art().textContent.includes(s)), art()?.textContent.replace(/\s+/g,' ').slice(0,200));
  ok('H4  site do dono: contador de pedidos novos', txt('#statNewOrders')==='1', txt('#statNewOrders'));
  art()?.querySelector('[data-adv]')?.click(); await sleep(150);
  ok('H5  site do dono: avançar para Preparando', art()?.textContent.includes('Preparando'));
  await asClientSite('pedidos');
  ok('H6  site do cliente: Meus pedidos mostra Preparando (mudança feita no site do dono)', q('#myOrdersList .track-step.now')?.textContent.includes('Preparando') && txt('#myOrdersList').includes(code), txt('#myOrdersList').slice(0,140));
  await asOwnerSite();
  art()?.querySelector('[data-cancel]')?.click(); await sleep(30); clk('#confirmYes'); await sleep(150);
  await asClientSite('pedidos');
  ok('H7  site do cliente: cancelamento feito no site do dono aparece para o cliente', txt('#myOrdersList').includes('Pedido cancelado'), txt('#myOrdersList').slice(0,140));
});
