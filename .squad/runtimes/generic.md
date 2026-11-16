# Runtime Mapping: Generic Development Agent

## Bootstrap

1. Resolve the durable workspace with `teamflow project path <project-id> --team <team-id>` and start work with `teamflow demand exec <demand-id> --project <project-id> --team <team-id> -- <runtime>`.
2. Read the generated demand-worktree entrypoint and the pinned immutable base; do not require `.project/` in a product checkout.
3. Let one native session/agent act as lead and maintain `workspace/deliveries/<demand-id>/` only beneath that private project root.

## Roles and delegation

If the runtime supports native agents, tasks, sessions, or isolated workspaces, map each bounded task to the appropriate role file and task contract. If it does not, the lead performs the responsibilities sequentially and records role, result, and review limitation.

## Required behavior

- follow workflow routing and progressive context;
- treat repository-local instructions as additional implementation context;
- produce versioned artifacts and evidence;
- use the runtime's native repository, terminal, browser, test, and review features;
- stop for missing authority or blocking user input.

No adapter, server, protocol bridge, or local orchestrator is required.
