---
{"schema_version":"1.0","id":"refactor","version":"1.0","aliases":["refactoring"],"workflow":"feature","side_effect_class":"repository-write","permissions":{"requires_repository_read":true,"may_write_files":true,"may_create_local_branch":true,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: refactor

## Purpose
Improve internal structure while preserving intentional functional behavior.
## When to use
Use `/refactor <structural problem>` for bounded maintainability/design improvements.
## Do not use when
Use feature for behavior change; do not hide broad cleanup inside another demand.
## Inputs and autonomous discovery
Discover invariants, public contracts, callers, tests, complexity/duplication evidence, owners and pipeline.
## Blocking questions
Ask when expected behavior, compatibility boundary or acceptable scope cannot be established.
## Preconditions
Structural problem/benefit, invariants, forbidden scope, characterization/baseline and rollback are explicit.
## Operational steps
Characterize behavior → add `/tests` coverage if needed → plan small steps → refactor → run regression/contracts/static checks → compare interfaces → separate discovered functional changes.
## Semantic decisions
Judge whether complexity reduction justifies churn and whether a change is truly behavior-preserving.
## Deterministic checks
Compare public API/contracts, build/tests, static analysis and configured behavior before/after.
## Failure, cancellation and recovery
Stop/rollback the step on behavioral drift; do not weaken tests to accept unintended change.
## Outputs and evidence
Changed structure, invariant mapping, before/after maintainability evidence where measurable, regression and residual risk.
## Completion criteria
Behavioral invariants and contracts remain satisfied; scope is bounded and applicable gates/review pass.
