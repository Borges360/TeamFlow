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
  execution:
    run_id: RUN-DEM-0001-T03-01
    runtime: codex
    model_or_agent_version: null
    context_bundle: deliveries/DEM-0001/context-bundle.md
    tools:
      - name: pytest
        version: 8.x
    attempt: 1
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

Execution metadata is recorded when available and material. Unknown runtime/model/tool-version values remain `null`; they are never inferred. Full prompts, private reasoning and whole context windows are not required evidence.
