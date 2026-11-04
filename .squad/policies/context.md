# Policy: Progressive Context

Use the smallest context that enables a safe next decision. Large estates must not be flattened into a single prompt or copied into this template.

## Context layers

1. **Core:** demand, `AGENTS.md`, project context/constraints, selected playbook (when applicable), and selected workflow.
2. **Seed:** systems/repositories explicitly named by the demand or catalog lookup.
3. **Neighbor:** owners, contracts, dependencies, consumers, data and runtime relationships of seeds.
4. **Deep:** repository-local source, histories, runbooks, dashboards, schemas, ADRs, or operational evidence needed for a specific question.

Load the next layer only when the current layer identifies a decision or risk that requires it.

## Context bundle rules

- Build a context bundle from `.squad/contracts/context-bundle.md` and record why every item is included.
- Separate facts, inferences, assumptions, unknowns, and stale information.
- Record source, owner, revision/date, confidence, sensitivity, and expiry when relevant.
- Summarize large documents with links; preserve exact contract clauses needed for decisions.
- Refresh the bundle after scope or blast-radius changes.
- Do not expose context to a delegate that is not needed or not permitted.
- Keep only playbook registry metadata persistent; load the full text of the selected playbook and discard it after the demand.

## Context budget

When context grows, retain decisions, interfaces, constraints, ownership, unresolved risks, and evidence pointers. Drop duplicated prose, unrelated source, superseded exploration, and raw outputs already stored as artifacts.
