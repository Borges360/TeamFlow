# Contract: Status Vocabulary

Statuses are namespaced by lifecycle. Do not normalize distinct lifecycles into one ambiguous enum.

| Namespace | Canonical values | Presentation notes |
|---|---|---|
| delivery | `triage`, `in_progress`, `blocked`, `needs_user_input`, `complete` | UI may display `NEEDS_USER_INPUT`; stored value remains snake_case. |
| task | `draft`, `ready`, `in_progress`, `completed`, `partial`, `failed`, `blocked`, `needs_user_input`, `cancelled`, `timed_out` | `completed` applies to the task contract, not the demand. |
| result | `completed`, `partial`, `failed`, `blocked`, `needs_user_input`, `cancelled`, `timed_out` | Must agree with attempts/partial effects. |
| gate decision | `PASS`, `FAIL`, `BLOCKED`, `WAIVED`, `NOT_APPLICABLE` | Uppercase is canonical for gate decisions only. |
| evidence result | `pass`, `fail`, `blocked`, `inconclusive`, `skipped`, `not_applicable` | Describes the stated check/claim only. |

Automatic consumers validate within the declared namespace. Human-facing Markdown may translate labels but must preserve the canonical value when a machine consumes it.
