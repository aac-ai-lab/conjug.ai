#!/usr/bin/env bash
# Copia conjugai-core.js para o Emotalk irmão (quando existir) e invalida o cache PWA.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/js/conjugai-core.js"

if [[ ! -f "$SRC" ]]; then
  echo "sync-core-to-emotalk: origem ausente: $SRC" >&2
  echo "Rode antes: npm run build:core" >&2
  exit 1
fi

EMOTALK_ROOT="${EMOTALK_PATH:-$ROOT/../emotalk}"
DEST_DIR="$EMOTALK_ROOT/assets/js"
DEST="$DEST_DIR/conjugai-core.js"
SW="$EMOTALK_ROOT/sw.js"

if [[ ! -d "$EMOTALK_ROOT" ]]; then
  echo "sync-core-to-emotalk: Emotalk não encontrado em $EMOTALK_ROOT (defina EMOTALK_PATH se estiver noutra pasta)."
  echo "Sync ignorado."
  exit 0
fi

mkdir -p "$DEST_DIR"
cp -f "$SRC" "$DEST"

if [[ -f "$SW" ]]; then
  # Incrementa emotalk-vN para forçar atualização do service worker.
  python3 - <<'PY' "$SW"
import re, sys
path = sys.argv[1]
text = open(path, encoding="utf-8").read()
new, n = re.subn(
    r"(CACHE\s*=\s*['\"]emotalk-v)(\d+)(['\"])",
    lambda m: f"{m.group(1)}{int(m.group(2)) + 1}{m.group(3)}",
    text,
    count=1,
)
if n == 0:
    print("sync-core-to-emotalk: aviso — não achei CACHE emotalk-vN em sw.js", file=sys.stderr)
else:
    open(path, "w", encoding="utf-8").write(new)
    m = re.search(r"CACHE\s*=\s*['\"](emotalk-v\d+)['\"]", new)
    print(f"sync-core-to-emotalk: PWA cache → {m.group(1) if m else '?'}")
PY
fi

echo "sync-core-to-emotalk: copiado → $DEST"
