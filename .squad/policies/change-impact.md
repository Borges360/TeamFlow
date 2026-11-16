# Policy: Change Impact

Analyze the pieces a demand may change before solution design, delegation, or writes. The purpose is to constrain scope and integration—not to predict every file perfectly.

## Required analysis

1. Start from the repository seeds authorized by the demand and context bundle.
2. Read repository-local instructions and discover the branching model and CI/CD pipeline.
3. Identify likely changed and affected pieces: repositories, components, files/directories, interfaces, schemas/data, configuration/infrastructure, tests, documentation, observability, ownership and approvals.
4. Classify each repository or piece as `observed`, `affected`, `changed`, or `follow-up`.
5. Record dependencies, integration/merge order, compatibility, rollout/rollback implications and write boundary.
6. Link each proposed change to a requirement or risk. Do not add a piece merely because it exists in the stack.
7. Reassess after reproduction, design or implementation reveals material scope.
8. For every changed component/API, resolve catalogued journeys and evaluate API/contracts, frontend, mobile/webview, internal/external consumers, data/analytics, infrastructure, observability, tests and documentation. Mark every surface `changed`, `affected`, `observed`, `follow-up`, `not_applicable`, or `unknown`.

When documentation presents mutually exclusive alternatives and the demand identifies neither an accepted option nor enough criteria to choose, ask which solution to implement or whether to begin technical discovery. Agent preference is not a decision criterion. Alternative records use stable IDs, proposal/discarded/selected/superseded status, evidence, constraints and human decision when available.

Use `.squad/contracts/change-plan.md` and `.squad/templates/change-plan.md`. A read-only demand still produces a small plan that explicitly records zero intended writes.

## Decision rules

- A piece may be discovered autonomously when repository evidence is available and access is authorized.
- A low-risk file-level estimate may remain an assumption if its impact and validation are recorded.
- Unknown business behavior, ownership, production authority, regulated data or irreversible architecture blocks the affected decision; it is not converted into an assumption.
- Do not open broad write scope from an unreviewed search result. Add repositories progressively under the multi-repository policy.
- A material scope change invalidates affected context, architecture, quality and readiness decisions until reevaluated.

## Completion criterion

Implementation begins only when the changed pieces, affected consumers, required verification, pipeline alignment and write boundary are explicit enough to execute safely. Exact file lists may evolve, but silent scope expansion is prohibited.
