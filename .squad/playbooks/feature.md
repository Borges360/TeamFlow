---
{"schema_version":"1.0","id":"feature","version":"1.0","aliases":["feat"],"workflow":"feature","side_effect_class":"repository-write","permissions":{"requires_repository_read":true,"may_write_files":true,"may_create_local_branch":true,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: feature

## Purpose
Implement new or changed functional behavior with verifiable acceptance criteria.
## When to use
Use `/feature <objective>` for a capability or intentional behavior change.
## Do not use when
Use bugfix for incorrect existing behavior and refactor for behavior-preserving restructuring.
## Inputs and autonomous discovery
Objective is required; discover repositories, behavior, stack, contracts, tests, docs, branch model, and pipeline. Acceptance/scope are optional inputs.
## Blocking questions
Ask only for missing business behavior, material scope, authority, security/data, or irreversible decisions.
## Preconditions
Requirements, context bundle, repository plans, write boundaries, branches, and applicable pipeline are explicit.
## Operational steps
Define acceptance → analyze impact/consumers → design proportionally → implement smallest coherent change → add tests/docs → run pipelines → integrate → gates/review.
## Semantic decisions
Decide behavior, compatibility and necessary specialist review from evidence; do not add adjacent refactors/dependencies silently.
## Deterministic checks
Trace requirements to changed paths/tests; validate contracts, formatting, build, tests, links, and repository plans.
## Failure, cancellation and recovery
Stop on blocking ambiguity/access/gate failure. Preserve partial effects; retry only per failure policy.
## Outputs and evidence
Playbook result, changed repositories/branches, permanent artifacts, commands/results, gates and residual risk.
## Completion criteria
Acceptance is externally supported, applicable pipelines/gates pass, Principal Review passes, and no mandatory repository is unresolved.
