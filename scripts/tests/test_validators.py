from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def load_script(name: str):
    path = ROOT / "scripts" / name
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


template_validator = load_script("validate-template.py")
delivery_validator = load_script("validate-delivery.py")


ACTIVE_CONFIG = """schema_version: "1.0"
project:
  id: active-project
  name: Active Project
  status: active
  context_owner: platform-team
  last_reviewed: "2026-08-29"
  default_language: pt-BR
  catalog:
    domains: .project/catalog/domains.yaml
    systems: .project/catalog/systems.yaml
    repositories: .project/catalog/repositories.yaml
    interfaces: .project/catalog/interfaces.yaml
    relations: .project/catalog/relations.yaml
  policy_profiles:
    quality: .project/quality-profile.md
    security_and_compliance: .project/compliance.md
    observability: .project/observability.md
  project_agent_profiles: .project/agent-profiles
  project_skills: .project/skills
  project_workflows: []
  project_gates: []
  workspace:
    checkout_root: runtime-managed
    allow_reuse_clean_checkout: true
  branching:
    preferred_base: develop
    feature_pattern: feature/{demand_id}-{slug}
    repository_rules_take_precedence: true
  documentation:
    repository_id: null
    fallback_root: docs
    adr_path: docs/architecture/decisions
  delivery_records:
    path: deliveries
    git_ignored: true
  delegation_limits:
    max_depth: 1
    max_parallel_tasks: 2
    context_budget: task-specific
    financial_or_tool_budget: owner-approved
"""


class TemplateValidatorTests(unittest.TestCase):
    def test_repository_template_mode_passes(self):
        mode, errors = template_validator.validate(ROOT, "template")
        self.assertEqual("template", mode)
        self.assertEqual([], errors)

    def test_active_config_passes_without_example_references(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / ".project" / "catalog").mkdir(parents=True)
            (root / ".project" / "agent-profiles").mkdir()
            (root / ".project" / "skills").mkdir()
            (root / ".project" / "project.yaml").write_text(ACTIVE_CONFIG, encoding="utf-8")
            for name in ("domains", "systems", "repositories", "interfaces", "relations"):
                (root / ".project" / "catalog" / f"{name}.yaml").write_text("schema_version: '1.0'\n", encoding="utf-8")
            for name in ("quality-profile", "compliance", "observability"):
                (root / ".project" / f"{name}.md").write_text("# Active project\n", encoding="utf-8")
            errors: list[str] = []
            template_validator.check_project_context(root, "active", ".project/project.yaml", errors)
            self.assertEqual([], errors)

    def test_active_config_rejects_example_path(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / ".project").mkdir()
            invalid = ACTIVE_CONFIG.replace("domains.yaml", "domains.example.yaml")
            (root / ".project" / "project.yaml").write_text(invalid, encoding="utf-8")
            errors: list[str] = []
            template_validator.check_project_context(root, "active", ".project/project.yaml", errors)
            self.assertTrue(any("example path" in error for error in errors))

    def test_full_active_validation_rejects_unterminated_yaml_quote(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "repository"
            shutil.copytree(ROOT, root, ignore=shutil.ignore_patterns(".git", "__pycache__"))
            squad = (root / "squad.yaml").read_text(encoding="utf-8")
            squad = squad.replace("mode: template", "mode: active").replace("project.example.yaml", "project.yaml")
            (root / "squad.yaml").write_text(squad, encoding="utf-8")
            (root / ".project" / "project.yaml").write_text(ACTIVE_CONFIG.replace("name: Active Project", 'name: "unterminated'), encoding="utf-8")
            mode, errors = template_validator.validate(root, "active")
            self.assertEqual("active", mode)
            self.assertTrue(any("unterminated double-quoted" in error for error in errors))

    def test_project_gate_collision_is_rejected(self):
        invalid = ACTIVE_CONFIG.replace(
            "  project_gates: []",
            "  project_gates:\n    - id: security\n      applicability: conditional\n      accountable_role: local-security",
        )
        errors: list[str] = []
        universal = {"security", "principal-review", "delivery"}
        template_validator.check_project_gates(invalid, universal, errors)
        self.assertTrue(any("collides with universal" in error for error in errors))

    def test_active_config_rejects_unclosed_inline_collection(self):
        errors: list[str] = []
        template_validator.check_supported_yaml(
            ACTIVE_CONFIG.replace("project_workflows: []", "project_workflows: [foo"),
            ".project/project.yaml",
            errors,
        )
        self.assertTrue(any("unclosed inline collection" in error for error in errors))

    def test_project_gate_without_id_is_rejected(self):
        invalid = ACTIVE_CONFIG.replace(
            "  project_gates: []",
            "  project_gates:\n    - applicability: conditional\n      accountable_role: local-reviewer",
        )
        errors: list[str] = []
        template_validator.check_project_gates(invalid, {"principal-review", "delivery"}, errors)
        self.assertTrue(any("requires a valid id" in error for error in errors))


class DeliveryValidatorTests(unittest.TestCase):
    def make_delivery(self, root: Path, status: str = "in_progress") -> Path:
        delivery = root / "DEM-TEST-001"
        delivery.mkdir()
        for name in ("demand.md", "requirements.md", "context-bundle.md", "change-impact.md", "delivery-index.md"):
            (delivery / name).write_text(f"# {name}\n", encoding="utf-8")
        (delivery / "delivery-index.md").write_text(f"# Index\n\n- Status: {status}\n", encoding="utf-8")
        state = {
            "schema_version": "1.0",
            "demand_id": "DEM-TEST-001",
            "status": status,
            "workflow": "feature",
            "artifacts": {
                "demand": "demand.md",
                "requirements": "requirements.md",
                "context_bundle": "context-bundle.md",
                "change_plan": "change-impact.md",
                "final_review": None,
                "delivery_summary": None,
            },
            "tasks": [],
            "evidence": [],
            "gates": [],
        }
        (delivery / "delivery-state.json").write_text(json.dumps(state), encoding="utf-8")
        return delivery

    def test_in_progress_delivery_passes(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary))
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertEqual([], errors)

    def test_complete_delivery_requires_principal_and_delivery_gates(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary), "complete")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertTrue(any("principal-review" in error for error in errors))
            self.assertTrue(any("delivery_summary" in error for error in errors))

    def test_path_escape_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary))
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["artifacts"]["demand"] = "../outside.md"
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertTrue(any("escapes delivery" in error for error in errors))

    def test_unsafe_retry_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary))
            (delivery / "task.md").write_text("# Task\n", encoding="utf-8")
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["tasks"] = [{
                "id": "DEM-TEST-001-T01",
                "status": "in_progress",
                "contract": "task.md",
                "result": None,
                "operation_class": "non-idempotent-write",
                "retry_eligible": True,
                "retry_authorized": False,
                "attempts": [
                    {"number": 1, "outcome": "timed_out", "side_effect_state": "unknown"},
                    {"number": 2, "outcome": "in_progress", "side_effect_state": "none"}
                ]
            }]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertTrue(any("unsafe retry" in error for error in errors))
            self.assertTrue(any("unknown side-effect" in error for error in errors))

    def test_structurally_complete_delivery_passes(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary), "complete")
            for name in ("final-review.md", "delivery-summary.md", "evidence.md"):
                (delivery / name).write_text(f"# {name}\n", encoding="utf-8")
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["artifacts"]["final_review"] = "final-review.md"
            state["artifacts"]["delivery_summary"] = "delivery-summary.md"
            state["evidence"] = [{"id": "EV-001", "path": "evidence.md"}]
            common = {
                "demand_id": "DEM-TEST-001",
                "decision": "PASS",
                "evaluator_role": "reviewer",
                "evaluated_at": "2026-08-29T19:00:00-03:00",
                "scope": {"repositories": ["test"], "revision": "abc"},
                "criteria": [{"id": "C-01", "result": "pass", "evidence": ["EV-001"], "notes": "fixture"}],
                "findings": [],
                "residual_risk": [],
                "exception_id": None,
                "invalidated_by": []
            }
            state["gates"] = [
                {"id": "GATE-PR-01", "gate": "principal-review", **common},
                {"id": "GATE-DEL-01", "gate": "delivery", **common}
            ]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertEqual([], errors)

    def test_always_gate_cannot_be_not_applicable(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary))
            (delivery / "evidence.md").write_text("# Evidence\n", encoding="utf-8")
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["evidence"] = [{"id": "EV-001", "path": "evidence.md"}]
            state["gates"] = [{
                "id": "GATE-PR-NA",
                "demand_id": "DEM-TEST-001",
                "gate": "principal-review",
                "decision": "NOT_APPLICABLE",
                "evaluator_role": "principal-reviewer",
                "evaluated_at": "2026-08-29T19:00:00-03:00",
                "scope": {"repositories": ["test"], "revision": "abc"},
                "criteria": [{"id": "C-01", "result": "not_applicable", "evidence": ["EV-001"], "notes": "fixture"}],
                "findings": [],
                "residual_risk": [],
                "exception_id": None,
                "invalidated_by": []
            }]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertTrue(any("always gate" in error for error in errors))

    def test_expired_waiver_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary))
            (delivery / "evidence.md").write_text("# Evidence\n", encoding="utf-8")
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["evidence"] = [{"id": "EV-001", "path": "evidence.md"}]
            state["gates"] = [{
                "id": "GATE-QUALITY-WAIVER",
                "demand_id": "DEM-TEST-001",
                "gate": "quality",
                "decision": "WAIVED",
                "evaluator_role": "quality-engineer",
                "evaluated_at": "2026-08-01T00:00:00Z",
                "scope": {"repositories": ["test"], "revision": "abc"},
                "criteria": [{"id": "C-01", "result": "waived", "evidence": ["EV-001"], "notes": "fixture"}],
                "findings": [],
                "residual_risk": [],
                "exception_id": "EX-001",
                "exception": {"status": "approved", "expires_at": "2026-08-02T00:00:00Z"},
                "invalidated_by": []
            }]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime(2026, 8, 29, tzinfo=timezone.utc))
            self.assertTrue(any("expired" in error for error in errors))

    def test_gate_unknown_evidence_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary))
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["gates"] = [{
                "id": "GATE-QUALITY-01",
                "demand_id": "DEM-TEST-001",
                "gate": "quality",
                "decision": "PASS",
                "evaluator_role": "quality-engineer",
                "evaluated_at": "2026-08-29T19:00:00-03:00",
                "scope": {"repositories": ["test"], "revision": "abc"},
                "criteria": [{"id": "C-01", "result": "pass", "evidence": ["EV-MISSING"], "notes": "fixture"}],
                "findings": [],
                "residual_risk": [],
                "exception_id": None,
                "invalidated_by": []
            }]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertTrue(any("unknown evidence" in error for error in errors))

    def test_evidence_without_path_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary))
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["evidence"] = [{"id": "EV-NO-PATH"}]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertTrue(any("requires a non-empty path" in error for error in errors))

    def test_complete_delivery_rejects_current_fail_and_conflicting_gates(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary), "complete")
            for name in ("final-review.md", "delivery-summary.md", "evidence.md"):
                (delivery / name).write_text(f"# {name}\n", encoding="utf-8")
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["artifacts"]["final_review"] = "final-review.md"
            state["artifacts"]["delivery_summary"] = "delivery-summary.md"
            state["evidence"] = [{"id": "EV-001", "path": "evidence.md"}]
            common = {
                "demand_id": "DEM-TEST-001", "evaluator_role": "reviewer",
                "evaluated_at": "2026-08-29T19:00:00-03:00", "scope": {"revision": "abc"},
                "criteria": [{"id": "C-01", "result": "pass", "evidence": ["EV-001"], "notes": "fixture"}],
                "findings": [], "residual_risk": [], "exception_id": None, "invalidated_by": []
            }
            state["gates"] = [
                {"id": "REQ-FAIL", "gate": "requirement", "decision": "FAIL", **common},
                {"id": "PR-FAIL", "gate": "principal-review", "decision": "FAIL", **common},
                {"id": "PR-PASS", "gate": "principal-review", "decision": "PASS", **common},
                {"id": "DEL-PASS", "gate": "delivery", "decision": "PASS", **common},
            ]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertTrue(any("conflicting current decisions" in error for error in errors))
            self.assertTrue(any("unresolved FAIL gate: requirement" in error for error in errors))

    def test_legitimate_project_gate_is_accepted(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "repository"
            (root / ".squad" / "registries").mkdir(parents=True)
            (root / ".project").mkdir()
            (root / ".squad" / "registries" / "gates.yaml").write_text(
                "gates:\n  - id: principal-review\n    applicability: always\n  - id: delivery\n    applicability: always\n",
                encoding="utf-8",
            )
            (root / ".project" / "project.yaml").write_text(
                ACTIVE_CONFIG.replace(
                    "  project_gates: []",
                    "  project_gates:\n    - id: local-risk\n      applicability: conditional\n      accountable_role: local-reviewer",
                ),
                encoding="utf-8",
            )
            delivery = self.make_delivery(root)
            (delivery / "evidence.md").write_text("# Evidence\n", encoding="utf-8")
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["evidence"] = [{"id": "EV-001", "path": "evidence.md"}]
            state["gates"] = [{
                "id": "LOCAL-01", "demand_id": "DEM-TEST-001", "gate": "local-risk", "decision": "PASS",
                "evaluator_role": "local-reviewer", "evaluated_at": "2026-08-29T19:00:00-03:00",
                "scope": {"revision": "abc"},
                "criteria": [{"id": "C-01", "result": "pass", "evidence": ["EV-001"], "notes": "fixture"}],
                "findings": [], "residual_risk": [], "exception_id": None, "invalidated_by": []
            }]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, root, datetime.now(timezone.utc))
            self.assertEqual([], errors)

    def test_gate_cannot_be_invalidated_by_an_older_decision(self):
        with tempfile.TemporaryDirectory() as temporary:
            delivery = self.make_delivery(Path(temporary))
            (delivery / "evidence.md").write_text("# Evidence\n", encoding="utf-8")
            state_path = delivery / "delivery-state.json"
            state = json.loads(state_path.read_text(encoding="utf-8"))
            state["evidence"] = [{"id": "EV-001", "path": "evidence.md"}]
            common = {
                "demand_id": "DEM-TEST-001", "evaluator_role": "reviewer", "scope": {"revision": "abc"},
                "criteria": [{"id": "C-01", "result": "pass", "evidence": ["EV-001"], "notes": "fixture"}],
                "findings": [], "residual_risk": [], "exception_id": None,
            }
            state["gates"] = [
                {"id": "PASS-OLD", "gate": "quality", "decision": "PASS", "evaluated_at": "2026-08-29T18:00:00Z", "invalidated_by": [], **common},
                {"id": "FAIL-NEW", "gate": "quality", "decision": "FAIL", "evaluated_at": "2026-08-29T19:00:00Z", "invalidated_by": ["PASS-OLD"], **common},
            ]
            state_path.write_text(json.dumps(state), encoding="utf-8")
            errors = delivery_validator.validate_delivery(delivery, ROOT, datetime.now(timezone.utc))
            self.assertTrue(any("non-newer decision" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
