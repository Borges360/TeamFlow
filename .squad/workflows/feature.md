# Workflow: Feature

## Use when

New or changed behavior must be designed, implemented, tested, and delivered.

## Flow

`Demand → Requirements → Context & blast radius → Architecture → Specialist reviews → Implementation → QA → Production readiness → Principal review → Delivery`

## Phases and gates

| Phase | Accountable role | Required output | Gate |
|---|---|---|---|
| Demand intake | Lead | demand intake and delivery index | — |
| Requirements | Requirement Analyst | requirements and open questions | Requirement |
| Context and scope | Lead + relevant specialists | context bundle, repositories and blast radius | Context |
| Solution design | Solution Architect | architecture and ADRs when needed | Architecture |
| Risk reviews | Security, Reliability, Data, Performance, Platform as applicable | specialist reviews | applicable specialist gates |
| Implementation | Software/Platform/Data Engineer | changes and implementation evidence | — |
| Verification | Quality Engineer | test evidence and QA report | Quality |
| Operational readiness | Reliability Engineer | production readiness | Production Readiness |
| Final review | Principal Reviewer | final review | Principal Review |
| Delivery | Lead | delivery summary | Delivery |

Specialist reviews may run in parallel after requirements and initial architecture are stable. Implementation work may be parallelized by repository only when contracts, ownership, integration order, and merge dependencies are explicit.

## Required controls

- Trace each acceptance criterion to implementation and verification.
- Update the context bundle when new repositories or risks enter scope.
- Re-run affected gates after a material design or scope change.
- Treat documentation, rollout, rollback, observability, and evidence as delivery work.

## Exit criteria

Every applicable gate is resolved, no blocker remains, evidence is retained, the deployment/rollout boundary is explicit, and the delivery summary matches the actual outcome.
