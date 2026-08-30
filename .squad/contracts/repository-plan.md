# Contract: Repository Plan

```yaml
repository_id: customer-api
classification: changed
reason: owns requested behavior
owner: customer-platform
remote_verified: true
write_authorized: true
base_branch: develop
base_revision: abc123
working_branch: feature/DEM-123-change
planned_paths: [src, tests, docs]
pipeline_definition: .github/workflows/validate.yml
required_stages: [build, unit]
remote_only_stages: []
integration_order: 1
rollback: revert unmerged branch commit
```

Every `changed` repository requires owner, verified remote, explicit write authority, base/revision, branch or approved exception, write boundary, pipeline disposition, integration order, and rollback. Catalog visibility is not authorization.

A repository-local branch outside the common prefixes is valid only with non-empty `branch_exception` rationale and `branch_exception_approved: true`; local rules, not the prefix whitelist, decide the branch model.
