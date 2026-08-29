# Skill: Evidence-Driven Testing

## Purpose

Design and execute tests whose results can support gate decisions.

## Procedure

1. Build a traceability matrix from acceptance criteria and risks to test conditions.
2. Choose the lowest effective layer plus cross-layer tests for contracts and critical journeys.
3. Define environment, revision, test data, preconditions, oracle, and expected evidence before execution.
4. Execute the exact procedure; retain raw/structured output and timing.
5. Classify failures, skips, flakes, retries, blocked tests, and not-applicable cases without collapsing them into pass.
6. Assess gaps and residual risk; link defects and remediation verification.
7. Produce a QA report and gate recommendation.

## Safety

Use authorized environments and sanitized data. Stop before destructive, high-load, or production-affecting tests without explicit authority.
