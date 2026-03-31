#!/usr/bin/env bash
# Descarrega ficheiros .dict de substantivos e adjetivos do MorphoBr (LR-POR/MorphoBr).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CACHE="${ROOT}/cache"
mkdir -p "${CACHE}"

MB_BASE="https://raw.githubusercontent.com/LR-POR/MorphoBr/master"

# Letras para download (ex: a-z)
LETRAS="${LETRAS:-a b c d e f g h i j k l m n o p q r s t u v w x y z}"

for x in ${LETRAS}; do
  # Substantivos
  dest_n="${CACHE}/nouns-${x}.dict"
  if [ ! -f "$dest_n" ]; then
    echo "A descarregar nouns-${x}.dict ..."
    curl -fsSL "${MB_BASE}/nouns/nouns-${x}.dict" -o "${dest_n}" || echo "Aviso: nouns-${x}.dict não encontrado."
  fi

  # Adjetivos
  dest_adj="${CACHE}/adjectives-${x}.dict"
  if [ ! -f "$dest_adj" ]; then
    echo "A descarregar adjectives-${x}.dict ..."
    curl -fsSL "${MB_BASE}/adjectives/adjectives-${x}.dict" -o "${dest_adj}" || echo "Aviso: adjectives-${x}.dict não encontrado."
  fi
done

echo "Download concluído em ${CACHE}"
