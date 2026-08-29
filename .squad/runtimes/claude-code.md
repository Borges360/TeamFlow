# Runtime Mapping: Claude Code

Configure Claude Code's project instruction mechanism to include or point to root `AGENTS.md`. Keep `.squad/` and `.project/` readable from the project.

## Suggested mapping

- Main Claude Code session: lead and workflow owner.
- Native subagents/tasks: bounded specialist or independent review contracts.
- Repository-local instruction files: implementation-specific context, subordinate to the precedence rules.
- Native tools/hooks/commands: optional operational conveniences; they are not the squad architecture.

If the runtime expects another instruction filename, keep that file as a thin pointer to `AGENTS.md` rather than duplicating the universal base. Use the generic sequential fallback when delegation is unavailable.
