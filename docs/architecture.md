# Template Architecture

The architecture is deliberately two-layered:

```text
Universal squad model                 Project/domain configuration
AGENTS.md + .squad/            +      .project/
roles, workflows, policies,           catalog, ownership, stack,
contracts, skills, templates          constraints, domain profiles
                    ↓
         Native development-agent runtime
          (Codex, Claude Code, Devin, ...)
                    ↓
       Repositories, tools, tests and evidence
```

## Universal base

`.squad/` defines invariant operating behavior. Agent files are responsibility profiles; workflow files are ordered instructions; contracts standardize context and results; policies constrain decisions; templates make outputs reviewable. None is an executable engine.

## Project context

`.project/` provides replaceable, owned, freshness-aware facts. The version included here is an example for a broad enterprise squad and must not be treated as production truth.

## Runtime boundary

The development tool supplies execution, context windows, native delegation, terminal/browser/repository access, and review mechanics. This repository supplies instructions and work-product contracts. It intentionally contains no scheduler, server, database, state machine, runtime framework, MCP implementation, or A2A implementation.

## Durable demand artifacts

For work performed in an adopted project, `deliveries/<demand-id>/` retains the demand, selected context, decisions, evidence references, gate outcomes, reviews, and summary. Runtime-private state may remain ephemeral.
