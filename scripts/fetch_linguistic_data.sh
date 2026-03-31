#!/bin/bash
# scripts/fetch_linguistic_data.sh

CACHE_DIR="scripts/cache"
mkdir -p "$CACHE_DIR"

echo "--- Downloading OpenWordNet-PT ---"
# OWN-PT LMF XML (v1.0.0 is stable)
# Note: Using the raw link from the official repository or a reliable fork if main is broken
curl -fsSL https://raw.githubusercontent.com/own-pt/openWordnet-PT/master/own-pt.xml -o "$CACHE_DIR/own-pt.xml" || {
  echo "Failed to download own-pt.xml from master. Trying archive link..."
  curl -fsSL https://github.com/own-pt/openWordnet-PT/releases/download/v1.0.0/own-pt-lmf.xml -o "$CACHE_DIR/own-pt.xml"
}

echo "--- Downloading ViP (VerbNet in Portuguese) ---"
# ViP.csv from LR-POR
curl -fsSL https://raw.githubusercontent.com/LR-POR/ViP/master/ViP.csv -o "$CACHE_DIR/ViP.csv" || {
  echo "Failed to download ViP.csv. Please check the URL."
}

echo "--- Download Complete ---"
ls -lh "$CACHE_DIR"
