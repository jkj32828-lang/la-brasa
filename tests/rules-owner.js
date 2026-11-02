// Testa o lado do DONO das regras (firestore.rules) na API de teste de regras do Firebase, sem precisar do login Google.
// Uso: node tests/rules-owner.js <firebase-tools/lib>
const fs = require('fs'), path = require('path');
const lib = process.argv[2];
const { requireAuth } = require(lib + '/requireAuth');
const { getGlobalDefaultAccount } = require(lib + '/auth');
const apiv2 = require(lib + '/apiv2');
const PROJECT = 'la-brasa-burger-nf';
const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const owner = { uid: 'dono', token: { email: 'jkj32828@gmail.com', email_verified: true } };
const other = { uid: 'outro', token: { email: 'outro@gmail.com', email_verified: true } };
const unverified = { uid: 'falso', token: { email: 'jkj32828@gmail.com', email_verified: false } };
const order = { id: 'x'.repeat(30), status: 'new', code: '#1234' };
const doc = p => `/databases/(default)/documents/${p}`;
const cases = [
  ['dono lista os pedidos', 'ALLOW', owner, 'list', 'orders/' + order.id],
  ['dono muda o status', 'ALLOW', owner, 'update', 'orders/' + order.id, order],
  ['dono apaga pedido', 'ALLOW', owner, 'delete', 'orders/' + order.id, order],
  ['dono grava produto', 'ALLOW', owner, 'update', 'products/burger-baconese', { id: 'burger-baconese', price: 40 }],
  ['dono lê mensagens', 'ALLOW', owner, 'list', 'messages/m1'],
  ['outra conta Google NÃO lista pedidos', 'DENY', other, 'list', 'orders/' + order.id],
  ['outra conta Google NÃO muda status', 'DENY', other, 'update', 'orders/' + order.id, order],
  ['outra conta Google NÃO grava produto', 'DENY', other, 'update', 'products/burger-baconese', { id: 'burger-baconese', price: 1 }],
  ['e-mail do dono sem verificação NÃO entra', 'DENY', unverified, 'list', 'orders/' + order.id],
];
(async () => {
  const acct = getGlobalDefaultAccount();
  await requireAuth({ user: acct.user, tokens: acct.tokens, project: PROJECT });
  const c = new apiv2.Client({ urlPrefix: 'https://firebaserules.googleapis.com', apiVersion: 'v1', auth: true });
  const testCases = cases.map(([, expectation, auth, method, p, data]) => ({
    expectation, request: { auth, method, path: doc(p), ...(method === 'update' ? { resource: { data: { ...data, status: 'preparing' } } } : {}) },
    ...(data ? { resource: { data } } : {}),
  }));
  const r = await c.post(`/projects/${PROJECT}:test`, { source: { files: [{ name: 'firestore.rules', content: rules }] }, testSuite: { testCases } });
  const res = r.body.testResults || [];
  if (!res.length) { console.log(JSON.stringify(r.body).slice(0, 1500)); process.exit(1); }
  res.forEach((t, i) => console.log((t.state === 'SUCCESS' ? 'OK   ' : 'FALHA') + ' ' + cases[i][0] + (t.state === 'SUCCESS' ? '' : '  >> ' + JSON.stringify(t.debugMessages || t.errorPosition || t))));
})().catch(e => { console.error('ERRO: ' + (e.message || e)); process.exit(1); });
