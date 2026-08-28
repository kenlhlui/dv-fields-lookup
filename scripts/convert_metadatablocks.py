#!/usr/bin/env python3
"""Convert src/data/metadatablocks.json (raw Dataverse /api/metadatablocks export)
into the flat shape used by src/data/metadata.json (see src/lib/metadata.ts for
the validated shape).

Compound fields (typeClass "compound") are not emitted themselves; their
childFields are flattened into the output in place, matching how metadata.json
already treats e.g. datasetContact's child fields as top-level entries.

`bestPracticeDefinition`, `recommendation`, and `example` don't exist in
metadatablocks.json (today they come from fields.xlsx) so they're left out of
the generated output entirely; the schema marks them optional for exactly
this reason. Merging them in is future work per the user.
"""
import argparse
import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "src" / "data"

# Dataverse's metadatablocks API has no block-level "description" -- these are
# hand-written summaries carried over from the current metadata.json. A block
# id not listed here falls back to its displayName (see convert_block).
BLOCK_DESCRIPTIONS = {
    "citation": "Core information used to identify, describe, and cite a dataset.",
    "geospatial": "Spatial coverage, geographic boundaries, and geospatial reference metadata for a dataset.",
    "socialscience": "Study design, data collection methodology, and population concepts used in social science and humanities research.",
    "astrophysics": "Observational targets, equipment, and coverage used to collect astronomy and astrophysics data.",
    "biomedical": "Experimental design, organisms, and assay information for life sciences data.",
    "journal": "Journal volume, issue, and article information associated with a dataset.",
    "customMRA": "Terms for browsing the Murray Research Archive collection.",
    "customGSD": "Studio submission metadata for Graduate School of Design projects.",
    "customARCS": "Data sharing, consent, and disclosure fields for the Alliance for Research on Corporate Sustainability.",
    "customPSRI": "Replication checklist fields for the Political Science Replication Initiative.",
    "customPSI": "Behavior, population, and intervention fields used to classify PSI studies.",
    "customCHIA": "Dataset source, variable, classification, and provenance documentation fields.",
    "customDigaai": "Publication metadata for Digaai (title, issue, date, and place of publication).",
    "customSAEF": "Manuscript identifiers, dates, people, and themes associated with the SAEF collection.",
    "computationalworkflow": "Information describing a computational workflow that composes and executes a series of computational methods.",
    "LocalContextsCVoc": "Local Contexts project reference for TK and BC Labels.",
    "3dobjects": "Technique, capture, and format information for 3D object data.",
    "heal": "NIH HEAL Initiative study registration, translational focus, and data-sharing metadata.",
}

# (raw "type", isControlledVocabulary) -> metadata.json's friendly type label.
TYPE_MAP = {
    ("TEXT", False): "Text",
    ("TEXT", True): "Controlled Vocabulary",
    ("TEXTBOX", False): "Text (multi-line)",
    ("DATE", False): "Date",
    ("INT", False): "Number (integer)",
    ("FLOAT", False): "Number",
    ("URL", False): "URL",
    ("EMAIL", False): "Email",
}


def convert_field(raw):
    key = (raw["type"], raw["isControlledVocabulary"])
    try:
        field_type = TYPE_MAP[key]
    except KeyError:
        raise ValueError(f"Unknown field type/CV combo {key} for field {raw['name']!r}")

    field = {
        "id": raw["name"],
        "name": raw["displayName"],
        "definition": raw["description"],
        "type": field_type,
        "required": raw["isRequired"],
        "repeatable": raw["multiple"],
    }
    if raw["isControlledVocabulary"]:
        field["values"] = raw.get("controlledVocabularyValues", [])
    return field


def flatten_fields(raw_fields):
    """Depth-first flatten, recursing into compound childFields in place."""
    out = []
    for raw in raw_fields.values():
        if raw["typeClass"] == "compound":
            out.extend(flatten_fields(raw.get("childFields", {})))
        else:
            out.append(convert_field(raw))
    return out


def convert_block(raw):
    block_id = raw["name"]
    if block_id not in BLOCK_DESCRIPTIONS:
        print(f"warning: no known description for block {block_id!r}, using displayName", file=sys.stderr)
    return {
        "id": block_id,
        "name": raw["displayName"],
        "description": BLOCK_DESCRIPTIONS.get(block_id, raw["displayName"]),
        "fields": flatten_fields(raw["fields"]),
    }


def convert(raw_export):
    return [convert_block(b) for b in raw_export["data"]]


def verify(generated, existing_path):
    """Self-check: structural fields (everything but the xlsx-sourced ones)
    should match the current metadata.json exactly. Returns a list of
    mismatch descriptions (empty means clean)."""
    existing = json.loads(existing_path.read_text())
    existing_map = {(b["id"], f["id"]): f for b in existing for f in b["fields"]}
    generated_map = {(b["id"], f["id"]): f for b in generated for f in b["fields"]}

    structural_keys = ("id", "name", "definition", "type", "required", "repeatable", "values")
    problems = []
    for key, gen_field in generated_map.items():
        old_field = existing_map.get(key)
        if old_field is None:
            problems.append(f"new field not in existing metadata.json: {key}")
            continue
        for k in structural_keys:
            if gen_field.get(k) != old_field.get(k):
                problems.append(f"{key} field {k!r}: {old_field.get(k)!r} -> {gen_field.get(k)!r}")
    for key in existing_map:
        if key not in generated_map:
            problems.append(f"field removed vs existing metadata.json: {key}")
    return problems


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DATA_DIR / "metadatablocks.json")
    parser.add_argument("--output", type=Path, default=DATA_DIR / "metadata.generated.json",
                         help="Never defaults to metadata.json -- bestPracticeDefinition/"
                              "recommendation/example live there and this script can't produce them.")
    parser.add_argument("--verify", action="store_true",
                         help="Diff structural fields against src/data/metadata.json and exit 1 on mismatch.")
    args = parser.parse_args()

    raw_export = json.loads(args.input.read_text())
    generated = convert(raw_export)

    args.output.write_text(json.dumps(generated, indent=2) + "\n")
    field_count = sum(len(b["fields"]) for b in generated)
    print(f"wrote {len(generated)} blocks / {field_count} fields to {args.output}")

    if args.verify:
        problems = verify(generated, DATA_DIR / "metadata.json")
        if problems:
            print(f"\n{len(problems)} mismatch(es) vs metadata.json:", file=sys.stderr)
            for p in problems:
                print(f"  {p}", file=sys.stderr)
            sys.exit(1)
        print("verify: OK, matches metadata.json (structural fields only)")


if __name__ == "__main__":
    main()
