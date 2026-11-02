run(async()=>{
  await sleep(1200);
  location.hash='admin'; await sleep(200);
  ok('F1  painel: conta que não é do dono fica de fora', vis('#adminGate') && !vis('#adminPanel'));
  ok('F2  painel: avisa qual conta entrou e oferece sair', txt('#adminGateMsg').includes('outro@gmail.com') && vis('#adminGateSignOut') && !vis('#adminSignIn'), txt('#adminGateMsg'));
  ok('F3  privacidade: conta comum não baixa pedidos', !(window.__subs||[]).includes('orders'));
  clk('#adminGateSignOut'); await sleep(50);
  ok('F4  sair mostra o botão Entrar com Google', vis('#adminSignIn') && q('#adminGateSignOut').hidden);
  clk('#adminSignIn'); await sleep(100);
  ok('F5  entrar com a conta do dono abre o painel e baixa pedidos', vis('#adminPanel') && (window.__subs||[]).includes('orders'));
  ok('F6  banco com produtos: entrada do dono não regrava o cardápio', keys('products/').length===4, 'banco tinha 4 produtos e ficou com '+keys('products/').length);
  clk('#adminSignOut'); await sleep(80);
  ok('F7  Sair do painel fecha o painel e para de baixar pedidos', !vis('#adminPanel') && !(window.__subs||[]).includes('orders'));
});
