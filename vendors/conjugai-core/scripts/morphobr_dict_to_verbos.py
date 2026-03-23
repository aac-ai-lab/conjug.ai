#!/usr/bin/env python3
"""
Converte ficheiros .dict de verbos do MorphoBr (LR-POR/MorphoBr, Apache-2.0)
para o formato verbos.json do conjugai-core (todos os tempos/modos verbais
presentes nos .dict, mais gerúndio, infinitivo, particípio e infinitivo pessoal).

Formato de linha: «forma» «lema»+V+«tag»+…
Ex.: comemos comer+V+PRS+1+PL

Mapeamento de tags MorphoBr → chaves JSON (5 pessoas: eu, tu, ele/ela, nós, eles/vocês):
  PRS → presente | FUT → futuro | PRF → passado
  IMPF → preterito_imperfeito | PQP → preterito_mais_que_perfeito | COND → condicional
  SBJR → subjuntivo_presente | SBJP → subjuntivo_imperfeito | SBJF → subjuntivo_futuro
  IMP → imperativo

  INF (sem pessoa) → infinitivo (string)
  INF+1+SG … → infinitivo_pessoal[0..4]
  GRD → gerundio
  PTPST+M|F+SG|PL → participio.m|f.sg|pl

Índice 4 (eles): prefere 3PL a 2PL (vós), alinhado ao PT-BR.

Uso:
  python3 morphobr_dict_to_verbos.py -i cache/verbs-c.dict -o ../data/verbos.json
  python3 morphobr_dict_to_verbos.py -i cache/*.dict -m ../data/verbos.json -o ../data/verbos.json \\
      --prefer-morphobr --minify

  --require-core  Exige presente+futuro+passado completos (comportamento mais restrito).
  --no-minify     JSON indentado (2 espaços) para diff humano.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

# Tag MorphoBr → chave no JSON (paradigma de 5 pessoas)
TAG_CINCO = {
    "PRS": "presente",
    "FUT": "futuro",
    "PRF": "passado",
    "IMPF": "preterito_imperfeito",
    "PQP": "preterito_mais_que_perfeito",
    "COND": "condicional",
    "SBJR": "subjuntivo_presente",
    "SBJP": "subjuntivo_imperfeito",
    "SBJF": "subjuntivo_futuro",
    "IMP": "imperativo",
}

CHAVES_CINCO = tuple(TAG_CINCO.values())


def empty_cinco() -> list[str | None]:
    return [None] * 5


def new_lemma_raw() -> dict[str, Any]:
    out: dict[str, Any] = {k: empty_cinco() for k in CHAVES_CINCO}
    out["gerundio"] = None
    out["infinitivo"] = None
    out["infinitivo_pessoal"] = empty_cinco()
    out["participio"] = {
        "M": {"SG": None, "PL": None},
        "F": {"SG": None, "PL": None},
    }
    return out


def person_to_slot(num: str, per: str) -> int | None:
    if per == "SG":
        return {"1": 0, "2": 1, "3": 2}.get(num)
    if per == "PL":
        if num == "1":
            return 3
        if num == "2":
            return 4  # vós
        if num == "3":
            return 4  # eles/elas/vocês — preferir quando ambas existem
    return None


def set_cinco(
    raw: dict[str, Any],
    chave: str,
    slot: int,
    num: str,
    per: str,
    form: str,
) -> None:
    """
    Preenche célula do paradigma. Para slots 0–3: primeira forma no .dict ganha
    (evita variantes arcaicas repetidas depois, ex.: imos após vamos em «ir»).
    No índice 4 (plural): 3PL sobrescreve; 2PL só se ainda vazio.
    """
    arr = raw[chave]
    if slot == 4 and per == "PL":
        if num == "3":
            arr[4] = form
        elif num == "2" and arr[4] is None:
            arr[4] = form
    else:
        if arr[slot] is None:
            arr[slot] = form


def parse_line(line: str) -> tuple[str, str, list[str]] | None:
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    parts = line.split()
    if len(parts) < 2:
        return None
    form, analysis = parts[0], parts[1]
    bits = analysis.split("+")
    if len(bits) < 3 or bits[1] != "V":
        return None
    return form, bits[0].strip().lower(), bits


def apply_line(raw: dict[str, Any], form: str, lemma: str, bits: list[str]) -> None:
    tag = bits[2]

    if tag == "GRD" and len(bits) == 3:
        if raw["gerundio"] is None:
            raw["gerundio"] = form
        return

    if tag == "PTPST" and len(bits) >= 5:
        gender, num = bits[3], bits[4]
        if gender in raw["participio"] and num in raw["participio"][gender]:
            cur = raw["participio"][gender][num]
            if cur is None:
                raw["participio"][gender][num] = form
        return

    if tag == "INF":
        if len(bits) == 3:
            if raw["infinitivo"] is None:
                raw["infinitivo"] = form
            return
        if len(bits) >= 5:
            num, per = bits[3], bits[4]
            slot = person_to_slot(num, per)
            if slot is not None:
                ip = raw["infinitivo_pessoal"]
                if slot == 4 and per == "PL":
                    if num == "3":
                        ip[4] = form
                    elif num == "2" and ip[4] is None:
                        ip[4] = form
                elif ip[slot] is None:
                    ip[slot] = form
        return

    if tag in TAG_CINCO:
        # «lema»+V+TAG+«número»+SG|PL → 5 segmentos (ex.: comer+V+PRS+1+SG)
        if len(bits) < 5:
            return
        num, per = bits[3], bits[4]
        slot = person_to_slot(num, per)
        if slot is None:
            return
        set_cinco(raw, TAG_CINCO[tag], slot, num, per, form)


def ingest_dict(path: Path) -> dict[str, dict[str, Any]]:
    paradigms: dict[str, dict[str, Any]] = {}
    with path.open(encoding="utf-8", errors="replace") as f:
        for line in f:
            parsed = parse_line(line)
            if not parsed:
                continue
            form, lemma, bits = parsed
            if lemma not in paradigms:
                paradigms[lemma] = new_lemma_raw()
            apply_line(paradigms[lemma], form, lemma, bits)
    return paradigms


def cinco_completo(arr: list[str | None]) -> list[str] | None:
    if all(x is not None and str(x).strip() != "" for x in arr):
        return [str(x) for x in arr]
    return None


def participio_json(p: dict[str, dict[str, str | None]]) -> dict[str, Any] | None:
    m_sg, m_pl = p["M"]["SG"], p["M"]["PL"]
    f_sg, f_pl = p["F"]["SG"], p["F"]["PL"]
    if all(x is not None for x in (m_sg, m_pl, f_sg, f_pl)):
        return {
            "m": {"sg": m_sg, "pl": m_pl},
            "f": {"sg": f_sg, "pl": f_pl},
        }
    return None


def finalize_lemma(raw: dict[str, Any], require_core: bool) -> dict[str, Any] | None:
    pres = cinco_completo(raw["presente"])
    if pres is None:
        return None
    out: dict[str, Any] = {"presente": pres}

    fut = cinco_completo(raw["futuro"])
    pas = cinco_completo(raw["passado"])
    if require_core and (fut is None or pas is None):
        return None
    if fut is not None:
        out["futuro"] = fut
    if pas is not None:
        out["passado"] = pas

    for k in CHAVES_CINCO:
        if k in ("presente", "futuro", "passado"):
            continue
        sp = cinco_completo(raw[k])
        if sp is not None:
            out[k] = sp

    ip = cinco_completo(raw["infinitivo_pessoal"])
    if ip is not None:
        out["infinitivo_pessoal"] = ip

    if raw["gerundio"]:
        out["gerundio"] = raw["gerundio"]
    if raw["infinitivo"]:
        out["infinitivo"] = raw["infinitivo"]

    pj = participio_json(raw["participio"])
    if pj is not None:
        out["participio"] = pj

    return out


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


def _merge_list_five(a: list[Any], b: list[Any], prefer_b: bool) -> list[str]:
    a = (list(a) + [""] * 5)[:5]
    b = (list(b) + [""] * 5)[:5]
    out: list[str] = []
    for i in range(5):
        va, vb = str(a[i] or ""), str(b[i] or "")
        if prefer_b and vb:
            out.append(vb)
        elif vb and not va:
            out.append(vb)
        else:
            out.append(va or vb)
    return out


def merge_lemma_entry(
    base: dict[str, Any],
    inc: dict[str, Any],
    prefer_inc: bool,
) -> dict[str, Any]:
    """Funde duas entradas de verbo já no formato JSON final."""
    keys = set(base) | set(inc)
    out: dict[str, Any] = {}
    for k in keys:
        vb, vi = base.get(k), inc.get(k)
        if k == "participio":
            if isinstance(vb, dict) and isinstance(vi, dict):
                out[k] = {
                    "m": {
                        "sg": (vi.get("m") or {}).get("sg") or (vb.get("m") or {}).get("sg"),
                        "pl": (vi.get("m") or {}).get("pl") or (vb.get("m") or {}).get("pl"),
                    },
                    "f": {
                        "sg": (vi.get("f") or {}).get("sg") or (vb.get("f") or {}).get("sg"),
                        "pl": (vi.get("f") or {}).get("pl") or (vb.get("f") or {}).get("pl"),
                    },
                }
                if prefer_inc:
                    for g in ("m", "f"):
                        for nk in ("sg", "pl"):
                            iv = (vi.get(g) or {}).get(nk)
                            if iv:
                                out[k][g][nk] = iv
            elif isinstance(vi, dict):
                out[k] = vi
            elif isinstance(vb, dict):
                out[k] = vb
            continue
        if isinstance(vb, list) and isinstance(vi, list):
            out[k] = _merge_list_five(vb, vi, prefer_inc)
        elif isinstance(vi, list):
            out[k] = list(vi)
        elif isinstance(vb, list):
            out[k] = list(vb)
        elif prefer_inc and vi is not None:
            out[k] = vi
        elif vi is not None and vi != "" and vi != []:
            out[k] = vi
        elif vb is not None:
            out[k] = vb
        elif vi is not None:
            out[k] = vi
    return out


def merge_json_entries(
    base: dict[str, Any],
    incoming: dict[str, Any],
    prefer_incoming: bool,
) -> dict[str, Any]:
    """Preserva lemas só em `base`; sobrepõe/funde com `incoming`."""
    out: dict[str, Any] = {k: dict(v) for k, v in base.items()}
    for lemma, inc in incoming.items():
        if lemma not in out:
            out[lemma] = dict(inc)
        else:
            out[lemma] = merge_lemma_entry(out[lemma], inc, prefer_incoming)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="MorphoBr .dict → verbos.json (léxico estendido)")
    ap.add_argument(
        "-i",
        "--input",
        type=Path,
        action="append",
        required=True,
        help="Ficheiro(s) .dict (repetir -i ou usar glob no shell)",
    )
    ap.add_argument("-o", "--output", type=Path, required=True, help="verbos.json")
    ap.add_argument(
        "-m",
        "--merge",
        type=Path,
        help="verbos.json existente para fundir após ingestão MorphoBr",
    )
    ap.add_argument(
        "--prefer-morphobr",
        action="store_true",
        help="Sobrescrever valores ao fundir com -m",
    )
    ap.add_argument(
        "--whitelist",
        type=Path,
        help="Um lema por linha; só esses lemas no output",
    )
    ap.add_argument(
        "--require-core",
        action="store_true",
        help="Só inclui lema se presente+futuro+passado estiverem completos",
    )
    ap.add_argument(
        "--no-minify",
        action="store_true",
        help="JSON indentado (2 espaços)",
    )
    args = ap.parse_args()

    whitelist = load_whitelist(args.whitelist)

    combined: dict[str, dict[str, Any]] = {}
    for pth in args.input:
        chunk = ingest_dict(pth)
        for lemma, raw in chunk.items():
            if whitelist is not None and lemma not in whitelist:
                continue
            if lemma not in combined:
                combined[lemma] = new_lemma_raw()
            dst = combined[lemma]
            src = raw
            for k in CHAVES_CINCO:
                for i in range(5):
                    v = src[k][i]
                    if v is None:
                        continue
                    if dst[k][i] is None:
                        dst[k][i] = v
            if src["gerundio"] and dst["gerundio"] is None:
                dst["gerundio"] = src["gerundio"]
            if src["infinitivo"] and dst["infinitivo"] is None:
                dst["infinitivo"] = src["infinitivo"]
            for i in range(5):
                v = src["infinitivo_pessoal"][i]
                if v is None:
                    continue
                if dst["infinitivo_pessoal"][i] is None:
                    dst["infinitivo_pessoal"][i] = v
            for g in ("M", "F"):
                for n in ("SG", "PL"):
                    v = src["participio"][g][n]
                    if v is None:
                        continue
                    if dst["participio"][g][n] is None:
                        dst["participio"][g][n] = v

    final: dict[str, Any] = {}
    for lemma, raw in combined.items():
        if whitelist is not None and lemma not in whitelist:
            continue
        fe = finalize_lemma(raw, require_core=args.require_core)
        if fe is not None:
            final[lemma] = fe

    if args.merge:
        base = load_json(args.merge)
        final = merge_json_entries(base, final, prefer_incoming=args.prefer_morphobr)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        if args.no_minify:
            json.dump(final, f, ensure_ascii=False, indent=2)
            f.write("\n")
        else:
            json.dump(final, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Escrito {args.output} — {len(final)} lema(s).", file=sys.stderr)


if __name__ == "__main__":
    main()
