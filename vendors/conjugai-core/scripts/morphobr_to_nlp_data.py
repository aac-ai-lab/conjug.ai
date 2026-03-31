#!/usr/bin/env python3
import argparse
import json
import os
import unicodedata
from pathlib import Path

"""
Converter MorphoBr (.dict) para o formato nlp-pt-br-lite (alfabeto).
Formato MorphoBr: <forma> <lema>+<POS>+<Cat>...
Ex: marceneiro marceneiro+N+M+SG
    mesa mesa+N+F+SG
    bonito bonito+ADJ+M+SG
"""


def normalize(s):
    return "".join(c for c in unicodedata.normalize('NFD', s.lower())
                   if unicodedata.category(c) != 'Mn')


def parse_morphobr(paths):
    lexicon = {}
    for p in paths:
        if not p.exists():
            continue
        with p.open('r', encoding='utf-8', errors='replace') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                parts = line.split()
                if len(parts) < 2:
                    continue
                _form, analysis = parts[0], parts[1]
                bits = analysis.split('+')
                if len(bits) < 2:
                    continue

                lemma = bits[0].lower()
                pos = bits[1]  # N, ADJ, V, etc

                # Normalizar a chave para o léxico
                n_lemma = normalize(lemma)
                if not n_lemma:
                    continue

                if n_lemma not in lexicon:
                    lexicon[n_lemma] = {"cat": []}

                # Categorias simplificadas
                if pos == 'N':
                    if "SUBST" not in lexicon[n_lemma]["cat"]:
                        lexicon[n_lemma]["cat"].append("SUBST")
                    # Gênero para regência
                    if 'F' in bits and "LUGAR_FEM" not in lexicon[n_lemma]["cat"]:
                        lexicon[n_lemma]["cat"].append("LUGAR_FEM")
                    if 'M' in bits and "LUGAR_MASC" not in lexicon[n_lemma]["cat"]:
                        lexicon[n_lemma]["cat"].append("LUGAR_MASC")
                elif pos == 'ADJ':
                    if "ADJ" not in lexicon[n_lemma]["cat"]:
                        lexicon[n_lemma]["cat"].append("ADJ")
    return lexicon


def save_alphabet(lexicon, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    alphabet = {}
    for word, data in lexicon.items():
        letter = word[0] if word else 'others'
        if not ('a' <= letter <= 'z'):
            letter = 'others'
        if letter not in alphabet:
            alphabet[letter] = {}
        alphabet[letter][word] = data

    for letter, data in alphabet.items():
        out_p = Path(output_dir) / f"{letter}.json"
        with out_p.open('w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", type=Path, nargs='+', required=True)
    parser.add_argument("-o", "--output", type=Path, required=True)
    args = parser.parse_args()

    print(f"Processando {len(args.input)} arquivos...")
    lex = parse_morphobr(args.input)
    print(f"Lemas únicos extraídos: {len(lex)}")
    save_alphabet(lex, args.output)
    print("Salvo com sucesso.")
