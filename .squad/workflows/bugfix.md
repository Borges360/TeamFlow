# Workflow: Bugfix

## Use when

Observed behavior differs from intended behavior and a bounded correction is requested outside an active incident.

## Flow

`Symptom → Reproduction → Cause → Change plan & project pipeline → Fix design → Implementation → Regression verification → Review → Delivery`

## Procedure

1. Capture expected versus actual behavior, impact, frequency, environment, and reproducibility.
2. Preserve evidence of the failure before changing the implementation when feasible.
3. Identify root cause and distinguish it from symptoms and correlated events.
4. Discover affected consumers and repositories; create a change plan covering the pieces, branch, project pipeline, tests, data repair and compatibility work.
5. Define a minimal fix and rollback. Use full architecture review if contracts, boundaries, or high-risk design change.
6. Add a regression test that fails for the defect or document why automated reproduction is not viable.
7. Execute focused and risk-based regression tests plus applicable project-pipeline stages with evidence.
8. Complete applicable Security, Reliability, Quality, Production Readiness, and Principal Review gates.

## Exit criteria

The defect is reproducibly addressed, cause and blast radius are documented, regression evidence exists, and no known affected path is left undisclosed.
