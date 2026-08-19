# Agent Evaluation Framework — Architecture

## 1. System Overview

The Agent Evaluation Framework is organized as a layered backend evaluation pipeline.

The system receives an evaluation request through the FastAPI API, executes a simulated agent workflow, converts execution events into structured request records, detects and classifies failures, evaluates execution quality, calculates aggregate metrics, and generates machine-readable and human-readable reports.

The current implementation is a backend evaluation framework with a simulated agent and local/sample log adapters. The frontend is intentionally outside this backend scope and will consume the `/evaluate` API.

---

## 2. High-Level Architecture

```text
Frontend
   │
   │ POST /evaluate
   ▼
FastAPI API
   │
   ▼
Evaluation Service
   │
   ▼
Simulated Agent
   │
   ▼
Execution Events
   │
   ▼
Request Record Parser
   │
   ▼
Failure Detector
   │
   ▼
Evaluator + Rule Factory
   │
   ▼
Metrics Engine
   │
   ▼
Report Generator
   │
   ├── evaluation_report.json
   └── evaluation_report.txt
```

---

## 3. Architectural Layers

### 3.1 API Layer

The API layer exposes the backend through FastAPI.

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Confirms that the Agent Evaluation API is running |
| `/health` | GET | Health/status check |
| `/evaluate` | POST | Starts an agent evaluation |

The `/evaluate` endpoint accepts an evaluation prompt and a simulation scenario and returns aggregate metrics and generated report paths.

### 3.2 Service Layer

`EvaluationService` orchestrates the complete evaluation workflow. It keeps API handling separate from the evaluation logic.

```text
API Request
    ↓
EvaluationService
    ↓
Agent execution
    ↓
Event parsing
    ↓
Failure detection
    ↓
Evaluation
    ↓
Metrics
    ↓
Reports
```

### 3.3 Agent Execution Layer

The current implementation uses `SimulatedAgent`.

The simulated agent provides deterministic execution behavior for development, testing, and demonstration. It generates events such as:

- `REQUEST_STARTED`
- `PLANNER_STARTED`
- `TOOL_SELECTED`
- `AGENT_RESPONSE`
- `REQUEST_COMPLETED`

The final execution event contains status, latency, error information, and retry count.

### 3.4 Adapter Layer

The backend contains adapters that separate log-source access from evaluation logic.

```text
app/
└── adapters/
    ├── local_adapter.py
    └── betterstack_adapter.py
```

`LocalLogAdapter` returns the configured local/sample log file path.

`BetterStackAdapter` is currently a mock adapter. It returns the sample log path rather than calling the Better Stack API. The intended production pattern is:

```text
Production Log Source
        ↓
Log Adapter
        ↓
Common Evaluation Pipeline
```

---

## 4. Event-to-Record Architecture

The simulated agent produces execution events. The request-record parsing layer converts these low-level events into structured `RequestRecord` objects.

```text
Execution Events
      ↓
Request Record Parser
      ↓
RequestRecord
```

A request record consolidates information such as:

- request ID
- trace ID
- prompt
- agent name
- status
- latency
- error
- retries
- failure type

These records are consumed by the failure detector, evaluator, and metrics engine.

---

## 5. Failure Detection Architecture

`FailureDetector` classifies request records into predefined failure categories based on execution status, retry count, and error information.

Current categories include:

```text
SUCCESS
HIGH_RETRY
TIMEOUT
WRONG_TOOL
MEMORY_FAILURE
PERMISSION_FAILURE
UNKNOWN
```

General flow:

```text
RequestRecord
     │
     ├── SUCCESS
     │      └── retry count checked
     │
     └── FAILED
            │
            ├── timeout
            ├── wrong tool
            ├── memory
            ├── permission
            └── unknown
```

Successful requests with two or more retries are classified as `HIGH_RETRY`. Failed requests are classified from their error text; unrecognized failures become `UNKNOWN`.

---

## 6. Evaluation Architecture

The evaluator applies configured evaluation rules to execution records. Rule selection is separated through the rule factory and individual rule implementations.

```text
RequestRecord
      ↓
RuleFactory
      │
      ├── Success Rule
      ├── Timeout Rule
      ├── Memory Rule
      ├── Wrong Tool Rule
      └── Mixed Rule
              ↓
          Evaluator
              ↓
      Evaluation Result
```

This structure allows additional evaluation rules to be introduced without redesigning the complete pipeline.

---

## 7. Scenario Architecture

The simulator supports deterministic evaluation scenarios:

| Scenario | Intended Result |
|---|---|
| `success` | Successful execution |
| `timeout` | Timeout failure |
| `memory` | Memory retrieval failure |
| `wrong_tool` | Wrong tool selection failure |
| `permission` | Permission failure |
| `failure` | Unknown/general failure |
| `retry` | Successful execution with retry |
| `mixed` | Combination of successful and failed requests |

The `mixed` scenario is useful for dashboard demonstrations because it produces both successful and failed executions.

Current mixed simulation results:

- 20 total requests
- 11 successful requests
- 9 failed requests
- 55% success rate
- 45% failure rate
- 5070 ms average latency
- `TIMEOUT` as the top failure
- `GeneralAgent` as the most failed agent

---

## 8. Metrics Architecture

`MetricsEngine` calculates aggregate metrics from processed `RequestRecord` objects.

| Metric | Description |
|---|---|
| `total_requests` | Total number of processed requests |
| `successful_requests` | Number of successful requests |
| `failed_requests` | Number of failed requests |
| `success_rate` | Percentage of successful requests |
| `failure_rate` | Percentage of failed requests |
| `average_latency_ms` | Average request latency |
| `top_failure` | Most common failure category |
| `most_failed_agent` | Agent with the highest number of failures |
| `worst_prompt` | Prompt associated with the highest-latency failed request |

The metrics engine uses counters for failure categories and failed agents and identifies the worst prompt from the failed request with the highest latency.

---

## 9. Report Generation Architecture

`ReportGenerator` converts calculated metrics into persistent reports.

```text
reports_output/
├── evaluation_report.json
└── evaluation_report.txt
```

The JSON report is machine-readable and the TXT report provides a simple human-readable representation of the same core metrics.

Example JSON:

```json
{
    "total_requests": 20,
    "successful_requests": 11,
    "failed_requests": 9,
    "success_rate": 55.0,
    "failure_rate": 45.0,
    "average_latency_ms": 5070.0,
    "top_failure": "TIMEOUT",
    "most_failed_agent": "GeneralAgent",
    "worst_prompt": "Test mixed evaluation"
}
```

---

## 10. Configuration Architecture

Central configuration is maintained in `config.py`.

It currently covers:

- report output directory
- JSON report filename
- TXT report filename
- sample log location
- default scenario
- simulation request count
- API title
- API version
- logging level
- logging format

This keeps frequently changed configuration values outside implementation classes.

---

## 11. API Data Flow

A typical `/evaluate` request follows this path:

```text
Client
  │
  │ POST /evaluate
  │
  │ {
  │   "prompt": "Test mixed evaluation",
  │   "scenario": "mixed"
  │ }
  ↓
FastAPI Route
  ↓
EvaluationService
  ↓
SimulatedAgent
  ↓
Execution Events
  ↓
Request Records
  ↓
Failure Detection
  ↓
Evaluation Rules
  ↓
MetricsEngine
  ↓
ReportGenerator
  ↓
JSON + TXT Reports
  ↓
API Response
```

---

## 12. Current API Contract

### Request

```http
POST /evaluate
Content-Type: application/json
```

Example:

```json
{
    "prompt": "Test mixed evaluation",
    "scenario": "mixed"
}
```

### Response

The current API response exposes the main dashboard metrics and report paths:

```json
{
    "prompt": "Test mixed evaluation",
    "total_requests": 20,
    "success_rate": 55.0,
    "failure_rate": 45.0,
    "average_latency_ms": 5070.0,
    "top_failure": "TIMEOUT",
    "most_failed_agent": "GeneralAgent",
    "report_json": "reports_output/evaluation_report.json",
    "report_txt": "reports_output/evaluation_report.txt"
}
```

The frontend should use the API response as the primary source for currently available top-level dashboard metrics.

---

## 13. Frontend Integration Boundary

The frontend is a separate responsibility and will consume the backend API.

```text
Frontend
    │
    │ HTTP POST
    ↓
/evaluate
    ↓
Backend Evaluation Pipeline
    ↓
JSON Response
    ↓
Frontend Dashboard
```

The frontend should not reproduce backend evaluation logic.

It should:

1. Collect the evaluation prompt.
2. Allow selection of a supported scenario.
3. Call `/evaluate`.
4. Display returned metrics.
5. Handle loading and error states.
6. Present results through the dashboard UI.

The frontend implementation itself is outside this backend architecture document.

---

## 14. Testing Architecture

The backend has automated tests covering the main evaluation components.

```text
tests/
├── test_api.py
├── test_evaluator.py
├── test_failure_detector.py
└── test_rule_factory.py
```

The test suite covers:

- API root endpoint
- API health endpoint
- successful evaluation
- timeout evaluation
- mixed evaluation
- evaluator scoring behavior
- retry behavior
- high-latency behavior
- failure classification
- rule selection

Latest verified test result:

```text
23 passed
1 warning
```

The warning is a Starlette/httpx test-client compatibility/deprecation warning and does not represent a failed test.

---

## 15. Backend Responsibilities

The backend is responsible for:

- exposing FastAPI endpoints
- accepting evaluation requests
- executing the simulated evaluation workflow
- generating execution events
- converting events into request records
- detecting and classifying failures
- applying evaluation rules
- calculating aggregate metrics
- generating JSON and TXT reports
- providing local/sample log access
- providing the current mock Better Stack adapter
- maintaining the frontend API contract

---

## 16. Frontend Responsibilities

The frontend is responsible for:

- dashboard layout
- scenario selection UI
- prompt input
- API request interaction
- loading state
- error state
- KPI presentation
- charts and visualizations supported by available API data
- displaying evaluation results
- user-facing navigation and interaction

The frontend should not invent backend metrics that are not exposed by the API.

---

## 17. Current Architecture Scope

### Implemented

- FastAPI API
- evaluation service orchestration
- simulated agent execution
- execution event generation
- request record processing
- failure detection
- evaluation rules
- aggregate metrics
- JSON/TXT report generation
- local log adapter
- mock Better Stack adapter
- automated backend tests
- frontend API contract

### Outside the current backend implementation

- production agent execution
- live Better Stack API ingestion
- production observability infrastructure
- authentication/authorization
- persistent database storage
- frontend dashboard implementation

These can be introduced later without changing the fundamental layered architecture.

---

## 18. Design Principles

### Separation of concerns

Each major responsibility is implemented in a separate component.

### Deterministic testing

Simulation scenarios provide predictable results for development and automated testing.

### Extensibility

Adapters, failure categories, and evaluation rules can be extended independently.

### API-first integration

The frontend communicates with the backend through the defined FastAPI API contract.

### Centralized configuration

Common configuration values are maintained in `config.py`.

### Testability

Core evaluation components are independently testable and covered by automated tests.

---

## 19. End-to-End Architecture Summary

```text
                 ┌──────────────────┐
                 │     Frontend     │
                 └────────┬─────────┘
                          │
                    POST /evaluate
                          │
                          ▼
                 ┌──────────────────┐
                 │    FastAPI API   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ EvaluationService│
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  SimulatedAgent  │
                 └────────┬─────────┘
                          │
                    Execution Events
                          │
                          ▼
                 ┌──────────────────┐
                 │ Request Record   │
                 │     Parser       │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Failure Detector │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    Evaluator     │
                 │  + Rule Factory  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Metrics Engine  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Report Generator │
                 └────────┬─────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
          JSON Report          TXT Report
```

This document defines the current backend architecture and the integration boundary required for the frontend dashboard.
