// ViaCEP fora do ar: o cliente ainda consegue preencher o endereço à mão
run(async()=>{
  await sleep(1200);
  location.hash='product-b1'; await sleep(120); clk('#pdAdd'); await sleep(120);
  clk('#cartBtn'); clk('#checkoutBtn'); await sleep(40);
  clk('#editAddr'); setv('#aCep','28610190'); clk('#searchCep'); await sleep(150);
  ok('J1  CEP: serviço fora do ar avisa para preencher à mão', txt('#cepHint').includes('Preencha os campos manualmente') && !txt('#cepHint').includes('Buscando'), txt('#cepHint'));
  setv('#aStreet','Rua X'); setv('#aNumber','1'); clk('#saveAddr'); await sleep(20);
  ok('J2  CEP: endereço à mão salva', txt('#addrText').includes('Rua X, 1') && txt('#addrText').includes('Nova Friburgo/RJ'), txt('#addrText'));
});
