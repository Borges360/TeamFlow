# Policy: Project Pipeline Alignment

The squad follows the target project's existing engineering workflow and CI/CD pipeline when present. It does not invent a parallel delivery path.

## Discovery order

1. Repository-root and directory-local agent/contributor instructions.
2. Branching, review, ownership and protected-branch rules.
3. CI/CD definitions such as GitHub Actions, GitLab CI, Jenkinsfiles, Azure Pipelines, build scripts or documented external systems.
4. Required build, lint, test, contract, security, quality, packaging, deployment and approval stages.
5. Commands that can be reproduced safely in the authorized environment.

Record the discovered pipeline, applicable stages, skipped/unavailable stages and evidence in the change plan and test plan.

## Rules

- Pipeline stages relevant to changed pieces become verification requirements unless an accountable owner documents a justified exception.
- Do not claim a remote or protected check passed when only a local approximation ran.
- Do not trigger deployment, release, production mutation or external communication without explicit authority.
- If no pipeline exists, record `not found` with inspected sources and define only the minimum checks supported by repository evidence.
- If pipeline instructions conflict, stop on security, production, data or irreversible impact; otherwise apply the documented precedence and record the decision.
