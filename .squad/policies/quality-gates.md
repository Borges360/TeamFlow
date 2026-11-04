# Policy: Quality Gates

A gate is a documented decision over explicit criteria. It is not a runtime state. Use the gate-decision contract and link evidence.

Canonical gate IDs, applicability classes and accountable roles are indexed in `.squad/registries/gates.yaml`. Project gates are explicit extensions under the project-config contract and cannot redefine a universal ID.

## Decision values

- `PASS`: every mandatory criterion is satisfied with evidence.
- `FAIL`: one or more mandatory criteria are not satisfied.
- `BLOCKED`: evaluation cannot finish because required input, access, environment, or evidence is unavailable.
- `WAIVED`: an authorized, time-bound exception exists under the exception policy.
- `NOT_APPLICABLE`: allowed only for conditional gates, with rationale and reviewer.

## Universal gate set

| Gate | When | Minimum criteria | Accountable role |
|---|---|---|---|
| Requirement | behavior or outcome changes | goals, non-goals, acceptance criteria, constraints and blocking questions resolved | Requirement Analyst |
| Context | any implementation or multi-component/repository work | seed context, ownership, dependencies, change plan, branch/pipeline discovery, blast radius and write boundary recorded | Lead |
| Architecture | structural, cross-boundary, hard-to-reverse or high-risk change | requirements traceability, alternatives, contracts, risks, rollout/rollback | Solution Architect |
| Security | security trigger applies | classification, threats, controls, findings and risk disposition | Security Engineer |
| Quality | implementation or verification output exists | criteria-to-test traceability, appropriate coverage, retained results, residual gaps | Quality Engineer |
| Production Readiness | production behavior/deployment can change | observability, ownership, rollout, rollback, recovery, capacity and runbooks as applicable | Reliability Engineer |
| Principal Review | every delivery | cross-artifact consistency, evidence sufficiency, all prior gates resolved | Principal Reviewer |
| Delivery | every delivery | requested outcome, artifacts, evidence, limitations, next actions and actual status are accurate | Lead |

Data, Performance, Platform, Accessibility, Compliance and Mainframe are registered conditional gates. Project configuration may add non-colliding domain gates. Applicability is decided from risk, not from whether a specialist happens to be available.

## Re-evaluation

Re-run an affected gate when scope, requirements, architecture, data classification, repository set, implementation, evidence, or exception changes materially. A later gate cannot override a failed earlier gate; it can only return the work for correction or reference an authorized waiver.
