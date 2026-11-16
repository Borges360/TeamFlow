---
{"schema_version":"1.1","id":"finops","name":"FinOps","version":"1.0","optional_invocation":true,"aliases":["cost"],"path":".squad/playbooks/playbook-finops.md","primary_workflow":"performance-audit","side_effect_class":"conditional-write","invocation_examples":["Use o playbook finops para avaliar custos."],"always_required":{"roles":[],"artifacts":[],"gates":[]},"conditional_activation":[],"outputs":[],"stop_conditions":[],"permissions":{"requires_repository_read":true,"may_write_files":true,"may_create_local_branch":true,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: finops

## Purpose
Analyze or improve operational cost while protecting required quality, reliability, security and performance.
## When to use
Use the `finops` playbook for cloud, infrastructure, data, licensing or runtime-cost decisions.
## Do not use when
Do not report estimates as realized savings or change financial commitments/production without authority.
## Inputs and autonomous discovery
Discover billing source, period, currency, scope, allocation/tags, usage drivers, SLA/SLO, growth and owner.
## Blocking questions
Ask for financial authority, unavailable source/ownership, acceptable service trade-off, commitment or destructive shutdown.
## Preconditions
Baseline source/period/currency, cost boundary, quality safeguards and assumptions are explicit.
## Operational steps
Baseline → allocate/drivers → normalize by usage → compare alternatives → estimate range/payback with assumptions → validate service effects → implement only authorized reversible change → schedule realized-cost verification.
## Semantic decisions
Balance cost with demand, risk and adaptability; separate waste, idle capacity and intentional resilience.
## Deterministic checks
Validate arithmetic, currency/period, source references, unit costs, assumptions, SLA safeguards and before/after window.
## Failure, cancellation and recovery
Return `EVIDÊNCIA INSUFICIENTE` for unsupported cost data; stop before commitments, shutdown or production mutation without approval.
## Outputs and evidence
Cost baseline, drivers, alternatives, estimated range, trade-offs, authorized changes and later verification plan.
## Completion criteria
Recommendation/change has traceable data and safeguards; realized savings are claimed only after measured billing evidence.
