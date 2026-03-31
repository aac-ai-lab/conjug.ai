#!/usr/bin/env python3
import os
import json
import re
import unicodedata
from pathlib import Path

def normalize(s):
    return "".join(c for c in unicodedata.normalize('NFD', s.lower())
                   if unicodedata.category(c) != 'Mn')

def parse_own_ttl(file_path):
    lexicon = {}
    # Regex para capturar lema e POS de arquivos TTL no formato OpenWordNet-PT
    # Ex: owns:lemma "Afloramento"@pt ; owns:pos "n"
    re_lemma = re.compile(r'owns:lemma\s+"([^"]+)"@pt')
    re_pos = re.compile(r'owns:pos\s+"([^"]+)"')

    print(f"Lendo {file_path}...")
    current_lemma = None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Busca lema
            m_lemma = re_lemma.search(line)
            if m_lemma:
                current_lemma = m_lemma.group(1)
            
            # Busca POS se já temos um lema
            if current_lemma:
                m_pos = re_pos.search(line)
                if m_pos:
                    pos = m_pos.group(1)
                    n_lemma = normalize(current_lemma)
                    
                    if n_lemma not in lexicon:
                        lexicon[n_lemma] = {"cat": []}
                    
                    # Mapear tags de WordNet (n, v, a, r) para as do ConjugAI
                    cat = None
                    if pos == 'v': cat = "VERBO"
                    elif pos == 'n': cat = "SUBST"
                    elif pos == 'a': cat = "ADJ"
                    elif pos == 'r': cat = "ADV"
                    
                    if cat and cat not in lexicon[n_lemma]["cat"]:
                        lexicon[n_lemma]["cat"].append(cat)
                    
                    current_lemma = None # Reset para próxima entrada
                    
    return lexicon

def save_alphabet(lexicon, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    alphabet = {}
    for word, data in lexicon.items():
        if not word: continue
        letter = word[0]
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
    input_file = "scripts/cache/own-pt-words.ttl"
    output_dir = "vendors/nlp-pt-br-lite/src/data/wordnet"
    
    if os.path.exists(input_file):
        lex = parse_own_ttl(input_file)
        print(f"Extraídos {len(lex)} lemas de WordNet.")
        save_alphabet(lex, output_dir)
        print(f"Dados salvos em {output_dir}")
    else:
        print(f"Erro: {input_file} não encontrado.")
