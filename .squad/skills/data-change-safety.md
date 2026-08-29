# Skill: Data Change Safety

## Purpose

Plan and verify schema, pipeline, dataset, catalog, backfill, or storage changes without losing correctness or recoverability.

## Procedure

1. Inventory sources, consumers, owners, classification, lineage, partitions, contracts, and retention.
2. Define invariants and before/after reconciliation queries or checks.
3. Assess backward/forward compatibility, late/duplicate data, replay, idempotency, and partial failure.
4. Estimate scale, duration, capacity, and cost using representative evidence.
5. Rehearse migration/backfill and restore on safe data/environment.
6. Roll out progressively with checkpoints, stop conditions, and owner-approved rollback/finality.
7. Update catalogs, lineage, runbooks, and quality monitoring.

## Output

Data impact/migration artifact, reconciliation evidence, recovery plan, and residual risk.
