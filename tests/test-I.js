// Painel do dono quando o banco recusa a gravação: tem que avisar, não ficar parado em silêncio
run(async()=>{
  await sleep(1200);
  location.hash='admin'; await sleep(200);
  clk('#ordersList [data-adv="o1"]'); await sleep(150);
  ok('I1  dono: status que não grava mostra erro', q('#toast').classList.contains('toast-error') && !q('#toast').hidden && S.get('orders/o1').status==='new', txt('#toast'));
  ok('I2  dono: botão volta a funcionar depois do erro', q('#ordersList [data-adv="o1"]')?.disabled===false);
  clk('.admin-tab[data-at="products"]'); await sleep(30);
  clk('#productsList [data-edit="b1"]'); await sleep(20); setv('#pfPrice','99'); q('#prodForm').requestSubmit(); await sleep(150);
  ok('I3  dono: produto que não grava mostra erro e não fecha o formulário', q('#toast').classList.contains('toast-error') && vis('#prodModal') && S.get('products/b1').price===30, txt('#toast'));
  clk('#closeProd');
  clk('#productsList [data-edit="b1"]'); await sleep(20); clk('#deleteProd'); await sleep(30); clk('#confirmYes'); await sleep(150);
  ok('I4  dono: exclusão que não grava mostra erro', q('#toast').classList.contains('toast-error') && S.has('products/b1'), txt('#toast'));
});
