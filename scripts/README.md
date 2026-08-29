# Optional maintenance scripts

Scripts here perform concrete repository maintenance; they are not an agent runtime or required CLI.

- `validate-template.py` checks structure, local Markdown links, example markers, and the absence of the removed platform/runtime implementation.

Agents may run the validator after changing template files. It uses only the Python standard library and does not orchestrate tasks or execute workflows.
