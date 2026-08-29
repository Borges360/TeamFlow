# EXAMPLE CONTEXT — repository estate

> Replace with real catalogs or resolvable catalog links. The example intentionally does not enumerate 100+ repositories.

## Catalog layout

- `catalog/systems.example.yaml`: representative systems/domains.
- `catalog/repositories.example.yaml`: representative repository records.
- `catalog/domains.example.yaml`: representative business/domain ownership.
- `catalog/interfaces.example.yaml`: representative APIs, events, services, and datasets.
- `catalog/relations.example.yaml`: representative cross-repository relationships.

Adopting projects may split files by domain or link an enterprise service catalog. Keep the repository catalog contract stable.

## Discovery rules for this example

1. Start from a demand's system, business capability, API, event, dataset, or named repository.
2. Find its owning catalog record and check `last_verified`.
3. Inspect direct consumers/producers, deployment/configuration, automated-test, observability, data, and system-of-record relationships only as the demand requires.
4. Read repository-local `AGENTS.md`/instructions before implementation.
5. Record observed, affected, changed, and follow-up repositories in the demand context bundle.
6. Escalate stale ownership, missing classification, ambiguous interface ownership, or write scope above the approved boundary.

## Example repository types

`application`, `service`, `frontend`, `mobile`, `data`, `infrastructure`, `configuration`, `test`, `observability`, `library`, `documentation`, and `mainframe`.

## Source and freshness

- Catalog owner: `[platform-engineering-or-enterprise-catalog-owner]`
- Source of truth: `[URL or repository]`
- Required verification cadence: `[define]`
- Last verified: `EXAMPLE — not verified`
