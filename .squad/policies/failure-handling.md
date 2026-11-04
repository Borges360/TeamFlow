# Policy: Failure Handling

Failures must be detectable, bounded and explainable. Retry is a decision about an operation, not a default reaction to an error.

## Classify before execution

For each material tool/action, record when applicable:

- operation class: read-only, idempotent write, non-idempotent write, destructive or external communication;
- expected success signal and timeout/stop signal;
- possible partial effects and how they are detected;
- retry eligibility, maximum attempts and required approval;
- cancellation/interrupt behavior and retained state;
- recovery, rollback, compensation or escalation path.

## Response rules

1. Detect invalid/missing result, timeout, interruption, contradictory evidence and repeated action.
2. Preserve the failed attempt and any partial effect before retrying or repairing.
3. Retry automatically only when the operation is known safe/idempotent, the failure is plausibly transient, the attempt limit is explicit and no contradictory evidence exists.
4. Never automatically retry destructive, irreversible, deployment, financial, message-sending or otherwise non-idempotent operations.
5. On partial success, stop dependent work until the resulting state is inspected and reconciled.
6. Use `blocked` when required access/evidence is unavailable, `needs_user_input` for a blocking human decision and `failed` when a criterion was evaluated and not met.
7. A user interruption stops new effects promptly; preserve completed work and report uncertain in-flight effects.

Runtime-specific timeout mechanics may vary, but task/result/evidence artifacts preserve the portable semantics.
