# EXAMPLE CONTEXT — observability and reliability profile

> Replace example products and placeholders with actual services, dashboards, monitors, owners, SLOs, and runbooks.

## Example stack context

Datadog may provide logs, metrics, traces, dashboards, monitors, and SLO views. Its presence does not prove telemetry quality or ownership.

## Per-service metadata to configure

| Service/system | Owner | Critical journeys | SLIs/SLOs | Dashboards | Alerts/runbooks | Recovery tier |
|---|---|---|---|---|---|---|
| `[service]` | `[owner]` | `[journeys]` | `[links]` | `[links]` | `[links]` | `[tier/RTO/RPO]` |

## Example guardrails

- Alerts must be actionable, owned, routed, severity-calibrated, and linked to a runbook.
- Logs avoid secrets and sensitive payloads and support correlation.
- Metrics describe units, aggregation, cardinality, and source.
- Traces preserve useful boundaries without uncontrolled cost or sensitive attributes.
- SLOs measure user-relevant outcomes; SLAs require business authorization.
- Rollout validation includes business and technical signals plus an observation window.
