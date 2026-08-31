# Universal Agentic Squad — operating instructions

This repository is a documentation-first operating model for engineering agents. It does not provide an orchestrator or runtime. Use the native capabilities of the active tool—Codex, Claude Code, Devin, or another agent—to follow the rules below.

## Source of truth

The immutable reusable base lives under `TEAMFLOW_HOME/metadata/bases/<package-version>/` after `teamflow setup`. Project-specific effective context lives under `TEAMFLOW_HOME/teams/<team-id>/projects/<project-id>/effective-context/`; repository-local instructions are the final, more restrictive layer. The distributed `.project/` directory is a legacy example only and may not silently weaken mandatory policies.

Read in this order, progressively:

1. the active project's `generated-runtime-files/activation.json`, which identifies team, project, base and effective-context paths;
2. this `AGENTS.md` from the cached immutable base;
3. the active project's `effective-context/team-snapshot.json` and `effective-context/team-files/`;
4. the cached base `.squad/policies/workflow-routing.md` and selected workflow;
5. only required role, skill, policy, contract and repository-local files; then catalog seeds and dependencies progressively.

When no active project exists, run `teamflow setup`, `teamflow team use <team-id>` and `teamflow project activate <project-id>`; do not fall back to a global project. Do not preload every file or repository. For large estates, follow `.squad/policies/context.md` and `.squad/policies/multi-repository.md`.

## Mandatory operating sequence

For every demand:

1. Preserve the user's original demand verbatim in the demand artifact.
2. Assign or derive a stable demand ID.
3. Select the primary workflow using `.squad/policies/workflow-routing.md`. When the user explicitly names a playbook or a clearly matching optional recipe materially helps, resolve it through `.squad/registries/playbooks.yaml` and load only that playbook. A playbook is never required for semantic routing or workflow execution. If workflow/recipe selection materially remains ambiguous, ask one blocking question or perform a short requirement-analysis pass; do not guess.
4. Create a minimal context bundle using `.squad/contracts/context-bundle.md`.
5. Before design or writes, inspect the target repository instructions and pipeline, then produce a change plan using `.squad/policies/change-impact.md` and `.squad/contracts/change-plan.md`. Identify the pieces likely to change, their owners, dependencies, tests, documentation, pipeline stages, integration order, and write boundary. For read-only work, record that no implementation pieces will change.
6. Run the workflow phases in order and follow the target project's existing build/test/review/deployment pipeline when one exists. Parallelize only phases explicitly marked as parallel-safe.
7. Activate conditional reviewers using `.squad/policies/risk-routing.md`, the blast radius, data classification, and project constraints.
8. Persist decisions, open questions, outputs, and evidence under the active project's private `teams/<team-id>/projects/<project-id>/deliveries/<demand-id>/` root in `TEAMFLOW_HOME`, using `.squad/templates/delivery-index.md`. Never create these records in the product or template checkout. They must not be promoted to `release/<version>` or `main`; permanent project documentation belongs in its canonical repository or the owner repository's `docs/` fallback.
9. Evaluate every required gate using `.squad/policies/quality-gates.md`. A role may recommend; the documented gate criteria decide progression.
10. Perform principal review with the greatest independence the runtime supports.
11. Deliver only when the definition of done and evidence contract are satisfied.

## Roles, delegation, and native runtimes

Agent files define responsibilities, not simulated personas or technology silos. Technologies belong in project context and optional skills.

- Use native subagents, tasks, sessions, or worktrees when the active runtime supports them.
- If delegation is unavailable, execute the same responsibilities sequentially and label the author/reviewer for each artifact.
- A delegated role receives a bounded task contract, minimal context bundle, allowed tools, expected outputs, and completion criteria.
- Delegated roles do not create further work unless `.squad/policies/delegation.md` permits it.
- Only the lead agent maintains the delivery index and decides which requested work is accepted.
- An author must not self-approve a mandatory independent review when another reviewer/runtime is available.

Follow the runtime-specific mapping in `.squad/runtimes/`; these mappings adapt native features without reimplementing them.

## Branch and project-pipeline alignment

- For ordinary task implementation, prefer a dedicated `feature/<demand-id>-<short-name>` branch created from `develop` when that model exists in the target repository. Never use an isolated `feature`, `release`, or `codex/<name>` branch; use `release/<version>` for release preparation and `feature/codex-<name>` for Codex-originated work.
- Repository-local branching rules, protected-branch policy, release trains, hotfix/incident procedures, and explicit user instructions take precedence. Record any deviation in the change plan.
- Discover CI/CD definitions and required checks before implementation. Reproduce applicable stages locally where safe; do not bypass or replace the project's pipeline with squad-specific assumptions.

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
