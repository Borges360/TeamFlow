# Contract: Project Configuration

The `.project/` directory supplies replaceable context for one squad/project while `.squad/` remains reusable.

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
    repositories: .project/catalog/repositories.yaml
    systems: .project/catalog/systems.yaml
    relations: .project/catalog/relations.yaml
  policy_profiles:
    quality: .project/quality-profile.md
    security: .project/compliance.md
    observability: .project/observability.md
  project_workflows: []
  project_skills: []
```

## Invariants

- Project files identify owner and freshness.
- Example context is visibly marked and never treated as production truth.
- Local configuration may add roles, skills, gates, workflows, or stricter rules.
- Local configuration cannot silently weaken universal policies; deviations use the exception/governance process.
