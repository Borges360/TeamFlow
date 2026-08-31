# Contract: Project Configuration

The legacy `.project/` directory is a distributed example only. Active local configuration lives outside checkouts at `TEAMFLOW_HOME/teams/<team-id>/projects/<project-id>/project-config.yaml`, while `.squad/` remains the installed reusable base.

## Required project information

```yaml
project:
  id: project-id
  name: Human-readable name
  status: example # example | active
  context_owner: team-or-role
  last_reviewed: "YYYY-MM-DD"
  default_language: pt-BR
  catalog:
    domains: .project/catalog/domains.yaml
    repositories: .project/catalog/repositories.yaml
    systems: .project/catalog/systems.yaml
    interfaces: .project/catalog/interfaces.yaml
    relations: .project/catalog/relations.yaml
  policy_profiles:
    quality: .project/quality-profile.md
    security_and_compliance: .project/compliance.md
    observability: .project/observability.md
  project_agent_profiles: .project/agent-profiles
  project_workflows: []
  project_skills: .project/skills
  project_gates:
    - id: local-risk-review
      applicability: conditional # always | conditional
      accountable_role: local-reviewer
  workspace:
    checkout_root: runtime-managed
    allow_reuse_clean_checkout: true
  branching:
    preferred_base: develop
    feature_pattern: feature/{demand_id}-{slug}
    repository_rules_take_precedence: true
  documentation:
    repository_id: null
    fallback_root: docs
    adr_path: docs/architecture/decisions
  delivery_records:
    path: deliveries
    git_ignored: true
  delegation_limits:
    max_depth: 1
    max_parallel_tasks: 4
    context_budget: runtime-and-task-specific
    financial_or_tool_budget: project-defined
```

## Invariants

- Project files identify owner and freshness.
- Active configuration lives at `.project/project.yaml`, uses `status: active`, a non-empty owner and an ISO `last_reviewed` date. The distributed example remains `.project/project.example.yaml` with `status: example`.
- Example context is visibly marked and never treated as production truth.
- Local configuration may add roles, skills, gates, workflows, or stricter rules.
- Catalog and policy-profile keys above are canonical. Additional local metadata belongs under an explicitly documented extension rather than aliases of canonical keys.
- Project gate entries use unique IDs, declare applicability and accountable role, and cannot collide with `.squad/registries/gates.yaml`.
- Use `project_gates: []` when no local gate exists. The validator supports the block-list shape shown above; aliases and inline object lists are outside the supported configuration subset.
- Local configuration cannot silently weaken universal policies; deviations use the exception/governance process.
- `runtime-managed` keeps product checkouts outside this template. Documentation uses the configured repository when present, otherwise the owner repository convention or `docs/` fallback.
- `delivery_records.path` is runtime-local and Git-ignored. It is not a documentation repository and must not be promoted to squad release branches.
- A project is never global: its `team_id` must match the containing team and all project commands resolve through the active team.
- `team_snapshot` and `agents_snapshot` are captured at creation. Team changes cannot mutate them; comparison/update is explicit, attributed, backed up in history and content-addressed.
- Effective context, generated runtime files, deliveries, evidence and history remain under the private project root and are not copied into product repositories by default.
