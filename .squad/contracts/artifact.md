# Contract: Artifact

An artifact is a versioned work product used to make or verify a decision.

```yaml
artifact:
  id: ART-001
  demand_id: DEM-0001
  type: architecture
  title: "Contract query solution"
  status: draft # draft | in_review | accepted | superseded
  owner_role: solution-architect
  path: deliveries/DEM-0001/architecture.md
  sources: []
  related_requirements: []
  related_repositories: []
  reviewers: []
  sensitivity: internal
  created_at: "YYYY-MM-DDTHH:MM:SSZ"
  updated_at: "YYYY-MM-DDTHH:MM:SSZ"
  supersedes: null
```

## Invariants

Artifacts name an owner, status, source, and scope. Accepted artifacts are changed through a new reviewed revision; superseded artifacts remain traceable. Links must resolve or name the external system and identifier.
