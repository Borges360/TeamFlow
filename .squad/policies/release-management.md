# Policy: Squad Template Releases

A release of this repository represents a change to the reusable structure or operating behavior of the agentic squad. It is not created for each project task executed with the squad.

## Release-eligible changes

- mandatory behavior in `AGENTS.md` or `.squad/policies/`;
- workflow, contract, artifact/template or registry compatibility;
- required project-configuration shape or runtime mapping;
- validator behavior that changes conformance requirements;
- removal, migration or precedence of a reusable squad component.

## Not release-eligible by themselves

- a demand delivery under `deliveries/`;
- project-specific `.project/` facts, catalog entries or owner changes;
- application feature/bugfix code in a target repository;
- wording, typo or example clarification with no behavior/contract change.

## Rules

1. Structural changes update the manifest/squad version and changelog under governance review.
2. Creating a tag, release, publishing artifact or promoting a release requires explicit maintainer authority and the repository's release pipeline.
3. Project tasks use their own repository versioning/deployment process; they do not cause a squad-template release.
4. When classification is ambiguous, record whether compatibility or mandatory behavior changed and obtain maintainer decision before publishing.
