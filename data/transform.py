"""
transform.py
Transforms old JSON question/exercise files into the new unified schema.

Usage:
    python transform.py --input ./old --output ./new
"""

import json
import re
import unicodedata
import argparse
from pathlib import Path


def slugify(text: str) -> str:
    """Convert a source string to a clean filename slug."""
    # Normalize unicode (é -> e, etc.)
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    # Remove file extension if present (.pptx, .pdf, etc.)
    text = re.sub(r'\.\w+$', '', text)
    # Lowercase
    text = text.lower()
    # Replace any non-alphanumeric characters with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    # Strip leading/trailing hyphens
    text = text.strip('-')
    return text


def make_id(slug: str, index: int) -> str:
    """Generate a simple item ID from slug + index."""
    return f"{slug}_{index + 1:03d}"


def transform_item(raw: dict, item_id: str) -> dict:
    """Transform a single question or exercise into the unified Item schema."""
    item = {
        "id": item_id,
        "question": raw.get("question", ""),
        "answer": raw.get("answer", ""),
        "type": raw.get("type", ""),
        "topic": raw.get("topic", ""),
        "difficulty": raw.get("difficulty", ""),
        "code_snippet": raw.get("code_snippet", ""),
    }
    

    # Unify justification / solution_outline -> explanation
    explanation = raw.get("justification") or raw.get("solution_outline") or raw.get("explanation")
    if explanation:
        item["explanation"] = explanation

    # Only keep choices if non-empty (drop "choices": [])
    choices = raw.get("choices")
    if choices:  # This correctly skips None and []
        item["choices"] = choices

    return item


def transform_file(input_path: Path, output_dir: Path) -> dict:
    """
    Transform one input JSON file.
    Returns a summary dict for the metadata file.
    """
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    source = data.get("source", input_path.stem)
    slug = slugify(source)

    # Collect raw items from either "questions" or "exercices" (note the typo in originals)
    raw_items = data.get("questions") or data.get("exercices") or data.get("items") or []

    items = [
        transform_item(raw, make_id(slug, i))
        for i, raw in enumerate(raw_items)
    ]

    new_data = {
        "source": source,
        "items": items,
    }

    output_path = output_dir / f"{slug}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"  {input_path.name} -> {output_path.name}  ({len(items)} items)")

    return {
        "slug": slug,
        "original_filename": input_path.name,
        "output_filename": output_path.name,
        "source": source,
        "item_count": len(items),
    }


def main():
    parser = argparse.ArgumentParser(description="Transform question JSON files to unified schema.")
    parser.add_argument("--input",  default="./old",  help="Directory containing original JSON files")
    parser.add_argument("--output", default="./new",  help="Directory for transformed JSON files")
    args = parser.parse_args()

    input_dir  = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    json_files = sorted(input_dir.glob("*.json"))
    if not json_files:
        print(f"No JSON files found in {input_dir}")
        return

    print(f"Transforming {len(json_files)} file(s)...\n")
    summaries = [transform_file(f, output_dir) for f in json_files]
    print(f"\nDone. {len(summaries)} file(s) written to '{output_dir}'.")


if __name__ == "__main__":
    main()
