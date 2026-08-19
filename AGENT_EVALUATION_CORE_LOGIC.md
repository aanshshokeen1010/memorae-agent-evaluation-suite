# Agent Evaluation Framework — Core Logic

## 1. Overview

The core logic of the Agent Evaluation Framework transforms simulated agent execution behavior into measurable evaluation results.

The pipeline separates execution, parsing, failure classification, evaluation, metrics calculation, and reporting.

Core flow:

Execution
→ Events
→ Request Records
→ Failure Detection
→ Evaluation
→ Metrics
→ Reports

---

## 2. Simulated Agent

The `SimulatedAgent` represents an agent execution layer for development and testing.

It generates deterministic execution events containing information such as:

- Timestamp
- Trace ID
- Request ID
- Agent name
- Prompt
- Selected tool
- Agent response
- Status
- Latency
- Error
- Retry count

The agent supports multiple scenarios so that different evaluation outcomes can be reproduced consistently.

---

## 3. Scenario Logic

The execution outcome is controlled by the requested scenario.

### Success

All simulated requests complete successfully.

### Timeout

The request is marked as failed with:

- Status: `FAILED`
- Latency: `10000 ms`
- Error: `Request timed out.`

### Memory Failure

The request fails with:

`Memory retrieval failed.`

### Wrong Tool

The request fails with:

`Wrong tool selected.`

### Permission Failure

The request fails with:

`Permission denied.`

### General Failure

The request fails with:

`Agent execution failed.`

This is classified as `UNKNOWN` by the failure detector.

### Retry

The request succeeds while recording a retry count.

### Mixed

The mixed scenario intentionally produces a combination of successful and failed requests.

The current deterministic distribution is:

- Requests 1–10: Success
- Requests 11–13: Timeout
- Requests 14–15: Memory failure
- Requests 16–17: Wrong tool
- Requests 18–19: Permission failure
- Request 20: Success

This produces:

- 11 successful requests
- 9 failed requests
- 55% success rate
- 45% failure rate
- Timeout as the top failure category

---

## 4. Request Record Parsing

Execution events are converted into structured `RequestRecord` objects.

The request record provides the normalized representation consumed by downstream components.

Important fields include:

- Request ID
- Trace ID
- Prompt
- Agent name
- Status
- Latency
- Error
- Retries
- Failure type

This separates raw execution events from the evaluation logic.

---

## 5. Failure Detection

The `FailureDetector` classifies each request record.

### Successful requests

If the request status is `SUCCESS`:

- Retries below the high-retry threshold → `SUCCESS`
- Two or more retries → `HIGH_RETRY`

### Failed requests

The detector examines the error text.

| Error condition | Failure type |
|---|---|
| Contains `timeout` | `TIMEOUT` |
| Contains `wrong tool` | `WRONG_TOOL` |
| Contains `memory` | `MEMORY_FAILURE` |
| Contains `permission` | `PERMISSION_FAILURE` |
| No recognized condition | `UNKNOWN` |

The classification is stored on the request record.

---

## 6. Evaluation Rules

The evaluator applies evaluation rules to execution results.

The rule system supports scenario-specific behavior through the rule factory.

The current rule factory recognizes:

- Success
- Timeout
- Memory failure
- Wrong tool
- Mixed

Unknown scenarios default to the mixed rule.

Evaluation considers execution characteristics such as:

- Success/failure status
- Retry behavior
- Latency

The evaluator produces an evaluation result containing the execution details and evaluation outcome.

---

## 7. Metrics Engine

The `MetricsEngine` calculates aggregate metrics from request records.

### Total requests

Number of processed request records.

### Successful requests

Number of records with:

`status == SUCCESS`

### Failed requests

Number of records with:

`status == FAILED`

### Success rate

Calculated as:

`successful_requests / total_requests × 100`

### Failure rate

Calculated as:

`failed_requests / total_requests × 100`

### Average latency

Calculated from the latency of all processed requests:

`total_latency / total_requests`

### Top failure

The most frequently occurring failure type, excluding successful records.

### Most failed agent

The agent name with the highest number of failed requests.

### Worst prompt

Among failed requests, the prompt belonging to the request with the highest latency.

---

## 8. Report Generation

The `ReportGenerator` creates two outputs:

- `evaluation_report.json`
- `evaluation_report.txt`

The JSON report contains structured metrics suitable for programmatic consumption.

The TXT report contains the same metrics in a human-readable format.

Example structure:

```text
AGENT EVALUATION REPORT

total_requests
successful_requests
failed_requests
success_rate
failure_rate
average_latency_ms
top_failure
most_failed_agent
worst_prompt
```

---

## 9. Evaluation Service

The `EvaluationService` coordinates the complete evaluation workflow.

Conceptually, it:

1. Receives a prompt and scenario.
2. Executes the simulated agent multiple times.
3. Converts execution events into request records.
4. Detects failure types.
5. Applies evaluation logic.
6. Calculates aggregate metrics.
7. Generates JSON and TXT reports.
8. Returns the evaluation summary.

The default simulation request count is 20.

---

## 10. API Layer

The FastAPI layer exposes the evaluation functionality through:

`POST /evaluate`

The request contains:

```json
{
  "prompt": "Test mixed evaluation",
  "scenario": "mixed"
}
```

The response contains the main evaluation metrics and report paths.

The API therefore acts as the interface between the backend evaluation pipeline and the frontend dashboard.

---

## 11. Adapter Boundary

The project contains log adapters such as:

- `LocalLogAdapter`
- `BetterStackAdapter`

During development, both use the configured sample-log source.

The Better Stack implementation is currently a mock adapter.

The purpose of this boundary is to allow a production log provider to be connected later without coupling the core evaluation logic directly to a specific log source.

---

## 12. Validation

The core logic is validated through automated tests.

The current test suite covers:

- API behavior
- Successful execution
- Failed execution
- Retry scoring
- High-latency scoring
- Failure classification
- Timeout detection
- Wrong-tool detection
- Memory failure detection
- Permission failure detection
- Unknown failure detection
- Rule factory behavior

The complete test suite currently passes:

`23 passed`

---

## 13. Core Design Principle

The central design principle is separation of responsibilities:

- Agent → generates execution behavior
- Parser → normalizes events
- Failure Detector → classifies failures
- Evaluator → applies evaluation rules
- Metrics Engine → calculates aggregate metrics
- Report Generator → produces reports
- FastAPI → exposes the pipeline

This makes the framework easier to test, extend, and eventually connect to real agent execution logs.
