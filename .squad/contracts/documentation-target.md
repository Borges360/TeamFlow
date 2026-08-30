# Contract: Documentation Target

```yaml
document_id: ADR-0042
kind: adr
owner_repository_id: customer-api
target_repository_id: engineering-docs
target_path: docs/architecture/decisions/ADR-0042-cache.md
status: proposed
routing_reason: configured shared documentation repository
fallback_used: false
branch: feature/DEM-123-change
revision: abc123
```

Permanent documentation resolves to a repository and path outside `deliveries/`. The local delivery retains only its repository, path, branch/revision, status, and evidence pointer. `accepted` decisions also require explicit approval evidence.
