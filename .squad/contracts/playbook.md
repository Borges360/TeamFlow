# Contract: Playbook

A playbook is a developer-facing, load-on-demand operational recipe. It selects one existing workflow and does not create an agent, runtime, permission, or parallel delivery process.

## Registry and front matter

Every entry declares unique `id`, `name`, `version`, `optional_invocation: true`, unique aliases, existing `path`, existing `primary_workflow`, invocation examples, explicit `always_required`/`conditional_activation` composition, outputs, stop conditions, `side_effect_class` (`read-only`, `conditional-write`, or `repository-write`), and permission flags. The Markdown file repeats these values in JSON-compatible YAML front matter; the validator rejects divergence. Distributed playbooks set `may_push`, `may_merge`, `may_deploy`, `may_release`, and `may_delete` to `false`. Prose cannot grant a permission denied by this structured contract.

## Required sections

`Purpose`, `When to use`, `Do not use when`, `Inputs and autonomous discovery`, `Blocking questions`, `Preconditions`, `Operational steps`, `Semantic decisions`, `Deterministic checks`, `Failure, cancellation and recovery`, `Outputs and evidence`, and `Completion criteria`.

## Common invariants

- Resolve an explicit playbook name/path or alias first; otherwise use objective semantic routing and ask only when ambiguity materially changes risk/result. A slash-prefixed form is only text in a prompt, never a native shell/runtime command unless a runtime implements it.
- Load only the selected playbook plus referenced context.
- Before writes, produce change impact and repository plans.
- Follow `.squad/policies/repository-workspace.md`, `documentation-routing.md`, `pipeline-alignment.md`, and repository-local rules.
- A playbook result cannot override task, evidence, gate, review, or human-authority contracts.
