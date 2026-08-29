#!/usr/bin/env python3
"""Optional structural checks for the documentation-first template."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / ".squad" / "manifest.yaml"
LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def manifest_list(text: str, key: str) -> list[str]:
    values: list[str] = []
    active = False
    for line in text.splitlines():
        if line == f"{key}:":
            active = True
            continue
        if active and line.startswith("  - "):
            values.append(line[4:].strip().strip('"\''))
            continue
        if active and line and not line.startswith(" "):
            break
    return values


def check_structure(errors: list[str]) -> None:
    if not MANIFEST.is_file():
        errors.append("missing .squad/manifest.yaml")
        return
    text = MANIFEST.read_text(encoding="utf-8")
    for item in manifest_list(text, "required_directories"):
        if not (ROOT / item).is_dir():
            errors.append(f"missing required directory: {item}")
    for item in manifest_list(text, "required_files"):
        if not (ROOT / item).is_file():
            errors.append(f"missing required file: {item}")


def check_links(errors: list[str]) -> None:
    for document in ROOT.rglob("*.md"):
        if any(part.startswith(".") and part not in {".squad", ".project"} for part in document.relative_to(ROOT).parts):
            continue
        text = document.read_text(encoding="utf-8")
        for raw_target in LINK.findall(text):
            target = raw_target.strip().strip("<>")
            if not target or target.startswith(("#", "http://", "https://", "mailto:")):
                continue
            clean = unquote(target.split("#", 1)[0]).split(":", 1)[0]
            if clean and not (document.parent / clean).resolve().exists():
                relative = document.relative_to(ROOT).as_posix()
                errors.append(f"broken local link in {relative}: {raw_target}")


def check_docs_first_boundary(errors: list[str]) -> None:
    forbidden = [
        "pyproject.toml",
        "runtime.yaml",
        "src/agentic_squad",
        ".squad/state",
        ".squad/effective",
    ]
    for item in forbidden:
        if (ROOT / item).exists():
            errors.append(f"obsolete platform artifact still present: {item}")
    for source in ROOT.rglob("*.py"):
        relative = source.relative_to(ROOT)
        if not relative.parts or relative.parts[0] != "scripts":
            errors.append(f"executable Python outside optional scripts: {relative.as_posix()}")


def check_example_context(errors: list[str]) -> None:
    project = ROOT / ".project"
    for document in project.rglob("*.md"):
        text = document.read_text(encoding="utf-8")
        if "EXAMPLE CONTEXT" not in text[:500]:
            errors.append(f"project example lacks visible marker: {document.relative_to(ROOT).as_posix()}")
    for config in project.rglob("*.yaml"):
        text = config.read_text(encoding="utf-8")
        if "example" not in text[:500].lower():
            errors.append(f"project YAML lacks example status/warning: {config.relative_to(ROOT).as_posix()}")


def main() -> int:
    errors: list[str] = []
    check_structure(errors)
    check_links(errors)
    check_docs_first_boundary(errors)
    check_example_context(errors)
    if errors:
        print("Template validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Template validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
