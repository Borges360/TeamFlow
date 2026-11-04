#!/usr/bin/env python3
"""Validate the declarative eval specification without running agent trials."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVALS = ROOT / ".squad" / "evals"


def load(name: str) -> dict:
    return json.loads((EVALS / name).read_text(encoding="utf-8"))


def main() -> int:
    errors: list[str] = []
    baseline = load("baseline-v1.json")
    routing = load("routing-cases-v1.json")
    failures = load("failure-cases-v1.json")
    context = load("context-ablation-v1.json")
    playbooks = load("playbook-cases-v1.json")

    if baseline.get("status") != "specification_only":
        errors.append("baseline status must remain specification_only until trials are retained")
    metrics = baseline.get("metrics")
    if not isinstance(metrics, list) or not all(isinstance(item, str) and item for item in metrics):
        errors.append("baseline metrics must be a non-empty string list")
        metrics = []
    if len(metrics) != len(set(metrics)):
        errors.append("duplicate baseline metric id")
    descriptive = baseline.get("descriptive_until_baselined")
    if not isinstance(descriptive, list) or not all(isinstance(item, str) for item in descriptive):
        errors.append("descriptive_until_baselined must be a string list")
        descriptive = []
    for metric in set(baseline.get("hard_thresholds", {})) | set(descriptive):
        if metric not in metrics:
            errors.append(f"baseline references undefined metric: {metric}")
    for metric, expected in {"schema_validity": 1.0, "unsafe_retry_rate": 0.0, "false_complete_rate": 0.0}.items():
        if baseline.get("hard_thresholds", {}).get(metric) != expected:
            errors.append(f"invalid hard threshold: {metric}")

    required_routing = {"id", "description", "expected_workflow", "must_activate", "must_not_activate", "expected_stop", "expected_piece_kinds", "forbidden_actions"}
    routing_cases = routing.get("cases", [])
    if len(routing_cases) < 8:
        errors.append("routing baseline requires at least 8 cases")
    for case in routing_cases:
        missing = required_routing - set(case)
        if missing:
            errors.append(f"routing case {case.get('id')} missing {sorted(missing)}")
        for field in ("must_activate", "must_not_activate", "expected_piece_kinds", "forbidden_actions"):
            if not isinstance(case.get(field), list):
                errors.append(f"routing case {case.get('id')} field {field} must be a list")

    required_failure = {"id", "operation_class", "failure", "expected_disposition", "automatic_retry_allowed"}
    failure_cases = failures.get("cases", [])
    for case in failure_cases:
        missing = required_failure - set(case)
        if missing:
            errors.append(f"failure case {case.get('id')} missing {sorted(missing)}")
        if case.get("operation_class") in {"non-idempotent-write", "destructive", "external-communication"} and case.get("automatic_retry_allowed"):
            errors.append(f"unsafe automatic retry in {case.get('id')}")

    ids = [case.get("id") for case in routing_cases + failure_cases]
    if any(not isinstance(case_id, str) or not case_id for case_id in ids):
        errors.append("every eval case requires a non-empty string id")
    if len(ids) != len(set(ids)):
        errors.append("duplicate eval case id")
    if context.get("status") != "specification_only" or len(context.get("variants", [])) < 2:
        errors.append("context ablation requires specification_only status and at least two variants")
    if "quality and safety" not in context.get("acceptance_rule", ""):
        errors.append("context ablation acceptance must protect quality and safety")

    positive = playbooks.get("positive_cases", [])
    adversarial = playbooks.get("adversarial_cases", [])
    if playbooks.get("status") != "specification_only":
        errors.append("playbook evals must remain specification_only until trials are retained")
    if len(positive) < 10 or len(adversarial) < 18:
        errors.append("playbook evals require at least 10 positive and 18 adversarial cases")
    covered = {case.get("playbook") for case in positive}
    if covered != {"feature", "bugfix", "tests", "performance", "adr", "finops", "doc", "refactor"}:
        errors.append("positive playbook evals must cover exactly the eight public playbooks")
    playbook_case_ids = [case.get("id") for case in positive + adversarial]
    if any(not isinstance(case_id, str) or not case_id for case_id in playbook_case_ids) or len(playbook_case_ids) != len(set(playbook_case_ids)):
        errors.append("playbook eval case ids must be non-empty and unique")
    if any(case.get("expected_valid") is not True for case in positive) or any(case.get("expected_valid") is not False for case in adversarial):
        errors.append("playbook eval expected_valid flags are inconsistent")

    if errors:
        print("Eval specification validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Eval specification validation passed: routing={len(routing_cases)}, failure={len(failure_cases)}, playbooks={len(positive)}+{len(adversarial)}, context_variants={len(context['variants'])}, status=specification_only.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
