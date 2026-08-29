# Universal Agentic Squad — operating instructions

This repository is a documentation-first operating model for engineering agents. It does not provide an orchestrator or runtime. Use the native capabilities of the active tool—Codex, Claude Code, Devin, or another agent—to follow the rules below.

## Source of truth

The reusable base lives in `.squad/`. Project-specific context lives in `.project/` and may override local choices, but it may not silently weaken mandatory policies from `.squad/policies/`.

Read in this order, progressively:

1. this `AGENTS.md`;
2. `.project/context.md`, `.project/squad.md`, and `.project/constraints.md`;
3. `.squad/policies/workflow-routing.md` and the selected workflow;
4. only the agent-role, skill, policy, contract, and project files required by the task;
5. repository catalog entries for seed repositories, then their dependencies as needed.

Do not preload every file or repository. For large estates, follow `.squad/policies/context.md` and `.squad/policies/multi-repository.md`.

## Mandatory operating sequence

For every demand:

1. Preserve the user's original demand verbatim in the demand artifact.
2. Assign or derive a stable demand ID.
3. Select a workflow using `.squad/policies/workflow-routing.md`. If selection is ambiguous, ask one blocking question or perform a short requirement-analysis pass; do not guess.
4. Create a minimal context bundle using `.squad/contracts/context-bundle.md`.
5. Run the workflow phases in order. Parallelize only phases explicitly marked as parallel-safe.
6. Activate conditional reviewers using `.squad/policies/risk-routing.md`, the blast radius, data classification, and project constraints.
7. Persist decisions, open questions, outputs, and evidence under `deliveries/<demand-id>/` using `.squad/templates/delivery-index.md`.
8. Evaluate every required gate using `.squad/policies/quality-gates.md`. A role may recommend; the documented gate criteria decide progression.
9. Perform principal review with the greatest independence the runtime supports.
10. Deliver only when the definition of done and evidence contract are satisfied.

## Roles, delegation, and native runtimes

Agent files define responsibilities, not simulated personas or technology silos. Technologies belong in project context and optional skills.

- Use native subagents, tasks, sessions, or worktrees when the active runtime supports them.
- If delegation is unavailable, execute the same responsibilities sequentially and label the author/reviewer for each artifact.
- A delegated role receives a bounded task contract, minimal context bundle, allowed tools, expected outputs, and completion criteria.
- Delegated roles do not create further work unless `.squad/policies/delegation.md` permits it.
- Only the lead agent maintains the delivery index and decides which requested work is accepted.
- An author must not self-approve a mandatory independent review when another reviewer/runtime is available.

Follow the runtime-specific mapping in `.squad/runtimes/`; these mappings adapt native features without reimplementing them.

## User interaction

Ask the user when an unknown is blocking, high-impact, irreversible, regulatory, security-sensitive, or would materially change scope/architecture. Use `.squad/contracts/user-input.md`.

Reasonable low-risk assumptions are allowed only when recorded with impact and validation plan. Never convert a blocking business rule into an assumption.

## Evidence and claims

Every material claim must reference evidence. Evidence must say what was executed or inspected, where, when, by whom/which role, and what the result proves. A screenshot alone is insufficient when a reproducible command or structured report is available.

Tests must include scope, environment, data/setup, command or procedure, result, and retained output. Follow `.squad/policies/evidence.md` and `.squad/contracts/evidence.md`.

## Multi-repository safety

- Start from repository seeds in the demand or project catalog.
- Expand dependencies progressively and record why each repository entered scope.
- Distinguish application, service, frontend, mobile, data, infrastructure, configuration, test, observability, documentation, and mainframe repositories.
- Estimate blast radius before writes.
- Never make broad changes across 100+ repositories from an unreviewed search result.
- Respect ownership, data classification, repository-local instructions, and approval boundaries.

## Stop conditions

Stop and report `NEEDS_USER_INPUT` or `BLOCKED` when:

- a blocking question remains unanswered;
- required context or repository access is unavailable;
- a mandatory gate fails;
- evidence is missing or contradictory;
- the requested action exceeds permissions or approved blast radius;
- reviewer independence required by policy cannot be achieved.

Do not report completion while any mandatory artifact, review, gate, or evidence item remains open.
