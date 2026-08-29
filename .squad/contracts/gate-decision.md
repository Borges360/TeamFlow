# Contract: Gate Decision

```yaml
gate_decision:
  id: GATE-DEM-0001-QUALITY-01
  demand_id: DEM-0001
  gate: quality
  decision: PASS # PASS | FAIL | BLOCKED | WAIVED | NOT_APPLICABLE
  evaluator_role: quality-engineer
  evaluated_at: "YYYY-MM-DDTHH:MM:SSZ"
  scope:
    repositories: []
    revision: null
  criteria:
    - id: QG-01
      result: pass
      evidence: [EV-004]
      notes: null
  findings: []
  residual_risk: []
  exception_id: null
  invalidated_by: []
```

## Invariants

Every mandatory criterion has a result and evidence. `WAIVED` references an approved, unexpired exception. `NOT_APPLICABLE` is valid only for conditional gates. A material scope or artifact change invalidates affected decisions until re-evaluated.
