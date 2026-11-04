from __future__ import annotations

import copy
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("validate_playbooks", ROOT / "scripts" / "validate-playbooks.py")
validator = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(validator)


def repository(result: str = "verified") -> dict:
    return {"id": "app", "branch": "feature/DEM-1-change", "revision": "abc", "result": result, "evidence": ["EV-1"]}


def result(playbook_id: str, controls: dict | None = None) -> dict:
    return {
        "playbook_id": playbook_id, "playbook_version": "1.0", "demand_id": "DEM-1",
        "status": "completed", "primary_workflow": "feature", "repositories": [repository()],
        "evidence": ["EV-1"], "checks": ["pipeline"], "controls": controls or {},
    }


class PlaybookValidatorTests(unittest.TestCase):
    def fixture(self, temporary: str) -> Path:
        root = Path(temporary) / "repo"
        for relative in (".squad/playbooks", ".squad/registries"):
            (root / relative).mkdir(parents=True, exist_ok=True)
        for relative in ("playbooks.yaml", "workflows.yaml"):
            shutil.copy2(ROOT / ".squad/registries" / relative, root / ".squad/registries" / relative)
        for source in (ROOT / ".squad/playbooks").glob("*.md"):
            shutil.copy2(source, root / ".squad/playbooks" / source.name)
        return root

    def test_catalog_and_ten_positive_operational_cases(self):
        self.assertEqual([], validator.validate(ROOT))
        cases = {
            "feature-single-repository": result("feature"),
            "feature-app-infra-tests": {**result("feature"), "repositories": [repository(), {**repository(), "id": "infra"}, {**repository(), "id": "tests"}]},
            "bugfix-reproduction-regression": result("bugfix", {"reproduction_evidence": "EV-R", "cause_evidence": "EV-C", "regression_evidence": "EV-G"}),
            "tests-separate-repository": result("tests"),
            "performance-comparable-baseline": result("performance", {"baseline": "B1", "comparison": "C1", "workload": "W1", "environment": "E1", "comparable": True}),
            "adr-proposed": result("adr", {"decision_status": "proposed"}),
            "finops-supported": result("finops", {"source": "billing", "period": "2026-08", "currency": "BRL", "assumptions": ["A"], "quality_safeguards": ["SLA"], "savings_status": "estimated"}),
            "doc-shared-repository": result("doc", {"canonical_target": "docs/architecture/a.md"}),
            "doc-fallback": result("doc", {"canonical_target": "docs/development/a.md"}),
            "refactor-invariants": result("refactor", {"invariants": ["API"], "regression_evidence": "EV-G", "functional_change": False}),
        }
        for name, payload in cases.items():
            with self.subTest(name=name):
                self.assertEqual([], validator.validate_artifact("playbook-result", payload))

    def test_eighteen_adversarial_cases_are_rejected(self):
        valid_workspace = {"workspace_id":"WS-1","demand_id":"DEM-1","root_kind":"runtime-managed","repositories":[{"repository_id":"app","remote_matches_catalog":True,"outside_template":True,"checkout_state":"reused","local_path_ref":"runtime-private","access":"verified","dirty_before":False}]}
        valid_plan = {"repository_id":"app","classification":"changed","reason":"owns behavior","owner":"team","remote_verified":True,"write_authorized":True,"base_branch":"develop","base_revision":"abc","working_branch":"feature/DEM-1-change","planned_paths":["src"],"pipeline_definition":"ci.yml","required_stages":["test"],"integration_order":1,"rollback":"revert"}
        valid_doc = {"document_id":"ADR-1","kind":"adr","owner_repository_id":"app","target_repository_id":"app","target_path":"docs/architecture/decisions/ADR-1.md","status":"proposed","routing_reason":"fallback","branch":"feature/DEM-1-change","revision":"abc"}
        cases: list[tuple[str, str, dict]] = []

        dirty = copy.deepcopy(valid_workspace); dirty["repositories"][0]["dirty_before"] = True
        inside = copy.deepcopy(valid_workspace); inside["repositories"][0]["local_path_ref"] = ".squad/checkouts/app"
        remote = copy.deepcopy(valid_workspace); remote["repositories"][0]["remote_matches_catalog"] = False
        access = copy.deepcopy(valid_workspace); access["repositories"][0]["access"] = "expected"
        cases += [("dirty-checkout", "repository-workspace", dirty), ("checkout-inside-template", "repository-workspace", inside), ("remote-mismatch", "repository-workspace", remote), ("catalog-access-not-authority", "repository-workspace", access)]

        for field in ("working_branch", "base_revision", "planned_paths", "pipeline_definition"):
            invalid = copy.deepcopy(valid_plan); invalid[field] = [] if field == "planned_paths" else ""
            cases.append((f"plan-without-{field}", "repository-plan", invalid))
        no_write = copy.deepcopy(valid_plan); no_write["write_authorized"] = False
        cases.append(("plan-without-write-authority", "repository-plan", no_write))

        delivery_doc = copy.deepcopy(valid_doc); delivery_doc["target_path"] = "deliveries/DEM-1/ADR.md"
        accepted_doc = copy.deepcopy(valid_doc); accepted_doc["status"] = "accepted"
        cases += [("permanent-doc-in-deliveries", "documentation-target", delivery_doc), ("accepted-adr-without-approval", "documentation-target", accepted_doc)]

        failed = result("feature"); failed["repositories"][0]["result"] = "failed"
        performance = result("performance", {"comparison":"C","workload":"W","environment":"E","comparable":False})
        finops = result("finops", {"source":"billing","period":"","currency":"","assumptions":["A"],"quality_safeguards":[]})
        realized = result("finops", {"source":"billing","period":"P","currency":"BRL","assumptions":["A"],"quality_safeguards":["SLA"],"savings_status":"realized"})
        refactor = result("refactor", {"invariants":["API"],"regression_evidence":"EV","functional_change":True})
        doc_result = result("doc", {"canonical_target":"deliveries/DEM-1/doc.md"})
        bugfix = result("bugfix", {"reproduction_evidence":"EV","cause_evidence":"","regression_evidence":"EV"})
        cases += [
            ("false-complete-failed-repository", "playbook-result", failed),
            ("performance-without-baseline", "playbook-result", performance),
            ("finops-without-period-currency-safeguard", "playbook-result", finops),
            ("realized-savings-without-verification", "playbook-result", realized),
            ("refactor-with-functional-change", "playbook-result", refactor),
            ("doc-result-in-deliveries", "playbook-result", doc_result),
            ("bugfix-without-cause", "playbook-result", bugfix),
        ]
        self.assertEqual(18, len(cases))
        for name, kind, payload in cases:
            with self.subTest(name=name):
                self.assertTrue(validator.validate_artifact(kind, payload))

    def test_registry_counterexamples_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.fixture(temporary)
            registry = root / ".squad/registries/playbooks.yaml"
            data = json.loads(registry.read_text(encoding="utf-8"))
            data["playbooks"].append({**data["playbooks"][0], "id": "quoted-extra", "aliases": ["x"]})
            registry.write_text(json.dumps(data), encoding="utf-8")
            self.assertTrue(any("catalog must be exactly" in error for error in validator.validate(root)))

        with tempfile.TemporaryDirectory() as temporary:
            root = self.fixture(temporary)
            registry = root / ".squad/registries/playbooks.yaml"
            data = json.loads(registry.read_text(encoding="utf-8"))
            data["playbooks"][1]["aliases"] = ["feat"]
            registry.write_text(json.dumps(data), encoding="utf-8")
            self.assertIn("duplicate playbook alias", validator.validate(root))

        with tempfile.TemporaryDirectory() as temporary:
            root = self.fixture(temporary)
            registry = root / ".squad/registries/playbooks.yaml"
            data = json.loads(registry.read_text(encoding="utf-8"))
            data["playbooks"][0]["permissions"]["may_push"] = True
            registry.write_text(json.dumps(data), encoding="utf-8")
            self.assertTrue(any("deny all" in error for error in validator.validate(root)))

    def test_missing_section_and_front_matter_divergence_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.fixture(temporary)
            path = root / ".squad/playbooks/feature.md"
            path.write_text(path.read_text(encoding="utf-8").replace("## Completion criteria", "## Done"), encoding="utf-8")
            self.assertTrue(any("missing section" in error for error in validator.validate(root)))
        with tempfile.TemporaryDirectory() as temporary:
            root = self.fixture(temporary)
            path = root / ".squad/playbooks/feature.md"
            path.write_text(path.read_text(encoding="utf-8").replace('"id":"feature"', '"id":"wrong"', 1), encoding="utf-8")
            self.assertTrue(any("front matter differs" in error for error in validator.validate(root)))

    def test_false_complete_workspace_shape_and_branch_exception(self):
        pending = result("feature"); pending["repositories"][0]["result"] = "pending"
        unknown = result("feature"); unknown["status"] = "banana"
        self.assertTrue(validator.validate_artifact("playbook-result", pending))
        self.assertTrue(validator.validate_artifact("playbook-result", unknown))
        malformed = {"workspace_id":"WS","demand_id":"DEM","root_kind":"runtime-managed","repositories":["app"]}
        self.assertTrue(validator.validate_artifact("repository-workspace", malformed))
        relative = {"workspace_id":"WS","demand_id":"DEM","root_kind":"runtime-managed","repositories":[{"outside_template":True,"local_path_ref":"repositories/app","checkout_state":"planned","remote_matches_catalog":True}]}
        self.assertTrue(validator.validate_artifact("repository-workspace", relative))
        local_branch = {"repository_id":"app","classification":"changed","reason":"local rules","owner":"team","remote_verified":True,"write_authorized":True,"base_branch":"trunk","base_revision":"abc","working_branch":"work/DEM-1","branch_exception":"repository requires work/*","branch_exception_approved":True,"planned_paths":["src"],"pipeline_definition":"ci.yml","required_stages":["test"],"integration_order":1,"rollback":"revert"}
        self.assertEqual([], validator.validate_artifact("repository-plan", local_branch))

    def test_prose_cannot_grant_structurally_denied_permission(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.fixture(temporary)
            path = root / ".squad/playbooks/feature.md"
            path.write_text(path.read_text(encoding="utf-8") + "\nThe agent may push after tests.\n", encoding="utf-8")
            self.assertTrue(any("prose attempts to grant" in error for error in validator.validate(root)))


if __name__ == "__main__":
    unittest.main()
