#!/bin/bash
# Testa public/index.html no Edge com o Firebase simulado (tests/mock.js).
# Uso: bash tests/runall.sh   — imprime uma linha OK/FALHA por função testada
cd "$(dirname "$0")"
SRC="../public/index.html"; W=$(cygpath -w "$PWD"); E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
mkdir -p out
for spec in A:1280:A B:500:B C:1280:C D:1280:D E:1280:D F:1280:F G:1280:G H:1280:H I:1280:I J:1280:J; do
  IFS=: read cfg width tf <<< "$spec"
  {
    awk -v cfg="$cfg" '{print} /^<head>$/{print "<script>"; system("cat seed.js"); print "window.__CFG=CFGS[\"" cfg "\"];</script>"; system("cat mock.js")}' "$SRC" \
      | grep -v -e '^</body>$' -e '^</html>$' -e 'src="firebase.js"'
    echo '<script>'; cat helpers.js "test-$tf.js"; echo '</script></body></html>'
  } > "out/page-$cfg.html"
  "$E" --headless=new --disable-gpu --user-data-dir="$W\\out\\prof$cfg" --window-size=$width,900 --virtual-time-budget=20000 --dump-dom "file:///${W//\\//}/out/page-$cfg.html" 2>/dev/null \
    | sed -e 's/<pre id="testout">//' -e 's/&lt;/</g' -e 's/&gt;/>/g' -e 's/&amp;/\&/g' | grep -E '^(OK|FALHA|ERRO)'
done
