#!/usr/bin/env python3
"""Validate objective delivery-state invariants; never semantic adequacy."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DELIVERY_STATUSES = {"triage", "in_progress", "blocked", "needs_user_input", "complete"}
TASK_STATUSES = {"draft", "ready", "in_progress", "completed", "partial", "failed", "blocked", "needs_user_input", "cancelled", "timed_out"}
GATE_DECISIONS = {"PASS", "FAIL", "BLOCKED", "WAIVED", "NOT_APPLICABLE"}


def project_gate_definitions(root: Path) -> list[dict[str, str]]:
    """Read project_gates from the supported project-config YAML subset."""
    config = root / ".project" / ("project.yaml" if (root / ".project" / "project.yaml").is_file() else "project.example.yaml")
    if not config.is_file():
        return []
    result: list[dict[str, str]] = []
    active = False
    current: dict[str, str] | None = None
    for raw in config.read_text(encoding="utf-8").splitlines():
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


def gate_registry(root: Path) -> dict[str, str]:
    registry = root / ".squad" / "registries" / "gates.yaml"
    result: dict[str, str] = {}
    current: str | None = None
    for line in registry.read_text(encoding="utf-8").splitlines():
        match = re.match(r"\s+- id:\s*([a-z0-9-]+)\s*$", line)
        if match:
            current = match.group(1)
            continue
        match = re.match(r"\s+applicability:\s*(always|conditional)\s*$", line)
        if match and current:
            result[current] = match.group(1)
            current = None
    for gate in project_gate_definitions(root):
        gate_id = gate.get("id")
        if gate_id and gate_id not in result and gate.get("applicability") in {"always", "conditional"}:
            result[gate_id] = gate["applicability"]
    return result


def safe_path(delivery: Path, raw: str, errors: list[str]) -> Path | None:
    target = (delivery / raw).resolve()
    try:
        target.relative_to(delivery.resolve())
    except ValueError:
        errors.append(f"path escapes delivery: {raw}")
        return None
    if not target.exists():
        errors.append(f"referenced path does not exist: {raw}")
    return target


def parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def validate_delivery(delivery: Path, root: Path, as_of: datetime) -> list[str]:
    errors: list[str] = []
    state_path = delivery / "delivery-state.json"
    if not state_path.is_file():
        return ["missing delivery-state.json"]
    try:
        state = json.loads(state_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        return [f"invalid delivery-state.json: {exc}"]

    demand_id = state.get("demand_id")
    if demand_id != delivery.name:
        errors.append(f"demand_id {demand_id!r} does not match directory {delivery.name!r}")
    status = state.get("status")
    if status not in DELIVERY_STATUSES:
        errors.append(f"invalid delivery status: {status!r}")

    index = delivery / "delivery-index.md"
    if index.is_file():
        match = re.search(r"^- Status:\s*`?([a-z_-]+)`?\s*$", index.read_text(encoding="utf-8"), re.MULTILINE)
        if match and match.group(1).replace("-", "_") != status:
            errors.append("delivery-index status differs from delivery-state.json")

    artifacts = state.get("artifacts", {})
    for name, path in artifacts.items():
        if path is not None and not isinstance(path, str):
            errors.append(f"artifact path must be string/null: {name}")
        elif path:
            safe_path(delivery, path, errors)

    task_ids: set[str] = set()
    for task in state.get("tasks", []):
        task_id = task.get("id")
        if not task_id or task_id in task_ids:
            errors.append(f"missing or duplicate task id: {task_id!r}")
        task_ids.add(task_id)
        task_status = task.get("status")
        if task_status not in TASK_STATUSES:
            errors.append(f"invalid task status for {task_id}: {task_status!r}")
        if task.get("contract"):
            safe_path(delivery, task["contract"], errors)
        if task_status == "completed":
            if not task.get("result"):
                errors.append(f"completed task lacks result: {task_id}")
            else:
                safe_path(delivery, task["result"], errors)
        attempts = task.get("attempts", [])
        if len(attempts) > 1:
            if not task.get("retry_eligible"):
                errors.append(f"multiple attempts without retry eligibility: {task_id}")
            if task.get("operation_class") in {"non-idempotent-write", "destructive", "external-communication"} and not task.get("retry_authorized"):
                errors.append(f"unsafe retry without authorization: {task_id}")
            if any(attempt.get("side_effect_state") == "unknown" for attempt in attempts[:-1]):
                errors.append(f"retry followed unknown side-effect state: {task_id}")

    evidence_ids: set[str] = set()
    for evidence in state.get("evidence", []):
        evidence_id = evidence.get("id")
        if not evidence_id or evidence_id in evidence_ids:
            errors.append(f"missing or duplicate evidence id: {evidence_id!r}")
        evidence_ids.add(evidence_id)
        evidence_path = evidence.get("path")
        if not isinstance(evidence_path, str) or not evidence_path.strip():
            errors.append(f"evidence {evidence_id!r} requires a non-empty path")
        else:
            safe_path(delivery, evidence_path, errors)

    registry = gate_registry(root)
    gate_ids: set[str] = set()
    gates = state.get("gates", [])
    current_gates: dict[str, list[dict]] = {}
    for gate in gates:
        decision_id = gate.get("id")
        gate_name = gate.get("gate")
        decision = gate.get("decision")
        if not decision_id or decision_id in gate_ids:
            errors.append(f"missing or duplicate gate decision id: {decision_id!r}")
        gate_ids.add(decision_id)
        if gate_name not in registry:
            errors.append(f"unknown universal or project gate id: {gate_name!r}")
        if decision not in GATE_DECISIONS:
            errors.append(f"invalid decision for {decision_id}: {decision!r}")
        for required in ("demand_id", "evaluator_role", "evaluated_at", "scope", "criteria", "findings", "residual_risk", "exception_id", "invalidated_by"):
            if required not in gate:
                errors.append(f"gate {decision_id} missing field: {required}")
        if gate.get("demand_id") != demand_id:
            errors.append(f"gate {decision_id} demand_id mismatch")
        try:
            evaluated_at = parse_time(gate.get("evaluated_at", ""))
        except (TypeError, ValueError):
            evaluated_at = None
            errors.append(f"gate {decision_id} has invalid evaluated_at")
        criteria = gate.get("criteria", [])
        for criterion in criteria:
            for required in ("id", "result", "evidence", "notes"):
                if required not in criterion:
                    errors.append(f"gate {decision_id} criterion missing field: {required}")
            for evidence_id in criterion.get("evidence", []):
                if evidence_id not in evidence_ids:
                    errors.append(f"gate {decision_id} references unknown evidence: {evidence_id}")
        if decision == "PASS" and (not criteria or any(item.get("result") != "pass" or not item.get("evidence") for item in criteria)):
            errors.append(f"PASS gate has failed/missing-evidence criterion: {decision_id}")
        if decision == "NOT_APPLICABLE":
            if registry.get(gate_name) != "conditional":
                errors.append(f"always gate cannot be NOT_APPLICABLE: {gate_name}")
            if not criteria or any(not item.get("notes") for item in criteria):
                errors.append(f"NOT_APPLICABLE gate requires criterion rationale: {decision_id}")
        if decision == "WAIVED":
            exception = gate.get("exception")
            if not gate.get("exception_id") or not exception or exception.get("status") != "approved":
                errors.append(f"WAIVED gate lacks approved exception: {decision_id}")
            else:
                try:
                    if parse_time(exception["expires_at"]) <= as_of:
                        errors.append(f"WAIVED gate exception expired: {decision_id}")
                except (KeyError, ValueError):
                    errors.append(f"WAIVED gate exception has invalid expiry: {decision_id}")
        invalidated_by = gate.get("invalidated_by")
        if isinstance(invalidated_by, list) and not invalidated_by:
            current_gates.setdefault(gate_name, []).append(gate)

    gates_by_id = {gate.get("id"): gate for gate in gates if gate.get("id")}
    for gate in gates:
        invalidators = gate.get("invalidated_by", [])
        if not isinstance(invalidators, list):
            errors.append(f"gate {gate.get('id')} invalidated_by must be a list")
            continue
        for invalidator_id in invalidators:
            invalidator = gates_by_id.get(invalidator_id)
            if not invalidator:
                errors.append(f"gate {gate.get('id')} references unknown invalidator: {invalidator_id}")
            elif invalidator.get("gate") != gate.get("gate"):
                errors.append(f"gate {gate.get('id')} invalidated by a different gate: {invalidator_id}")
            else:
                try:
                    invalidated_at = parse_time(gate.get("evaluated_at", ""))
                    invalidator_at = parse_time(invalidator.get("evaluated_at", ""))
                    if invalidator_at <= invalidated_at:
                        errors.append(f"gate {gate.get('id')} invalidated by non-newer decision: {invalidator_id}")
                except (TypeError, ValueError):
                    pass

    for gate_name, decisions in current_gates.items():
        if len(decisions) != 1:
            errors.append(f"gate {gate_name} has {len(decisions)} conflicting current decisions")

    if status == "complete":
        for required in ("demand", "requirements", "context_bundle", "change_plan", "final_review", "delivery_summary"):
            if not artifacts.get(required):
                errors.append(f"complete delivery missing artifact: {required}")
        for task in state.get("tasks", []):
            if task.get("required", True) and task.get("status") != "completed":
                errors.append(f"complete delivery has unresolved task: {task.get('id')}")
        for gate_name, decisions in current_gates.items():
            if len(decisions) == 1 and decisions[0].get("decision") in {"FAIL", "BLOCKED"}:
                errors.append(f"complete delivery has unresolved {decisions[0].get('decision')} gate: {gate_name}")
        for required_gate in ("principal-review", "delivery"):
            decisions = current_gates.get(required_gate, [])
            gate = decisions[0] if len(decisions) == 1 else None
            if not gate or gate.get("decision") != "PASS":
                errors.append(f"complete delivery lacks current PASS gate: {required_gate}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("delivery", nargs="?", type=Path)
    parser.add_argument("--all", dest="all_root", type=Path)
    parser.add_argument("--as-of", default=datetime.now(timezone.utc).isoformat())
    args = parser.parse_args()
    if bool(args.delivery) == bool(args.all_root):
        parser.error("provide one delivery path or --all <deliveries-dir>")
    as_of = parse_time(args.as_of)
    deliveries = [args.delivery] if args.delivery else sorted(path for path in args.all_root.iterdir() if path.is_dir())
    failed = False
    for delivery in deliveries:
        errors = validate_delivery(delivery.resolve(), ROOT, as_of)
        if errors:
            failed = True
            print(f"Delivery validation failed: {delivery}")
            for error in errors:
                print(f"- {error}")
        else:
            print(f"Delivery validation passed: {delivery}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
