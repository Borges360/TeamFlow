# Contract: Playbook Result

```yaml
playbook_id: feature
playbook_version: "1.0"
demand_id: DEM-123
status: completed
primary_workflow: feature
repositories:
  - id: customer-api
    branch: feature/DEM-123-change
    revision: abc123
    result: verified
    evidence: [EV-TEST]
artifacts: []
checks: []
decisions: []
unknowns: []
residual_risk: []
evidence: [EV-TEST]
controls: {}
```

The result identifies the resolved playbook/version, repositories and permanent artifacts. `completed` requires all mandatory repository plans and checks resolved plus applicable gates and Principal Review; it is not inferred from prose.
