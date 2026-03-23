#!/usr/bin/env python3
"""
Converte CSV de flexões verbais para o formato verbos.json do conjugai-core.

CSV esperado (UTF-8), com cabeçalho:
  lemma,form,tense,person

  lemma   : infinitivo (ex.: comer)
  form    : forma flexionada (ex.: como)
  tense   : presente | futuro | passado  (alinhado ao motor TS)
  person  : 0..4  → eu, tu, ele/ela, nós, eles (igual a conjugador.ts)

Linhas com mesmo (lemma, tense, person): a última ganha.

Uso:
  python3 csv_to_verbos.py --input flexoes.csv --output verbos.json
  python3 csv_to_verbos.py --input flexoes.csv --merge verbos_atual.json --output verbos.json
  python3 csv_to_verbos.py -i flexoes.csv -m data/verbos.json -o verbos.json --merge-overwrites

Depois: copiar verbos.json para data/; npm run build:core na raiz do projeto.
Para tempos além de presente/futuro/passado, usar o pipeline MorphoBr (`morphobr_dict_to_verbos.py` / `npm run build:lexicon`).
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any

TENSES = ("presente", "futuro", "passado")
PERSON_MAX = 4


def empty_paradigm() -> dict[str, list[str | None]]:
    return {
        "presente": [None] * 5,
        "futuro": [None] * 5,
        "passado": [None] * 5,
    }


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def merge_paradigms(
    base: dict[str, dict[str, list[str | None]]],
    extra: dict[str, dict[str, list[str | None]]],
    overwrite: bool,
) -> dict[str, dict[str, list[str | None]]]:
    out = {k: {t: list(v[t]) for t in TENSES} for k, v in base.items()}
    for lemma, para in extra.items():
        if lemma not in out:
            out[lemma] = empty_paradigm()
        for t in TENSES:
            for i in range(5):
                newv = para[t][i]
                if newv is None:
                    continue
                oldv = out[lemma][t][i]
                if oldv is None or overwrite:
                    out[lemma][t][i] = newv
    return out


def finalize(
    paradigms: dict[str, dict[str, list[str | None]]],
    allow_incomplete: bool,
) -> dict[str, dict[str, list[str]]]:
    """Por omissão só inclui lemas com as 15 células preenchidas."""
    clean: dict[str, dict[str, list[str]]] = {}
    for lemma, p in paradigms.items():
        holes: list[str] = []
        for t in TENSES:
            for i in range(5):
                if p[t][i] is None:
                    holes.append(f"{t}[{i}]")
        if holes:
            print(
                f"[aviso] {lemma} incompleto: {', '.join(holes)}",
                file=sys.stderr,
            )
            if not allow_incomplete:
                continue
            clean[lemma] = {
                "presente": [(p["presente"][i] or "") for i in range(5)],
                "futuro": [(p["futuro"][i] or "") for i in range(5)],
                "passado": [(p["passado"][i] or "") for i in range(5)],
            }
        else:
            clean[lemma] = {
                "presente": [p["presente"][i] for i in range(5)],  # type: ignore[misc]
                "futuro": [p["futuro"][i] for i in range(5)],
                "passado": [p["passado"][i] for i in range(5)],
            }
    return clean


def read_csv(path: Path) -> dict[str, dict[str, list[str | None]]]:
    paradigms: dict[str, dict[str, list[str | None]]] = {}
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        required = {"lemma", "form", "tense", "person"}
        if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
            raise SystemExit(
                f"Cabeçalho tem de incluir: {sorted(required)}; temos: {reader.fieldnames}"
            )
        for row in reader:
            lemma = row["lemma"].strip().lower()
            form = row["form"].strip()
            tense = row["tense"].strip().lower()
            person = int(row["person"].strip())
            if tense not in TENSES:
                raise SystemExit(f"Tempo inválido: {tense!r} em {row}")
            if person < 0 or person > PERSON_MAX:
                raise SystemExit(f"Pessoa inválida: {person} em {row}")
            if lemma not in paradigms:
                paradigms[lemma] = empty_paradigm()
            paradigms[lemma][tense][person] = form
    return paradigms


def json_to_nullable_paradigms(
    data: dict[str, dict[str, list[str]]],
) -> dict[str, dict[str, list[str | None]]]:
    out: dict[str, dict[str, list[str | None]]] = {}
    for lemma, para in data.items():
        out[lemma] = empty_paradigm()
        for t in TENSES:
            for i in range(5):
                v = para[t][i] if i < len(para[t]) else None
                out[lemma][t][i] = v if v else None
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="CSV → verbos.json (conjugai-core)")
    ap.add_argument("--input", "-i", type=Path, required=True, help="CSV: lemma,form,tense,person")
    ap.add_argument("--output", "-o", type=Path, required=True, help="verbos.json de saída")
    ap.add_argument(
        "--merge",
        "-m",
        type=Path,
        help="JSON existente (ex.: verbos atual) para fundir",
    )
    ap.add_argument(
        "--merge-overwrites",
        action="store_true",
        help="Em merge, sobrescrever formas já preenchidas no base",
    )
    ap.add_argument(
        "--allow-incomplete",
        action="store_true",
        help="Incluir lemas com buracos (strings vazias onde faltar). Por omissão omite lemas incompletos.",
    )
    args = ap.parse_args()

    new_data = read_csv(args.input)
    if args.merge:
        base_raw = load_json(args.merge)
        merged = merge_paradigms(
            json_to_nullable_paradigms(base_raw),
            new_data,
            overwrite=args.merge_overwrites,
        )
        final = finalize(merged, allow_incomplete=args.allow_incomplete)
    else:
        final = finalize(new_data, allow_incomplete=args.allow_incomplete)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Escrito {args.output} com {len(final)} lema(s).")


if __name__ == "__main__":
    main()
