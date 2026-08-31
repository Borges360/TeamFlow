# Contract: Journey Catalog Entry

```yaml
journey:
  id: stable-id
  name: Human-readable name
  objective: Business/user outcome
  owner: team-or-role
  criticality: unknown
  actors_channels: []
  systems: []
  repositories: []
  apis: []
  events: []
  data: []
  dependencies: []
  operational_requirements: []
  source: catalog-or-owner
  verified_at: null
```

An impacted journey is expanded into API/contracts, frontend, mobile/webview, internal/external consumers, data/analytics, infrastructure, observability, tests and documentation. Every surface receives exactly one disposition: `changed`, `affected`, `observed`, `follow-up`, `not_applicable`, or `unknown`.
