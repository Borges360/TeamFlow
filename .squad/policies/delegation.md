# Policy: Delegation

Delegation uses the active tool's native agent/task capabilities. This template defines the handoff contract; it does not implement scheduling, messaging, or agent transport.

## Delegate when

- specialist judgment materially reduces risk;
- work is independently bounded by repository, artifact, or question;
- parallel work has explicit contracts and does not race on the same state;
- an independent review is required.

## Do not delegate when

- the task is too small to justify context transfer;
- requirements or write boundaries are unresolved;
- the delegate would need the full estate rather than a minimal context bundle;
- parallel edits would collide or create an unsafe integration order.

## Mandatory handoff

Every delegated unit must include a task contract: objective, assigned responsibility, inputs, context bundle, allowed actions/tools, expected outputs, completion criteria, risks, and where to return artifacts.

The delegate returns a result contract. It may request more work or context but may not silently expand its scope.

## Control rules

1. One lead owns demand status, delivery index, workflow routing, and integration.
2. The lead records runtime/project limits for depth, concurrent fan-out, context, elapsed work, and financial/tool budget when applicable. In the absence of an explicit limit, nested delegation is prohibited.
3. Parallel tasks must name file/repository ownership and their integration dependency.
4. A reviewer must receive the claim, artifacts, and evidence—not the author's confidence statement alone.
5. If native delegation is unavailable, execute roles sequentially and label the responsibility performed.
6. Delegation never transfers user authority for destructive, external, regulatory, or scope-expanding actions.

Runtime concurrency is a capacity ceiling, not a reason to create work. When fan-out cannot be safely bounded, execute sequentially.
