# Contract: Local Team Configuration

`TEAMFLOW_HOME/teams/<team-id>/team-config.yaml` is JSON-compatible YAML with `schema_version`, team identity/status/timestamps, locale, Git flow/delivery policy, installed/unavailable agent profiles and pending bootstrap information.

The team owns reusable context, catalog, policies, profiles and templates. It never contains a global project index: projects are discovered only as direct children of that team's `projects/` directory.

Agent installation/removal updates only the active team's configuration. Removing an agent used by an active project's snapshot requires explicit confirmation and never edits that snapshot. An unavailable profile cannot make a risk gate inapplicable; the workflow requests installation, an authorized human reviewer or returns `BLOCKED`.

Projects capture a content hash and immutable copy of the effective team configuration. An explicit snapshot update records timestamp, author, reason, before/after hashes and the previous content under project history.
