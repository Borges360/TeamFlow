# Workflow: Performance Audit

## Use when

The primary outcome is to measure, diagnose, or improve latency, throughput, capacity, resource use, scalability, or cost efficiency.

## Flow

`Question → Baseline → Workload model → Instrumentation → Experiment → Analysis → Recommendation/Fix → Verification`

## Procedure

1. Define measurable targets, critical journeys, environment, data volume, concurrency, and acceptable cost.
2. Capture a baseline and telemetry quality before optimization.
3. Design representative, repeatable tests and protect shared/production environments.
4. Change one meaningful variable at a time where feasible; correlate client, service, dependency, infrastructure, and cost signals.
5. Document uncertainty, confounders, saturation points, and extrapolation limits.
6. If code or configuration changes, route through the relevant feature/bugfix phases and gates.

## Exit criteria

Evidence answers the audit question, targets and regressions have dispositions, recommendations are prioritized by impact/cost/risk, and no benchmark is presented beyond its valid scope.
