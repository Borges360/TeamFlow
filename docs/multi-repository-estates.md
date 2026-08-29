# Estates with 100+ Repositories

The template uses a catalog and relationship graph as metadata, not a mirror of source code.

## Catalog dimensions

Capture stable repository IDs, lifecycle, type, domains, systems, owners, technologies, criticality, data classification, interfaces, dependencies, deployments, local instructions, metadata source, and last verification.

## Selective discovery

```text
Demand seeds
    ↓
system / API / event / domain lookup
    ↓
direct owning repositories
    ↓
only relevant consumers, dependencies, configuration, tests and telemetry
    ↓
verified context bundle and write boundary
```

Do not load every catalog record or clone every repository. Query/filter metadata first, then inspect repository-local context for a specific decision.

## Federation

Large organizations may keep catalogs per domain and reference an enterprise service catalog. The `.squad/contracts/repository-catalog.md` fields define the portable minimum. External catalog records can be linked instead of copied, provided agents can resolve them and freshness/ownership remain visible.

## Change coordination

For cross-repository work, record observed/affected/changed/follow-up classifications, owners, revisions, contracts, integration order, verification, rollout, and rollback. Never turn a global text search into an implicit mass-change plan.
