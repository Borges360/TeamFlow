# EXAMPLE CONTEXT — squad responsibilities

> Replace names, ownership, capacity, and approval authorities. These are capabilities that may be performed by people or native agents; they are not permanent simulated agents.

| Local discipline | Universal roles commonly used | Example capability context |
|---|---|---|
| Backend engineering | Software, Data, Security, Reliability Engineers | Java, Go, Python, DynamoDB, PostgreSQL |
| Frontend/mobile | Software, Quality, Security Engineers | mobile webview, Angular, React, accessibility |
| SRE/DevOps | Reliability, Platform, Security Engineers | Datadog, Terraform, CloudFormation, SLI/SLO/SLA, alerts |
| Data | Data, Platform, Quality, Security Engineers | Glue jobs, Athena, Glue Data Catalog, data mesh, S3 |
| Quality | Quality Engineer with specialist contributors | mobile webview, backend, regression, infrastructure, Robot Framework, accessibility, security, test modeling and evidence |
| Mainframe | Software/Data/Reliability Engineer with mainframe profile | IMS online/batch, DB2, VSAN/VSAM clarification required |
| Architecture | Solution Architect with specialist reviews | solution design, resilience, patterns, FinOps, DR, C4, ADRs, governance, guardrails, logs/metrics/tracing, SLOs |
| Principal review | Principal Reviewer | independent cross-cutting review and gate audit |

## Example role activation

Activation follows demand risk and scope, not a fixed ceremony. A backend-only low-risk change does not load every local profile. A contract, data, infrastructure, or mainframe boundary activates the relevant specialist responsibility.

## Example human authorities to configure

| Decision | Accountable owner/group |
|---|---|
| Business behavior and acceptance | `[product-owner]` |
| Architecture guardrail exception | `[architecture-governance]` |
| Security risk acceptance | `[security-risk-owner]` |
| Production deployment/rollback | `[operations-change-authority]` |
| Data classification/retention | `[data-owner]` |
| SLA commitment | `[business-service-owner]` |
