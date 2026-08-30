# Contract: Multi-repository Result

The machine-readable result uses `.squad/templates/multi-repository-result.json`. A `completed` result requires a branch, revision, successful result and evidence for every repository, plus integration order and cross-repository checks. Any `failed`, `partial`, or `blocked` repository prevents completion. Git repositories are integrated independently; the contract never implies an atomic multi-repository transaction.
