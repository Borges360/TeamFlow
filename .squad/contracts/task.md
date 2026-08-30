# Contract: Task

Use this contract for any bounded unit assigned to a role or native subagent. YAML below is illustrative and may be represented as Markdown by the runtime.

```yaml
task:
  id: DEM-0001-T03
  demand_id: DEM-0001
  objective: "One observable outcome"
  assigned_role: quality-engineer
  capability: evidence-driven-testing
  status: ready
  inputs:
    artifacts: []
    context_bundle: deliveries/DEM-0001/context-bundle.md
  scope:
    repositories: []
    paths: []
    allowed_actions: [read, test]
    excluded: []
  constraints: []
  risks: []
  execution:
    operation_class: read-only # read-only | idempotent-write | non-idempotent-write | destructive | external-communication
    side_effects: []
    timeout_or_stop_condition: null
    retry:
      eligible: false
      max_attempts: 1
      conditions: []
      approval_required: false
    cancellation: "Stop new effects and report uncertain in-flight state"
    recovery_or_rollback: null
  limits:
    delegation_depth_remaining: 0
    max_parallel_children: 0
    context_budget: minimal
    time_or_cost_budget: project-defined
  expected_outputs: []
  completion_criteria: []
  allowed_tools: []
  blocking_dependencies: []
  return_to: lead
```

## Invariants

- `objective` describes an outcome, not a vague activity.
- Scope and allowed actions are explicit; omitted write access means no write access.
- Inputs use artifact/context references rather than duplicating the whole project.
- Expected outputs use artifact/result/evidence contracts.
- Operation class, possible side effects, retry eligibility, cancellation and recovery are explicit for material actions. Omitted retry eligibility means no automatic retry.
- Delegation depth, fan-out, context, and material cost/time limits are explicit; zero child limits prohibit re-delegation.
- A task is `ready` only when its blocking inputs and authority exist.
- The assignee returns a result; it does not silently redefine the task.
- `allowed_tools` is the task authorization/selection boundary. If a runtime cannot hide other tools, their presence does not authorize use.
