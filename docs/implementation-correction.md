# Correction Audit: Removal of the Python Platform

The previous implementation treated the specification as a Python application. This audit records the responsibility of every created Python source/test file and its declarative replacement. All listed files were removed.

## Package root

| Removed file | Intended responsibility | Declarative/native replacement |
|---|---|---|
| `src/agentic_squad/__init__.py` | expose a Python package/version | `squad.yaml`, `.squad/manifest.yaml`, and versioned documentation |
| `src/agentic_squad/cli.py` | commands for initialize/plan/run/validate/catalog | `AGENTS.md`, workflow instructions, native runtime tools, and optional structural validator only |
| `src/agentic_squad/errors.py` | runtime exception hierarchy | task/result/user-input statuses and gate decisions in contracts |
| `src/agentic_squad/orchestrator.py` | coordinate agents, tasks, workflow state, gates, and persistence | `AGENTS.md`, `.squad/workflows/`, delegation and gate policies; execution belongs to the native agent runtime |
| `src/agentic_squad/planning.py` | turn demands into execution plans | workflow routing, demand intake, task and context-bundle contracts |
| `src/agentic_squad/routing.py` | choose workflow/agents from demand and risk | workflow-routing and risk-routing policies |
| `src/agentic_squad/telemetry.py` | collect harness telemetry | delivery artifacts plus continuous-improvement policy; no monitoring runtime/database |
| `src/agentic_squad/util.py` | shared application helpers | unnecessary after removal of the application; conventions live in contracts/templates |

## Catalog and context

| Removed file | Intended responsibility | Declarative/native replacement |
|---|---|---|
| `src/agentic_squad/catalog/__init__.py` | expose catalog package | project catalog directory and repository-catalog contract |
| `src/agentic_squad/catalog/context.py` | assemble context for tasks | progressive-context policy and context-bundle contract/template |
| `src/agentic_squad/catalog/graph.py` | model repository dependencies | federated project catalog records plus multi-repository policy |
| `src/agentic_squad/catalog/index.py` | build/search a SQLite catalog index | catalog metadata and progressive discovery through native tools; no local database |

## Configuration

| Removed file | Intended responsibility | Declarative/native replacement |
|---|---|---|
| `src/agentic_squad/config/__init__.py` | expose configuration package | `.squad/` universal base and `.project/` configuration convention |
| `src/agentic_squad/config/loader.py` | load/merge base and overlays | documented precedence and native file reading; project context is separate rather than materialized |
| `src/agentic_squad/config/registry.py` | Python registry of agents/workflows/skills | declarative YAML files in `.squad/registries/` |
| `src/agentic_squad/config/validation.py` | validate executable configuration | `.squad/manifest.yaml` plus optional `scripts/validate-template.py` |

## Domain and policies

| Removed file | Intended responsibility | Declarative/native replacement |
|---|---|---|
| `src/agentic_squad/domain/__init__.py` | expose runtime domain models | Markdown contracts |
| `src/agentic_squad/domain/models.py` | `Agent`, `Task`, `Artifact`, `Evidence`, workflow/result models | `.squad/agents/` and `.squad/contracts/`; roles/contracts are specifications, not classes |
| `src/agentic_squad/policy/__init__.py` | expose policy package | `.squad/policies/` directory |
| `src/agentic_squad/policy/gates.py` | execute deterministic gate logic | quality-gate criteria and gate-decision artifacts evaluated by native agents/reviewers |

## Runtime adapters

| Removed file | Intended responsibility | Declarative/native replacement |
|---|---|---|
| `src/agentic_squad/runtime/__init__.py` | expose runtime adapters | runtime guidance documents only |
| `src/agentic_squad/runtime/base.py` | abstract agent runtime interface | runtime-portability policy and generic native-runtime mapping |
| `src/agentic_squad/runtime/command.py` | launch external commands as agents | active tool's native terminal/task capabilities |
| `src/agentic_squad/runtime/factory.py` | construct an adapter by configuration | unnecessary; the user selects and runs Codex, Claude Code, Devin, or another tool directly |
| `src/agentic_squad/runtime/local.py` | simulate/local-run an agent | unnecessary; no agent simulation |
| `src/agentic_squad/runtime/prompt.py` | serialize agent/task prompts | task, result, context-bundle, and role files consumed by the native runtime |

## Storage and workflow engine

| Removed file | Intended responsibility | Declarative/native replacement |
|---|---|---|
| `src/agentic_squad/storage/__init__.py` | expose storage package | repository artifact conventions |
| `src/agentic_squad/storage/artifacts.py` | create/manage artifact files | `deliveries/<demand-id>/` convention, artifact contract, delivery index, and templates |
| `src/agentic_squad/storage/audit.py` | persist audit events | timestamped decisions, evidence, gates, reviews, and incident timeline artifacts |
| `src/agentic_squad/storage/database.py` | persist runtime state in SQLite | unnecessary; durable state is versioned documentation or approved external evidence systems |
| `src/agentic_squad/workflow/__init__.py` | expose workflow package | `.squad/workflows/` directory |
| `src/agentic_squad/workflow/engine.py` | execute a workflow state machine | ordered workflow Markdown executed by the active native agent runtime |
| `src/agentic_squad/workflow/loader.py` | parse workflow definitions for the engine | workflow registry and native file reading |

## Removed Python tests

| Removed file | What it tested | Replacement validation |
|---|---|---|
| `tests/conftest.py` | Python application fixtures | unnecessary |
| `tests/test_catalog.py` | catalog graph/index implementation | catalog examples, contracts, review, and optional structural validation |
| `tests/test_config.py` | YAML loading/overlay merge | manifest/example markers and governance review |
| `tests/test_gates.py` | gate engine | gate criteria, evidence contract, and reviewer gate artifacts |
| `tests/test_orchestrator.py` | orchestrator behavior | native-runtime pilot demands and review of produced delivery bundles |
| `tests/test_planning.py` | Python plan generation | workflow pilot and task-contract inspection |
| `tests/test_routing.py` | Python routing logic | workflow/risk-routing decision tables and scenario review |
| `tests/test_runtime.py` | adapters/local simulation | native-runtime mappings; no adapter test needed |
| `tests/test_storage.py` | SQLite/artifact store | link/structure checks and repository review of delivery artifacts |
| `tests/test_workflow.py` | executable workflow state | workflow scenario walkthroughs; no state-machine test needed |

## Other removed application artifacts

`pyproject.toml`, `runtime.yaml`, the SQLite catalog database, materialized/effective configuration, coverage and linter caches, Python bytecode, application source directories, and platform-oriented examples were also removed. The remaining Python file is the optional, standard-library-only structural validator; it does not plan, route, delegate, execute workflows, store state, or simulate agents.
