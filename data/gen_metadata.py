"""
gen_metadata.py
Scans the transformed JSON files and produces a metadata.json summary.

Usage:
    python gen_metadata.py --input ./new --output ./new/metadata.json
"""

import json
import argparse
from pathlib import Path
from collections import defaultdict


def main():
    parser = argparse.ArgumentParser(description="Generate metadata from unified JSON files.")
    parser.add_argument("--input",  default="./new",                  help="Directory of transformed JSON files")
    parser.add_argument("--output", default="./new/metadata.json",    help="Output path for metadata.json")
    args = parser.parse_args()

    input_dir   = Path(args.input)
    output_path = Path(args.output)

    json_files = sorted(f for f in input_dir.glob("*.json") if f.name != "metadata.json")

    if not json_files:
        print(f"No JSON files found in {input_dir}")
        return

    # Accumulators
    all_types        = set()
    all_difficulties = set()
    all_topics       = set()
    sources          = []
    total_items      = 0

    for path in json_files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        items = data.get("items", [])
        source = data.get("source", path.stem)

        file_types        = set()
        file_difficulties = set()
        file_topics       = set()

        for item in items:
            t = item.get("type", "").strip()
            d = item.get("difficulty", "").strip()
            p = item.get("topic", "").strip()
            if t: file_types.add(t)
            if d: file_difficulties.add(d)
            if p: file_topics.add(p)

        all_types        |= file_types
        all_difficulties |= file_difficulties
        all_topics       |= file_topics
        total_items      += len(items)

        sources.append({
            "source":      source,
            "filename":    path.name,
            "item_count":  len(items),
            "types":       sorted(file_types),
            "difficulties": sorted(file_difficulties),
            "topics":      sorted(file_topics),
        })

    metadata = {
        "total_files":       len(json_files),
        "total_items":       total_items,
        "all_types":         sorted(all_types),
        "all_difficulties":  sorted(all_difficulties),
        "all_topics":        sorted(all_topics),
        "sources":           sources,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"metadata.json written to '{output_path}'")
    print(f"  {len(json_files)} files | {total_items} total items")
    print(f"  {len(all_types)} types: {sorted(all_types)}")
    print(f"  {len(all_difficulties)} difficulties: {sorted(all_difficulties)}")
    print(f"  {len(all_topics)} topics")


if __name__ == "__main__":
    main()
