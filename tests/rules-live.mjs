// Testa as regras do Firestore no projeto real, como um visitante SEM login (API REST).
// Uso: node tests/rules-live.mjs   — cria documentos com id "teste-..." (apague depois com firestore:delete)
const KEY = 'AIzaSyCd0xT_vuRFKHC3JviEIHH1i1_itXLCUeI';
const BASE = 'https://firestore.googleapis.com/v1/projects/la-brasa-burger-nf/databases/(default)/documents';
const RUN = 'teste-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);

const v = x => x === null ? { nullValue: null }
  : typeof x === 'string' ? { stringValue: x }
  : typeof x === 'boolean' ? { booleanValue: x }
  : typeof x === 'number' ? (Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x })
  : Array.isArray(x) ? { arrayValue: { values: x.map(v) } }
  : { mapValue: { fields: Object.fromEntries(Object.entries(x).map(([k, y]) => [k, v(y)])) } };
const fields = o => ({ fields: Object.fromEntries(Object.entries(o).map(([k, y]) => [k, v(y)])) });

async function call(method, path, body) {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(BASE + path + sep + 'key=' + KEY, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  return r.status;
}
const results = [];
const expect = (name, status, want) => results.push(`${status === want ? 'OK   ' : 'FALHA'} ${name} (HTTP ${status}, esperado ${want})`);

const order = id => ({ id, code: '#1234', createdAt: Date.now(), status: 'new',
  customer: { name: 'Teste Regras', phone: '22 90000-0000' },
  address: { cep: '28610-190', street: 'Rua Augusto Spinelli', number: '92', complement: '', neighborhood: 'Centro', city: 'Nova Friburgo', state: 'RJ' },
  payment: 'pix', items: [{ pid: 'burger-baconese', name: 'Burger Baconese', qty: 1, unit: 38.9, addons: [], obs: '' }],
  subtotal: 38.9, delivery: 8.99, discount: 1.95, total: 45.94 });

const oid = RUN + '-pedido', rid = RUN + '-avaliacao', mid = RUN + '-mensagem';
expect('visitante lê o cardápio', await call('GET', '/products'), 200);
expect('visitante NÃO grava produto', await call('POST', '/products?documentId=' + RUN, fields({ id: RUN, name: 'X', price: 1 })), 403);
expect('visitante cria pedido válido', await call('POST', '/orders?documentId=' + oid, fields(order(oid))), 200);
expect('visitante NÃO lista pedidos', await call('GET', '/orders'), 403);
expect('visitante lê UM pedido pelo id (acompanhamento do cliente)', await call('GET', '/orders/' + oid), 200);
expect('pedido com id curto (adivinhável) é recusado', await call('POST', '/orders?documentId=curto1', fields({ ...order('curto1') })), 403);
expect('visitante NÃO altera pedido existente', await call('PATCH', '/orders/' + oid, fields({ ...order(oid), total: 0 })), 403);
expect('visitante NÃO apaga pedido', await call('DELETE', '/orders/' + oid), 403);
expect('pedido sem nome é recusado', await call('POST', '/orders?documentId=' + RUN + '-x1', fields({ ...order(RUN + '-x1'), customer: { name: '', phone: '1' } })), 403);
expect('pedido já "entregue" é recusado', await call('POST', '/orders?documentId=' + RUN + '-x2', fields({ ...order(RUN + '-x2'), status: 'delivered' })), 403);
expect('pedido com campo extra é recusado', await call('POST', '/orders?documentId=' + RUN + '-x3', fields({ ...order(RUN + '-x3'), hack: 1 })), 403);
const rev = { id: rid, name: 'Teste', rating: 5, text: 'Teste de regras', createdAt: Date.now() };
expect('visitante cria avaliação', await call('POST', '/reviews?documentId=' + rid, fields(rev)), 200);
expect('visitante lê avaliações', await call('GET', '/reviews'), 200);
expect('avaliação nota 9 é recusada', await call('POST', '/reviews?documentId=' + RUN + '-r9', fields({ ...rev, id: RUN + '-r9', rating: 9 })), 403);
expect('visitante NÃO apaga avaliação', await call('DELETE', '/reviews/' + rid), 403);
expect('visitante envia mensagem', await call('POST', '/messages?documentId=' + mid, fields({ id: mid, name: 'Teste', contact: 't@t.com', body: 'Teste de regras', createdAt: Date.now(), read: false })), 200);
expect('visitante NÃO lê mensagens', await call('GET', '/messages'), 403);
console.log(results.join('\n'));
console.log('IDS_CRIADOS ' + [`orders/${oid}`, `reviews/${rid}`, `messages/${mid}`].join(' '));
