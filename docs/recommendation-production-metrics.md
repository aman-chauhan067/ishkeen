# Production Metrics Architecture

This document expands on ADR 0024 to define the exact telemetry metric models to be implemented in Phase 7B.

## 1. Metrics Dictionary

| Metric Name | Type | Tags/Dimensions | Description |
| :--- | :--- | :--- | :--- |
| `rec.runs.count` | Counter | `mode=v1\|hybrid`, `status=success\|fail` | Total execution volume. |
| `rec.execution.latency` | Histogram | `mode` | Engine generation time (excludes DB IO). |
| `rec.evidence.conflict` | Counter | `winner=user\|model`, `concern_type` | How often the ML model disagrees with the user. |
| `rec.rule.triggered` | Counter | `rule_name`, `reason_code`, `candidate` | The specific safety rule that dropped a candidate. |
| `rec.candidate.assigned` | Counter | `slot`, `category` | Which active ingredients are actually making it into the final routine. |

## 2. Thresholds & Alerting Strategy
- **Anomaly Detection**: If `rec.rule.triggered{reason_code="EXCLUDED_KNOWN_REACTION"}` jumps > 20% compared to the previous week, trigger an alert. This implies a corrupted Knowledge Base update mapped too many ingredients to a common allergy.
- **Latency Alerts**: `rec.execution.latency` > 500ms (P99). The deterministic engine should run in < 10ms. A spike indicates a severe loop or memory issue.
- **Conflict Spikes**: If `rec.evidence.conflict{winner="user"}` spikes, it indicates the ML model is severely over-predicting false positives compared to self-reported user symptoms.

## 3. Data Privacy
No PII (user IDs, emails, raw images) is ever included in the metrics telemetry payload. All dimensions are limited to system enum strings (categories, rule names, reason codes).
