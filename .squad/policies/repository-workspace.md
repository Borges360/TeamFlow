# Policy: Repository Workspace

Product repositories are cloned or reused outside the squad template checkout. The runtime chooses a safe task-specific workspace; no credential is written to template artifacts.

## Sequence

1. Resolve repository candidates from authorized seeds/catalog relationships.
2. Verify access expectation separately from actual access and write authority.
3. Confirm the checkout target is outside the template.
4. Before reuse, verify remote, HEAD, branch, dirty state, worktrees and Git operations in progress.
5. Never reset, clean, overwrite, move, or delete unknown work.
6. Fetch refs without changing user work, load repository-local instructions, and record initial revision.
7. For each `changed` repository, create a repository plan and use its local branch model. Prefer `feature/<demand-id>-<slug>` from `develop` only where permitted.

Stop as `BLOCKED` for missing access, remote mismatch, unsafe target, or unknown dirty state. Clone does not authorize writes; local branch does not authorize push.
