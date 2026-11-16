# Contract: Change Plan

Create this artifact before implementation to show which pieces are expected to change and how they will be integrated and verified.

```yaml
change_plan:
  id: CHANGE-DEM-0001-01
  demand_id: DEM-0001
  generated_at: "YYYY-MM-DDTHH:MM:SSZ"
  base_revisions: []
  repository_instructions: []
  branch:
    model: feature-from-develop
    base: develop
    name: feature/DEM-0001-short-name
    deviation_reason: null
  pipeline:
    sources_inspected: []
    status: found # found | not_found | inaccessible
    applicable_stages: []
    local_commands: []
    remote_or_protected_checks: []
  pieces:
    - id: component-or-path
      repository: repository-id
      classification: changed # observed | affected | changed | follow-up
      reason: "Requirement/risk addressed"
      owner: null
      dependencies: []
      contracts_or_data: []
      tests: []
      documentation: []
      observability: []
      journeys:
        - id: journey-id
          classification: affected
          surfaces:
            api_contracts: affected
            frontend: not_applicable
            mobile_webview: not_applicable
            internal_external_consumers: observed
            data_analytics: observed
            infrastructure: not_applicable
            observability: affected
            tests: changed
            documentation: changed
  integration_order: []
  write_boundary: []
  excluded: []
  assumptions: []
  unknowns: []
  risks: []
  refresh_triggers: [scope-change, reproduction-change, design-change]
```

## Invariants

- Each changed piece links to a requirement or risk and has verification expectations.
- Affected consumers may be read-only but are not omitted from blast radius.
- Pipeline status and inspected sources are explicit; absence is not guessed.
- Branch guidance defers to repository-local rules and authorized incident/hotfix procedures.
- Unknown ownership, business behavior or irreversible impact remains blocking for that decision.
- Material scope changes create a revised plan and invalidate affected gates.
- Every impacted journey and each of its standard surfaces has an explicit disposition: `changed`, `affected`, `observed`, `follow-up`, `not_applicable`, or `unknown`.
