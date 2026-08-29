# EXAMPLE CONTEXT — quality profile

> Replace coverage expectations and thresholds with project-approved values. The test types below are applicability prompts, not mandatory execution for every change.

## Example applicability matrix

| Change signal | Expected verification candidates |
|---|---|
| Java/Go/Python backend behavior | unit, component, contract/API, integration, regression, security |
| Mobile webview journey | device/browser matrix, web/native boundary, UI automation, accessibility, regression |
| Angular/React UI | component, integration/E2E, compatibility, accessibility, security, performance |
| Terraform/CloudFormation/configuration | format/validate, plan/change-set review, policy, infrastructure tests, drift/deployment rehearsal |
| Datadog/alert changes | syntax/query validation, signal replay/simulation where safe, owner/runbook/actionability, noise check |
| Glue/Athena/Catalog/S3 | schema/contract, quality/reconciliation, partitions, permissions, lineage, replay/backfill, cost |
| Mainframe online/batch/data | unit/component where available, integration, batch controls/restart, reconciliation, regression, operational evidence |

## Evidence baseline

Every executed test includes the universal evidence metadata. Define real retention, approved tools/environments, device/browser matrix, accessibility standard/version, defect severity model, flake policy, and gate thresholds here.
