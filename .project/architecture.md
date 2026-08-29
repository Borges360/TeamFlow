# EXAMPLE CONTEXT — architecture baseline

> Replace with verified C4 views, ADR index, service catalog links, deployment topology, data flows, and recovery model. Do not invent them from the technology list.

## Example landscape model

```text
Mobile/web clients
      ↓
Frontend applications / webviews
      ↓
APIs and services
   ↙          ↘
Operational data   Events/integration
   ↓                  ↓
Data platform      Mainframe systems of record
      ↘              ↙
 Observability, infrastructure and configuration repositories
```

This picture is illustrative, not an asserted target architecture.

## Sources of architectural truth to configure

- C4 context/container/component diagrams: `[link/location]`
- ADR index: `[link/location]`
- API/event/data contract registry: `[link/location]`
- deployment and environment topology: `[link/location]`
- resilience/DR tier and RTO/RPO: `[link/location]`
- guardrails and approved patterns: `[link/location]`
- FinOps tagging/budget policy: `[link/location]`

## Example decision triggers

Require architecture review for new system boundaries, shared contracts, persistent data models, cross-domain events, mainframe integration, new cloud services, changed recovery objectives, high-cost capacity choices, or guardrail exceptions.
