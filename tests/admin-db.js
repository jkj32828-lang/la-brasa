// Lê, grava ou apaga documentos do Firestore real com a conta logada no firebase-tools (acesso de administrador).
// Uso: node tests/admin-db.js <firebase-tools/lib> list <colecao>
//      node tests/admin-db.js <firebase-tools/lib> delete <colecao/id> [...]
//      node tests/admin-db.js <firebase-tools/lib> seed            — grava o cardápio de public/index.html (SEED_PRODUCTS)
//      node tests/admin-db.js <firebase-tools/lib> status <id> <status>   — muda o status de um pedido, como o dono faria
//      node tests/admin-db.js <firebase-tools/lib> wait-order <texto> [segundos]   — espera um pedido com esse nome de cliente e imprime o id
const fs = require('fs'), path = require('path');
const [lib, cmd, ...args] = process.argv.slice(2);
const { requireAuth } = require(lib + '/requireAuth');
const { getGlobalDefaultAccount } = require(lib + '/auth');
const apiv2 = require(lib + '/apiv2');
const PROJECT = 'la-brasa-burger-nf';
const P = `projects/${PROJECT}/databases/(default)/documents`;
const plain = v => v.stringValue ?? v.booleanValue ?? (v.integerValue != null ? Number(v.integerValue) : v.doubleValue)
  ?? (v.arrayValue ? (v.arrayValue.values || []).map(plain) : v.mapValue ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, plain(x)])) : null);
const val = x => x === null ? { nullValue: null }
  : typeof x === 'string' ? { stringValue: x }
  : typeof x === 'boolean' ? { booleanValue: x }
  : typeof x === 'number' ? (Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x })
  : Array.isArray(x) ? { arrayValue: { values: x.map(val) } }
  : { mapValue: { fields: Object.fromEntries(Object.entries(x).map(([k, y]) => [k, val(y)])) } };
(async () => {
  const acct = getGlobalDefaultAccount();
  await requireAuth({ user: acct.user, tokens: acct.tokens, project: PROJECT });
  const c = new apiv2.Client({ urlPrefix: 'https://firestore.googleapis.com', apiVersion: 'v1', auth: true });
  const list = async coll => ((await c.get(`/${P}/${coll}`, { queryParams: { pageSize: '300' } })).body.documents || [])
    .map(d => ({ id: d.name.split('/').pop(), ...plain({ mapValue: { fields: d.fields } }) }));
  if (cmd === 'list') {
    const docs = await list(args[0]);
    console.log(`${args[0]}: ${docs.length} documento(s)`);
    for (const o of docs) console.log('  ' + o.id + ' | ' + (o.customer?.name || o.name || '') + (o.total != null ? ' | total ' + o.total : '') + (o.status ? ' | ' + o.status : ''));
  } else if (cmd === 'delete') {
    for (const p of args) { await c.delete(`/${P}/${p}`); console.log('apagado: ' + p); }
  } else if (cmd === 'seed') {
    const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    const products = eval(html.match(/const SEED_PRODUCTS = (\[[\s\S]*?\n\]);/)[1]);
    const writes = products.map(p => ({ update: { name: `${P}/products/${p.id}`, fields: val(p).mapValue.fields } }));
    for (let i = 0; i < writes.length; i += 100) await c.post(`/${P.replace('/documents', '')}/documents:commit`, { writes: writes.slice(i, i + 100) });
    console.log('produtos gravados: ' + writes.length);
  } else if (cmd === 'status') {
    await c.patch(`/${P}/orders/${args[0]}`, { fields: { status: val(args[1]) } }, { queryParams: { 'updateMask.fieldPaths': 'status' } });
    console.log('status ' + args[0] + ' → ' + args[1]);
  } else if (cmd === 'wait-order') {
    const until = Date.now() + (+(args[1] || 120)) * 1000;
    while (Date.now() < until) {
      const o = (await list('orders')).find(x => (x.customer?.name || '').includes(args[0]));
      if (o) { console.log(o.id); return; }
      await new Promise(r => setTimeout(r, 2000));
    }
    console.error('ERRO: nenhum pedido com "' + args[0] + '"'); process.exit(1);
  }
})().catch(e => { console.error('ERRO: ' + (e.message || e)); process.exit(1); });
