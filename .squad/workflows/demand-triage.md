# Workflow: Demand Triage

## Use when

The request cannot yet be safely classified, its outcome is unclear, or the likely repositories and risk cannot be bounded.

## Flow

`Demand capture → minimal context → classification → blocking questions → workflow selection`

## Procedure

1. Preserve the original request and assign a demand ID.
2. Classify the intent: feature, bugfix, incident, architecture review, migration, performance audit, or project-defined workflow.
3. Identify the business outcome, affected capability/system seeds, urgency, reversibility, and obvious risk triggers.
4. Use progressive discovery only far enough to choose the workflow and identify blockers.
5. Ask the user only questions whose answers change the workflow, scope, authority, or safety.
6. Record the selected workflow and why; do not begin implementation during triage.

## Exit criteria

A workflow is selected, seed context is available, and blocking classification questions are resolved. Otherwise return `NEEDS_USER_INPUT` with the user-input contract.
