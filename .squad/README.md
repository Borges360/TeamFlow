# Universal base

This directory is the vendor-neutral, reusable source of truth for the squad operating model.

Files here define responsibilities, processes, contracts, policies, procedures, and artifact templates. They do not implement agents or execute workflows. The active development tool provides execution.

Project-specific technologies, repositories, owners, architecture, business rules, compliance, and exceptions belong in `.project/`.

## Precedence

1. active runtime safety/system constraints and the user's current instruction;
2. root `AGENTS.md`;
3. mandatory policies in `.squad/policies/`;
4. `.project/` configuration and its stricter local controls;
5. repository-local implementation instructions;
6. selected role, workflow, skill, and task guidance.

Project context may specialize the base but must not silently weaken a mandatory gate. Approved exceptions follow `.squad/policies/exceptions.md`.
