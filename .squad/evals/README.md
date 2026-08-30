# Declarative eval baseline

This directory specifies representative cases for comparing changes to the squad operating model. It is not an executed benchmark and contains no claimed model scores.

## Protocol

1. Keep runtime, model/version, tools, budgets, repository revisions and task inputs fixed between baseline and candidate.
2. Run multiple trials because agent trajectories vary.
3. Evaluate the final state, trajectory/tool use, factual support, unsafe actions, intervention and resource usage reported by the runtime.
4. Preserve failures, skipped cases, evaluator identity and limitations.
5. Accept token/cost reductions only when quality and safety remain inside predeclared tolerances.

`baseline-v1.json` defines conditions, metrics and hard safety thresholds. `routing-cases-v1.json` covers workflow/risk/delegation decisions. `failure-cases-v1.json` covers timeout, invalid result, cancellation, partial effects and retry safety. `context-ablation-v1.json` compares context variants while protecting quality and safety.

The corpus is intentionally small. It calibrates changes and catches objective regressions; it does not prove production effectiveness or provide universal thresholds for semantic quality.

Validate the specification with:

```text
python scripts/validate-evals.py
```
