# Contract: Execution Record

Retain the minimum provenance needed to investigate a material execution without storing a full private conversation.

```yaml
execution_record:
  id: RUN-DEM-0001-T03-01
  demand_id: DEM-0001
  task_id: DEM-0001-T03
  started_at: "YYYY-MM-DDTHH:MM:SSZ"
  ended_at: null
  actor_role: software-engineer
  runtime: null
  model_or_agent_version: null
  context_bundle: deliveries/DEM-0001/context-bundle.md
  repository_revisions: []
  tools:
    - name: test-runner
      version: null
      operation_class: read-only
  attempts: []
  decisions: []
  artifacts: []
  evidence: []
  termination: completed
  sensitive_content_retained: false
  limitations: []
```

## Invariants

- Record only metadata available from the runtime or produced by the task; never invent model, token or tool-version values.
- Full prompts, chain-of-thought, raw context windows and secrets are not required and should not be retained by default.
- Repository revisions, context-bundle ID, tools/actions, attempts, decisions and evidence make material variation inspectable.
- Sensitive outputs remain in approved restricted storage and are referenced rather than copied.
