# Policy: Continuous Improvement

Improve the declarative operating model from delivery evidence without turning it into an agent-monitoring platform.

## Useful measures

- acceptance criteria satisfied first pass versus reworked;
- gate failures by cause and time to resolution;
- escaped defects and incidents linked to missing/ineffective controls;
- evidence completeness and reproducibility;
- blocking questions asked early versus discovered late;
- repositories loaded, affected, changed, and mistakenly scoped;
- review findings by severity and recurrence;
- cycle time by workflow phase where timestamps are already available;
- exception count, age, expiry and remediation;
- flaky/blocked/skipped test trends from approved test systems.

## Rules

1. Use existing delivery artifacts and approved engineering systems; do not add a surveillance database or telemetry runtime to this template.
2. Measure outcomes and control effectiveness, not agent verbosity or persona performance.
3. Protect personal/sensitive data and avoid ranking individuals.
4. Propose reusable changes in `.squad/`; project-specific lessons in `.project/` or repository-local guidance.
5. Review whether added instruction reduces a recurrent risk; remove obsolete or duplicative rules.
