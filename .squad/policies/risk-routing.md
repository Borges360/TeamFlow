# Policy: Risk Routing

Risk routing activates responsibilities and conditional gates from evidence about the demand; it does not instantiate permanent agents for every technology.

## Build the risk profile

At intake and after context discovery, record impact, reversibility, criticality, data classification, user exposure, production reach, repository/interface blast radius, novelty, operational change, and uncertainty. Reassess after material scope or design changes.

| Trigger | Required responsibility/review |
|---|---|
| New boundary, shared contract, cross-system/repository design, hard-to-reverse choice | Solution Architect / Architecture Gate |
| Identity, authorization, secrets, untrusted input, exposure, sensitive/regulated data, dependency or supply-chain change | Security Engineer / Security Gate |
| Production behavior, SLO/capacity/deployment/recovery/alert/dependency failure impact | Reliability Engineer / Production Readiness Gate |
| Dataset, schema, pipeline, catalog, lineage, retention, backfill or analytical cost | Data Engineer / data review |
| Hot path, material traffic/data growth, latency/throughput target, capacity or efficiency concern | Performance Engineer / performance review |
| Infrastructure-as-code, CI/CD, cloud resource, shared configuration or observability configuration | Platform Engineer / platform review |
| User-facing UI, webview, document or interaction | Quality Engineer with accessibility review under project standard |
| Mainframe online/batch/DB2/dataset boundary | Project mainframe profile plus Architecture, Data, Reliability and Quality as applicable |
| Any implementation | Quality Engineer / Quality Gate |
| Every delivery | Principal Reviewer / Principal Review Gate |

## Rules

1. Technology presence alone does not activate a role; affected behavior and risk do.
2. Unavailable specialist capacity does not make a gate inapplicable. Use an approved reviewer, disclose the limitation, or stop.
3. Multiple reviews may run in parallel after their shared requirements/context are stable.
4. Record why each conditional gate is applicable or not applicable.
5. After determining required responsibilities, compare them with the active project's immutable `agents_snapshot`. An unavailable agent never changes gate applicability: request explicit installation plus project snapshot update, route to an authorized human reviewer, or return `BLOCKED`. Record the missing profile and resolution before the affected phase proceeds.
