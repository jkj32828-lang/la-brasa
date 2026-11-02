// 100 pessoas ao mesmo tempo no site REAL: cada uma baixa a página e as fotos como o navegador faz, lê o cardápio
// e as avaliações no Firestore e, como no site, parte delas faz pedido, acompanha o pedido, avalia ou manda mensagem.
// Uso: node tests/load-live.mjs [pessoas=100] [completas=todas] [segundos-para-chegar=3]
//   "completas" baixam também o cardápio inteiro (124 leituras) e as fotos; as outras abrem a página, avaliações e pedem.
//   Serve para caber no plano grátis do Firebase (50 mil leituras e 360 MB por dia).
//   Imprime o resumo e a linha IDS com tudo que criou (para apagar depois)
const N = +(process.argv[2] || 100), FULL = +(process.argv[3] || N), SPREAD = +(process.argv[4] || 3) * 1000;
let menuCache = null;
const SITE = 'https://la-brasa-burger-nf.web.app';
const KEY = 'AIzaSyCd0xT_vuRFKHC3JviEIHH1i1_itXLCUeI';
const DB = 'https://firestore.googleapis.com/v1/projects/la-brasa-burger-nf/databases/(default)/documents';
const RUN = 'carga' + Date.now().toString(36);
const v = x => x === null ? { nullValue: null } : typeof x === 'string' ? { stringValue: x } : typeof x === 'boolean' ? { booleanValue: x }
  : typeof x === 'number' ? (Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x })
  : Array.isArray(x) ? { arrayValue: { values: x.map(v) } } : { mapValue: { fields: Object.fromEntries(Object.entries(x).map(([k, y]) => [k, v(y)])) } };
const plain = f => f.stringValue ?? f.booleanValue ?? (f.integerValue != null ? +f.integerValue : f.doubleValue)
  ?? (f.arrayValue ? (f.arrayValue.values || []).map(plain) : f.mapValue ? Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, plain(x)])) : null);
const hex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
const code = () => '#' + [...crypto.getRandomValues(new Uint8Array(5))].map(b => 'ACDEFGHJKMNPQRTUVWXY34679'[b % 25]).join('');
const stats = {}, errors = [], created = [];
async function hit(kind, url, opt) {
  const t = performance.now();
  try {
    const r = await fetch(url, opt); const body = await r.arrayBuffer();
    (stats[kind] ||= []).push(performance.now() - t);
    if (!r.ok) errors.push(`${kind}: HTTP ${r.status} ${new TextDecoder().decode(body).slice(0, 120)}`);
    return { ok: r.ok, status: r.status, body };
  } catch (e) { errors.push(`${kind}: ${e.message}`); (stats[kind] ||= []).push(performance.now() - t); return { ok: false }; }
}
const json = r => JSON.parse(new TextDecoder().decode(r.body));
const post = (path, obj) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: v(obj).mapValue.fields }) });

async function person(i) {
  await new Promise(r => setTimeout(r, Math.random() * SPREAD)); // chegam quase juntas
  const full = i <= FULL;
  const page = await hit('página (index.html)', SITE + '/');
  if (page.ok && !new TextDecoder().decode(page.body).includes('La Brasa Burger')) errors.push('página sem o nome da loja');
  await Promise.all(['/firebase.js', '/config.js', ...(full ? ['/img/logo.jpg', '/img/banner.jpg'] : [])].map(p => hit('arquivos do site', SITE + p)));
  let list = menuCache || [];
  if (full) {
    const prods = await hit('ler cardápio (Firestore)', `${DB}/products?pageSize=300&key=${KEY}`);
    list = prods.ok ? (json(prods).documents || []).map(d => plain({ mapValue: { fields: d.fields } })) : [];
    if (prods.ok && list.length !== 124) errors.push(`cardápio veio com ${list.length} produtos`);
    if (list.length) menuCache = list;
    await Promise.all(list.slice().sort(() => Math.random() - .5).slice(0, 3).map(p => hit('fotos dos produtos', SITE + '/' + p.img)));
  } else if (!list.length) {
    const html = new TextDecoder().decode(page.body || new ArrayBuffer(0)); // o cardápio também vem dentro da página
    const m = html.match(/const SEED_PRODUCTS = (\[[\s\S]*?\n\]);/); list = m ? eval(m[1]) : [];
  }
  await hit('ler avaliações (Firestore)', `${DB}/reviews?pageSize=50&key=${KEY}`);
  const roll = Math.random();
  if (roll < .6 && list.length) { // faz pedido e acompanha
    const items = list.slice().sort(() => Math.random() - .5).slice(0, 1 + Math.floor(Math.random() * 3))
      .map(p => ({ pid: p.id, name: p.name, qty: 1 + Math.floor(Math.random() * 2), unit: p.price, addons: [], obs: '' }));
    const subtotal = Math.round(items.reduce((s, x) => s + x.unit * x.qty, 0) * 100) / 100, discount = Math.round(subtotal * 5) / 100;
    const id = hex(15), o = { id, code: code(), createdAt: Date.now(), status: 'new', customer: { name: `Carga ${RUN} ${i}`, phone: '22 90000-0000' },
      address: { cep: '28610-190', street: 'Rua Augusto Spinelli', number: String(i), complement: '', neighborhood: 'Centro', city: 'Nova Friburgo', state: 'RJ' },
      payment: 'pix', items, subtotal, delivery: 8.99, discount, total: Math.round((subtotal - discount + 8.99) * 100) / 100 };
    const w = await hit('fazer pedido (Firestore)', `${DB}/orders?documentId=${id}&key=${KEY}`, post('', o));
    if (w.ok) { created.push('orders/' + id); const g = await hit('acompanhar pedido (Firestore)', `${DB}/orders/${id}?key=${KEY}`); if (g.ok && plain({ mapValue: { fields: json(g).fields } }).code !== o.code) errors.push('pedido lido diferente do gravado'); }
  } else if (roll < .8) {
    const id = RUN + 'r' + i;
    const w = await hit('avaliar (Firestore)', `${DB}/reviews?documentId=${id}&key=${KEY}`, post('', { id, name: 'Carga', rating: 5, text: 'Teste de carga ' + RUN, createdAt: Date.now() }));
    if (w.ok) created.push('reviews/' + id);
  } else if (roll < .9) {
    const id = RUN + 'm' + i;
    const w = await hit('mensagem (Firestore)', `${DB}/messages?documentId=${id}&key=${KEY}`, post('', { id, name: 'Carga', contact: 'teste', body: 'Teste de carga ' + RUN, createdAt: Date.now(), read: false }));
    if (w.ok) created.push('messages/' + id);
  }
}
const t0 = performance.now();
await Promise.all(Array.from({ length: N }, (_, i) => person(i + 1)));
const secs = ((performance.now() - t0) / 1000).toFixed(1);
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
console.log(`${N} pessoas ao mesmo tempo em ${secs}s`);
for (const [k, a] of Object.entries(stats)) console.log(`  ${k.padEnd(32)} ${String(a.length).padStart(4)} chamadas · metade em até ${Math.round(pct(a, .5))} ms · 95% em até ${Math.round(pct(a, .95))} ms · pior ${Math.round(Math.max(...a))} ms`);
console.log(`ERROS: ${errors.length}`); [...new Set(errors)].slice(0, 15).forEach(e => console.log('  ' + e));
console.log('PEDIDOS ' + created.filter(x => x.startsWith('orders/')).length);
console.log('RUN ' + RUN);
console.log('IDS ' + created.join(' '));
