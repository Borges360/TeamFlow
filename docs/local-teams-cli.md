# CLI local, times e projetos

`teamflow` is a dependency-free npm CLI. It keeps reusable team configuration and isolated implementation projects outside product repositories.

## Home and layout

Windows defaults to `%USERPROFILE%\.teamFlow`; macOS and Linux default to `$HOME/.teamFlow`. Override explicitly with `TEAMFLOW_HOME` or `--home <path>`.

```text
.teamFlow/
├── metadata/
├── teams/<team-id>/
│   ├── team-config.yaml
│   ├── context/ catalog/ policies/ profiles/ templates/ history/
│   └── projects/<project-id>/
│       ├── project-config.yaml
│       ├── effective-context/ generated-runtime-files/
│       └── deliveries/ evidence/ history/
└── backups/
```

The `.yaml` configuration files contain JSON-compatible YAML so they can be parsed without runtime dependencies. Setup config passed to `--non-interactive` uses the same representation.

During setup, the package base is copied once to `metadata/bases/<package-version>/`. Project activation writes the base and effective-context locations into `generated-runtime-files/activation.json`, so a runtime can continue after an ephemeral `npx` process exits. Each project snapshots team configuration plus `context/`, `catalog/`, `policies/`, `profiles/` and `templates/`; `project compare` shows both configuration and file differences.

## Fast setup

```bash
npx teamflow setup
teamflow setup --resume
teamflow setup --dry-run
teamflow setup --non-interactive --config setup.json
```

The wizard asks for the team, Git/commit policy, agent preset and an optional first project. Everything else stays pending and the team remains in `bootstrap`. Portuguese is the default locale and is stored explicitly (`pt-BR`) so message catalogs can be added without changing persisted schemas.

Agent presets are `essential`, `complete`, and `custom`. Selection controls locally available profiles, never gate applicability. Existing projects keep their agent snapshot until `project update-snapshot <id> --reason <motivo>` is explicitly run.

## Commands

```text
team create|list|show|use|configure
team agents list|install|remove|show
project create|list|activate|status|archive|compare|update-snapshot
doctor
export team
export project <project-id>
catalog add-repository|add-system|add-journey|import
playbook list|show
workflow show
```

Project commands always require an active team and resolve paths only beneath that team. `project list` never aggregates across teams. Archive preserves the project. Export writes outside the private home only when `--output` is explicitly supplied; otherwise it prints to stdout.

The Git policy may prepare local commits and the inspectable `ready_for_push` status, but it cannot perform push, PR, merge, tag, release or deploy.
