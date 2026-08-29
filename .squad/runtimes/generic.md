# Runtime Mapping: Generic Development Agent

## Bootstrap

1. Configure the tool to read root `AGENTS.md` as project instructions, or provide that file as the initial project context.
2. Keep `.squad/` available as the reusable instruction library and `.project/` as project context.
3. Let one native session/agent act as lead and maintain `deliveries/<demand-id>/`.

## Roles and delegation

If the runtime supports native agents, tasks, sessions, or isolated workspaces, map each bounded task to the appropriate role file and task contract. If it does not, the lead performs the responsibilities sequentially and records role, result, and review limitation.

## Required behavior

- follow workflow routing and progressive context;
- treat repository-local instructions as additional implementation context;
- produce versioned artifacts and evidence;
- use the runtime's native repository, terminal, browser, test, and review features;
- stop for missing authority or blocking user input.

No adapter, server, protocol bridge, or local orchestrator is required.
