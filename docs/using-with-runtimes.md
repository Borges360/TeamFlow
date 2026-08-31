# Using Native Agent Runtimes

The user should be able to open a development agent and state a demand in natural language. The agent reads `AGENTS.md`, chooses a workflow, builds selective context, assigns native tasks when useful, evaluates gates, and produces evidence.

## Runtime-neutral prompt

```text
Follow the AGENTS.md from the active project's cached base and selected workflow.
Treat its effective-context as project context, load repositories progressively,
use native delegation where useful, and keep artifacts only under the active
private project root's deliveries/<demand-id>.

Demand: Implemente a nova funcionalidade de consulta de contratos.
```

Usually the explicit preamble is unnecessary once the runtime is correctly configured to read project instructions.

## Capability differences

Native runtimes vary in delegation, isolation, review, approval, and context behavior. The portable requirement is the outcome: bounded role responsibilities, task/result contracts, evidence, and gates. A single agent may perform several roles sequentially, but must disclose when independent review was not available.

See `.squad/runtimes/` for mappings. These mappings are guidance, not adapters.
