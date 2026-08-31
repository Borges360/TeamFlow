# Policy: Git delivery and `ready_for_push`

Teams configure `git.delivery.local_commit_mode` as `disabled`, `manual`, `incremental`, or `final-per-repository`. Projects may only make it more restrictive; repository-local rules, hooks, signing, protected branches and message conventions prevail.

Before a local commit, inspect remote, branch, dirty state, worktrees and in-progress operations; isolate demand-owned paths; run applicable local checks and a secret scan; preserve unknown changes; and record unavailable remote checks. Never reset, clean, include unrelated changes or claim cross-repository atomicity.

`ready_for_push` is valid only when every changed repository has a valid branch, demand-related changes are committed, no related uncommitted changes remain, local checks and secret scan have evidence, remote checks are declared pending, gates/review are resolved or authorized, and documentation/evidence are current. Multi-repository status lists branch, base revision, commit, checks and gaps separately for every repository.

`push_allowed`, `pull_request_allowed`, `merge_allowed`, `release_allowed`, and `deploy_allowed` remain `false`. The status means only that user/pipeline action may begin; it never authorizes a remote operation.
