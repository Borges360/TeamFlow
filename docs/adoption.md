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

## 6. Trial and review

Run one feature, bugfix, and review-only demand. Inspect context size, questions, artifacts, evidence, gate decisions, and repository discovery. Improve declarative files before considering helper code.

## Update rule

Put reusable behavior in `.squad/`; put factual/local configuration in `.project/`; put repository-specific implementation rules in that repository. Add executable scripts only for concrete validation or collection that documentation cannot perform.
