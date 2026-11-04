# Policy: Documentation Routing

Permanent project documentation belongs with the project source of truth, not only in a delivery bundle.

## Routing order

1. Existing convention in the repository that owns the subject.
2. Configured documentation repository for shared/cross-system content.
3. `docs/` in the owner repository when no convention or documentation repository exists.
4. For ADRs without a convention, `docs/architecture/decisions/`.

Update indexes and link affected repositories when useful; do not create divergent copies. A delivery records the canonical repository/path/revision/status. The squad repository receives only documentation about the reusable squad itself.
