# Policy: Workflow Routing

Select one primary workflow before material work begins. A workflow is an instruction sequence, not an executable state machine.

| Demand signal | Primary workflow |
|---|---|
| New or changed behavior | `feature.md` |
| Incorrect existing behavior | `bugfix.md` |
| Active production degradation or urgent threat | `incident.md` |
| Decision/design evaluation | `architecture-review.md` |
| Movement between old and new states | `migration.md` |
| Measurement or optimization is the principal goal | `performance-audit.md` |
| Insufficient information to classify | `demand-triage.md` |

## Rules

1. Record the selected workflow and evidence for the choice in the delivery index.
2. Use the primary workflow as the spine; embed another workflow only for a distinct subproblem.
3. An incident may create later bugfix, architecture, or migration demands rather than expanding indefinitely.
4. Reclassify when facts change and record which completed phases remain valid.
5. Project-defined workflows may extend this list but must preserve universal contracts, evidence, exceptions, and gates.
