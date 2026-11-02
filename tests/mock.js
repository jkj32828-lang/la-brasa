<script>
/* Firebase simulado: entrega a connectBackend() o mesmo formato que public/firebase.js
   (snap.docs + snap.metadata, erros com code 'permission-denied', onAuth com {email, isOwner},
   doc(path).onSnapshot com {exists, data()}). Também simula o ViaCEP (fetch). */
try{localStorage.clear()}catch(e){}
(function(){
  const C=window.__CFG||{}; const OWNER=!!C.owner, FAIL=!!C.failWrites;
  if(C.site==='dono') window.OWNER_SITE=true;   // abre como la-brasa-dono.web.app
  const store=new Map(); window.__store=store; window.__writes=[];
  (C.seed||[]).forEach(([p,d])=>store.set(p,JSON.parse(JSON.stringify(d))));
  const listeners=[], docListeners=[];
  const collOf=p=>p.split('/').slice(0,-1).join('/');
  function snapFor(l){
    let docs=[...store.entries()].filter(([p])=>collOf(p)===l.coll).map(([p,d])=>{const c=JSON.parse(JSON.stringify(d));return {id:p.split('/').pop(),data:()=>c};});
    if(l.order){const [f,dir]=l.order;docs.sort((a,b)=>{const x=a.data()[f],y=b.data()[f];return (x<y?-1:x>y?1:0)*(dir==='desc'?-1:1);});}
    return {docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false,hasPendingWrites:false}};
  }
  const docSnap=path=>{const d=store.get(path);const c=d?JSON.parse(JSON.stringify(d)):undefined;return {exists:!!d,data:()=>c};};
  const notify=path=>{
    listeners.filter(l=>l.coll===collOf(path)).forEach(l=>setTimeout(()=>l.next(snapFor(l)),5));
    docListeners.filter(l=>l.path===path).forEach(l=>setTimeout(()=>l.next(docSnap(path)),5));
  };
  const refuse=()=>{throw {code:'permission-denied',message:'Missing or insufficient permissions.'};};
  /* C.rules: aplica as mesmas regras de firestore.rules; cada recusa fica em window.__rejects (o teste de "fuçar" usa) */
  const RULES=!!C.rules; window.__rejects=[];
  const txt=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
  const only=(o,ks)=>o&&typeof o==='object'&&Object.keys(o).every(k=>ks.includes(k));
  const isNum=v=>typeof v==='number'&&isFinite(v);
  function createProblem(coll,id,d){
    if(coll==='orders'){
      if(!only(d,['id','code','createdAt','status','customer','address','payment','items','subtotal','delivery','discount','total'])) return 'pedido com campo a mais';
      if(d.id!==id||id.length<20) return 'id do pedido'; if(d.status!=='new') return 'status inicial';
      if(!txt(d.code,10)||!isNum(d.createdAt)) return 'código/data';
      if(!only(d.customer,['name','phone'])||!txt(d.customer.name,80)) return 'nome do cliente (vazio ou > 80)';
      if(!txt(d.customer.phone,30)) return 'telefone (vazio ou > 30)';
      const a=d.address; if(!only(a,['cep','street','number','complement','neighborhood','city','state'])) return 'endereço com campo a mais';
      if(!txt(a.street,120)) return 'rua (vazia ou > 120)'; if(!txt(a.number,20)) return 'número (vazio ou > 20)';
      if(!txt(a.city,60)) return 'cidade (vazia ou > 60)'; if(!txt(a.state,2)) return 'UF (vazia ou > 2)';
      if(!['pix','card','cash'].includes(d.payment)) return 'pagamento';
      if(!Array.isArray(d.items)||d.items.length<1||d.items.length>40) return 'itens (0 ou mais de 40 linhas)';
      if(![d.subtotal,d.delivery,d.discount,d.total].every(isNum)) return 'valores';
    } else if(coll==='reviews'){
      if(!only(d,['id','name','rating','text','createdAt'])||d.id!==id) return 'avaliação com campo a mais';
      if(!txt(d.name,60)) return 'nome da avaliação (vazio ou > 60)'; if(!txt(d.text,1000)) return 'texto da avaliação (vazio ou > 1000)';
      if(!Number.isInteger(d.rating)||d.rating<1||d.rating>5||!isNum(d.createdAt)) return 'nota';
    } else if(coll==='messages'){
      if(!only(d,['id','name','contact','body','createdAt','read'])||d.id!==id||d.read!==false) return 'mensagem com campo a mais';
      if(!txt(d.name,80)) return 'nome da mensagem (vazio ou > 80)'; if(!txt(d.contact,120)) return 'contato (vazio ou > 120)';
      if(!txt(d.body,2000)) return 'texto da mensagem (vazio ou > 2000)'; if(!isNum(d.createdAt)) return 'data';
    } else return 'só o dono';
    return '';
  }
  function check(op,path,data){
    if(!RULES) return;
    const [coll,id]=path.split('/'); const exists=store.has(path);
    let why='';
    if(op==='set'&&!exists) why = account?.isOwner&&coll==='products' ? '' : createProblem(coll,id,data);
    else if(!account?.isOwner) why='só o dono';
    if(why){ window.__rejects.push(op+' '+path+': '+why); refuse(); }
  }
  function docRef(path){return {
    async set(data){if(FAIL)refuse();check('set',path,data);store.set(path,JSON.parse(JSON.stringify(data)));__writes.push(['set',path]);notify(path);},
    async update(data){if(FAIL)refuse();check('update',path,data);const d=store.get(path);if(!d)throw {code:'not-found'};store.set(path,{...d,...JSON.parse(JSON.stringify(data))});__writes.push(['update',path]);notify(path);},
    async delete(){if(FAIL)refuse();check('delete',path);store.delete(path);__writes.push(['delete',path]);notify(path);},
    onSnapshot(next,err){const l={path,next,err};docListeners.push(l);window.__docSubs=(window.__docSubs||[]).concat(path);setTimeout(()=>next(docSnap(path)),10);
      return ()=>{const i=docListeners.indexOf(l);if(i>=0)docListeners.splice(i,1);};}};}
  function query(coll,order){return {
    orderBy(f,dir){return query(coll,[f,dir||'asc']);},
    onSnapshot(next,err){const l={coll,order,next,err};listeners.push(l);window.__subs=(window.__subs||[]).concat(coll);setTimeout(()=>next(snapFor(l)),10);
      return ()=>{const i=listeners.indexOf(l);if(i>=0)listeners.splice(i,1);window.__subs=window.__subs.filter((c,j)=>!(c===coll&&j===window.__subs.indexOf(coll)));};}};}
  let authCb=null, account=OWNER?{email:'dono@teste.com',isOwner:true}:(C.account?{email:C.account,isOwner:false}:null);
  const api={
    db:{doc:docRef,collection:c=>query(c,null)},
    onAuth:cb=>{authCb=cb;setTimeout(()=>cb(account),15);return ()=>{};},
    signIn:async()=>{account={email:'dono@teste.com',isOwner:true};authCb&&authCb(account);},
    signOut:async()=>{account=null;authCb&&authCb(null);},
  };
  // ViaCEP simulado: um CEP conhecido, o resto "não existe"; cepDown simula serviço fora do ar
  const CEPS={'28610190':{logradouro:'Rua Augusto Spinelli',bairro:'Centro',localidade:'Nova Friburgo',uf:'RJ'}};
  const realFetch=window.fetch.bind(window);
  window.fetch=async(url,opt)=>{
    const m=String(url).match(/viacep\.com\.br\/ws\/(\d{8})\/json/);
    if(!m) return realFetch(url,opt);
    if(C.cepDown) throw new TypeError('Failed to fetch');
    return {ok:true,json:async()=>CEPS[m[1]]||{erro:true}};
  };
  if(!C.noDb) window.addEventListener('load',()=>setTimeout(()=>connectBackend(api),20));
})();
</script>
