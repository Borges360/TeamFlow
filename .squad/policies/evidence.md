# Policy: Evidence

Evidence makes a claim independently inspectable. Store it under `deliveries/<demand-id>/evidence/` or link to an approved immutable system when sensitive or too large.

## Required metadata

Every evidence item records: evidence ID, demand ID, claim/criterion, producer role, timestamp and timezone, source/repository, revision when relevant, environment, command or procedure, inputs/test data classification, result, retained artifact location, and limitations.

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
