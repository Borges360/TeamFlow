# Policy: User Interaction

Ask for user input only when it improves correctness or provides authority the agent does not have.

## Blocking questions

Ask before proceeding when an answer materially changes business behavior, scope, architecture, security/privacy posture, regulatory treatment, irreversible action, production impact, cost commitment, ownership, or acceptance criteria.

Use the user-input contract. Include context, the exact decision, viable options with consequences, a recommendation if evidence supports one, and what is blocked.

## Non-blocking unknowns

A low-risk, reversible assumption may be used when it is labeled, its impact is bounded, and a validation plan is recorded. Report it in the delivery.

## Communication rules

- Prefer one consolidated set of related questions over repeated interruption.
- Do not ask the user for facts discoverable from authorized project sources.
- Never imply completion while waiting for a blocking decision.
- When the user changes direction, update the demand, affected artifacts, context, and gates rather than silently overwriting history.
