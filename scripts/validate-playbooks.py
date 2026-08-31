#!/usr/bin/env python3
"""Validate operational playbooks and retained machine-readable results."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
EXPECTED = ["feature", "bugfix", "tests", "technical-discovery", "performance", "adr", "finops", "doc", "refactor"]
REQUIRED_SECTIONS = [
    "Purpose", "When to use", "Do not use when", "Inputs and autonomous discovery",
    "Blocking questions", "Preconditions", "Operational steps", "Semantic decisions",
    "Deterministic checks", "Failure, cancellation and recovery", "Outputs and evidence",
    "Completion criteria",
]
PERMISSION_FIELDS = {
    "requires_repository_read", "may_write_files", "may_create_local_branch",
    "may_push", "may_merge", "may_deploy", "may_release", "may_delete",
}
EXTERNAL_PERMISSION_FIELDS = {"may_push", "may_merge", "may_deploy", "may_release", "may_delete"}
TERMINAL_FAILURES = {"failed", "partial", "blocked"}
RESULT_STATUSES = {"completed", "partial", "failed", "blocked", "needs_user_input", "cancelled", "timed_out"}
COMPLETED_REPOSITORY_RESULTS = {"verified", "not_applicable"}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def workflow_ids(root: Path) -> set[str]:
    text = (root / ".squad" / "registries" / "workflows.yaml").read_text(encoding="utf-8")
    return set(re.findall(r"^  ([a-z0-9-]+):\s+\.squad/workflows/", text, re.MULTILINE))


def front_matter(text: str) -> dict[str, Any]:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not match:
        raise ValueError("missing JSON-compatible YAML front matter")
    value = json.loads(match.group(1))
    if not isinstance(value, dict):
        raise ValueError("front matter must be an object")
    return value


def required_nonempty(data: dict[str, Any], fields: tuple[str, ...], kind: str) -> list[str]:
    return [f"{kind} missing {field}" for field in fields if data.get(field) in (None, "", [])]


def validate_artifact(kind: str, data: dict[str, Any]) -> list[str]:
    """Validate objective invariants; semantic truth still requires external evidence/review."""
    errors: list[str] = []
    if not isinstance(data, dict):
        return [f"{kind} must be an object"]

    if kind == "repository-workspace":
        errors += required_nonempty(data, ("workspace_id", "demand_id", "root_kind", "repositories"), kind)
        if data.get("root_kind") != "runtime-managed":
            errors.append("repository-workspace root_kind must be runtime-managed")
        for repo in data.get("repositories", []):
            if not isinstance(repo, dict):
                errors.append("repository-workspace repository entry must be an object")
                continue
            if repo.get("outside_template") is not True:
                errors.append("repository checkout requires outside_template true")
            if repo.get("local_path_ref", "").replace("\\", "/").startswith((".squad/", "./.squad/")):
                errors.append("repository checkout cannot be inside .squad")
            local_ref = str(repo.get("local_path_ref", ""))
            if local_ref != "runtime-private" and not re.match(r"^(?:[A-Za-z]:[/\\]|/)", local_ref):
                errors.append("repository checkout path must be opaque or absolute outside the template")
            if repo.get("checkout_state") == "reused" and repo.get("dirty_before") is not False:
                errors.append("dirty checkout cannot be silently reused")
            if repo.get("access") != "verified" and repo.get("checkout_state") in {"cloned", "reused"}:
                errors.append("usable checkout requires verified access")
            if repo.get("remote_matches_catalog") is not True:
                errors.append("repository remote must be verified against catalog")

    elif kind == "repository-plan":
        errors += required_nonempty(data, ("repository_id", "classification", "reason"), kind)
        if data.get("classification") == "changed":
            errors += required_nonempty(data, (
                "owner", "base_branch", "base_revision", "working_branch", "planned_paths",
                "pipeline_definition", "required_stages", "integration_order", "rollback",
            ), kind)
            if data.get("remote_verified") is not True:
                errors.append("changed repository requires verified remote")
            if data.get("write_authorized") is not True:
                errors.append("changed repository requires explicit write authorization")
            recognized = str(data.get("working_branch", "")).startswith(("feature/", "bugfix/", "hotfix/", "refactor/", "docs/", "test/"))
            approved_exception = bool(data.get("branch_exception")) and data.get("branch_exception_approved") is True
            if not recognized and not approved_exception:
                errors.append("changed repository requires a recognized working branch or approved documented exception")

    elif kind == "documentation-target":
        errors += required_nonempty(data, (
            "document_id", "kind", "owner_repository_id", "target_repository_id",
            "target_path", "status", "routing_reason", "branch", "revision",
        ), kind)
        target = str(data.get("target_path", "")).replace("\\", "/").lstrip("./")
        if target == "deliveries" or target.startswith("deliveries/"):
            errors.append("permanent documentation cannot use deliveries as canonical target")
        if data.get("status") == "accepted" and not data.get("approval_evidence"):
            errors.append("accepted documentation decision requires approval evidence")

    elif kind in {"playbook-result", "multi-repository-result"}:
        errors += required_nonempty(data, ("demand_id", "status", "repositories", "evidence"), kind)
        if data.get("status") not in RESULT_STATUSES:
            errors.append(f"{kind} has unknown result status")
        if kind == "playbook-result":
            errors += required_nonempty(data, ("playbook_id", "playbook_version", "primary_workflow"), kind)
            if data.get("playbook_id") not in EXPECTED:
                errors.append("playbook-result references unknown playbook")
        if kind == "multi-repository-result":
            integration = data.get("integration", {})
            errors += required_nonempty(integration, ("strategy", "order", "cross_repository_checks"), "integration")
            if integration.get("unresolved"):
                errors.append("completed multi-repository result cannot contain unresolved integration items")
        if data.get("status") == "completed":
            repos = data.get("repositories", [])
            if not repos:
                errors.append("completed result requires repository results")
            for repo in repos:
                if not isinstance(repo, dict):
                    errors.append("repository result must be an object")
                    continue
                if repo.get("result") in TERMINAL_FAILURES:
                    errors.append("completed result cannot contain failed, partial, or blocked repository")
                if repo.get("result") not in COMPLETED_REPOSITORY_RESULTS:
                    errors.append("completed result requires verified or not_applicable repository result")
                errors += required_nonempty(repo, ("id", "branch", "revision", "result", "evidence"), "repository result")
            if not data.get("evidence"):
                errors.append("completed result requires retained evidence")
            if kind == "playbook-result" and not data.get("checks"):
                errors.append("completed playbook result requires checks")

            playbook_id = data.get("playbook_id")
            controls = data.get("controls", {})
            if playbook_id == "performance":
                errors += required_nonempty(controls, ("baseline", "comparison", "workload", "environment"), "performance controls")
                if controls.get("comparable") is not True:
                    errors.append("performance completion requires a comparable baseline")
            elif playbook_id == "finops":
                errors += required_nonempty(controls, ("source", "period", "currency", "assumptions", "quality_safeguards"), "finops controls")
                if controls.get("savings_status") == "realized" and not controls.get("verification_evidence"):
                    errors.append("realized savings requires verification evidence")
            elif playbook_id == "adr":
                if controls.get("decision_status") == "accepted" and not controls.get("approval_evidence"):
                    errors.append("accepted ADR requires owner approval evidence")
            elif playbook_id == "doc":
                target = str(controls.get("canonical_target", "")).replace("\\", "/").lstrip("./")
                if not target or target == "deliveries" or target.startswith("deliveries/"):
                    errors.append("doc completion requires a canonical target outside deliveries")
            elif playbook_id == "refactor":
                errors += required_nonempty(controls, ("invariants", "regression_evidence"), "refactor controls")
                if controls.get("functional_change") is not False:
                    errors.append("refactor completion requires functional_change false")
            elif playbook_id == "bugfix":
                errors += required_nonempty(controls, ("reproduction_evidence", "cause_evidence", "regression_evidence"), "bugfix controls")
    else:
        errors.append(f"unknown artifact kind: {kind}")
    return errors


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    registry_path = root / ".squad" / "registries" / "playbooks.yaml"
    if not registry_path.is_file():
        return ["missing .squad/registries/playbooks.yaml"]
    try:
        registry = load_json(registry_path)
    except (json.JSONDecodeError, OSError) as exc:
        return [f"invalid playbook registry: {exc}"]
    if set(registry) != {"schema_version", "playbooks"}:
        errors.append("playbook registry contains missing or unknown top-level fields")
    entries = registry.get("playbooks", [])
    if not isinstance(entries, list):
        return errors + ["playbooks must be a list"]
    ids = [entry.get("id") for entry in entries if isinstance(entry, dict)]
    if ids != EXPECTED:
        errors.append(f"public playbook catalog must be exactly {EXPECTED}, got {ids}")
    aliases: list[str] = []
    workflows = workflow_ids(root)
    required_fields = {
        "id", "name", "version", "optional_invocation", "aliases", "path",
        "primary_workflow", "side_effect_class", "invocation_examples",
        "always_required", "conditional_activation", "outputs", "stop_conditions",
        "permissions",
    }
    for entry in entries:
        if not isinstance(entry, dict):
            errors.append("registry entry must be an object")
            continue
        playbook_id = entry.get("id", "<missing>")
        if set(entry) != required_fields:
            errors.append(f"playbook {playbook_id} contains missing or unknown registry fields")
        if not re.fullmatch(r"\d+\.\d+", str(entry.get("version", ""))):
            errors.append(f"playbook {playbook_id} has invalid version")
        current_aliases = entry.get("aliases")
        if not isinstance(current_aliases, list) or not current_aliases or not all(re.fullmatch(r"[a-z0-9-]+", str(alias)) for alias in current_aliases):
            errors.append(f"playbook {playbook_id} requires valid aliases")
            current_aliases = []
        aliases.extend(current_aliases)
        if entry.get("primary_workflow") not in workflows:
            errors.append(f"playbook {playbook_id} references unknown workflow: {entry.get('primary_workflow')}")
        if entry.get("optional_invocation") is not True:
            errors.append(f"playbook {playbook_id} must be optional")
        examples = entry.get("invocation_examples")
        if not isinstance(examples, list) or not examples or not all(isinstance(example, str) and example.strip() for example in examples):
            errors.append(f"playbook {playbook_id} requires invocation examples")
        required = entry.get("always_required")
        if not isinstance(required, dict) or set(required) != {"roles", "artifacts", "gates"}:
            errors.append(f"playbook {playbook_id} has invalid always_required composition")
        for field in ("conditional_activation", "outputs", "stop_conditions"):
            if not isinstance(entry.get(field), list):
                errors.append(f"playbook {playbook_id} field {field} must be a list")
        if entry.get("side_effect_class") not in {"read-only", "conditional-write", "repository-write"}:
            errors.append(f"playbook {playbook_id} has invalid side_effect_class")
        permissions = entry.get("permissions")
        if not isinstance(permissions, dict) or set(permissions) != PERMISSION_FIELDS:
            errors.append(f"playbook {playbook_id} has incomplete permission contract")
        else:
            if any(permissions[field] is not False for field in EXTERNAL_PERMISSION_FIELDS):
                errors.append(f"playbook {playbook_id} must deny all external/destructive permissions")
            expected_write = entry.get("side_effect_class") != "read-only"
            if permissions["requires_repository_read"] is not True or permissions["may_write_files"] is not expected_write or permissions["may_create_local_branch"] is not expected_write:
                errors.append(f"playbook {playbook_id} permissions conflict with side_effect_class")
        path = root / str(entry.get("path", ""))
        if not path.is_file():
            errors.append(f"playbook {playbook_id} path does not exist: {entry.get('path')}")
            continue
        text = path.read_text(encoding="utf-8")
        try:
            metadata = front_matter(text)
        except (ValueError, json.JSONDecodeError) as exc:
            errors.append(f"playbook {playbook_id} invalid front matter: {exc}")
            metadata = {}
        if metadata.get("schema_version") != registry.get("schema_version"):
            errors.append(f"playbook {playbook_id} front matter differs from registry field: schema_version")
        for field in required_fields:
            if metadata.get(field) != entry.get(field):
                errors.append(f"playbook {playbook_id} front matter differs from registry field: {field}")
        for section in REQUIRED_SECTIONS:
            if not re.search(rf"^## {re.escape(section)}\s*$", text, re.MULTILINE):
                errors.append(f"playbook {playbook_id} missing section: {section}")
        positive_grants = (
            r"\bmay\s+(?:push|merge|deploy|release|delete)\b",
            r"\bpermission\s+to\s+(?:push|merge|deploy|release|delete)\b",
            r"\bpode\s+(?:fazer\s+)?(?:push|merge|deploy|release|excluir|deletar)\b",
            r"\bautorizad[oa]\s+a\s+(?:fazer\s+)?(?:push|merge|deploy|release|excluir|deletar)\b",
        )
        for pattern in positive_grants:
            if re.search(pattern, text, re.IGNORECASE):
                errors.append(f"playbook {playbook_id} prose attempts to grant denied permission")
                break
    if len(aliases) != len(set(aliases)):
        errors.append("duplicate playbook alias")
    if set(aliases) & set(ids):
        errors.append("playbook alias collides with a playbook id")
    bundled = {
        "repository-workspace": ".squad/templates/repository-workspace.json",
        "repository-plan": ".squad/templates/repository-plan.json",
        "documentation-target": ".squad/templates/documentation-target.json",
        "playbook-result": ".squad/templates/playbook-result.json",
        "multi-repository-result": ".squad/templates/multi-repository-result.json",
    }
    for kind, relative in bundled.items():
        path = root / relative
        if not path.is_file():
            errors.append(f"missing structured template: {relative}")
            continue
        try:
            errors.extend(f"{relative}: {error}" for error in validate_artifact(kind, load_json(path)))
        except (json.JSONDecodeError, OSError) as exc:
            errors.append(f"invalid structured template {relative}: {exc}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact-kind", choices=("repository-workspace", "repository-plan", "documentation-target", "playbook-result", "multi-repository-result"))
    parser.add_argument("--artifact-path", type=Path)
    args = parser.parse_args()
    if bool(args.artifact_kind) != bool(args.artifact_path):
        parser.error("--artifact-kind and --artifact-path must be used together")
    if args.artifact_path:
        try:
            errors = validate_artifact(args.artifact_kind, load_json(args.artifact_path))
        except (json.JSONDecodeError, OSError) as exc:
            errors = [f"invalid artifact: {exc}"]
    else:
        errors = validate(ROOT)
    if errors:
        print("Playbook validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    if args.artifact_path:
        print(f"Artifact validation passed: {args.artifact_kind} {args.artifact_path}.")
    else:
        print(f"Playbook validation passed: {', '.join(EXPECTED)}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
