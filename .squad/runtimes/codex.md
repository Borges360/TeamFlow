# Runtime Mapping: Codex

Use root `AGENTS.md` as the entrypoint. Codex's native project instructions, tools, tasks/subagents when available, terminals, workspaces/worktrees, and review capabilities execute the model defined here.

## Suggested mapping

- Current task: lead role and delivery index owner.
- Native subagent/task: one bounded task contract plus relevant role/skill/context files.
- Worktree or isolated task: parallel repository implementation when merge boundaries are explicit.
- Review capability or independent task: Principal Reviewer and specialist review.
- Repository files: durable artifacts, project context, and evidence pointers.

Do not create a Python wrapper around Codex. If a capability is unavailable in the active Codex environment, follow the generic sequential fallback and disclose the limitation.

Reference: [Codex `AGENTS.md` project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
