run(async()=>{
  await sleep(1200);
  const tag=(window.__CFG.noDb?'E':'D'), why=(window.__CFG.noDb?'(visitante sem login, sem banco)':'(banco recusa a gravação)');
  location.hash='product-'+state.products.find(p=>p.available).id; await sleep(120); clk('#pdAdd'); await sleep(120);
  clk('#cartBtn'); clk('#checkoutBtn'); await sleep(40);
  setv('#guestName','Ana'); setv('#guestPhone','11 9');
  clk('#editAddr'); setv('#aStreet','Rua A'); setv('#aNumber','1'); setv('#aCity','SP'); setv('#aState','SP'); clk('#saveAddr');
  clk('#placeOrder'); await sleep(200);
  ok(tag+'1  pedido que não grava mostra erro '+why, q('#successModal').hidden && q('#toast').classList.contains('toast-error'), 'mostra "Pedido confirmado!" sem o pedido existir');
  ok(tag+'2  carrinho fica guardado quando o pedido falha '+why, state.cart.length===1, 'carrinho foi esvaziado');
  clk('#closeSuccess'); clk('#closeCheckout');
  clk('.star-btn[data-s="5"]'); setv('#revName','P'); setv('#revText','T'); q('#reviewForm').requestSubmit(); await sleep(150);
  ok(tag+'3  avaliação que não grava mostra erro '+why, !txt('#toast').includes('Obrigado'), 'diz "Obrigado pela avaliação!"');
  setv('#msgName','C'); setv('#msgContact','c'); setv('#msgBody','b'); q('#msgForm').requestSubmit(); await sleep(150);
  ok(tag+'4  mensagem que não grava mostra erro '+why, !txt('#toast').includes('enviada'), 'diz "Mensagem enviada!"');
});
