#!/bin/bash
# Abre uma cópia de public/ num servidor local, com tests/live-ui.js no fim da página, e roda no Edge.
# Usa o Firebase REAL: o "cliente" faz um pedido e uma avaliação pela tela; ao mesmo tempo este script faz o papel
# do dono (acesso de administrador do firebase-tools), acha o pedido no banco e muda o status para "preparing".
# No fim apaga o pedido e a avaliação de teste.
# Uso: bash tests/live-ui.sh <firebase-tools/lib>
cd "$(dirname "$0")"
LIB="$1"; RUN="tela$(date +%s)"; OUT=out/live; rm -rf "$OUT"; mkdir -p "$OUT"; cp -r ../public/* "$OUT/"
{ grep -v -e '^</body>$' -e '^</html>$' ../public/index.html
  echo "<script>try{localStorage.clear()}catch(e){};window.__RUN='$RUN';"; cat helpers.js live-ui.js; echo '</script></body></html>'; } > "$OUT/index.html"
node -e "const h=require('http'),f=require('fs'),p=require('path');const T={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg'};h.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);if(u==='/hold'){return setTimeout(()=>r.end('ok'),+(new URL(q.url,'http://x').searchParams.get('ms'))||500)}const fp=p.join(process.argv[1],u==='/'?'index.html':u);f.readFile(fp,(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':T[p.extname(fp)]||'application/octet-stream'});r.end(d)})}).listen(5055)" "$OUT" &
SRV=$!; sleep 1
W=$(cygpath -w "$PWD"); "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --user-data-dir="$W\\out\\proflive" --window-size=1280,900 --virtual-time-budget=400000 --dump-dom "http://localhost:5055/" 2>/dev/null > "$OUT/dom.txt" &
EDGE=$!
# Papel do dono: espera o pedido chegar no banco e muda o status
OID=$(node admin-db.js "$LIB" wait-order "Teste Tela $RUN" 150)
if [ -n "$OID" ]; then echo "DONO  pedido chegou no banco: $OID"; sleep 3; node admin-db.js "$LIB" status "$OID" preparing; else echo "FALHA DONO  pedido não chegou no banco"; fi
wait $EDGE
sed -e 's/<pre id="testout">//' -e 's/&lt;/</g' -e 's/&gt;/>/g' -e 's/&amp;/\&/g' "$OUT/dom.txt" | grep -E '^(OK|FALHA|ERRO|ID)' > "$OUT/result.txt"
grep -v '^ID' "$OUT/result.txt"
kill $SRV 2>/dev/null
# Limpeza: apaga o que o teste criou no banco real
IDS=$(grep '^ID' "$OUT/result.txt" | cut -d' ' -f2 | tr '\n' ' ')
[ -n "$IDS" ] && node admin-db.js "$LIB" delete $IDS
echo "RUN $RUN"
