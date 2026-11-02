#!/bin/bash
# 100 pessoas fuçando o site (20 navegadores × 5 pessoas; metade celular, metade computador) + 10 sessões do dono no painel.
# Banco simulado com as MESMAS regras do banco real (mock.js com rules:true). Nada vai para o Firebase.
# Uso: bash tests/monkey.sh [semente] [navegadores-cliente=20] [pessoas-por-navegador=5] [navegadores-dono=2]
#      (1000 pessoas: bash tests/monkey.sh 5005 100 10 10)
cd "$(dirname "$0")"
SEED=${1:-$(date +%s)}; NB=${2:-20}; PER=${3:-5}; NO=${4:-2}; W=$(cygpath -w "$PWD"); E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
# Em partes (cada parte cabe em ~10 min): CB0/OB0 = primeiro navegador cliente/dono desta parte; KEEP=1 soma com as partes anteriores
OUT=out/monkey; [ -n "$KEEP" ] || rm -rf "$OUT"; mkdir -p "$OUT"
# Sem internet nos navegadores de teste: centenas de downloads seguidos do Tailwind travavam a página esperando a rede
[ -s out/tailwind.js ] || curl -sL -m 60 https://cdn.tailwindcss.com -o out/tailwind.js
build(){ # build <nome> <cfg> <monkey>
  awk -v cfg="$2" -v mk="$3" '{print} /^<head>$/{print "<script>"; system("cat seed.js"); print "window.__CFG=" cfg "; window.__MONKEY=" mk ";</script>"; system("cat mock.js")}' ../public/index.html \
    | grep -v -e '^</body>$' -e '^</html>$' -e 'src="firebase.js"' -e 'fonts.googleapis.com' -e 'fonts.gstatic.com' \
    | sed 's#<script src="https://cdn.tailwindcss.com"></script>#<script src="../tailwind.js"></script>#' > "$OUT/$1.html"
  { echo '<script>'; cat helpers.js monkey.js; echo '</script></body></html>'; } >> "$OUT/$1.html"
}
jobs_list=()
for b in $(seq ${CB0:-0} $((NB-1))); do
  w=$([ $((b%2)) -eq 0 ] && echo 500 || echo 1280)
  build "c$b" "{rules:true,seed:[]}" "{first:$((b*PER+1)),count:$PER,seed0:$SEED}"; jobs_list+=("c$b:$w")
done
for b in $(seq ${OB0:-0} $((NO-1))); do
  w=$([ $((b%2)) -eq 0 ] && echo 500 || echo 1280)
  build "d$b" "{site:'dono',owner:true,rules:true,seed:[]}" "{first:$((b*PER+1)),count:$PER,seed0:$SEED,owner:true}"; jobs_list+=("d$b:$w")
done
RUNID=$(date +%s)
runone(){ IFS=: read name w <<< "$1"
  [ "${P:-3}" -gt 1 ] && sleep $((RANDOM%4))  # abrir vários Edge no mesmo instante às vezes trava algum
  for try in 1 2 3; do  # travou (passou de 3 min) ou não devolveu nada: tenta de novo
    # Pasta de perfil única: se um Edge antigo ainda segura a pasta, o novo entrega a ele e sai sem fazer nada
    prof="prof-$RUNID-$name-$try"
    # Vigia: o "timeout" do bash não fecha o Edge no Windows; quem fecha é o kill-prof.ps1
    ( sleep 180; powershell -NoProfile -ExecutionPolicy Bypass -File kill-prof.ps1 "$prof" ) >/dev/null 2>&1 & dog=$!
    "$E" --headless=new --disable-gpu --blink-settings=imagesEnabled=false --force-prefers-reduced-motion --user-data-dir="$W\\out\\monkey\\$prof" --window-size=$w,900 --virtual-time-budget=$((PER*20000)) --dump-dom "file:///${W//\\//}/out/monkey/$name.html" 2>/dev/null \
      | sed -e 's/<pre id="testout">//' -e 's/&lt;/</g' -e 's/&gt;/>/g' -e 's/&amp;/\&/g' -e 's#</pre></body></html>##' -e 's#<pre id="monkeytrace"[^>]*>[^<]*</pre>##' | grep -E '^(OK|FALHA|ERRO)' | sed "s/^\(OK\|FALHA\|ERRO\) */&[$name ${w}px] /" > "$OUT/$name.txt"
    kill $dog 2>/dev/null; powershell -NoProfile -ExecutionPolicy Bypass -File kill-prof.ps1 "$prof" 2>/dev/null
    [ -s "$OUT/$name.txt" ] && break; sleep 2
  done
  [ -s "$OUT/$name.txt" ] || echo "ERRO  [$name] navegador não devolveu resultado" > "$OUT/$name.txt"
  rm -rf out/monkey/prof-$RUNID-$name-* 2>/dev/null
}
export -f runone; export E W OUT RUNID PER P
printf '%s\n' "${jobs_list[@]}" | xargs -P ${P:-3} -I{} bash -c 'runone {}'  # P=1 em máquina com pouca RAM
cat "$OUT"/c[0-9]*.txt > "$OUT/clientes.txt" 2>/dev/null; cat "$OUT"/d[0-9]*.txt > "$OUT/dono.txt" 2>/dev/null
echo "SEMENTE $SEED"
echo "CLIENTES: $(grep -c '^OK' "$OUT/clientes.txt") ok, $(grep -c -E '^(FALHA|ERRO)' "$OUT/clientes.txt") quebraram (de $((NB*PER)))"
echo "DONO:     $(grep -c '^OK' "$OUT/dono.txt") ok, $(grep -c -E '^(FALHA|ERRO)' "$OUT/dono.txt") quebraram (de $((NO*PER)))"
grep -h -E '^(FALHA|ERRO)' "$OUT/clientes.txt" "$OUT/dono.txt"
