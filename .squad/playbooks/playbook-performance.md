---
{"schema_version":"1.1","id":"performance","name":"Performance","version":"1.0","optional_invocation":true,"aliases":["perf"],"path":".squad/playbooks/playbook-performance.md","primary_workflow":"performance-audit","side_effect_class":"conditional-write","invocation_examples":["Use o playbook performance para medir a latência."],"always_required":{"roles":[],"artifacts":[],"gates":[]},"conditional_activation":[],"outputs":[],"stop_conditions":[],"permissions":{"requires_repository_read":true,"may_write_files":true,"may_create_local_branch":true,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: performance

## Purpose
Measure, diagnose, or improve latency, throughput, capacity, resource use, or stability under load.
## When to use
Use the `performance` playbook when performance is the principal measurable outcome.
## Do not use when
Do not optimize without a baseline or extrapolate local/synthetic results to production.
## Inputs and autonomous discovery
Discover metric, unit, percentile/window, environment, workload, revision, telemetry and constraints.
## Blocking questions
Ask when target, safe environment, representative workload, data authority, or measurement source is unavailable.
## Preconditions
Comparable baseline, workload, environment, repetitions and success/regression criteria are recorded.
## Operational steps
Baseline → instrumentation/profile → bottleneck hypothesis → controlled experiment/change → repeat same scenario → compare distribution/resources/cost → verify regressions.
## Semantic decisions
Distinguish causality from correlation and account for confounders, warmup, variance and saturation.
## Deterministic checks
Validate revisions/config, repetitions, metric units, percentiles, resource counters and raw evidence references.
## Failure, cancellation and recovery
Protect shared environments; stop on unsafe load, polluted baseline or incomparable conditions.
## Outputs and evidence
Performance review with baseline, workload, results/distribution, uncertainty, code/config changes and verification.
## Completion criteria
The question is answered within scope; any claimed improvement has comparable before/after evidence and quality safeguards.
