#!/usr/bin/env python3
"""Structural checks for template distribution and active project adoption."""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import unquote


LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
EXAMPLE_MARKER = "EXAMPLE CONTEXT"
CANONICAL_SCALARS = [
    "project.id",
    "project.name",
    "project.status",
    "project.context_owner",
    "project.last_reviewed",
    "project.default_language",
    "project.catalog.domains",
    "project.catalog.systems",
    "project.catalog.repositories",
    "project.catalog.interfaces",
    "project.catalog.relations",
    "project.policy_profiles.quality",
    "project.policy_profiles.security_and_compliance",
    "project.policy_profiles.observability",
    "project.project_agent_profiles",
    "project.project_skills",
    "project.project_workflows",
    "project.project_gates",
    "project.workspace.checkout_root",
    "project.workspace.allow_reuse_clean_checkout",
    "project.branching.preferred_base",
    "project.branching.feature_pattern",
    "project.branching.repository_rules_take_precedence",
    "project.documentation.repository_id",
    "project.documentation.fallback_root",
    "project.documentation.adr_path",
    "project.delivery_records.path",
    "project.delivery_records.git_ignored",
    "project.delegation_limits.max_depth",
    "project.delegation_limits.max_parallel_tasks",
    "project.delegation_limits.context_budget",
    "project.delegation_limits.financial_or_tool_budget",
]
REFERENCE_SCALARS = [
    key
    for key in CANONICAL_SCALARS
    if key.startswith("project.catalog.")
    or key.startswith("project.policy_profiles.")
    or key in {"project.project_agent_profiles", "project.project_skills"}
]


def scalar(value: str) -> str | None:
    value = value.strip()
    if not value or value in {"null", "~"}:
        return None
    if value.startswith(("[", "{")):
        return value
    return value.strip('"\'')


def yaml_scalars(text: str) -> dict[str, str | None]:
    """Read scalar paths from the repository's deliberately small YAML subset."""
    values: dict[str, str | None] = {}
    stack: list[tuple[int, str]] = []
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].rstrip()
        if not line.strip() or line.lstrip().startswith("-") or ":" not in line:
            continue
        indent = len(line) - len(line.lstrip(" "))
        key, raw_value = line.strip().split(":", 1)
        while stack and stack[-1][0] >= indent:
            stack.pop()
        path = ".".join([item[1] for item in stack] + [key])
        parsed = scalar(raw_value)
        if parsed is None and not raw_value.strip():
            values[path] = None
            stack.append((indent, key))
        else:
            values[path] = parsed
    return values


def check_supported_yaml(text: str, source: str, errors: list[str]) -> None:
    """Reject syntax outside the small YAML subset consumed by these validators."""
    block_indent: int | None = None
    for number, raw in enumerate(text.splitlines(), 1):
        indent = len(raw) - len(raw.lstrip(" "))
        if block_indent is not None:
            if not raw.strip() or indent > block_indent:
                continue
            block_indent = None
        if "\t" in raw[: len(raw) - len(raw.lstrip())]:
            errors.append(f"invalid YAML in {source}:{number}: tabs are not allowed for indentation")
        content_chars: list[str] = []
        quote: str | None = None
        escaped = False
        for char in raw:
            if escaped:
                content_chars.append(char)
                escaped = False
                continue
            if char == "\\" and quote == '"':
                content_chars.append(char)
                escaped = True
                continue
            if char in {'"', "'"}:
                if quote is None:
                    quote = char
                elif quote == char:
                    quote = None
                content_chars.append(char)
                continue
            if char == "#" and quote is None:
                break
            content_chars.append(char)
        content = "".join(content_chars).rstrip()
        if not content.strip():
            continue
        if re.search(r":\s*[|>]\s*$", content):
            block_indent = indent
            continue
        if quote == '"':
            errors.append(f"invalid YAML in {source}:{number}: unterminated double-quoted scalar")
        if quote == "'":
            errors.append(f"invalid YAML in {source}:{number}: unterminated single-quoted scalar")
        collection_stack: list[str] = []
        current_quote: str | None = None
        escaped = False
        pairs = {"]": "[", "}": "{"}
        for char in content:
            if escaped:
                escaped = False
                continue
            if char == "\\" and current_quote == '"':
                escaped = True
                continue
            if char in {'"', "'"}:
                if current_quote is None:
                    current_quote = char
                elif current_quote == char:
                    current_quote = None
                continue
            if current_quote:
                continue
            if char in "[{":
                collection_stack.append(char)
            elif char in "]}":
                if not collection_stack or collection_stack.pop() != pairs[char]:
                    errors.append(f"invalid YAML in {source}:{number}: unbalanced inline collection")
                    collection_stack = []
                    break
        if collection_stack:
            errors.append(f"invalid YAML in {source}:{number}: unclosed inline collection")
        if not content.lstrip().startswith("-") and ":" not in content:
            errors.append(f"invalid YAML in {source}:{number}: expected mapping entry")


def project_gate_definitions(text: str) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    active = False
    current: dict[str, str] | None = None
    for raw in text.splitlines():
        if re.match(r"^  project_gates:\s*\[\s*\]\s*(?:#.*)?$", raw):
            return []
        if re.match(r"^  project_gates:\s*$", raw):
            active = True
            continue
        if active and raw.strip() and len(raw) - len(raw.lstrip(" ")) <= 2:
            break
        if not active or not raw.strip() or raw.lstrip().startswith("#"):
            continue
        item = re.match(r"^    - id:\s*([a-z0-9-]+)\s*(?:#.*)?$", raw)
        if item:
            if current:
                result.append(current)
            current = {"id": item.group(1)}
            continue
        field = re.match(r"^      (applicability|accountable_role):\s*([^#\s][^#]*?)\s*(?:#.*)?$", raw)
        if field and current is not None:
            current[field.group(1)] = field.group(2).strip().strip("\"'")
    if current:
        result.append(current)
    return result


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


def configured_adoption(root: Path) -> tuple[str | None, str | None]:
    squad = root / "squad.yaml"
    if not squad.is_file():
        return None, None
    values = yaml_scalars(squad.read_text(encoding="utf-8"))
    return values.get("spec.adoption.mode"), values.get("spec.adoption.project_config")


def check_structure(root: Path, mode: str, errors: list[str]) -> None:
    manifest = root / ".squad" / "manifest.yaml"
    if not manifest.is_file():
        errors.append("missing .squad/manifest.yaml")
        return
    text = manifest.read_text(encoding="utf-8")
    for item in manifest_list(text, "required_directories"):
        if not (root / item).is_dir():
            errors.append(f"missing required directory: {item}")
    for item in manifest_list(text, "required_files"):
        if mode == "active" and item == ".project/project.example.yaml":
            continue
        if not (root / item).is_file():
            errors.append(f"missing required file: {item}")
    manifest_values = yaml_scalars(text)
    squad_values = yaml_scalars((root / "squad.yaml").read_text(encoding="utf-8")) if (root / "squad.yaml").is_file() else {}
    if manifest_values.get("template_version") != squad_values.get("metadata.version"):
        errors.append("manifest template_version differs from squad.yaml metadata.version")


def check_links(root: Path, errors: list[str]) -> None:
    for document in root.rglob("*.md"):
        relative_parts = document.relative_to(root).parts
        if any(part.startswith(".") and part not in {".squad", ".project"} for part in relative_parts):
            continue
        text = document.read_text(encoding="utf-8")
        for raw_target in LINK.findall(text):
            target = raw_target.strip().strip("<>")
            if not target or target.startswith(("#", "http://", "https://", "mailto:")):
                continue
            clean = unquote(target.split("#", 1)[0]).split(":", 1)[0]
            if clean and not (document.parent / clean).resolve().exists():
                relative = document.relative_to(root).as_posix()
                errors.append(f"broken local link in {relative}: {raw_target}")


def check_docs_first_boundary(root: Path, errors: list[str]) -> None:
    forbidden = ["pyproject.toml", "runtime.yaml", "src/agentic_squad", ".squad/state", ".squad/effective"]
    for item in forbidden:
        if (root / item).exists():
            errors.append(f"obsolete platform artifact still present: {item}")
    for source in root.rglob("*.py"):
        relative = source.relative_to(root)
        if not relative.parts or relative.parts[0] != "scripts":
            errors.append(f"executable Python outside optional scripts: {relative.as_posix()}")


def check_gate_registry(root: Path, errors: list[str]) -> None:
    registry = root / ".squad" / "registries" / "gates.yaml"
    if not registry.is_file():
        errors.append("missing .squad/registries/gates.yaml")
        return
    ids = re.findall(r"^\s+- id:\s*([a-z0-9-]+)\s*$", registry.read_text(encoding="utf-8"), re.MULTILINE)
    if len(ids) != len(set(ids)):
        errors.append("duplicate gate id in .squad/registries/gates.yaml")
    for required in ("principal-review", "delivery"):
        if required not in ids:
            errors.append(f"missing universal gate id: {required}")


def check_project_gates(text: str, universal_ids: set[str], errors: list[str]) -> None:
    active = False
    for raw in text.splitlines():
        inline = re.match(r"^  project_gates:\s*(.*?)\s*(?:#.*)?$", raw)
        if inline:
            active = True
            value = inline.group(1)
            if value and not re.fullmatch(r"\[\s*\]", value):
                errors.append("project_gates supports only [] or the documented block-list shape")
            if value:
                active = False
            continue
        if active and raw.strip() and len(raw) - len(raw.lstrip(" ")) <= 2:
            active = False
        if active and re.match(r"^    -\s+", raw) and not re.match(r"^    - id:\s*[a-z0-9-]+\s*(?:#.*)?$", raw):
            errors.append("project gate item requires a valid id as its first field")
    seen: set[str] = set()
    for gate in project_gate_definitions(text):
        gate_id = gate.get("id")
        if not gate_id or gate_id in seen:
            errors.append(f"missing or duplicate project gate id: {gate_id!r}")
        elif gate_id in universal_ids:
            errors.append(f"project gate collides with universal gate: {gate_id}")
        seen.add(gate_id or "")
        if gate.get("applicability") not in {"always", "conditional"}:
            errors.append(f"project gate {gate_id!r} has invalid applicability")
        if not gate.get("accountable_role"):
            errors.append(f"project gate {gate_id!r} requires accountable_role")


def check_registry_paths(root: Path, errors: list[str]) -> None:
    for relative in (".squad/registries/artifacts.yaml", ".squad/registries/workflows.yaml"):
        registry = root / relative
        if not registry.is_file():
            errors.append(f"missing registry: {relative}")
            continue
        for path in re.findall(r":\s*(\.squad/[^\s#]+)\s*$", registry.read_text(encoding="utf-8"), re.MULTILINE):
            if not (root / path).exists():
                errors.append(f"registry path does not exist in {relative}: {path}")


def check_project_context(root: Path, mode: str, config_value: str | None, errors: list[str]) -> None:
    expected = ".project/project.example.yaml" if mode == "template" else ".project/project.yaml"
    config_relative = config_value or expected
    if config_relative != expected:
        errors.append(f"{mode} mode requires adoption.project_config={expected}")
    config = root / config_relative
    if not config.is_file():
        errors.append(f"missing project config for {mode} mode: {config_relative}")
        return
    text = config.read_text(encoding="utf-8")
    check_supported_yaml(text, config_relative, errors)
    values = yaml_scalars(text)
    for key in CANONICAL_SCALARS:
        if key not in values:
            errors.append(f"project config missing canonical scalar: {key}")

    safe_defaults = {
        "project.workspace.checkout_root": "runtime-managed",
        "project.branching.repository_rules_take_precedence": "true",
        "project.delivery_records.path": "deliveries",
        "project.delivery_records.git_ignored": "true",
    }
    for key, expected_value in safe_defaults.items():
        if values.get(key) != expected_value:
            errors.append(f"project config requires safe default {key}={expected_value}")
    if values.get("project.documentation.fallback_root") == "deliveries":
        errors.append("project documentation fallback cannot be deliveries")
    feature_pattern = values.get("project.branching.feature_pattern") or ""
    if "{demand_id}" not in feature_pattern or "{slug}" not in feature_pattern:
        errors.append("project.branching.feature_pattern requires {demand_id} and {slug}")

    status = values.get("project.status")
    expected_status = "example" if mode == "template" else "active"
    if status != expected_status:
        errors.append(f"project.status must be {expected_status}, got {status!r}")

    registry = root / ".squad" / "registries" / "gates.yaml"
    universal_ids = set(re.findall(r"^\s+- id:\s*([a-z0-9-]+)\s*$", registry.read_text(encoding="utf-8"), re.MULTILINE)) if registry.is_file() else set()
    check_project_gates(text, universal_ids, errors)

    project = root / ".project"
    if mode == "template":
        for document in project.rglob("*.md"):
            if EXAMPLE_MARKER not in document.read_text(encoding="utf-8")[:500]:
                errors.append(f"project example lacks visible marker: {document.relative_to(root).as_posix()}")
        for document in project.rglob("*.yaml"):
            if "example" not in document.read_text(encoding="utf-8")[:500].lower():
                errors.append(f"project YAML lacks example status/warning: {document.relative_to(root).as_posix()}")
        return

    owner = values.get("project.context_owner")
    reviewed = values.get("project.last_reviewed")
    if not owner or "placeholder" in owner.lower() or owner.startswith("["):
        errors.append("active project requires non-placeholder project.context_owner")
    try:
        if not reviewed:
            raise ValueError
        date.fromisoformat(reviewed)
    except ValueError:
        errors.append("active project requires ISO project.last_reviewed date")

    for key in REFERENCE_SCALARS:
        reference = values.get(key)
        if not reference:
            continue
        if ".example." in reference or reference.endswith(".example"):
            errors.append(f"active project reference must not use example path: {key}={reference}")
            continue
        path = (root / reference).resolve()
        try:
            path.relative_to(root.resolve())
        except ValueError:
            errors.append(f"active project reference escapes repository: {key}={reference}")
            continue
        if not path.exists():
            errors.append(f"active project reference does not exist: {key}={reference}")
        elif path.is_file() and path.suffix == ".md" and EXAMPLE_MARKER in path.read_text(encoding="utf-8")[:500]:
            errors.append(f"active project references example-marked document: {reference}")

    manifest = root / ".squad" / "manifest.yaml"
    if manifest.is_file():
        for item in manifest_list(manifest.read_text(encoding="utf-8"), "required_files"):
            if item.startswith(".project/") and item.endswith(".md") and "/agent-profiles/" not in item and "/skills/" not in item:
                document = root / item
                if document.is_file() and EXAMPLE_MARKER in document.read_text(encoding="utf-8")[:500]:
                    errors.append(f"active project retains example marker in required context: {item}")


def validate(root: Path, requested_mode: str | None) -> tuple[str, list[str]]:
    errors: list[str] = []
    configured_mode, config_path = configured_adoption(root)
    mode = requested_mode or configured_mode or "template"
    if requested_mode and configured_mode and requested_mode != configured_mode:
        errors.append(f"requested mode {requested_mode!r} conflicts with squad.yaml adoption.mode {configured_mode!r}")
    if mode not in {"template", "active"}:
        errors.append(f"unsupported adoption mode: {mode!r}")
        mode = "template"
    for document in root.rglob("*.yaml"):
        text = document.read_text(encoding="utf-8")
        if text.lstrip().startswith("{"):
            try:
                import json
                json.loads(text)
            except json.JSONDecodeError as exc:
                errors.append(f"invalid JSON-compatible YAML in {document.relative_to(root).as_posix()}: {exc}")
        else:
            check_supported_yaml(text, document.relative_to(root).as_posix(), errors)
    for document in root.rglob("*.yml"):
        check_supported_yaml(document.read_text(encoding="utf-8"), document.relative_to(root).as_posix(), errors)
    check_structure(root, mode, errors)
    check_links(root, errors)
    check_docs_first_boundary(root, errors)
    check_gate_registry(root, errors)
    check_registry_paths(root, errors)
    check_project_context(root, mode, config_path, errors)
    return mode, errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--mode", choices=("template", "active"))
    args = parser.parse_args()
    mode, errors = validate(args.root.resolve(), args.mode)
    if errors:
        print(f"Template validation failed (mode={mode}):")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Template validation passed (mode={mode}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
