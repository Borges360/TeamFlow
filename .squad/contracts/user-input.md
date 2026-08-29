# Contract: User Input

Use when progress requires a decision or authority only the user/stakeholder can provide.

```yaml
user_input_request:
  id: UI-001
  demand_id: DEM-0001
  status: open
  question: "One precise decision"
  context: "Why it matters now"
  blocking: true
  blocks: [architecture-gate]
  options:
    - id: A
      description: "Option"
      consequences: []
  recommendation:
    option: A
    rationale: "Evidence-based rationale, or null"
  default_if_non_blocking: null
  requested_from: product-owner
  needed_by: null
```

## Invariants

Do not manufacture a default for a blocking business, security, regulatory, irreversible, or production-risk decision. Record the answer, responder, timestamp, and affected artifacts when received.
