# Policy: Evidence

Evidence makes a claim independently inspectable. Store it under the active project's private `teams/<team-id>/projects/<project-id>/deliveries/<demand-id>/evidence/` root in `TEAMFLOW_HOME`, or link to an approved immutable system when sensitive, shared, or too large. Never create this bundle in a product checkout or commit it to a squad release branch.

## Required metadata

Every evidence item records: evidence ID, demand ID, claim/criterion, producer role, timestamp and timezone, source/repository, revision when relevant, environment, command or procedure, inputs/test data classification, result, retained artifact location, and limitations.

For material agent/tool execution, also record when available: run/task ID, runtime, model or agent version, context-bundle reference, repository revisions, tools/versions, attempt number, termination and observed side effects. Unknown values remain explicit; full conversations and private reasoning are not required.

## Test evidence

For every executed test or suite, retain enough information to distinguish:

- what was tested and why;
- version/revision and environment;
- setup and sanitized test data;
- command/tool/procedure;
- start/end or timestamp;
- pass, fail, blocked, skipped, or not applicable counts;
- raw or structured output where available;
- defects and retries;
- interpretation and limitations.

All applicable test categories require evidence, including backend, API, mobile webview, frontend, regression, infrastructure, data, Robot Framework, accessibility, security, resilience, and manual/exploratory tests.

## Integrity and sensitivity

1. Prefer generated reports, logs, diffs, plans, traces, and checksums over recollection.
2. Never fabricate execution. Label static inspection and planned tests as such.
3. Redact secrets, personal data, tokens, production payloads, and regulated data; link to restricted storage rather than copying sensitive evidence.
4. A screenshot may supplement evidence but should not replace reproducible output.
5. Failed evidence is retained and explained; do not overwrite it with a later pass.
6. Evidence retention follows project policy and regulatory constraints.
