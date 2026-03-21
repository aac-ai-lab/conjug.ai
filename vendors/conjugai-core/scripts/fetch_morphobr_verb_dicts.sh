#!/usr/bin/env bash
# Descarrega ficheiros .dict de verbos do MorphoBr (LR-POR/MorphoBr, Apache-2.0).
# Uso: bash fetch_morphobr_verb_dicts.sh        # letras c f i q v (cobre os lemas do whitelist por defeito)
#      LETRAS="a b c" bash fetch_morphobr_verb_dicts.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
CACHE="${ROOT}/cache"
MB_BASE="https://raw.githubusercontent.com/LR-POR/MorphoBr/master/verbs"
LETRAS="${LETRAS:-c f i q v}"
mkdir -p "${CACHE}"
for x in ${LETRAS}; do
  dest="${CACHE}/verbs-${x}.dict"
  echo "A descarregar ${dest} ..."
  curl -fsSL "${MB_BASE}/verbs-${x}.dict" -o "${dest}"
done
echo "Concluído. Ficheiros em ${CACHE}"
