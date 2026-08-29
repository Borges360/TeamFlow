# Policy: Review

Review validates claims against artifacts and evidence. It is not a stylistic approval ritual.

## Review scope

Review requirements, design, code/configuration, contracts, data and infrastructure impact, tests, security, operability, documentation, rollout, rollback, and evidence according to applicability.

## Independence

Use a different person/agent/session for mandatory final review whenever the runtime and team permit it. If independence is unavailable, disclose that limitation, perform a fresh evidence-based pass, and let project policy decide whether user approval is required.

## Finding format

Each finding states severity, affected artifact/location, violated criterion or risk, evidence, consequence, and a concrete remediation or question. Separate blockers from suggestions.

## Resolution

- A finding is resolved by a verified change, evidence that invalidates it, or an authorized exception.
- The author does not close a finding solely by assertion.
- Material fixes invalidate affected review/gate results and require focused re-review.
- The final review samples raw evidence and traces critical acceptance criteria end to end.
