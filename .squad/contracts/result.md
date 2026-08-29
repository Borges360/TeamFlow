# Contract: Result

Every delegated role and major workflow phase returns a structured result.

```yaml
result:
  task_id: DEM-0001-T03
  status: completed # completed | partial | failed | blocked | needs_user_input
  summary: "What was actually established"
  claims:
    - statement: "Acceptance criterion AC-02 passed"
      evidence: [EV-004]
  artifacts:
    created: []
    changed: []
    inspected: []
  evidence: []
  decisions: []
  findings: []
  assumptions: []
  risks_remaining: []
  questions: []
  requested_follow_up: []
  scope_variance: none
```

## Invariants

- Status reflects the contract, not effort spent.
- Every material claim links evidence or is labeled an inference.
- `completed` means all task completion criteria are met, not that the full demand is complete.
- Scope variance and unexecuted verification are explicit.
- Sensitive outputs are referenced from approved storage rather than embedded.
