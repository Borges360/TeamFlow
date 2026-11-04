# Workflow: Migration

## Use when

Data, traffic, interfaces, infrastructure, runtime, repository ownership, or platform capability moves between states.

## Flow

`Inventory → Change plan & project pipeline → Target design → Compatibility → Rehearsal → Controlled rollout → Reconciliation → Decommission → Review`

## Procedure

1. Inventory producers, consumers, owners, data, dependencies, controls, and current service levels.
2. Create a change plan for every changed/affected piece, branch, project-pipeline stage, integration order, ownership and write boundary.
3. Define target state, invariants, compatibility window, source of truth, rollback point, and stop conditions.
4. Divide work into reversible stages with observable entry/exit criteria.
5. Rehearse against representative scale and failure modes; validate backup/restore and reconciliation.
6. Roll out progressively with owner-approved checkpoints and pipeline evidence.
7. Decommission only after agreed observation, consumer confirmation, data retention, and rollback expiry.

## Required reviews

Architecture, Quality, Reliability, Security, Data or Platform according to scope, followed by Principal Review. Irreversible cutovers require explicit user/owner authorization.

## Exit criteria

Target invariants are met, data/traffic is reconciled, residual dependencies are known, rollback or finality is explicit, and decommission obligations are complete or owned.
