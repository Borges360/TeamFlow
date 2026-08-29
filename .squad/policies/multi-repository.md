# Policy: Multi-Repository Work

This policy supports estates with more than 100 repositories while preserving selective context and safe write boundaries.

## Discovery sequence

1. Start with named systems, capabilities, APIs, events, or repositories.
2. Query the project catalog by domain, owner, system, type, technology, criticality, data classification, and contract.
3. Expand one relationship hop at a time: dependency, consumer, producer, deployment, configuration, test, observability, data, or shared library.
4. Verify candidate repositories against their metadata and repository-local instructions.
5. Add a repository to the context bundle only with a reason and expected read/write action.

## Scope classes

- `observed`: inspected for context; no changes.
- `affected`: behavior or contract may be impacted; verify.
- `changed`: approved write target.
- `follow-up`: impact identified but intentionally outside current delivery.

## Write rules

1. Record owner, branch/revision, planned files, integration order, test responsibility, and rollback for every changed repository.
2. Do not infer write authorization from catalog visibility.
3. Broad search results are leads, not blast-radius proof.
4. Shared contracts require consumer/producer compatibility analysis.
5. Parallel edits require non-overlapping ownership or an explicit coordination plan.
6. Update catalog metadata when the delivery changes ownership, contracts, dependencies, technology, criticality, or lifecycle.

## Completion

The delivery summary lists all observed, affected, changed, and deferred repositories and states how cross-repository integration was verified.
