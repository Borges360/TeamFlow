# Workflow: Incident

## Use when

A production or business-critical service is degraded, unavailable, unsafe, or at imminent risk.

## Flow

`Declare → Stabilize → Diagnose → Mitigate/Recover → Validate → Communicate → Learn → Follow-up`

## Priority rule

Protect people, data, security, and service continuity before completeness. Time pressure may defer normal artifacts, but never conceals risk or bypasses required human authority. Backfill evidence and decisions after stabilization.

## Procedure

1. Record severity, commander/owner, start time, impact, affected systems, current hypothesis, and communication channel.
2. Establish safe action boundaries. Prefer reversible mitigation; obtain approval for destructive, irreversible, or scope-expanding actions.
3. Maintain a timestamped decision and action log with actor, evidence, outcome, and rollback status.
4. Validate recovery through user/business signals and system telemetry, not a single health check.
5. Define an observation window and handoff/ownership before closure.
6. Produce a blameless post-incident review with causal factors, control gaps, and owned follow-up work.

## Gates

During active mitigation, the Incident Commander or authorized owner makes documented risk decisions. Before closure, complete Recovery Validation, Security (if implicated), Evidence, and Principal/incident review. Emergency exceptions follow the exception policy and expire.

## Exit criteria

Service is stable for the agreed window, impact and recovery are evidenced, communications are complete, temporary changes are tracked, and follow-up items have owners and target dates.
