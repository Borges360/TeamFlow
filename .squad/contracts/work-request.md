# Contract: Work Request

The work-request contract captures the user's demand before it is decomposed.

```yaml
work_request:
  demand_id: DEM-0001
  original_text: "Preserve the user's exact request here"
  received_at: "YYYY-MM-DDTHH:MM:SSZ"
  requested_by: user
  desired_outcome: "Derived outcome, pending confirmation when needed"
  urgency: normal
  known_scope: []
  explicit_exclusions: []
  authority_granted: []
  constraints: []
  attachments_or_links: []
  selected_workflow: feature
  status: accepted
```

The derived interpretation never replaces `original_text`. Record later scope changes as dated amendments.
