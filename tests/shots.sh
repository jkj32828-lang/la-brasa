#!/bin/bash
# Tira prints das telas principais com o Firebase simulado e as fotos de verdade (servidor local).
# Uso: bash tests/shots.sh   — salva em tests/out/shots/*.png
cd "$(dirname "$0")"
OUT=out/shot; rm -rf "$OUT"; mkdir -p "$OUT" out/shots; cp -r ../public/* "$OUT/"
NOW=$(date +%s)000
CFG="{owner:true,seed:[
 ['orders/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',{id:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',code:'#4821',createdAt:$NOW-600000,status:'preparing',customer:{name:'Mariana Souza',phone:'(22) 99876-1234'},address:{street:'Rua Augusto Spinelli',number:'120',complement:'apto 302',neighborhood:'Centro',city:'Nova Friburgo',state:'RJ',cep:'28610-190'},payment:'pix',items:[{pid:'burger-baconese',name:'Burger Baconese',qty:2,unit:44.4,addons:['Bacon'],obs:'sem cebola'},{pid:'batata-ondulada-pequena',name:'Batata ondulada pequena',qty:1,unit:15.9,addons:[],obs:''}],subtotal:104.7,delivery:8.99,discount:5.24,total:108.45}],
 ['orders/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',{id:'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',code:'#3307',createdAt:$NOW-120000,status:'new',customer:{name:'João Pedro',phone:'(22) 98811-2233'},address:{street:'Av. Alberto Braune',number:'45',complement:'',neighborhood:'Centro',city:'Nova Friburgo',state:'RJ',cep:''},payment:'card',items:[{pid:'australiano',name:'Australiano',qty:1,unit:40.9,addons:[],obs:''}],subtotal:40.9,delivery:8.99,discount:0,total:49.89}],
 ['reviews/r1',{id:'r1',name:'Carla',rating:5,text:'Baconese chegou quentinho, melhor burger de Friburgo!',createdAt:$NOW}]]}"
{ awk '{print} /^<head>$/{print "<script>window.__CFG='"$(echo $CFG | tr -d '\n')"';</script>"; system("cat mock.js"); print "<script>localStorage.setItem(\"labrasa_orders_v1\",JSON.stringify([{id:\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",code:\"#4821\",createdAt:Date.now()}]))</script>"}' ../public/index.html | grep -v 'src="firebase.js"'; } > "$OUT/index.html"
# Site do dono (la-brasa-dono.web.app): a mesma página com OWNER_SITE ligado
sed 's#^<head>$#<head><script>window.OWNER_SITE=true</script>#' "$OUT/index.html" > "$OUT/dono.html"
node -e "const h=require('http'),f=require('fs'),p=require('path');const T={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg'};h.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=p.join(process.argv[1],u==='/'?'index.html':u);f.readFile(fp,(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':T[p.extname(fp)]||'application/octet-stream'});r.end(d)})}).listen(5056)" "$OUT" &
SRV=$!; sleep 1
W=$(cygpath -w "$PWD"); E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
shot(){ "$E" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$W\\out\\profshot$1" --window-size=$2 --virtual-time-budget=6000 --screenshot="$W\\out\\shots\\$1.png" "http://localhost:5056/$3" 2>/dev/null; echo "$1 ok"; }
shot desktop-home 1280,1900 ""
shot desktop-produto 1280,1000 "#product-burger-baconese"
shot desktop-pedidos 1280,1000 "#pedidos"
shot desktop-admin 1280,1300 "dono.html"
shot celular-app 500,1300 ""
shot celular-pedidos 500,900 "#pedidos"
shot celular-admin 500,1100 "dono.html"
kill $SRV 2>/dev/null
