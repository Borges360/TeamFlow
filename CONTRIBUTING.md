# Contributing

Preserve the architecture principle: configuration and documentation over implementation.

- Put universally reusable guidance in `.squad/`.
- Put squad, domain, technology, repository, and ownership context in `.project/`.
- Mark contextual examples clearly and never present placeholders as facts.
- Prefer concise, testable rules over persona prose.
- Keep contracts vendor-neutral.
- Add executable code only when a concrete maintenance need cannot be met through documentation or native runtime features.
- For ordinary work, prefer `feature/<demand-id>-<short-name>` from `develop` when repository rules permit; follow protected-branch and runtime-specific naming requirements.
- Discover and follow `.github/workflows/validate.yml` and any repository-local required checks before implementation.
- Run `python scripts/validate-template.py --mode template`, `python scripts/validate-evals.py`, and `python -m unittest discover -s scripts/tests -v` after changing structure or links.
- Prepare a squad release only for reusable structure, mandatory behavior, contract or conformance changes; ordinary deliveries and `.project/` facts do not create a squad release.
