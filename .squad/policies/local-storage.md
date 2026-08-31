# Policy: Local team and project storage

The npm CLI stores reusable private configuration outside product repositories. On Windows the default root is `%USERPROFILE%\.teamFlow`; on macOS and Linux it is `$HOME/.teamFlow`. `TEAMFLOW_HOME` or explicit `--home <path>` may override it.

## Isolation invariants

- A team is the isolation boundary. Projects exist only at `teams/<team-id>/projects/<project-id>`; no global projects directory or cross-team project listing is allowed.
- Team configuration, context, catalog, agent profiles, policies, templates and history remain under the team root.
- Project effective context, generated runtime files, deliveries, evidence and history remain under that project root.
- The active state records both `team_id` and `project_id`. Changing teams clears an active project from another team.
- Project creation captures a content-addressed team/agent snapshot plus copies of `context/`, `catalog/`, `policies/`, `profiles/` and `templates/`. Later team changes never mutate it; comparison reports configuration and file differences, while update is explicit, attributed and historical.
- Schema/config migrations create a local backup before writes. Archive changes status and preserves files.
- Files are private by default, writes are atomic, IDs reject traversal, and secret-bearing configuration keys are rejected.

Exports are explicit user actions. Runtime activation exposes only the selected project metadata and generated files; it does not copy squad context into a product checkout.

Effective precedence is: immutable base cached from the npm package in `metadata/bases/<version>` → reusable team configuration → project snapshot/stricter project configuration → product repository instructions. A lower layer may add or strengthen controls. Weakening a mandatory policy requires an explicit, attributable, authorized exception; it is never inferred during snapshot update.
