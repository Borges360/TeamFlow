---
{"schema_version":"1.0","id":"adr","version":"1.0","aliases":["decision"],"workflow":"architecture-review","side_effect_class":"repository-write","permissions":{"requires_repository_read":true,"may_write_files":true,"may_create_local_branch":true,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: adr

## Purpose
Record a consequential architectural decision and its evidence, alternatives and consequences.
## When to use
Use `/adr <decision question>` for cross-system, costly-to-reverse, exception-setting, or ownership-significant choices.
## Do not use when
Do not create ceremony for trivial/local reversible choices or autoapprove organizational decisions.
## Inputs and autonomous discovery
Discover existing ADRs, principles, owners, constraints, contracts, operational/cost evidence and current-state option.
## Blocking questions
Ask for decision owner, non-discoverable business constraint, risk acceptance or irreversible authority.
## Preconditions
Question, owner, scope, evidence sources and documentation target are explicit.
## Operational steps
Frame question → collect evidence/unknowns → compare alternatives including no change → write `proposed` ADR → route to canonical repository/path → update index/supersession → request owner review.
## Semantic decisions
Evaluate trade-offs without favoring novelty or current architecture.
## Deterministic checks
Validate required ADR sections, status vocabulary, owner, date, links, unique ID and index/supersession references.
## Failure, cancellation and recovery
Remain `proposed` or `BLOCKED` when owner/evidence is missing; never invent approval.
## Outputs and evidence
Canonical ADR target/revision, alternatives, decision status, reviewers, consequences and open questions.
## Completion criteria
ADR is stored canonically and structurally valid; `accepted` requires recorded authorized human approval.
