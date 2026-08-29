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
- Delegation depth, fan-out, context, and material cost/time limits are explicit; zero child limits prohibit re-delegation.
- A task is `ready` only when its blocking inputs and authority exist.
- The assignee returns a result; it does not silently redefine the task.
