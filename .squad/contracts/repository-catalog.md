# Contract: Repository Catalog

Use the project catalog to discover repositories; do not import their contents into the template.

```yaml
repositories:
  - id: stable-logical-id
    name: repository-name
    url: "https://scm.example/org/repository-name"
    lifecycle: active # planned | active | maintenance | deprecated | archived
    type: service # application | service | frontend | mobile | data | infrastructure | configuration | test | observability | library | documentation | mainframe
    domains: [contracts]
    systems: [contract-platform]
    owners:
      team: squad-example
      technical: group-or-contact
      business: group-or-contact
    technologies: [java, postgresql]
    criticality: high
    data_classification: confidential
    interfaces:
      provides: [api:contract-query-v1]
      consumes: []
      produces: []
      subscribes: []
    dependencies: []
    deployments: []
    local_instructions: AGENTS.md
    metadata_source: catalog-or-owner
    last_verified: "YYYY-MM-DD"
```

## Required semantics

IDs remain stable if a repository is renamed. Relationships use stable IDs. Stale/unknown values are explicit. URLs grant discoverability, not write authority. Catalogs may be split by domain; a generated index may exist outside the template, but Markdown/YAML metadata remains the contract.
