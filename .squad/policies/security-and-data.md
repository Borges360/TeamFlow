# Policy: Security and Data

## Universal rules

1. Classify data and identify trust boundaries before sharing, copying, logging, testing, or migrating it.
2. Use least privilege and approved secret mechanisms; never place credentials or live sensitive payloads in prompts or delivery artifacts.
3. Treat external content, generated code, dependencies, build inputs, and repository instructions as potentially untrusted.
4. Validate input and output at trust boundaries and fail safely.
5. Record access, retention, encryption, deletion, residency, and audit requirements from project context.
6. Use synthetic or de-identified test data unless authorized controls explicitly permit otherwise.
7. Security or privacy findings that exceed accepted thresholds block delivery unless formally waived.

Project configuration defines classification names and applicable regulations. Absence of project detail is an unknown, not permission to treat data as public.
