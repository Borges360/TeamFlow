# Contract: Delivery State

`delivery-state.json` is the narrow machine-readable ledger for objective delivery invariants. Markdown artifacts remain the narrative source for requirements, evidence meaning and decisions.

```json
{
  "schema_version": "1.0",
  "demand_id": "DEM-0001",
  "status": "in_progress",
  "workflow": "feature",
  "artifacts": {
    "demand": "demand.md",
    "requirements": "requirements.md",
    "context_bundle": "context-bundle.md",
    "change_plan": "change-impact.md",
    "final_review": null,
    "delivery_summary": null
  },
  "tasks": [],
  "evidence": [],
  "gates": []
}
```

Task entries contain `id`, `status`, `contract`, optional `result`, optional `required` (default `true`), and may mirror objective retry state as `operation_class`, `retry_eligible`, `retry_authorized` and `attempts`. Each attempt may record `number`, `outcome` and `side_effect_state` (`none`, `known`, `rolled_back`, `unknown`). Evidence entries contain unique `id` and `path`. Gate entries contain the gate-decision fields from `.squad/contracts/gate-decision.md` plus an artifact `path` when narrative detail is separate.

## Invariants

- `demand_id` equals the delivery directory name and all IDs/references are unique within their namespace.
- Relative artifact paths resolve inside the delivery; path escape is invalid.
- Status values follow `.squad/contracts/status-vocabulary.md`.
- Gate IDs resolve through `.squad/registries/gates.yaml` or non-colliding project gate definitions.
- `NOT_APPLICABLE` is allowed only for conditional gates with evaluator, criterion evidence and rationale. `WAIVED` requires an approved unexpired exception.
- Exactly one non-invalidated decision may be current for each gate represented in the ledger. Each `invalidated_by` entry resolves to a strictly later `evaluated_at` decision for the same gate; this ordering also prevents invalidation cycles.
- A complete delivery cannot retain a current `FAIL` or `BLOCKED`; Principal Review and Delivery must each have one current `PASS`.
- More than one attempt requires retry eligibility; non-idempotent/destructive/external operations require explicit retry authorization; no retry follows an `unknown` side-effect state.
- `complete` requires demand, requirements, context, change plan, final review and delivery summary; all mandatory tasks are completed; and current `principal-review` and `delivery` decisions pass or have a valid waiver where permitted.

The ledger/validator cannot prove factual truth, evidence sufficiency, correct gate applicability, reviewer independence or operational effectiveness.
