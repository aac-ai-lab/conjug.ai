#!/usr/bin/env python3
"""
Converte ficheiros .dict do MorphoBr (LR-POR/MorphoBr, Apache-2.0) para verbos.json.

Formato de linha: «forma» «lema»+V+«tempo»+«pessoa»+«número»
Ex.: comemos comer+V+PRS+1+PL

Mapeamento para conjugai-core:
  PRS → presente | FUT → futuro | PRF → passado (Pretérito Perfeito)
  Pessoa: 1SG→0, 2SG→1, 3SG→2, 1PL→3, 3PL→4 (2PL «vós» usa o mesmo índice 4 que 3PL,
          sobrescrevendo se 3PL existir depois no ficheiro — orientação PT-BR / vocês)

Uso:
  python3 morphobr_dict_to_verbos.py -i verbs-c.dict -i verbs-i.dict -o ../data/verbos.json \\
    -m ../data/verbos.json --whitelist morphobr-whitelist.txt --prefer-morphobr
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

TENSES = ("presente", "futuro", "passado")
TAG_TO_COL = {"PRS": "presente", "FUT": "futuro", "PRF": "passado"}


def empty_paradigm() -> dict[str, list[str | None]]:
    return {
        "presente": [None] * 5,
        "futuro": [None] * 5,
        "passado": [None] * 5,
    }


def person_to_slot(num: str, per: str) -> int | None:
    if per == "SG":
        return {"1": 0, "2": 1, "3": 2}.get(num)
    if per == "PL":
        if num == "1":
            return 3
        if num == "2":
            return 4  # vós
        if num == "3":
            return 4  # eles/elas/vocês — preferir esta forma quando ambas existem
    return None


def parse_line(line: str) -> tuple[str, str, str, int, str, str] | None:
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    parts = line.split()
    if len(parts) < 2:
        return None
    form, analysis = parts[0], parts[1]
    bits = analysis.split("+")
    if len(bits) < 6 or bits[1] != "V":
        return None
    lemma = bits[0].strip().lower()
    tag = bits[2]
    if tag not in TAG_TO_COL:
        return None
    num, per = bits[3], bits[4]
    slot = person_to_slot(num, per)
    if slot is None:
        return None
    col = TAG_TO_COL[tag]
    return (lemma, form, col, slot, num, per)


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def load_whitelist(path: Path | None) -> set[str] | None:
    if path is None:
        return None
    out: set[str] = set()
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip().lower()
        if not line or line.startswith("#"):
            continue
        out.add(line)
    return out


def filter_by_whitelist(
    paradigms: dict[str, Any], whitelist: set[str] | None
) -> dict[str, Any]:
    if whitelist is None:
        return paradigms
    return {k: v for k, v in paradigms.items() if k in whitelist}


def merge_paradigms(
    base: dict[str, dict[str, list[str]]],
    incoming: dict[str, dict[str, list[str | None]]],
    prefer_incoming: bool,
) -> dict[str, dict[str, list[str | None]]]:
    out: dict[str, dict[str, list[str | None]]] = {}
    for lemma, para in base.items():
        out[lemma] = {
            "presente": [para["presente"][i] for i in range(5)],
            "futuro": [para["futuro"][i] for i in range(5)],
            "passado": [para["passado"][i] for i in range(5)],
        }
    for lemma, para in incoming.items():
        if lemma not in out:
            out[lemma] = empty_paradigm()
        for t in TENSES:
            for i in range(5):
                v = para[t][i]
                if v is None:
                    continue
                old = out[lemma][t][i]
                if old is None or prefer_incoming:
                    out[lemma][t][i] = v
    return out


def finalize(paradigms: dict[str, dict[str, list[str | None]]]) -> dict[str, dict[str, list[str]]]:
    clean: dict[str, dict[str, list[str]]] = {}
    for lemma, p in paradigms.items():
        holes = []
        for t in TENSES:
            for i in range(5):
                if p[t][i] is None:
                    holes.append(f"{t}[{i}]")
        if holes:
            print(f"[omit] {lemma} incompleto: {', '.join(holes)}", file=sys.stderr)
            continue
        clean[lemma] = {
            "presente": [p["presente"][i] for i in range(5)],  # type: ignore[misc]
            "futuro": [p["futuro"][i] for i in range(5)],
            "passado": [p["passado"][i] for i in range(5)],
        }
    return clean


def ingest_dict(path: Path) -> dict[str, dict[str, list[str | None]]]:
    """
    Lê .dict. Para o índice 4 (plural), prefere 3PL (eles/vocês) a 2PL (vós).
    """
    paradigms: dict[str, dict[str, list[str | None]]] = {}
    with path.open(encoding="utf-8", errors="replace") as f:
        for line in f:
            parsed = parse_line(line)
            if not parsed:
                continue
            lemma, form, col, slot, num, per = parsed
            if lemma not in paradigms:
                paradigms[lemma] = empty_paradigm()
            if slot == 4 and per == "PL":
                if num == "3":
                    paradigms[lemma][col][4] = form
                elif num == "2" and paradigms[lemma][col][4] is None:
                    paradigms[lemma][col][4] = form
            else:
                paradigms[lemma][col][slot] = form
    return paradigms


def main() -> None:
    ap = argparse.ArgumentParser(description="MorphoBr .dict → verbos.json")
    ap.add_argument(
        "-i",
        "--input",
        type=Path,
        action="append",
        required=True,
        help="Ficheiro(s) .dict (pode repetir -i)",
    )
    ap.add_argument("-o", "--output", type=Path, required=True, help="verbos.json")
    ap.add_argument(
        "-m",
        "--merge",
        type=Path,
        help="verbos.json existente para fundir",
    )
    ap.add_argument(
        "--prefer-morphobr",
        action="store_true",
        help="Sobrescrever formas já presentes no merge (senão só preenche buracos)",
    )
    ap.add_argument(
        "--whitelist",
        type=Path,
        help="Ficheiro com um lema por linha; só esses lemas entram no JSON final",
    )
    args = ap.parse_args()
    whitelist = load_whitelist(args.whitelist)

    combined: dict[str, dict[str, list[str | None]]] = {}
    for pth in args.input:
        chunk = ingest_dict(pth)
        for lemma, para in chunk.items():
            if lemma not in combined:
                combined[lemma] = empty_paradigm()
            for t in TENSES:
                for i in range(5):
                    v = para[t][i]
                    if v is None:
                        continue
                    combined[lemma][t][i] = v

    combined = filter_by_whitelist(combined, whitelist)

    if args.merge:
        base = load_json(args.merge)
        merged = merge_paradigms(base, combined, prefer_incoming=args.prefer_morphobr)
        merged = filter_by_whitelist(merged, whitelist)
        final = finalize(merged)
    else:
        final = finalize(combined)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Escrito {args.output} — {len(final)} lema(s) completos.")


if __name__ == "__main__":
    main()
