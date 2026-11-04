---
{"schema_version":"1.0","id":"tests","version":"1.0","aliases":["test"],"workflow":"feature","side_effect_class":"repository-write","permissions":{"requires_repository_read":true,"may_write_files":true,"may_create_local_branch":true,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: tests

## Purpose
Create, correct, or extend tests tied to requirements, risks, or regressions.
## When to use
Use `/tests <objective>` for unit, component, integration, contract, E2E, accessibility, security, performance, or resilience coverage.
## Do not use when
Do not create tests without a meaningful oracle or alter production merely to force a scenario.
## Inputs and autonomous discovery
Discover test owners/repositories, existing suites, environment, fixtures/data, pipeline and uncovered risk.
## Blocking questions
Ask for unavailable expected behavior, restricted data/environment, or authority for costly/destructive tests.
## Preconditions
Test purpose, level, setup/data, expected result and repository plan are explicit.
## Operational steps
Map risk → select smallest effective level → prepare deterministic setup → implement assertions → execute → classify pass/fail/flaky/blocked → retain evidence.
## Semantic decisions
Choose test level and representative cases without duplicating implementation.
## Deterministic checks
Verify discovery, execution count, exit/result, assertions, isolation/cleanup and pipeline integration.
## Failure, cancellation and recovery
Do not hide flakes or retry side effects blindly; record unavailable environments and partial setup.
## Outputs and evidence
Test artifacts, requirement/risk mapping, setup, commands, results and limitations.
## Completion criteria
Requested risk is covered and tests produce reproducible evidence in the owning pipeline.
