# Policy: Workflow Routing

Select one primary workflow before material work begins. A workflow is an instruction sequence, not an executable state machine.

An operational playbook is an optional developer-facing recipe layered on one workflow. Resolve an explicit playbook name/path or alias through `.squad/registries/playbooks.yaml`; do not treat a playbook as another agent or duplicate workflow. Natural-language demands continue to route semantically to a workflow without mentioning a playbook. Slash-prefixed names are textual prompt shortcuts, not native shell/runtime commands.

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
6. Explicit playbook ID/alias/path wins; otherwise route objectively, then semantically. The workflow remains sufficient without a playbook. Load only an explicitly selected or clearly matching playbook and record its ID/version when one is used.
