# Contract: Evidence

```yaml
evidence:
  id: EV-004
  demand_id: DEM-0001
  claim: "API regression suite passes for revision abc123"
  kind: test-report
  producer_role: quality-engineer
  source:
    repository: example-contract-api
    revision: abc123
    environment: qa
  procedure: "Exact command or reproducible steps"
  inputs: "Sanitized fixture set v2"
  result: pass # pass | fail | blocked | inconclusive
  summary: "128 passed, 0 failed, 2 skipped with rationale"
  artifact: deliveries/DEM-0001/evidence/api-tests.xml
  captured_at: "YYYY-MM-DDTHH:MM:SS-03:00"
  sensitivity: internal
  limitations: []
```

## Invariants

The evidence proves only its stated claim and environment/revision. It must distinguish execution from inspection, retain failed outcomes, avoid secrets/sensitive payloads, and remain reproducible or independently inspectable.
