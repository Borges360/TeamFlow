---
{"schema_version":"1.1","id":"bugfix","name":"Bugfix","version":"1.0","optional_invocation":true,"aliases":["fix"],"path":".squad/playbooks/playbook-bugfix.md","primary_workflow":"bugfix","side_effect_class":"repository-write","invocation_examples":["Use o playbook bugfix para corrigir o defeito.","Use .squad/playbooks/playbook-bugfix.md.","Corrija o comportamento incorreto."],"always_required":{"roles":[],"artifacts":[],"gates":[]},"conditional_activation":[],"outputs":[],"stop_conditions":[],"permissions":{"requires_repository_read":true,"may_write_files":true,"may_create_local_branch":true,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: bugfix

## Purpose
Diagnose and correct incorrect existing behavior with regression evidence.
## When to use
Use the `bugfix` playbook for reproducible or observable defects.
## Do not use when
Use feature for new behavior; use investigate-only workflow when implementation is not authorized.
## Inputs and autonomous discovery
Capture symptoms, expected behavior, environment and evidence; discover code owners, history, telemetry, tests and pipeline.
## Blocking questions
Ask when expected behavior/business rule or safe reproduction conditions cannot be discovered.
## Preconditions
Repository plan and a reproduction, observable failure, or explicit `EVIDÊNCIA INSUFICIENTE` disposition exist before correction.
## Operational steps
Reproduce → form hypotheses → test hypotheses → isolate supported cause → add regression → implement minimal correction → run targeted and applicable regression/pipeline.
## Semantic decisions
Separate correlation, hypothesis and confirmed cause; avoid opportunistic cleanup.
## Deterministic checks
Show failure before/fix after where feasible; run regression, contracts, build and static checks.
## Failure, cancellation and recovery
If reproduction is unsafe/unavailable, return diagnosis/instrumentation plan instead of inventing a cause.
## Outputs and evidence
Reproduction procedure, causal evidence, correction, regression test, commands/results and residual uncertainty.
## Completion criteria
Supported cause is corrected or explicitly unresolved; regression and applicable gates/review pass.
