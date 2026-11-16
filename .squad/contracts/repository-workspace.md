# Contract: Repository Workspace

```yaml
workspace_id: WS-DEM-123
demand_id: DEM-123
root_kind: teamflow-demand-worktree
repositories:
  - repository_id: customer-api
    remote_url: https://scm.example/org/customer-api
    remote_matches_catalog: true
    outside_template: true
    checkout_state: cloned
    persistent_checkout_ref: workspace/repositories/customer-api
    worktree_ref: state/worktrees/DEM-123/customer-api
    access: verified
    head_before: abc123
    dirty_before: false
    instructions_loaded: [AGENTS.md]
```

Do not retain credentials or private absolute paths when an opaque reference is sufficient. `outside_template: true` is a required assertion backed by runtime inspection. Checkout states are `planned`, `cloned`, `reused`, `blocked`, or `failed`. A persistent checkout requires verified access and a remote matched to the catalog; a writing demand gets its own worktree and a dirty checkout cannot be reused silently.
