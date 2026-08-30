# Workflow: Architecture Review

## Use when

A solution, ADR, platform choice, cross-system change, resilience model, or governance exception needs architectural evaluation without necessarily implementing it.

## Flow

`Question → Context → Affected pieces → Quality attributes → Options → Risk reviews → Decision → Governance record`

## Procedure

1. Define the decision to be made, decision owner, deadline, non-goals, and reversibility.
2. Establish current state, constraints, stakeholders, affected systems/repositories, and quality-attribute scenarios.
3. Identify pieces that each option would change or affect, including contracts, data, pipeline, operations, tests and ownership; record zero intended writes for review-only work.
4. Compare credible options against requirements, cost, risk, operability, migration, and exit strategy.
5. Request Security, Reliability, Data, Performance, Platform, or domain review according to triggers.
6. Record the decision and consequences in an ADR; use C4 or other diagrams only where they improve shared understanding.
7. Identify follow-up implementation or migration demands separately.

## Exit criteria

The decision, rationale, alternatives, consequences, owner, status, and follow-up are reviewable; Architecture and applicable governance gates are resolved.
