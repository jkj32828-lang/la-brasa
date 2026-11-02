run(async()=>{
  await sleep(1200);
  const n=SEED_PRODUCTS.length;
  ok('G1  banco vazio: o cardápio completo da loja continua carregado', n>100 && state.products.length===n, state.products.length+' de '+n+' itens');
  await sleep(1500);
  ok('G2  banco vazio: primeira entrada do dono grava o cardápio inteiro', keys('products/').length===n, keys('products/').length+' gravados de '+n);
  const first=S.get('products/'+SEED_PRODUCTS[0].id);
  ok('G3  produtos gravados usam as fotos do site', !!first && first.img.startsWith('img/'), first&&first.img);
  ok('G4  todo produto tem foto, preço e categoria', SEED_PRODUCTS.every(p=>p.img && p.price>0 && p.cat && p.name), SEED_PRODUCTS.filter(p=>!(p.img&&p.price>0&&p.cat&&p.name)).map(p=>p.name).join(', '));
  ok('G5  ids de produto não se repetem', new Set(SEED_PRODUCTS.map(p=>p.id)).size===n);
});
