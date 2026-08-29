# Contributing

Preserve the architecture principle: configuration and documentation over implementation.

- Put universally reusable guidance in `.squad/`.
- Put squad, domain, technology, repository, and ownership context in `.project/`.
- Mark contextual examples clearly and never present placeholders as facts.
- Prefer concise, testable rules over persona prose.
- Keep contracts vendor-neutral.
- Add executable code only when a concrete maintenance need cannot be met through documentation or native runtime features.
- Run `python scripts/validate-template.py` after changing structure or links.

