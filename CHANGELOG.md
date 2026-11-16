# Changelog

## 0.1.1 - 2026-08-30

- Added the local `teamflow setup` wizard with resume, dry-run, non-interactive configuration, Portuguese defaults and agent presets.
- Added private cross-platform `TEAMFLOW_HOME` storage with isolated teams/projects, active-state boundaries, snapshots, explicit updates, history, archive, export and migration backups.
- Added team/project/agent/catalog/doctor commands, journey catalog support and formal local Git delivery/`ready_for_push` policy without remote operations.
- Made playbooks explicitly optional, standardized `playbook-*.md` names, added technical discovery and preserved semantic workflow routing without playbook invocation.
- Added filesystem integration, isolation, agent snapshot, migration and remote-operation policy tests.

This change prepares only a local `release/0.1.1` branch. It does not push, create a tag/GitHub Release/PR, merge, publish npm, or deploy.

## 0.1.0 - 2026-08-30

- Added the zero-runtime-dependency `teamflow` npm CLI for deterministic installation and safe updates from immutable Git release tags.
- Added origin, annotated-tag, clean-working-tree, downgrade, idempotency, and rollback protections.
- Added cross-platform Node tests, npm package dry-runs, clean tarball smoke tests, and release/version verification.
- Added a GitHub Actions npm release workflow prepared for Trusted Publishing with OIDC and provenance.
- Documented the install/update model, release procedure, supply-chain risks, and prioritized follow-up opportunities.
- Aligned product, CLI, npm package, squad manifest, and release tag versioning at `0.1.0`.

No npm publication, Git tag, GitHub Release, push, merge, or deployment is performed by this change.

### Historical pre-release structural revisions

The entries below used an internal structural-version series before the public
teamFlow release line was consolidated under `v0.x` tags and npm package versions.

## 1.2.0 - 2026-08-30

- Added the reusable `/feature`, `/bugfix`, `/tests`, `/performance`, `/adr`, `/finops`, `/doc`, and `/refactor` playbooks.
- Added playbook contracts, registry, templates, deterministic validation, and adversarial tests.
- Added safe external-workspace, per-repository planning, branching, and documentation-routing policies.
- Added project configuration and a documentation-repository catalog example.
- Integrated playbook selection with the entrypoint, context loading, CI validation, README, and onboarding.

This structural version is prepared for review only. No tag, release, push, or deployment is performed by this change.

## 1.1.0 - 2026-08-29

- Added mandatory pre-implementation change-impact and target-project pipeline discovery.
- Added adoption-aware template validation, canonical project configuration, gate registry and status vocabulary.
- Added deterministic delivery-state validation without claiming semantic correctness.
- Added portable failure/retry/side-effect semantics and minimal execution provenance.
- Added a specification-only eval baseline for routing, completion and retry safety.
- Added `start.md` with stack-based team composition, project preparation, example prompt, first pilot, branch guidance, Mermaid flow and squad-release boundary.
- Marked the previous consolidated orchestrator design as historical/superseded.

This version changes the reusable squad structure. The changelog/version are prepared for maintainer review; no tag or release is published by this change alone.

## 1.0.0 - 2026-08-29

- Reframed the repository as a documentation/configuration-first agentic squad template.
- Added universal role, workflow, policy, contract, skill, template, and native-runtime instructions.
- Added an explicitly contextual example for the requested engineering squad and 100+ repository pattern.
- Kept only an optional structural validation script; no orchestrator, runtime, framework, database, or service.
- Excluded MCP and A2A from this version.
