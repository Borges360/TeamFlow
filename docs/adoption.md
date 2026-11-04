# Adopting the Template

## 1. Copy the universal base

Copy root `AGENTS.md`, `squad.yaml`, and `.squad/` into the target project or a governed instruction repository. Keep universal changes independently versioned where possible.

## 2. Replace the example project context

Replace every `.project/` file marked `EXAMPLE CONTEXT`. Name real owners, sources, freshness dates, catalog locations, policies, and repository metadata. Delete example technologies or profiles that do not apply.

## 3. Connect the repository estate

Choose stable IDs and register systems, repositories, ownership, interfaces, dependencies, criticality, and data classification. Split catalogs by domain when needed; do not copy source code into the template.

## 4. Calibrate governance

Define gate applicability, risk/severity thresholds, evidence retention, human approval boundaries, production actions, regulations, and reviewer independence. Project rules may be stricter than the universal base.

## 5. Configure the development-agent runtime

Point the runtime's project instruction mechanism to `AGENTS.md`. Use its native agents/tasks and tools. A thin runtime-specific pointer file is acceptable; a custom orchestrator is not required.

Set `squad.yaml` adoption mode to `active`, point it to `.project/project.yaml`, and run `python scripts/validate-template.py --mode active`.

## 6. Align branch and project pipeline

Document the repository's branch model and CI/CD workflow. When the project supports `develop`, prefer one `feature/<demand-id>-<short-name>` branch per task. Repository-local GitFlow, trunk-based, release-train, hotfix and protected-branch rules take precedence.

Before implementation, inspect the project's pipeline definitions and record applicable build, lint, test, security, packaging, deployment and approval stages in the change plan. The squad follows that pipeline; it does not replace or bypass it.

## 7. Trial and review

Run one feature, bugfix, and review-only demand. Inspect context size, questions, artifacts, evidence, gate decisions, and repository discovery. Improve declarative files before considering helper code.

The first implementation artifact after context is a change plan identifying affected/changed pieces, tests, documentation, pipeline and integration order. Start with a small reversible single-repository pilot. See [start.md](../start.md).

## Update rule

Put reusable behavior in `.squad/`; put factual/local configuration in `.project/`; put repository-specific implementation rules in that repository. Add executable scripts only for concrete validation or collection that documentation cannot perform.

Create a squad-template release only when reusable structure, mandatory behavior or contracts change. Project deliveries and local `.project/` updates do not create a squad release; application releases follow the application's pipeline.
