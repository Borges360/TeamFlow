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
  attempts:
    - number: 1
      started_at: "YYYY-MM-DDTHH:MM:SSZ"
      ended_at: null
      outcome: completed # completed | failed | interrupted | timed_out | uncertain
      error_class: null
      side_effects_observed: []
      retry_disposition: not_needed
  decisions: []
  findings: []
  assumptions: []
  risks_remaining: []
  questions: []
  requested_follow_up: []
  termination_reason: completion_criteria_met
  partial_effects: []
  recovery_or_rollback_status: not_applicable
  scope_variance: none
```

## Invariants

- Status reflects the contract, not effort spent.
- Every material claim links evidence or is labeled an inference.
- `completed` means all task completion criteria are met, not that the full demand is complete.
- Scope variance and unexecuted verification are explicit.
- Attempts preserve failed/interrupted/timed-out work and observed partial effects; a later success does not overwrite them.
- `completed` requires completion criteria, reconciled side effects and no unknown in-flight mutation.
- Sensitive outputs are referenced from approved storage rather than embedded.
