# Contract: Context Bundle

A context bundle is the minimal, cited information set for a demand or delegated task.

```yaml
context_bundle:
  id: CTX-DEM-0001-01
  demand_id: DEM-0001
  purpose: "Decision or task enabled by this context"
  generated_at: "YYYY-MM-DDTHH:MM:SSZ"
  includes:
    - source: .project/context.md
      reason: project boundary
      revision_or_date: current
      sensitivity: internal
      facts: []
  repositories:
    - id: example-contract-api
      classification: changed # observed | affected | changed | follow-up
      reason: owns queried contract API
      revision: abc123
  contracts: []
  decisions: []
  assumptions: []
  unknowns: []
  excluded_context: []
  refresh_triggers: [scope-change, architecture-change]
```

## Invariants

Every inclusion has a purpose and source. Facts, inferences, assumptions, and unknowns remain distinct. The bundle does not copy entire repositories and respects sensitivity/access boundaries.
