# Skill: Progressive Repository Discovery

## Purpose

Find the minimum set of relevant repositories and relationships in a large estate.

## Prerequisites

A demand/system/API/event/domain seed and access to project catalog metadata.

## Procedure

1. Normalize seeds into stable catalog IDs.
2. Filter by system/domain/owner/type/contract before searching source broadly.
3. Inspect direct dependency, consumer, producer, deployment, configuration, test, observability, and data relationships.
4. Verify candidates with repository metadata and local instructions.
5. Classify each as observed, affected, changed, or follow-up and record the reason.
6. Expand another relationship hop only for an unresolved acceptance criterion, risk, or contract.
7. Stop when the blast radius is evidenced or the next expansion needs owner/user input.

## Output

An updated context bundle and repository impact table with sources, freshness, owners, and gaps.

## Stop conditions

Catalog staleness, conflicting ownership, unavailable private dependency, or proposed writes outside granted scope.
