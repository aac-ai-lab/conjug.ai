#!/usr/bin/env bash
# Descarrega todos os verbs-*.dict do MorphoBr (se faltarem em cache) e gera
# vendors/conjugai-core/data/verbos.json minificado (UTF-8, sem indentação).
# Uso: na raiz do repositório ConjugAI: npm run build:lexicon
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
CACHE="${ROOT}/cache"
DATA="${ROOT}/../data/verbos.json"
MB_BASE="https://raw.githubusercontent.com/LR-POR/MorphoBr/master/verbs"
LETRAS="a b c d e f g h i j k l m n o p q r s t u v w x y z"
mkdir -p "${CACHE}"
for x in ${LETRAS}; do
  dest="${CACHE}/verbs-${x}.dict"
  if [ ! -f "${dest}" ]; then
    echo "A descarregar ${dest} ..."
    curl -fsSL "${MB_BASE}/verbs-${x}.dict" -o "${dest}"
  fi
done
ARGS=()
for x in ${LETRAS}; do
  ARGS+=("-i" "${CACHE}/verbs-${x}.dict")
done
python3 "${ROOT}/morphobr_dict_to_verbos.py" "${ARGS[@]}" -o "${DATA}"
echo "verbos.json atualizado: ${DATA}"
