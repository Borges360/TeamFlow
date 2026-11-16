---
{"schema_version":"1.1","id":"doc","name":"Documentation","version":"1.0","optional_invocation":true,"aliases":["docs"],"path":".squad/playbooks/playbook-doc.md","primary_workflow":"feature","side_effect_class":"repository-write","invocation_examples":["Use o playbook doc para atualizar a documentação."],"always_required":{"roles":[],"artifacts":[],"gates":[]},"conditional_activation":[],"outputs":[],"stop_conditions":[],"permissions":{"requires_repository_read":true,"may_write_files":true,"may_create_local_branch":true,"may_push":false,"may_merge":false,"may_deploy":false,"may_release":false,"may_delete":false}}
---
# Playbook: doc

## Purpose
Create or update permanent project documentation in its canonical repository.
## When to use
Use the `doc` playbook for setup, development, API, architecture, operations, troubleshooting, runbooks or references.
## Do not use when
Do not place permanent project knowledge only in `deliveries/` or copy unsupported behavior.
## Inputs and autonomous discovery
Discover audience, owner, existing convention, code/config sources, documentation repository, `docs/` fallback, links and validation tools.
## Blocking questions
Ask when owner/source of truth or confidential publication boundary cannot be discovered.
## Preconditions
Documentation target resolves to an authorized repository/path; fallback follows documentation-routing policy.
## Operational steps
Classify → inspect sources → resolve target → write/update → validate examples/commands/links where safe → update index → record target in delivery.
## Semantic decisions
Choose one canonical source and appropriate detail; distinguish verified current behavior from proposal.
## Deterministic checks
Validate path, links, headings/format, commands/examples where feasible, index entry and delivery reference.
## Failure, cancellation and recovery
Stop rather than publish secrets or invented facts; preserve prior canonical content on failed migration.
## Outputs and evidence
Canonical repository/path/branch/revision, validation output, owner and audience.
## Completion criteria
Documentation is discoverable, validated proportionally and stored outside delivery-only artifacts.
