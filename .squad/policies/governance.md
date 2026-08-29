# Policy: Governance

Governance makes ownership, decisions, controls, and exceptions inspectable without centralizing all project context in this template.

## Rules

1. Universal policies are the minimum. Project configuration may strengthen them or select applicable profiles; it may not silently weaken them.
2. Repository-local instructions govern implementation details unless they conflict with a higher mandatory policy or user instruction.
3. Consequential, cross-system, expensive-to-reverse, or exception-setting decisions require an ADR.
4. Every gate, exception, and risk acceptance names an accountable owner and evidence.
5. Guardrails are explicit and versioned; agents do not invent or bypass them.
6. Changes to universal contracts or mandatory policies require principal review and a changelog entry.
7. Delivery artifacts are auditable but must respect data minimization and retention constraints.

## Precedence

For agent behavior: current user instruction → repository-root `AGENTS.md` → mandatory universal policy → project configuration → repository-local instructions → role/skill guidance. A lower level cannot authorize an action prohibited by a higher level. Report conflicts instead of guessing.
