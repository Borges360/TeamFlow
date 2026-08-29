# Policy: Runtime Portability

The template specifies work products and behavior independently of Claude Code, Codex, Devin, or another development-agent runtime.

## Portable core

- Markdown/YAML files are the source of truth.
- Roles are responsibility profiles, not runtime classes.
- Workflows are ordered instructions, not executable state machines.
- Contracts define handoff content, not a transport protocol.
- Gate decisions and evidence are versionable artifacts.

## Runtime mapping

Use native project instructions, agents/tasks, context, terminals, repository tools, and review features. If a native capability is absent, perform the same responsibility sequentially or document the limitation.

Do not add an orchestrator, scheduler, server, database, message bus, adapter framework, or agent simulator merely to normalize runtimes. MCP and A2A are intentionally outside this template's implementation scope.
