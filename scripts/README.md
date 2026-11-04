# Optional maintenance scripts

Scripts here perform concrete repository maintenance; they are not an agent runtime or required CLI.

- `validate-template.py --mode template` checks the distributed template, local links, canonical example config, registries and the docs-first boundary.
- `validate-template.py --mode active` validates an adopted project selected by `squad.yaml`; the configured mode and CLI mode must agree.
- These mode checks reject malformed input within the documented, deliberately small YAML subset; they are not a general-purpose YAML schema engine.
- `validate-delivery.py <delivery-dir>` checks objective JSON-ledger invariants, references, task/result state and gate structure. It does not judge factual truth or evidence sufficiency.
- `validate-evals.py` validates the specification-only routing/failure eval corpus; it does not execute agent benchmarks.
- `validate-playbooks.py` validates the exact public playbook catalog, structured templates, registry references, required sections and forbidden implicit external permissions.
- `validate-playbooks.py --artifact-kind <kind> --artifact-path <file.json>` validates a generated workspace, repository plan, documentation target, playbook result or multi-repository result before completion.
- `python -m unittest discover -s scripts/tests -v` runs standard-library validator tests.

Agents should run the applicable project pipeline stages after changing files. These scripts use only the Python standard library and do not orchestrate tasks or execute workflows.
